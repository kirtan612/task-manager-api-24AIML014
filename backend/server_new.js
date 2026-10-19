const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const Task = require("./models/Task");
const cache = require("./utils/cache");
const taskEvents = require("./events/taskEvents");
require("./events/listeners"); // Register background notification listeners
const auth = require("./middleware/auth");
const validate = require("./middleware/validate");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const emailRoutes = require("./routes/emailRoutes");
const { verifyEmailService } = require("./services/emailService");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error(err));

app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", emailRoutes);
app.use("/", emailRoutes);

// Cache Telemetry & Debug Endpoint (Supplementary Problem 2)
app.get("/tasks/cache/stats", auth, (req, res) => {
    res.status(200).json({
        success: true,
        metrics: cache.getMetrics()
    });
});

// Cache Flush Endpoint (for testing and benchmarks)
app.post("/tasks/cache/clear", auth, (req, res) => {
    cache.flushAll();
    cache.resetMetrics();
    res.status(200).json({
        success: true,
        message: "Cache flushed and telemetry counters reset"
    });
});

// GET all tasks (Step 3: In-Memory Caching with node-cache, 60s TTL)
app.get("/tasks", auth, async (req, res, next) => {
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

        const tasks = await Task.find();
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

// GET single task by ID (Supplementary Problem 1: Separate single-task cache key)
app.get("/tasks/:id", auth, async (req, res, next) => {
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

// CREATE task (Step 4: Cache Invalidation & Practical: Asynchronous Background Event)
app.post("/tasks", auth, validate, async (req, res, next) => {
    try {
        const task = await Task.create(req.body);

        // Invalidate all_tasks cache so new task is immediately visible
        cache.del("all_tasks");

        // Immediate API response point (Demonstrating non-blocking behavior)
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

// UPDATE task (Step 4 & Supplementary: Invalidate all_tasks and single-task cache)
app.put("/tasks/:id", auth, async (req, res, next) => {
    try {
        const existingTask = await Task.findById(req.params.id);

        if (!existingTask) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        // Requirement 5: Non-reversible - completed tasks cannot be moved back to ongoing
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

// DELETE task (Step 4 & Supplementary: Invalidate cache & emit task-deleted event)
app.delete("/tasks/:id", auth, async (req, res, next) => {
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

        // Immediate API response point
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

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(500).json({
        success: false,
        error: err.message || "Something went wrong"
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Verify email service on startup (non-blocking)
    verifyEmailService();
});
