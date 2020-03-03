/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

exports.selectMode = function(dragmode) {
    return (
        dragmode === 'lasso' ||
        dragmode === 'select'
    );
};

exports.drawMode = function(dragmode) {
    return (
        dragmode === 'closedfreedraw' ||
        dragmode === 'openfreedraw' ||
        dragmode === 'linedraw' ||
        dragmode === 'rectdraw' ||
        dragmode === 'ellipsedraw'
    );
};

exports.openMode = function(dragmode) {
    return (
        dragmode === 'linedraw' ||
        dragmode === 'openfreedraw'
    );
};

exports.rectMode = function(dragmode) {
    return (
        dragmode === 'select' ||
        dragmode === 'linedraw' ||
        dragmode === 'rectdraw' ||
        dragmode === 'ellipsedraw'
    );
};

exports.freeMode = function(dragmode) {
    return (
        dragmode === 'lasso' ||
        dragmode === 'closedfreedraw' ||
        dragmode === 'openfreedraw'
    );
};

exports.selectingOrDrawing = function(dragmode) {
    return (
        exports.freeMode(dragmode) ||
        exports.rectMode(dragmode)
    );
};
