'use strict';

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');
var handleArrayContainerDefaults = require('../../plots/array_container_defaults');

var attributes = require('./attributes');
var helpers = require('../shapes/helpers');

module.exports = function supplyLayoutDefaults(layoutIn, layoutOut) {
    handleArrayContainerDefaults(layoutIn, layoutOut, {
        name: 'selections',
        handleItemDefaults: handleSelectionDefaults
    });
};

function handleSelectionDefaults(selectionIn, selectionOut, fullLayout) {
    function coerce(attr, dflt) {
        return Lib.coerce(selectionIn, selectionOut, attributes, attr, dflt);
    }

    var path = coerce('path');
    var dfltType = path ? 'path' : 'rect';
    var selectionType = coerce('type', dfltType);
    var noPath = selectionType !== 'path';
    if(noPath) delete selectionOut.path;

    coerce('opacity');
    coerce('line.color');
    coerce('line.width');
    coerce('line.dash');

    // positioning
    var axLetters = ['x', 'y'];
    for(var i = 0; i < 2; i++) {
        var axLetter = axLetters[i];
        var gdMock = {_fullLayout: fullLayout};
        var ax;
        var pos2r;
        var r2pos;

        // xref, yref
        var axRef = Axes.coerceRef(selectionIn, selectionOut, gdMock, axLetter);

        // axRefType is 'range' for selections
        ax = Axes.getFromId(gdMock, axRef);
        ax._selectionIndices.push(selectionOut._index);
        r2pos = helpers.rangeToShapePosition(ax);
        pos2r = helpers.shapePositionToRange(ax);

        // Coerce x0, x1, y0, y1
        if(noPath) {
            var dflt0 = 0.25;
            var dflt1 = 0.75;

            // hack until V3.0 when log has regular range behavior - make it look like other
            // ranges to send to coerce, then put it back after
            // this is all to give reasonable default position behavior on log axes, which is
            // a pretty unimportant edge case so we could just ignore this.
            var attr0 = axLetter + '0';
            var attr1 = axLetter + '1';
            var in0 = selectionIn[attr0];
            var in1 = selectionIn[attr1];
            selectionIn[attr0] = pos2r(selectionIn[attr0], true);
            selectionIn[attr1] = pos2r(selectionIn[attr1], true);

            Axes.coercePosition(selectionOut, gdMock, coerce, axRef, attr0, dflt0);
            Axes.coercePosition(selectionOut, gdMock, coerce, axRef, attr1, dflt1);

            // hack part 2
            selectionOut[attr0] = r2pos(selectionOut[attr0]);
            selectionOut[attr1] = r2pos(selectionOut[attr1]);
            selectionIn[attr0] = in0;
            selectionIn[attr1] = in1;
        }
    } // TODO: centralize. This is similar to shapes.

    if(noPath) {
        Lib.noneOrAll(selectionIn, selectionOut, ['x0', 'x1', 'y0', 'y1']);
    }
}
