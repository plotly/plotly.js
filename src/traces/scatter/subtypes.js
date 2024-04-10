'use strict';

var Lib = require('../../lib');
var isTypedArraySpec = require('../../lib/array').isTypedArraySpec;

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
        var marker = trace.marker;
        return Lib.isPlainObject(marker) && (
            Lib.isArrayOrTypedArray(marker.size) ||
            isTypedArraySpec(marker.size)
        );
    }
};
