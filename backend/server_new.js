const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const Task = require("./models/Task");
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

// GET all tasks
app.get("/tasks", auth, async (req, res, next) => {
    try {
        const tasks = await Task.find();

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (err) {
        next(err);
    }
});

// CREATE task
app.post("/tasks", auth, validate, async (req, res, next) => {
    try {
        const task = await Task.create(req.body);

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            data: task
        });
    } catch (err) {
        next(err);
    }
});

// UPDATE task
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
app.delete("/tasks/:id", auth, async (req, res, next) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Task deleted successfully"
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
