'use strict';

var R = require('ramda');

// var Lib = require('@src/lib');
var Lib = require('../../../../src/lib');

/*eslint no-unused-vars: 0*/


// so that Plotly.register knows what to do with it
exports.moduleType = 'transform';

// determines to link between transform type and transform module
exports.name = 'candlestick';

//var schema = require('plotly.js').PlotSchema.get();

//var boxAttrs = schema.traces.box.attributes;
var transformKeys = {
    shared: ['hoverinfo', 'orientation'],
    independent: [
        'fillcolor', 'name', 'legendgroup', 'line',
        'opacity', 'showlegend', 'visible',
        'xaxis', 'yaxis'
    ],
    transformSpecific: ['x', 'o', 'h', 'l', 'c']
};

function extend(basearray, newarray) {
    for(var i = 0; i < newarray.length; i++) basearray.push(newarray[i]);
}

var highColor = '#1A9B4E';
var lowColor = '#D74624';

function styleAttributes(color, name) {
    return {
        fillcolor: {
            valType: 'color',
            dflt: color
        },
        line: {
            color: {
                valType: 'color',
                dflt: color
            },
            width: {
                valType: 'number',
                dflt: 2
            }
        },
        name: {
            valType: 'string',
            dflt: name
        },
        opacity: {
            valType: 'number',
            dflt: 1
        },
        legendgroup: {valType: 'string'},
        showlegend: {valType: 'boolean', dflt: true},
        visible: {valType: 'boolean', dflt: true},
        xaxis: {
            valType: 'subplotid',
            dflt: 'x'
        }, // is this right?
        yaxis: {
            valType: 'subplotid',
            dflt: 'y'
        }
    };
}

exports.attributes = {
    x: {valType: 'data_array'},
    o: {valType: 'data_array'},
    h: {valType: 'data_array'},
    l: {valType: 'data_array'},
    c: {valType: 'data_array'},
    // + src keys?

    hoverinfo: {
        valType: 'flaglist',
        // change name of y to something more candlestick-y?
        flags: ['x', 'y', 'text', 'name'],
        dflt: 'y'
    },
    orientation: {
        valType: 'enumerated',
        values: ['v', 'h'],
        dflt: 'v'
    },

    high: styleAttributes(highColor, 'high'),
    low: styleAttributes(lowColor, 'low')

};

exports.supplyDefaults = function(transformIn, fullData, layout) {
    var transformOut = {};


    function coerce(attr, dflt) {
        return Lib.coerce(transformIn, transformOut, exports.attributes, attr, dflt);
    }

    var i;
    for(i = 0; i < transformKeys.transformSpecific.length; i++) {
        console.warn('transformKeys.transformSpecific[i]: ', transformKeys.transformSpecific[i]);
        coerce(transformKeys.transformSpecific[i]);
    }
    for(i = 0; i < transformKeys.shared.length; i++) {
        console.warn('transformKeys.shared[i]: ', transformKeys.shared[i]);
        coerce(transformKeys.shared[i]);
    }

    // then all the high.fillcolor etc.
    for(i = 0; i < transformKeys.independent.length; i++) {
        console.warn('high.'+transformKeys.independent[i]);
        if(transformKeys.independent[i] !== 'line') {
            coerce('high.'+transformKeys.independent[i]);
            coerce('low.'+transformKeys.independent[i]);
        }
    }
    // nested color keys
    coerce('high.line.color');
    coerce('low.line.color');

    return transformOut;

};

// apply transform
exports.transform = function(data, state) {
    var transform = state.transform;

    console.warn(JSON.stringify(transform, null, 2));

    var highTrace = {type: 'box', x: [], y: []}; // uh or initialize it
    var lowTrace = {type: 'box', x: [], y: []};

    // TODO: deal w missing values
    // TODO: deal w partial updates

    // Map data
    if(transform.x && transform.o && transform.h &&
       transform.l && transform.c) {

        for(var i = 0; i < transform.x.length; i++) {
            var row = {
                o: transform.o[i],
                h: transform.h[i],
                l: transform.l[i],
                c: transform.c[i],
                x: transform.x[i]
            };
            var boxY = [row.l, row.o, row.c, row.c, row.c, row.h];
            var boxX = Array(6).fill(row.x);
            if(row.o > row.c) {
                extend(highTrace.y, boxY);
                extend(highTrace.x, boxX);
            } else {
                extend(lowTrace.y, boxY);
                extend(lowTrace.x, boxX);
            }
        }

    }

    // Map nested style properties into traces
    // TODO: how does this work with restyle updates like `high.opacity`?
    if(transform.high) {
        transformKeys.independent.forEach(function(k) {
            if(transform.high[k]) {
                highTrace[k] = transform.high[k];
            }
        });
    }
    if(transform.low) {
        transformKeys.independent.forEach(function(k) {
            if(transform.low[k]) {
                lowTrace[k] = transform.low[k];
            }
        });
    }

    // Map shared keys across both traces
    transformKeys.shared.forEach(function(k) {
        if(transform[k]) {
            highTrace[k] = lowTrace[k] = transform[k];
        }
    });

    // Map some layout properties?
    state.layout.boxmode = 'group'; // will we need a layout transform?

    return [
        highTrace,
        lowTrace
    ];

};

exports.transformInverse = function() {

}
