/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');
var handleArrayContainerDefaults = require('../../plots/array_container_defaults');

var attributes = require('./attributes');
var helpers = require('./helpers');


module.exports = function supplyLayoutDefaults(layoutIn, layoutOut) {
    handleArrayContainerDefaults(layoutIn, layoutOut, {
        name: 'shapes',
        handleItemDefaults: handleShapeDefaults
    });
};

function handleShapeDefaults(shapeIn, shapeOut, fullLayout) {
    function coerce(attr, dflt) {
        return Lib.coerce(shapeIn, shapeOut, attributes, attr, dflt);
    }

    var visible = coerce('visible');

    if(!visible) return;

    coerce('layer');
    coerce('opacity');
    coerce('fillcolor');
    coerce('line.color');
    coerce('line.width');
    coerce('line.dash');

    var dfltType = shapeIn.path ? 'path' : 'rect',
        shapeType = coerce('type', dfltType),
        xSizeMode = coerce('xsizemode'),
        ySizeMode = coerce('ysizemode');

    // positioning
    var axLetters = ['x', 'y'];
    for(var i = 0; i < 2; i++) {
        var axLetter = axLetters[i],
            attrAnchor = axLetter + 'anchor',
            sizeMode = axLetter === 'x' ? xSizeMode : ySizeMode,
            gdMock = {_fullLayout: fullLayout},
            ax,
            pos2r,
            r2pos;

        // xref, yref
        var axRef = Axes.coerceRef(shapeIn, shapeOut, gdMock, axLetter, '', 'paper');

        if(axRef !== 'paper') {
            ax = Axes.getFromId(gdMock, axRef);
            r2pos = helpers.rangeToShapePosition(ax);
            pos2r = helpers.shapePositionToRange(ax);
        }
        else {
            pos2r = r2pos = Lib.identity;
        }

        // Coerce x0, x1, y0, y1
        if(shapeType !== 'path') {
            var dflt0 = 0.25,
                dflt1 = 0.75;

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

            if(sizeMode === 'pixel') {
                coerce(attr0, 0);
                coerce(attr1, 10);
            } else {
                Axes.coercePosition(shapeOut, gdMock, coerce, axRef, attr0, dflt0);
                Axes.coercePosition(shapeOut, gdMock, coerce, axRef, attr1, dflt1);
            }

            // hack part 2
            shapeOut[attr0] = r2pos(shapeOut[attr0]);
            shapeOut[attr1] = r2pos(shapeOut[attr1]);
            shapeIn[attr0] = in0;
            shapeIn[attr1] = in1;
        }

        // Coerce xanchor and yanchor
        if(sizeMode === 'pixel') {
            // Hack for log axis described above
            var inAnchor = shapeIn[attrAnchor];
            shapeIn[attrAnchor] = pos2r(shapeIn[attrAnchor], true);

            Axes.coercePosition(shapeOut, gdMock, coerce, axRef, attrAnchor, 0.25);

            // Hack part 2
            shapeOut[attrAnchor] = r2pos(shapeOut[attrAnchor]);
            shapeIn[attrAnchor] = inAnchor;
        }
    }

    if(shapeType === 'path') {
        coerce('path');
    }
    else {
        Lib.noneOrAll(shapeIn, shapeOut, ['x0', 'x1', 'y0', 'y1']);
    }
}
