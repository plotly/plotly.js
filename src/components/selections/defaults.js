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

    // Drop rect selections with undefined x0, y0, x1, x1 values.
    // In future we may accept partially defined rects e.g.
    // a case with only x0 and x1 may be used to define
    // [-Infinity, +Infinity] range on the y axis, etc.
    var selections = layoutOut.selections;
    for(var i = 0; i < selections.length; i++) {
        var selection = selections[i];
        if(!selection) continue;
        if(selection.path === undefined) {
            if(
                selection.x0 === undefined ||
                selection.x1 === undefined ||
                selection.y0 === undefined ||
                selection.y1 === undefined
            ) {
                layoutOut.selections[i] = null;
            }
        }
    }
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

            Axes.coercePosition(selectionOut, gdMock, coerce, axRef, attr0);
            Axes.coercePosition(selectionOut, gdMock, coerce, axRef, attr1);

            var p0 = selectionOut[attr0];
            var p1 = selectionOut[attr1];

            if(p0 !== undefined && p1 !== undefined) {
                // hack part 2
                selectionOut[attr0] = r2pos(p0);
                selectionOut[attr1] = r2pos(p1);
                selectionIn[attr0] = in0;
                selectionIn[attr1] = in1;
            }
        }
    }

    if(noPath) {
        Lib.noneOrAll(selectionIn, selectionOut, ['x0', 'x1', 'y0', 'y1']);
    }
}
