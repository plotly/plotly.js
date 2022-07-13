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
