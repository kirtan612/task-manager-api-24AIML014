const taskEvents = require('./taskEvents');

/**
 * Event Listener: 'task-created'
 * Handles asynchronous background notification & audit logging.
 * Includes simulated 2-second delay (Supplementary Problem 3) to demonstrate
 * that the API response returns instantly without waiting for this worker.
 */
taskEvents.on('task-created', (payload) => {
    try {
        const task = payload.task || payload;
        const user = payload.user || null;
        const userIdentifier = user?.email || user?.id || 'System / Anonymous';
        const receivedAt = new Date().toISOString();

        console.log(`[Notification:Queued] Background worker picked up Task "${task.title}" at ${receivedAt}`);

        // Supplementary Problem 3: Simulate a 2-second slow notification worker
        setTimeout(() => {
            const completedAt = new Date().toISOString();
            console.log(`[Notification] Task "${task.title}" created at ${payload.timestamp || receivedAt}`);
            console.log(`[Notification:Details] Priority: ${task.priority || 'medium'} | User: ${userIdentifier} | TaskID: ${task._id}`);
            console.log(`[Notification:Finished] Background notification worker completed at ${completedAt}`);
        }, 2000);
    } catch (err) {
        taskEvents.emit('error', err);
    }
});

/**
 * Supplementary Problem 1: Event Listener for 'task-deleted'
 * Logs a distinct cleanup notification when a task is purged.
 */
taskEvents.on('task-deleted', (payload) => {
    try {
        const task = payload.task || payload;
        const user = payload.user || null;
        const userIdentifier = user?.email || user?.id || 'System';
        const timestamp = payload.timestamp || new Date().toISOString();

        console.log(`[Notification:task-deleted] Task "${task?.title || 'Unknown'}" (ID: ${task?._id}) was permanently deleted at ${timestamp} by ${userIdentifier}`);
    } catch (err) {
        taskEvents.emit('error', err);
    }
});

/**
 * Supplementary Problem 2: Dedicated 'error' Event Listener
 * Catches and logs errors thrown within handlers to prevent process crashes.
 */
taskEvents.on('error', (err) => {
    console.error(`[TaskEvents:Error] Background event processing error: ${err.message}`);
});

console.log('[TaskEvents] Event listeners registered successfully (task-created, task-deleted, error).');
