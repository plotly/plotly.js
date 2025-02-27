'use strict';

var Lib = require('../../lib');

var colorscaleDefaults = require('../../components/colorscale/defaults');
var attributes = require('./attributes');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var u = coerce('u');
    var v = coerce('v');
    var w = coerce('w');

    var x = coerce('x');
    var y = coerce('y');
    var z = coerce('z');

    if(
        !u || !u.length || !v || !v.length || !w || !w.length ||
        !x || !x.length || !y || !y.length || !z || !z.length
    ) {
        traceOut.visible = false;
        return;
    }

    var sizemode = coerce('sizemode');
    coerce('sizeref', sizemode === 'raw' ? 1 : 0.5);

    coerce('anchor');

    coerce('lighting.ambient');
    coerce('lighting.diffuse');
    coerce('lighting.specular');
    coerce('lighting.roughness');
    coerce('lighting.fresnel');
    coerce('lightposition.x');
    coerce('lightposition.y');
    coerce('lightposition.z');

    colorscaleDefaults(traceIn, traceOut, layout, coerce, {prefix: '', cLetter: 'c'});

    coerce('text');
    coerce('hovertext');
    coerce('hovertemplate');
    coerce('uhoverformat');
    coerce('vhoverformat');
    coerce('whoverformat');
    coerce('xhoverformat');
    coerce('yhoverformat');
    coerce('zhoverformat');

    // disable 1D transforms (for now)
    traceOut._length = null;
};
