/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');

var attributes = require('./attributes');
var helpers = require('./helpers');

module.exports = function handleShapeDefaults(shapeIn, fullLayout) {
    var shapeOut = {};

    function coerce(attr, dflt) {
        return Lib.coerce(shapeIn, shapeOut, attributes, attr, dflt);
    }

    coerce('layer');
    coerce('opacity');
    coerce('fillcolor');
    coerce('line.color');
    coerce('line.width');
    coerce('line.dash');

    var dfltType = shapeIn.path ? 'path' : 'rect',
        shapeType = coerce('type', dfltType);

    // positioning
    var axLetters = ['x', 'y'];
    for(var i = 0; i < 2; i++) {
        var axLetter = axLetters[i],
            tdMock = {_fullLayout: fullLayout};

        // xref, yref
        var axRef = Axes.coerceRef(shapeIn, shapeOut, tdMock, axLetter);

        if(shapeType !== 'path') {
            var dflt0 = 0.25,
                dflt1 = 0.75;

            if(axRef !== 'paper') {
                var ax = Axes.getFromId(tdMock, axRef),
                    convertFn = helpers.linearToData(ax);

                dflt0 = convertFn(ax.range[0] + dflt0 * (ax.range[1] - ax.range[0]));
                dflt1 = convertFn(ax.range[0] + dflt1 * (ax.range[1] - ax.range[0]));
            }

            // x0, x1 (and y0, y1)
            coerce(axLetter + '0', dflt0);
            coerce(axLetter + '1', dflt1);
        }
    }

    if(shapeType === 'path') {
        coerce('path');
    } else {
        Lib.noneOrAll(shapeIn, shapeOut, ['x0', 'x1', 'y0', 'y1']);
    }

    return shapeOut;
};
