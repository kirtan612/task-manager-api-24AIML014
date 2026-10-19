const EventEmitter = require('events');

/**
 * Dedicated TaskEvents EventEmitter singleton
 * Decouples asynchronous background side-effects from HTTP request-response flow.
 */
class TaskEvents extends EventEmitter {}

module.exports = new TaskEvents();
