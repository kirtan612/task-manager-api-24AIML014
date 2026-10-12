import { lazy } from 'react';

/**
 * Wraps dynamic import() with an artificial minimum delay to prevent
 * jarring micro-flicker on ultra-fast networks.
 *
 * @param {() => Promise<{ default: React.ComponentType<any> }>} factory
 * @param {number} minDelayMs
 */
export function lazyWithMinDelay(factory, minDelayMs = 300) {
    return lazy(() =>
        Promise.all([
            factory(),
            new Promise((resolve) => setTimeout(resolve, minDelayMs)),
        ]).then(([moduleExports]) => moduleExports)
    );
}
