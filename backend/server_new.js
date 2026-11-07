const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Load environment variables (.env in backend or parent directory)
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Task = require("./models/Task");
const cache = require("./utils/cache");
const taskEvents = require("./events/taskEvents");
require("./events/listeners"); // Idempotently register background event listeners
const auth = require("./middleware/auth");
const validate = require("./middleware/validate");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const emailRoutes = require("./routes/emailRoutes");
const { verifyEmailService } = require("./services/emailService");

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy (Render, Cloudflare, etc.)
app.set("trust proxy", 1);

// Configure CORS for production and development
const configuredOrigins = [
    process.env.FRONTEND_URL,
    "https://task-manager-api-24-aiml-014-v5c67-git-main-kirtan612s-projects.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000"
]
    .filter(Boolean)
    .map((o) => o.replace(/\/+$/, "")); // Strip trailing slashes

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, Postman, health checks)
        if (!origin) return callback(null, true);

        const normalizedOrigin = origin.replace(/\/+$/, "");

        // Match exact allowed origin
        if (configuredOrigins.includes(normalizedOrigin)) {
            return callback(null, true);
        }

        // Allow Vercel preview deployments for this project
        if (/\.vercel\.app$/.test(normalizedOrigin)) {
            return callback(null, true);
        }

        if (process.env.NODE_ENV !== "production") {
            // Allow all local origins during development
            return callback(null, true);
        }

        console.warn(`[CORS Blocked] Origin not allowed: ${origin}`);
        return callback(new Error("CORS policy does not allow access from this origin"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});

// Production Health Check Endpoints (for Render zero-downtime monitoring)
const healthHandler = (req, res) => {
    res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        environment: process.env.NODE_ENV || "development"
    });
};
app.get("/health", healthHandler);
app.get("/api/health", healthHandler);

// API Root Status
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Task Manager API is running in production",
        version: "1.0.0",
        docs: {
            auth: ["/auth/register", "/auth/login", "/auth/me"],
            tasks: ["/tasks", "/tasks/:id"],
            admin: ["/admin/dashboard", "/admin/users", "/admin/reports"],
            health: "/health"
        }
    });
});

// Database Readiness Guard: prevent application traffic before database is ready
app.use((req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            success: false,
            message: "Database connection initializing. Please try again in a moment.",
            databaseState: mongoose.connection.readyState === 2 ? "connecting" : "disconnected"
        });
    }
    next();
});

// Authentication Routes
app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);

// Admin Routes
app.use("/admin", adminRoutes);
app.use("/api/admin", adminRoutes);

// Email Routes
app.use("/api", emailRoutes);
app.use("/", emailRoutes);

// Helper middleware to validate MongoDB ObjectId
const validateTaskId = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid task ID format"
        });
    }
    next();
};

// Task Router (mount on both /tasks and /api/tasks for complete client compatibility)
const taskRouter = express.Router();

// Cache Telemetry & Debug Endpoint
taskRouter.get("/cache/stats", auth, (req, res) => {
    res.status(200).json({
        success: true,
        metrics: cache.getMetrics()
    });
});

// Cache Flush Endpoint
taskRouter.post("/cache/clear", auth, (req, res) => {
    cache.flushAll();
    cache.resetMetrics();
    res.status(200).json({
        success: true,
        message: "Cache flushed and telemetry counters reset"
    });
});

// GET all tasks (In-Memory Caching with node-cache, 60s TTL)
taskRouter.get("/", auth, async (req, res, next) => {
    try {
        const cachedTasks = cache.getWithMetrics("all_tasks");
        if (cachedTasks) {
            return res.status(200).json({
                success: true,
                count: cachedTasks.length,
                data: cachedTasks,
                source: "cache"
            });
        }

        const tasks = await Task.find().sort({ createdAt: -1 });
        cache.set("all_tasks", tasks);

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks,
            source: "database"
        });
    } catch (err) {
        next(err);
    }
});

// GET single task by ID
taskRouter.get("/:id", auth, validateTaskId, async (req, res, next) => {
    try {
        const cacheKey = `task_${req.params.id}`;
        const cachedTask = cache.getWithMetrics(cacheKey);
        if (cachedTask) {
            return res.status(200).json({
                success: true,
                data: cachedTask,
                source: "cache"
            });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        cache.set(cacheKey, task);

        res.status(200).json({
            success: true,
            data: task,
            source: "database"
        });
    } catch (err) {
        next(err);
    }
});

// CREATE task (Cache Invalidation & Background Event)
taskRouter.post("/", auth, validate, async (req, res, next) => {
    try {
        const task = await Task.create(req.body);

        // Invalidate all_tasks cache so new task is immediately visible
        cache.del("all_tasks");

        const apiTimestamp = new Date().toISOString();
        console.log(`[API] Response sent at ${apiTimestamp} for Task "${task.title}"`);

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            data: task
        });

        // Emit 'task-created' event handled asynchronously by background listener
        taskEvents.emit("task-created", {
            task,
            user: req.user,
            timestamp: apiTimestamp
        });
    } catch (err) {
        next(err);
    }
});

// UPDATE task
taskRouter.put("/:id", auth, validateTaskId, async (req, res, next) => {
    try {
        const existingTask = await Task.findById(req.params.id);

        if (!existingTask) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        // Non-reversible: completed tasks cannot be moved back to ongoing
        if (existingTask.completed && req.body.completed === false) {
            return res.status(400).json({
                success: false,
                message: "Completed tasks cannot be moved back to ongoing."
            });
        }

        const task = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        // Invalidate both collection and specific task key
        cache.del("all_tasks");
        cache.del(`task_${req.params.id}`);

        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            data: task
        });
    } catch (err) {
        next(err);
    }
});

// DELETE task
taskRouter.delete("/:id", auth, validateTaskId, async (req, res, next) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        // Invalidate both collection and specific task key
        cache.del("all_tasks");
        cache.del(`task_${req.params.id}`);

        const apiTimestamp = new Date().toISOString();
        console.log(`[API] Task delete response sent at ${apiTimestamp} for ID ${req.params.id}`);

        res.status(200).json({
            success: true,
            message: "Task deleted successfully"
        });

        // Emit 'task-deleted' event handled asynchronously by background listener
        taskEvents.emit("task-deleted", {
            task,
            user: req.user,
            timestamp: apiTimestamp
        });
    } catch (err) {
        next(err);
    }
});

// Mount tasks router on both /tasks and /api/tasks
app.use("/tasks", taskRouter);
app.use("/api/tasks", taskRouter);

// 404 Route Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint ${req.method} ${req.originalUrl} not found`
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`[Error] ${err.name || "Error"}: ${err.message}`);
    if (err.stack && process.env.NODE_ENV !== "production") {
        console.error(err.stack);
    }

    // Handle CORS Error
    if (err.message && err.message.includes("CORS")) {
        return res.status(403).json({
            success: false,
            error: err.message
        });
    }

    // Handle Mongoose Validation Error
    if (err.name === "ValidationError") {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({
            success: false,
            message: messages.join(", ")
        });
    }

    // Handle Mongoose CastError (invalid ObjectId)
    if (err.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: `Invalid format for field ${err.path}`
        });
    }

    // Handle JWT Errors
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }

    res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || "Internal server error"
    });
});

// Database Connection & Server Initialization
const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/Task";
const maskedURI = mongoURI.replace(/:([^:@]+)@/, ":****@");

// Setup MongoDB connection event listeners
mongoose.connection.on("connected", () => {
    console.log(`[Database] MongoDB connection established.`);
});

mongoose.connection.on("error", (err) => {
    console.error(`[Database Error] Connection error: ${err.message}`);
});

mongoose.connection.on("disconnected", () => {
    console.warn(`[Database] MongoDB connection disconnected.`);
});

mongoose.connection.on("reconnected", () => {
    console.log(`[Database] MongoDB reconnected successfully.`);
});

let server;

const startServer = async () => {
    // 1. Start HTTP listener first so Render's port detection and /health monitoring pass immediately
    server = app.listen(PORT, "0.0.0.0", () => {
        console.log(`[Server] Running on port ${PORT} (0.0.0.0) in ${process.env.NODE_ENV || "development"} mode`);
        verifyEmailService();
    });

    // 2. Connect to MongoDB Atlas (guarded by readiness middleware for all application endpoints)
    try {
        console.log(`[Database] Connecting to MongoDB: ${maskedURI}`);
        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 15000,
        });
        console.log(`[Database] Connected successfully to ${mongoose.connection.name || "Task"}`);
    } catch (err) {
        console.error(`[Database Error] Failed to connect to MongoDB: ${err.message}`);
        console.error(`[Database Error] Please ensure MONGODB_URI is configured in Render Environment Variables and MongoDB Atlas Network Access permits 0.0.0.0/0.`);
    }
};

// Graceful Shutdown handling for Render deploys & container restarts
const gracefulShutdown = (signal) => {
    console.log(`[Server] Received ${signal}. Starting graceful shutdown...`);
    if (server) {
        server.close(async () => {
            console.log("[Server] HTTP server stopped accepting new connections.");
            try {
                await mongoose.connection.close(false);
                console.log("[Database] MongoDB connection closed.");
                process.exit(0);
            } catch (err) {
                console.error("[Database] Error closing MongoDB:", err.message);
                process.exit(1);
            }
        });

        // Force shutdown after 10 seconds if hanging
        setTimeout(() => {
            console.error("[Server] Graceful shutdown timed out after 10s. Forcing exit.");
            process.exit(1);
        }, 10000);
    } else {
        process.exit(0);
    }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Process-level unhandled rejection/exception safety nets
process.on("unhandledRejection", (reason) => {
    console.error("[Process] Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (err) => {
    console.error("[Process] Uncaught Exception:", err);
});

startServer();

module.exports = app;
