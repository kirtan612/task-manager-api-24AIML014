const taskEvents = require('./taskEvents');

/**
 * Flag to guarantee listeners are registered exactly once
 */
let listenersRegistered = false;

/**
 * Register all TaskEvents background listeners.
 * Idempotent: safe to invoke multiple times without registering duplicate handlers.
 */
function registerTaskListeners() {
    if (listenersRegistered) {
        return;
    }
    listenersRegistered = true;

    /**
     * Event Listener: 'task-created'
     * Handles asynchronous background notification & audit logging.
     * Demonstrates non-blocking background execution with simulated processing delay.
     */
    taskEvents.on('task-created', (payload) => {
        try {
            const task = payload.task || payload;
            const user = payload.user || null;
            const userIdentifier = user?.email || user?.id || 'System / Anonymous';
            const receivedAt = new Date().toISOString();

            console.log(`[TaskEvents:Queued] Background worker queued for Task "${task?.title}" at ${receivedAt}`);

            // Asynchronous background notification worker
            setTimeout(() => {
                try {
                    const completedAt = new Date().toISOString();
                    console.log(`[Notification] Task "${task?.title}" processed at ${completedAt} (Created at: ${payload.timestamp || receivedAt})`);
                    console.log(`[Notification:Details] Priority: ${task?.priority || 'medium'} | User: ${userIdentifier} | TaskID: ${task?._id}`);
                    console.log(`[Notification:Finished] Background worker completed successfully at ${completedAt}`);
                } catch (asyncErr) {
                    console.error(`[TaskEvents:Error] Async worker failed for Task "${task?.title}": ${asyncErr.message}`);
                    taskEvents.emit('error', asyncErr);
                }
            }, 2000);
        } catch (err) {
            console.error('[TaskEvents:Error] Synchronous error in task-created listener:', err.message);
            taskEvents.emit('error', err);
        }
    });

    /**
     * Event Listener: 'task-deleted'
     * Logs distinct cleanup notification when a task is permanently removed.
     */
    taskEvents.on('task-deleted', (payload) => {
        try {
            const task = payload.task || payload;
            const user = payload.user || null;
            const userIdentifier = user?.email || user?.id || 'System';
            const timestamp = payload.timestamp || new Date().toISOString();

            console.log(`[Notification:task-deleted] Task "${task?.title || 'Unknown'}" (ID: ${task?._id}) permanently deleted at ${timestamp} by ${userIdentifier}`);
        } catch (err) {
            console.error('[TaskEvents:Error] Synchronous error in task-deleted listener:', err.message);
            taskEvents.emit('error', err);
        }
    });

    /**
     * Dedicated 'error' Event Listener
     * Catches and logs errors emitted within event handlers to prevent unhandled rejections.
     */
    taskEvents.on('error', (err) => {
        console.error(`[TaskEvents:Error] Background event processing error: ${err?.message || err}`);
    });

    console.log('[TaskEvents] Event listeners registered successfully (task-created, task-deleted, error).');
}

// Automatically register once on require
registerTaskListeners();

module.exports = {
    registerTaskListeners,
    taskEvents
};
