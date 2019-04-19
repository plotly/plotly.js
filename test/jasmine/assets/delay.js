'use strict';

/**
 * This is a very quick and simple promise delayer. It's not full-featured
 * like the `delay` module.
 *
 * Promise.resolve().then(delay(50)).then(...);
 *
 *   or:
 *
 * delay(50)().then(...);
 */
module.exports = function delay(duration) {
    return function(value) {
        return new Promise(function(resolve) {
            setTimeout(function() {
                resolve(value);
            }, duration || 0);
        });
    };
};
