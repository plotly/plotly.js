'use strict';

var Lib = require('../lib');

/**
 * Enable or disable performance profiling on a graph div
 *
 * @param {string|HTMLDivElement} gd - Graph div or its id
 * @param {boolean} [enable=true] - Whether to enable profiling
 * @returns {Object|null} - Current profile data if available, null otherwise
 *
 * Usage:
 *   Plotly.profile('myDiv');           // Enable profiling
 *   Plotly.profile('myDiv', true);     // Enable profiling
 *   Plotly.profile('myDiv', false);    // Disable profiling
 *
 * After each render, profile data is available via:
 *   gd._profileData           // Latest profile result
 *   gd.on('plotly_profiled', function(data) { ... });  // Event listener
 */
function profile(gd, enable) {
    gd = Lib.getGraphDiv(gd);

    if(!Lib.isPlotDiv(gd)) {
        Lib.warn('profile() called on non-plot element');
        return null;
    }

    // Default to enabling
    if(enable === undefined) enable = true;

    gd._profileEnabled = !!enable;

    if(!enable) {
        // Clear profile data when disabling
        delete gd._profileData;
    }

    return gd._profileData || null;
}

module.exports = profile;
