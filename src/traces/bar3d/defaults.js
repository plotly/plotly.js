'use strict';

var Lib = require('../../lib');
var Registry = require('../../registry');
var attributes = require('./attributes');
var colorscaleDefaults = require('../../components/colorscale/defaults');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var x = coerce('x');
    var y = coerce('y');
    var value = coerce('value');

    if(
        !x || !x.length ||
        !y || !y.length ||
        !value || !value.length
    ) {
        traceOut.visible = false;
        return;
    }

    coerce('xgap');
    coerce('ygap');

    coerce('base');
    coerce('showbase');

    var handleCalendarDefaults = Registry.getComponentMethod('calendars', 'handleTraceDefaults');
    handleCalendarDefaults(traceIn, traceOut, ['x', 'y', 'z'], layout);

    coerce('valuehoverformat');
    ['x', 'y', 'z'].forEach(function(dim) {
        coerce(dim + 'hoverformat');
    });

    var showContour = coerce('contour.show');
    if(showContour) {
        coerce('contour.color');
        coerce('contour.width');
    }

    // Coerce remaining properties
    [
        'text',
        'hovertext',
        'hovertemplate',
        'lighting.ambient',
        'lighting.diffuse',
        'lighting.specular',
        'lighting.roughness',
        'lighting.fresnel',
        'lighting.vertexnormalsepsilon',
        'lighting.facenormalsepsilon',
        'lightposition.x',
        'lightposition.y',
        'lightposition.z',
        'flatshading',
        'opacity'
    ].forEach(function(x) { coerce(x); });


    coerce('marker.fill');
    var coloring = coerce('marker.coloring');
    if(coloring === 'color') {
        coerce('marker.color');
    } else {
        colorscaleDefaults(traceIn, traceOut, layout, coerce, {prefix: '', cLetter: 'c'});
    }

    // disable 1D transforms (for now)
    traceOut._length = null;
};
