/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');

var Plots = require('../../plots/plots');
var Lib = require('../../lib');

var attributes = require('./attributes');


module.exports = function(traceIn, traceOut, defaultColor, opts) {
    var objName = 'error_' + opts.axis,
        containerOut = traceOut[objName] = {},
        containerIn = traceIn[objName] || {};

    function coerce(attr, dflt) {
        return Lib.coerce(containerIn, containerOut, attributes, attr, dflt);
    }

    var hasErrorBars = (
        containerIn.array !== undefined ||
        containerIn.value !== undefined ||
        containerIn.type === 'sqrt'
    );

    var visible = coerce('visible', hasErrorBars);

    if(visible === false) return;

    var type = coerce('type', 'array' in containerIn ? 'data' : 'percent'),
        symmetric = true;

    if(type !== 'sqrt') {
        symmetric = coerce('symmetric',
            !((type === 'data' ? 'arrayminus' : 'valueminus') in containerIn));
    }

    if(type === 'data') {
        var array = coerce('array');
        if(!array) containerOut.array = [];
        coerce('traceref');
        if(!symmetric) {
            var arrayminus = coerce('arrayminus');
            if(!arrayminus) containerOut.arrayminus = [];
            coerce('tracerefminus');
        }
    }
    else if(type === 'percent' || type === 'constant') {
        coerce('value');
        if(!symmetric) coerce('valueminus');
    }

    var copyAttr = 'copy_' + opts.inherit + 'style';
    if(opts.inherit) {
        var inheritObj = traceOut['error_' + opts.inherit];
        if((inheritObj || {}).visible) {
            coerce(copyAttr, !(containerIn.color ||
                               isNumeric(containerIn.thickness) ||
                               isNumeric(containerIn.width)));
        }
    }
    if(!opts.inherit || !containerOut[copyAttr]) {
        coerce('color', defaultColor);
        coerce('thickness');
        coerce('width', Plots.traceIs(traceOut, 'gl3d') ? 0 : 4);
    }
};
