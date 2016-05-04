'use strict';

var R = require('ramda')

// var Lib = require('@src/lib');
var Lib = require('../../../../src/lib');

/*eslint no-unused-vars: 0*/


// so that Plotly.register knows what to do with it
exports.moduleType = 'transform';

// determines to link between transform type and transform module
exports.name = 'subplots';

exports.attributes = {
    orientation: {
        valType: 'enumerated',
        values: ['rows', 'columns', 'wrapped'],
        dflt: 'rows'
    },
    padding: {
        valType: 'number',
        dflt: 0.1 // 10% of the space is padding
    }
    // nrows: map more than just the traces generated from this transform?
    // gap between subplots
    // wrapped: dimensions
    // shared axes
};

exports.supplyDefaults = function(transformIn, fullData, layout) {
    var transformOut = {};

    function coerce(attr, dflt) {
        return Lib.coerce(transformIn, transformOut, exports.attributes, attr, dflt);
    }

    coerce('orientation');
    coerce('padding');

    return transformOut;
};

exports.transform = function(data, state) {
    var transform = state.transform;
    var layout = state.layout;

    var padding = transform.padding;
    var spacing = padding / (data.length - 1);
    var axisHeight = (1 - spacing) / data.length;

    data.forEach(function(trace, i) {
        trace.xaxis = 'x'+(i+1);
        trace.yaxis = 'y'+(i+1);

        // xaxis
        layout['xaxis'+(i+1)] = layout['xaxis'+(i+1)] || {};
        Object.assign(layout['xaxis'+(i+1)], {
            domain: [0, 1],
            anchor: 'y'+(i+1)
        });

        // yaxis
        layout['yaxis'+(i+1)] = layout['yaxis'+(i+1)] || {};
        Object.assign(layout['yaxis'+(i+1)], {
            domain: [
                i*axisHeight + i*padding,
                (i+1) * axisHeight + i*padding
            ]
        });
    });

    return data;

};
