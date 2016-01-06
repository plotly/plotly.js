/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

module.exports = {
    hasLines: function(trace) {
        return trace.visible && trace.mode &&
            trace.mode.indexOf('lines') !== -1;
    },

    hasMarkers: function(trace) {
        return trace.visible && trace.mode &&
            trace.mode.indexOf('markers') !== -1;
    },

    hasText: function(trace) {
        return trace.visible && trace.mode &&
            trace.mode.indexOf('text') !== -1;
    },

    isBubble: function(trace) {
        return (typeof trace.marker === 'object' &&
                    Array.isArray(trace.marker.size));
    }
};
