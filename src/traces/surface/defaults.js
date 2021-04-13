'use strict';

var Registry = require('../../registry');
var Lib = require('../../lib');

var colorscaleDefaults = require('../../components/colorscale/defaults');
var attributes = require('./attributes');

var MIN = 0.1; // Note: often we don't want the data cube to be disappeared

function createWave(n, minOpacity) {
    var arr = [];
    var steps = 32; // Max: 256
    for(var i = 0; i < steps; i++) {
        var u = i / (steps - 1);
        var v = minOpacity + (1 - minOpacity) * (1 - Math.pow(Math.sin(n * u * Math.PI), 2));
        arr.push([
            u,
            Math.max(0, Math.min(1, v))
        ]);
    }
    return arr;
}

function isValidScaleArray(scl) {
    var highestVal = 0;

    if(!Array.isArray(scl) || scl.length < 2) return false;

    if(!scl[0] || !scl[scl.length - 1]) return false;

    if(+scl[0][0] !== 0 || +scl[scl.length - 1][0] !== 1) return false;

    for(var i = 0; i < scl.length; i++) {
        var si = scl[i];

        if(si.length !== 2 || +si[0] < highestVal) {
            return false;
        }

        highestVal = +si[0];
    }

    return true;
}

function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    var i, j;

    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var x = coerce('x');
    var y = coerce('y');

    var z = coerce('z');
    if(!z || !z.length ||
       (x ? (x.length < 1) : false) ||
       (y ? (y.length < 1) : false)
    ) {
        traceOut.visible = false;
        return;
    }

    traceOut._xlength = (Array.isArray(x) && Lib.isArrayOrTypedArray(x[0])) ? z.length : z[0].length;
    traceOut._ylength = z.length;

    var handleCalendarDefaults = Registry.getComponentMethod('calendars', 'handleTraceDefaults');
    handleCalendarDefaults(traceIn, traceOut, ['x', 'y', 'z'], layout);

    coerce('text');
    coerce('hovertext');
    coerce('hovertemplate');
    coerce('xhoverformat');
    coerce('yhoverformat');
    coerce('zhoverformat');

    // Coerce remaining properties
    [
        'lighting.ambient',
        'lighting.diffuse',
        'lighting.specular',
        'lighting.roughness',
        'lighting.fresnel',
        'lightposition.x',
        'lightposition.y',
        'lightposition.z',
        'hidesurface',
        'connectgaps',
        'opacity'
    ].forEach(function(x) { coerce(x); });

    var surfaceColor = coerce('surfacecolor');

    var dims = ['x', 'y', 'z'];
    for(i = 0; i < 3; ++i) {
        var contourDim = 'contours.' + dims[i];
        var show = coerce(contourDim + '.show');
        var highlight = coerce(contourDim + '.highlight');

        if(show || highlight) {
            for(j = 0; j < 3; ++j) {
                coerce(contourDim + '.project.' + dims[j]);
            }
        }

        if(show) {
            coerce(contourDim + '.color');
            coerce(contourDim + '.width');
            coerce(contourDim + '.usecolormap');
        }

        if(highlight) {
            coerce(contourDim + '.highlightcolor');
            coerce(contourDim + '.highlightwidth');
        }

        coerce(contourDim + '.start');
        coerce(contourDim + '.end');
        coerce(contourDim + '.size');
    }

    // backward compatibility block
    if(!surfaceColor) {
        mapLegacy(traceIn, 'zmin', 'cmin');
        mapLegacy(traceIn, 'zmax', 'cmax');
        mapLegacy(traceIn, 'zauto', 'cauto');
    }

    // TODO if contours.?.usecolormap are false and hidesurface is true
    // the colorbar shouldn't be shown by default

    colorscaleDefaults(
        traceIn, traceOut, layout, coerce, {prefix: '', cLetter: 'c'}
    );

    opacityscaleDefaults(traceIn, traceOut, layout, coerce);

    // disable 1D transforms - currently surface does NOT support column data like heatmap does
    // you can use mesh3d for this use case, but not surface
    traceOut._length = null;
}

function opacityscaleDefaults(traceIn, traceOut, layout, coerce) {
    var opacityscale = coerce('opacityscale');
    if(opacityscale === 'max') {
        traceOut.opacityscale = [[0, MIN], [1, 1]];
    } else if(opacityscale === 'min') {
        traceOut.opacityscale = [[0, 1], [1, MIN]];
    } else if(opacityscale === 'extremes') {
        traceOut.opacityscale = createWave(1, MIN);
    } else if(!isValidScaleArray(opacityscale)) {
        traceOut.opacityscale = undefined;
    }
}

function mapLegacy(traceIn, oldAttr, newAttr) {
    if(oldAttr in traceIn && !(newAttr in traceIn)) {
        traceIn[newAttr] = traceIn[oldAttr];
    }
}

module.exports = {
    supplyDefaults: supplyDefaults,
    opacityscaleDefaults: opacityscaleDefaults
};
