'use strict';

var Lib = require('../../lib');

module.exports = {
    hasLines: function(trace) {
        return trace.visible && trace.mode &&
            trace.mode.indexOf('lines') !== -1;
    },

    hasMarkers: function(trace) {
        return trace.visible && (
            (trace.mode && trace.mode.indexOf('markers') !== -1) ||
            // until splom implements 'mode'
            trace.type === 'splom'
        );
    },

    hasText: function(trace) {
        return trace.visible && trace.mode &&
            trace.mode.indexOf('text') !== -1;
    },

    isBubble: function(trace) {
        return Lib.isPlainObject(trace.marker) &&
            Lib.isArrayOrTypedArray(trace.marker.size);
    }
};
