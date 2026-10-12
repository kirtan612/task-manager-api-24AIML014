const NodeCache = require('node-cache');

/**
 * Shared in-memory cache instance (node-cache)
 * Default TTL (Time-To-Live): 60 seconds
 * Check period for expired key cleanup: 120 seconds
 */
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

let hitCount = 0;
let missCount = 0;

/**
 * Wrapped get method to monitor cache hits and misses
 * @param {string} key
 * @returns {any} cached value or undefined
 */
cache.getWithMetrics = function (key) {
    const val = cache.get(key);
    if (val !== undefined) {
        hitCount++;
        return val;
    }
    missCount++;
    return undefined;
};

/**
 * Retrieve cache performance metrics and debug telemetry
 * @returns {object} hit/miss counts, ratios, active keys, and node-cache stats
 */
cache.getMetrics = function () {
    const internalStats = cache.getStats();
    const total = hitCount + missCount;
    return {
        hits: hitCount,
        misses: missCount,
        totalRequests: total,
        hitRatio: total > 0 ? ((hitCount / total) * 100).toFixed(2) + '%' : '0.00%',
        activeKeys: cache.keys(),
        keyCount: cache.keys().length,
        stdTTL: 60,
        internalStats,
    };
};

/**
 * Reset hit and miss telemetry counters
 */
cache.resetMetrics = function () {
    hitCount = 0;
    missCount = 0;
};

module.exports = cache;
