/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');
var tinycolor = require('tinycolor2');
var isArrayOrTypedArray = require('../../lib').isArrayOrTypedArray;
var TEXTPAD = require('./constants').TEXTPAD;

exports.coerceString = function(attributeDefinition, value, defaultValue) {
    if(typeof value === 'string') {
        if(value || !attributeDefinition.noBlank) return value;
    } else if(typeof value === 'number' || value === true) {
        if(!attributeDefinition.strict) return String(value);
    }

    return (defaultValue !== undefined) ?
      defaultValue :
      attributeDefinition.dflt;
};

exports.coerceNumber = function(attributeDefinition, value, defaultValue) {
    if(isNumeric(value)) {
        value = +value;

        var min = attributeDefinition.min;
        var max = attributeDefinition.max;
        var isOutOfBounds = (min !== undefined && value < min) ||
              (max !== undefined && value > max);

        if(!isOutOfBounds) return value;
    }

    return (defaultValue !== undefined) ?
      defaultValue :
      attributeDefinition.dflt;
};

exports.coerceColor = function(attributeDefinition, value, defaultValue) {
    if(tinycolor(value).isValid()) return value;

    return (defaultValue !== undefined) ?
      defaultValue :
      attributeDefinition.dflt;
};

exports.coerceEnumerated = function(attributeDefinition, value, defaultValue) {
    if(attributeDefinition.coerceNumber) value = +value;

    if(attributeDefinition.values.indexOf(value) !== -1) return value;

    return (defaultValue !== undefined) ?
      defaultValue :
      attributeDefinition.dflt;
};

exports.getValue = function(arrayOrScalar, index) {
    var value;
    if(!Array.isArray(arrayOrScalar)) value = arrayOrScalar;
    else if(index < arrayOrScalar.length) value = arrayOrScalar[index];
    return value;
};

exports.getLineWidth = function(trace, di) {
    var w =
        (0 < di.mlw) ? di.mlw :
        !isArrayOrTypedArray(trace.marker.line.width) ? trace.marker.line.width :
        0;

    return w;
};

exports.dirSign = function(a, b) {
    return (a < b) ? 1 : -1;
};

exports.toMoveInsideBar = function(x0, x1, y0, y1, textBB, opts) {
    var isHorizontal = !!opts.isHorizontal;
    var constrained = !!opts.constrained;
    var angle = opts.angle || 0;
    var anchor = opts.anchor || 0;

    var textWidth = textBB.width;
    var textHeight = textBB.height;
    var lx = Math.abs(x1 - x0);
    var ly = Math.abs(y1 - y0);

    var textpad = (
        lx > (2 * TEXTPAD) &&
        ly > (2 * TEXTPAD)
    ) ? TEXTPAD : 0;

    lx -= 2 * textpad;
    ly -= 2 * textpad;

    var autoRotate = (angle === 'auto');
    var isAutoRotated = false;
    if(autoRotate &&
        !(textWidth <= lx && textHeight <= ly) &&
        (textWidth > lx || textHeight > ly) && (
        !(textWidth > ly || textHeight > lx) ||
        ((textWidth < textHeight) !== (lx < ly))
    )) {
        isAutoRotated = true;
    }

    if(isAutoRotated) {
        // don't rotate yet only swap bar width with height
        var tmp = ly;
        ly = lx;
        lx = tmp;
    }

    var rotate = getRotateFromAngle(angle);
    var absSin = Math.abs(Math.sin(Math.PI / 180 * rotate));
    var absCos = Math.abs(Math.cos(Math.PI / 180 * rotate));

    // compute and apply text padding
    var dx = Math.max(lx * absCos, ly * absSin);
    var dy = Math.max(lx * absSin, ly * absCos);

    var scale = (constrained) ?
        Math.min(dx / textWidth, dy / textHeight) :
        Math.max(absCos, absSin);

    scale = Math.min(1, scale);

    // compute text and target positions
    var targetX = (x0 + x1) / 2;
    var targetY = (y0 + y1) / 2;

    if(anchor !== 'middle') { // case of 'start' or 'end'
        var targetWidth = scale * (isHorizontal !== isAutoRotated ? textHeight : textWidth);
        var targetHeight = scale * (isHorizontal !== isAutoRotated ? textWidth : textHeight);
        textpad += 0.5 * (targetWidth * absSin + targetHeight * absCos);

        if(isHorizontal) {
            textpad *= exports.dirSign(x0, x1);
            targetX = (anchor === 'start') ? x0 + textpad : x1 - textpad;
        } else {
            textpad *= exports.dirSign(y0, y1);
            targetY = (anchor === 'start') ? y0 + textpad : y1 - textpad;
        }
    }

    var textX = (textBB.left + textBB.right) / 2;
    var textY = (textBB.top + textBB.bottom) / 2;

    // lastly apply auto rotation
    if(isAutoRotated) rotate += 90;

    return {
        textX: textX,
        textY: textY,
        targetX: targetX,
        targetY: targetY,
        scale: scale,
        rotate: rotate
    };
};

exports.toMoveOutsideBar = function(x0, x1, y0, y1, textBB, opts) {
    var isHorizontal = !!opts.isHorizontal;
    var constrained = !!opts.constrained;
    var angle = opts.angle || 0;

    var textWidth = textBB.width;
    var textHeight = textBB.height;
    var lx = Math.abs(x1 - x0);
    var ly = Math.abs(y1 - y0);

    var textpad;
    // Keep the padding so the text doesn't sit right against
    // the bars, but don't factor it into barWidth
    if(isHorizontal) {
        textpad = (ly > 2 * TEXTPAD) ? TEXTPAD : 0;
    } else {
        textpad = (lx > 2 * TEXTPAD) ? TEXTPAD : 0;
    }

    // compute rotate and scale
    var scale = 1;
    if(constrained) {
        scale = (isHorizontal) ?
            Math.min(1, ly / textHeight) :
            Math.min(1, lx / textWidth);
    }

    var rotate = getRotateFromAngle(angle);
    var absSin = Math.abs(Math.sin(Math.PI / 180 * rotate));
    var absCos = Math.abs(Math.cos(Math.PI / 180 * rotate));

    // compute text and target positions
    var targetWidth = scale * (isHorizontal ? textHeight : textWidth);
    var targetHeight = scale * (isHorizontal ? textWidth : textHeight);
    textpad += 0.5 * (targetWidth * absSin + targetHeight * absCos);

    var targetX = (x0 + x1) / 2;
    var targetY = (y0 + y1) / 2;

    if(isHorizontal) {
        targetX = x1 - textpad * exports.dirSign(x1, x0);
    } else {
        targetY = y1 + textpad * exports.dirSign(y0, y1);
    }

    var textX = (textBB.left + textBB.right) / 2;
    var textY = (textBB.top + textBB.bottom) / 2;

    return {
        textX: textX,
        textY: textY,
        targetX: targetX,
        targetY: targetY,
        scale: scale,
        rotate: rotate
    };
};

function getRotateFromAngle(angle) {
    return (angle === 'auto') ? 0 : angle;
}
