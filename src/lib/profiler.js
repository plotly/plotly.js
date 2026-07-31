'use strict';

/**
 * Profiler utility for collecting render timing data
 *
 * Usage:
 *   var profiler = Profiler.start(gd);
 *   // ... do work ...
 *   profiler.mark('phaseName');
 *   // ... do more work ...
 *   profiler.end();
 */

exports.isEnabled = function(gd) {
    return gd && gd._profileEnabled === true;
};

exports.start = function(gd) {
    if(!exports.isEnabled(gd)) {
        return {
            mark: function() {},
            end: function() {}
        };
    }

    var startTime = performance.now();
    var lastMark = startTime;
    var phases = {};

    return {
        mark: function(phaseName) {
            var now = performance.now();
            phases[phaseName] = {
                duration: now - lastMark,
                timestamp: now - startTime
            };
            lastMark = now;
        },
        end: function() {
            var endTime = performance.now();
            return {
                total: endTime - startTime,
                phases: phases,
                timestamp: new Date().toISOString()
            };
        }
    };
};
