const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const User = require('../models/User');
const Task = require('../models/Task');

// Admin-only route middleware chain:
// authenticate -> adminOnly -> controller

// GET /admin/dashboard - High-level statistics
router.get('/dashboard', authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalTasks = await Task.countDocuments();
        const completedTasks = await Task.countDocuments({ completed: true });
        const pendingTasks = totalTasks - completedTasks;

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalTasks,
                completedTasks,
                pendingTasks
            }
        });
    } catch (err) {
        next(err);
    }
});

// GET /admin/users - List users with roles (passwords omitted)
router.get('/users', authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (err) {
        next(err);
    }
});

// GET /admin/reports - Report generation for date range (Admin Only - Requirement 10)
router.get('/reports', authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const filter = {};

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                // Set to end of day if only date is passed
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        const tasks = await Task.find(filter).sort({ createdAt: -1 });
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        const lowPriority = tasks.filter(t => t.priority === 'low').length;
        const mediumPriority = tasks.filter(t => t.priority === 'medium').length;
        const highPriority = tasks.filter(t => t.priority === 'high').length;

        res.status(200).json({
            success: true,
            message: 'Report generated successfully',
            summary: {
                totalTasks: total,
                completedTasks: completed,
                pendingTasks: pending,
                completionRate,
                priorityBreakdown: {
                    low: lowPriority,
                    medium: mediumPriority,
                    high: highPriority
                },
                dateRange: {
                    startDate: startDate || 'all',
                    endDate: endDate || 'all'
                }
            },
            data: tasks
        });
    } catch (err) {
        next(err);
    }
});

const { sendEmail } = require('../services/emailService');

// POST /admin/reports/email - Send formatted report directly to admin email (Admin Only)
router.post('/reports/email', authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
        const { startDate, endDate, recipientEmail } = req.body || {};
        const targetEmail = recipientEmail || process.env.ADMIN_REPORT_EMAIL || 'kirtanjogani612@gmail.com';

        const filter = {};
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        const tasks = await Task.find(filter).sort({ createdAt: -1 });
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        const lowPriority = tasks.filter(t => t.priority === 'low').length;
        const mediumPriority = tasks.filter(t => t.priority === 'medium').length;
        const highPriority = tasks.filter(t => t.priority === 'high').length;

        const dateRangeLabel = startDate && endDate
            ? `${startDate} to ${endDate}`
            : startDate
            ? `From ${startDate}`
            : endDate
            ? `Until ${endDate}`
            : 'All Time';

        const taskRows = tasks.slice(0, 15).map(t => `
            <tr style="border-bottom: 1px solid #dfe3e7;">
                <td style="padding: 10px 14px; font-size: 14px; color: #171c1f; font-weight: 600;">${t.title}</td>
                <td style="padding: 10px 14px; font-size: 13px; color: #505f76;">${t.priority}</td>
                <td style="padding: 10px 14px; font-size: 13px;">
                    <span style="display:inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: ${t.completed ? '#e6f4ea' : '#fff0f0'}; color: ${t.completed ? '#137333' : '#c5221f'};">
                        ${t.completed ? 'Completed' : 'Pending'}
                    </span>
                </td>
                <td style="padding: 10px 14px; font-size: 12px; color: #75777d;">${new Date(t.createdAt).toLocaleDateString()}</td>
            </tr>
        `).join('');

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Executive Task Analytics Report</title>
        </head>
        <body style="margin: 0; padding: 24px; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f6fafe; color: #171c1f;">
            <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #dfe3e7; border-radius: 16px; overflow: hidden;">
                <!-- Header -->
                <div style="background: #1d2b3e; padding: 24px 28px; color: #ffffff;">
                    <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9eadc5; margin-bottom: 6px;">Slate Enterprise Analytics</div>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;">Executive Task Report</h1>
                    <div style="margin-top: 6px; font-size: 13px; color: #d0e1fb;">Coverage: ${dateRangeLabel} &bull; Generated: ${new Date().toUTCString()}</div>
                </div>

                <!-- KPI Metric Cards -->
                <div style="padding: 24px 28px; background: #f0f4f8; border-bottom: 1px solid #dfe3e7;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="width: 25%; padding: 12px; background: #ffffff; border-radius: 8px; border: 1px solid #dfe3e7; text-align: center;">
                                <div style="font-size: 11px; text-transform: uppercase; color: #505f76; font-weight: 600;">Total Tasks</div>
                                <div style="font-size: 24px; font-weight: 700; color: #1d2b3e; margin-top: 4px;">${total}</div>
                            </td>
                            <td style="width: 25%; padding: 12px; background: #ffffff; border-radius: 8px; border: 1px solid #dfe3e7; text-align: center;">
                                <div style="font-size: 11px; text-transform: uppercase; color: #137333; font-weight: 600;">Completed</div>
                                <div style="font-size: 24px; font-weight: 700; color: #137333; margin-top: 4px;">${completed}</div>
                            </td>
                            <td style="width: 25%; padding: 12px; background: #ffffff; border-radius: 8px; border: 1px solid #dfe3e7; text-align: center;">
                                <div style="font-size: 11px; text-transform: uppercase; color: #ba1a1a; font-weight: 600;">Pending</div>
                                <div style="font-size: 24px; font-weight: 700; color: #ba1a1a; margin-top: 4px;">${pending}</div>
                            </td>
                            <td style="width: 25%; padding: 12px; background: #ffffff; border-radius: 8px; border: 1px solid #dfe3e7; text-align: center;">
                                <div style="font-size: 11px; text-transform: uppercase; color: #334155; font-weight: 600;">Completion</div>
                                <div style="font-size: 24px; font-weight: 700; color: #1d2b3e; margin-top: 4px;">${completionRate}%</div>
                            </td>
                        </tr>
                    </table>

                    <div style="margin-top: 14px; font-size: 13px; color: #505f76; text-align: center;">
                        <strong>Priority Distribution:</strong> High: ${highPriority} &bull; Medium: ${mediumPriority} &bull; Low: ${lowPriority}
                    </div>
                </div>

                <!-- Recent Tasks Breakdown Table -->
                <div style="padding: 24px 28px;">
                    <div style="font-size: 14px; font-weight: 700; color: #1d2b3e; margin-bottom: 12px;">Task Activity Breakdown (${tasks.length} tasks)</div>
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="background: #eaeef2; border-bottom: 2px solid #dfe3e7;">
                                <th style="padding: 8px 14px; font-size: 12px; color: #171c1f; text-transform: uppercase; letter-spacing: 0.04em;">Title</th>
                                <th style="padding: 8px 14px; font-size: 12px; color: #171c1f; text-transform: uppercase; letter-spacing: 0.04em;">Priority</th>
                                <th style="padding: 8px 14px; font-size: 12px; color: #171c1f; text-transform: uppercase; letter-spacing: 0.04em;">Status</th>
                                <th style="padding: 8px 14px; font-size: 12px; color: #171c1f; text-transform: uppercase; letter-spacing: 0.04em;">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${taskRows || '<tr><td colspan="4" style="padding: 16px; text-align:center; color: #75777d;">No tasks found for this date range.</td></tr>'}
                        </tbody>
                    </table>
                    ${tasks.length > 15 ? `<div style="margin-top: 10px; font-size: 12px; color: #75777d; text-align: right;">...and ${tasks.length - 15} more tasks available in portal.</div>` : ''}
                </div>

                <!-- Footer -->
                <div style="background: #f0f4f8; padding: 18px 28px; border-top: 1px solid #dfe3e7; font-size: 12px; color: #505f76; text-align: center;">
                    Dispatched automatically by <strong>Slate Task Manager</strong> &bull; Confidential Administrative Report
                </div>
            </div>
        </body>
        </html>
        `;

        const mailResult = await sendEmail({
            to: targetEmail,
            subject: `[Slate Admin] Task Analytics Report - ${dateRangeLabel}`,
            text: `Executive Task Report (${dateRangeLabel})\nTotal: ${total}, Completed: ${completed}, Pending: ${pending}, Rate: ${completionRate}%\nHigh: ${highPriority}, Med: ${mediumPriority}, Low: ${lowPriority}`,
            html,
        });

        res.status(200).json({
            success: true,
            message: `Report successfully dispatched to ${targetEmail}`,
            recipient: targetEmail,
            messageId: mailResult.messageId,
            summary: {
                total,
                completed,
                pending,
                completionRate,
            }
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
