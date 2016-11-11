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


module.exports = function handleShapeDefaults(shapeIn, shapeOut, fullLayout, opts, itemOpts) {
    opts = opts || {};
    itemOpts = itemOpts || {};

    function coerce(attr, dflt) {
        return Lib.coerce(shapeIn, shapeOut, attributes, attr, dflt);
    }

    var visible = coerce('visible', !itemOpts.itemIsNotPlainObject);

    if(!visible) return shapeOut;

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
            gdMock = {_fullLayout: fullLayout};

        // xref, yref
        var axRef = Axes.coerceRef(shapeIn, shapeOut, gdMock, axLetter, '', 'paper');

        if(shapeType !== 'path') {
            var dflt0 = 0.25,
                dflt1 = 0.75,
                ax,
                pos2r,
                r2pos;

            if(axRef !== 'paper') {
                ax = Axes.getFromId(gdMock, axRef);
                r2pos = helpers.rangeToShapePosition(ax);
                pos2r = helpers.shapePositionToRange(ax);
            }
            else {
                pos2r = r2pos = Lib.identity;
            }

            // hack until V2.0 when log has regular range behavior - make it look like other
            // ranges to send to coerce, then put it back after
            // this is all to give reasonable default position behavior on log axes, which is
            // a pretty unimportant edge case so we could just ignore this.
            var attr0 = axLetter + '0',
                attr1 = axLetter + '1',
                in0 = shapeIn[attr0],
                in1 = shapeIn[attr1];
            shapeIn[attr0] = pos2r(shapeIn[attr0], true);
            shapeIn[attr1] = pos2r(shapeIn[attr1], true);

            // x0, x1 (and y0, y1)
            Axes.coercePosition(shapeOut, gdMock, coerce, axRef, attr0, dflt0);
            Axes.coercePosition(shapeOut, gdMock, coerce, axRef, attr1, dflt1);

            // hack part 2
            shapeOut[attr0] = r2pos(shapeOut[attr0]);
            shapeOut[attr1] = r2pos(shapeOut[attr1]);
            shapeIn[attr0] = in0;
            shapeIn[attr1] = in1;
        }
    }

    if(shapeType === 'path') {
        coerce('path');
    }
    else {
        Lib.noneOrAll(shapeIn, shapeOut, ['x0', 'x1', 'y0', 'y1']);
    }

    return shapeOut;
};
