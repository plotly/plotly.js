'use strict';

exports.selectMode = function(dragmode) {
    return (
        dragmode === 'lasso' ||
        dragmode === 'select'
    );
};

exports.drawMode = function(dragmode) {
    return (
        dragmode === 'drawclosedpath' ||
        dragmode === 'drawopenpath' ||
        dragmode === 'drawline' ||
        dragmode === 'drawrect' ||
        dragmode === 'drawcircle'
    );
};

exports.openMode = function(dragmode) {
    return (
        dragmode === 'drawline' ||
        dragmode === 'drawopenpath'
    );
};

exports.rectMode = function(dragmode) {
    return (
        dragmode === 'select' ||
        dragmode === 'drawline' ||
        dragmode === 'drawrect' ||
        dragmode === 'drawcircle'
    );
};

exports.freeMode = function(dragmode) {
    return (
        dragmode === 'lasso' ||
        dragmode === 'drawclosedpath' ||
        dragmode === 'drawopenpath'
    );
};

exports.selectingOrDrawing = function(dragmode) {
    return (
        exports.freeMode(dragmode) ||
        exports.rectMode(dragmode)
    );
};

exports.effectiveDragmode = (dragmode, { shiftKey } = {}) => {
    if(!shiftKey || !dragmode || exports.selectingOrDrawing(dragmode)) return dragmode;
    return dragmode === 'pan' ? 'zoom' : 'pan';
};

exports.dragCursor = (dragmode, modifiers) =>
    exports.effectiveDragmode(dragmode, modifiers) === 'pan' ? 'move' : 'crosshair';

const ACTION_BY_MODIFIER = { shiftKey: 'rotate', ctrlKey: 'pan', altKey: 'zoom' };
const CURSOR_BY_ACTION = { rotate: 'default', pan: 'move', zoom: 'crosshair' };

exports.dragCursor3d = (cameraMode, modifiers = {}) => {
    if(!cameraMode) return 'default';

    const heldActions = Object.keys(ACTION_BY_MODIFIER)
        .filter((key) => modifiers[key])
        .map((key) => ACTION_BY_MODIFIER[key]);
    if(heldActions.length > 1) return 'default';

    const modeAction = cameraMode === 'pan' || cameraMode === 'zoom' ? cameraMode : 'rotate';
    return CURSOR_BY_ACTION[heldActions[0] || modeAction];
};
