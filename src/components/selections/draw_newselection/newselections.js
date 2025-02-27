'use strict';

var dragHelpers = require('../../dragelement/helpers');
var selectMode = dragHelpers.selectMode;

var handleOutline = require('../../shapes/handle_outline');
var clearOutline = handleOutline.clearOutline;

var helpers = require('../../shapes/draw_newshape/helpers');
var readPaths = helpers.readPaths;
var writePaths = helpers.writePaths;
var fixDatesForPaths = helpers.fixDatesForPaths;

module.exports = function newSelections(outlines, dragOptions) {
    if(!outlines.length) return;
    var e = outlines[0][0]; // pick first
    if(!e) return;
    var d = e.getAttribute('d');

    var gd = dragOptions.gd;
    var newStyle = gd._fullLayout.newselection;

    var plotinfo = dragOptions.plotinfo;
    var xaxis = plotinfo.xaxis;
    var yaxis = plotinfo.yaxis;

    var isActiveSelection = dragOptions.isActiveSelection;
    var dragmode = dragOptions.dragmode;

    var selections = (gd.layout || {}).selections || [];

    if(!selectMode(dragmode) && isActiveSelection !== undefined) {
        var id = gd._fullLayout._activeSelectionIndex;
        if(id < selections.length) {
            switch(gd._fullLayout.selections[id].type) {
                case 'rect':
                    dragmode = 'select';
                    break;
                case 'path':
                    dragmode = 'lasso';
                    break;
            }
        }
    }

    var polygons = readPaths(d, gd, plotinfo, isActiveSelection);

    var newSelection = {
        xref: xaxis._id,
        yref: yaxis._id,

        opacity: newStyle.opacity,
        line: {
            color: newStyle.line.color,
            width: newStyle.line.width,
            dash: newStyle.line.dash
        }
    };

    var cell;
    // rect can be in one cell
    // only define cell if there is single cell
    if(polygons.length === 1) cell = polygons[0];

    if(
        cell &&
        cell.length === 5 && // ensure we only have 4 corners for a rect
        dragmode === 'select'
    ) {
        newSelection.type = 'rect';
        newSelection.x0 = cell[0][1];
        newSelection.y0 = cell[0][2];
        newSelection.x1 = cell[2][1];
        newSelection.y1 = cell[2][2];
    } else {
        newSelection.type = 'path';
        if(xaxis && yaxis) fixDatesForPaths(polygons, xaxis, yaxis);
        newSelection.path = writePaths(polygons);
        cell = null;
    }

    clearOutline(gd);

    var editHelpers = dragOptions.editHelpers;
    var modifyItem = (editHelpers || {}).modifyItem;

    var allSelections = [];
    for(var q = 0; q < selections.length; q++) {
        var beforeEdit = gd._fullLayout.selections[q];
        if(!beforeEdit) {
            allSelections[q] = beforeEdit;
            continue;
        }

        allSelections[q] = beforeEdit._input;

        if(
            isActiveSelection !== undefined &&
            q === gd._fullLayout._activeSelectionIndex
        ) {
            var afterEdit = newSelection;

            switch(beforeEdit.type) {
                case 'rect':
                    modifyItem('x0', afterEdit.x0);
                    modifyItem('x1', afterEdit.x1);
                    modifyItem('y0', afterEdit.y0);
                    modifyItem('y1', afterEdit.y1);
                    break;

                case 'path':
                    modifyItem('path', afterEdit.path);
                    break;
            }
        }
    }

    if(isActiveSelection === undefined) {
        allSelections.push(newSelection); // add new selection
        return allSelections;
    }

    return editHelpers ? editHelpers.getUpdateObj() : {};
};
