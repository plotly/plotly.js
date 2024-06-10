'use strict';

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');
var svgTextUtils = require('../../lib/svg_text_utils');

var Drawing = require('../drawing');

var readPaths = require('./draw_newshape/helpers').readPaths;
var helpers = require('./helpers');
var getPathString = helpers.getPathString;
var shapeLabelTexttemplateVars = require('./label_texttemplate');

var FROM_TL = require('../../constants/alignment').FROM_TL;


module.exports = function drawLabel(gd, index, options, shapeGroup) {
    // Remove existing label
    shapeGroup.selectAll('.shape-label').remove();

    // If no label text or texttemplate, return
    if(!(options.label.text || options.label.texttemplate)) return;

    // Text template overrides text
    var text;
    if(options.label.texttemplate) {
        var templateValues = {};
        if(options.type !== 'path') {
            var _xa = Axes.getFromId(gd, options.xref);
            var _ya = Axes.getFromId(gd, options.yref);
            for(var key in shapeLabelTexttemplateVars) {
                var val = shapeLabelTexttemplateVars[key](options, _xa, _ya);
                if(val !== undefined) templateValues[key] = val;
            }
        }
        text = Lib.texttemplateStringForShapes(options.label.texttemplate,
            {},
            gd._fullLayout._d3locale,
            templateValues);
    } else {
        text = options.label.text;
    }

    var labelGroupAttrs = {
        'data-index': index,
    };
    var font = options.label.font;

    var labelTextAttrs = {
        'data-notex': 1
    };

    var labelGroup = shapeGroup.append('g')
        .attr(labelGroupAttrs)
        .classed('shape-label', true);
    var labelText = labelGroup.append('text')
        .attr(labelTextAttrs)
        .classed('shape-label-text', true)
        .text(text);

    // Get x and y bounds of shape
    var shapex0, shapex1, shapey0, shapey1;
    if(options.path) {
        // If shape is defined as a path, get the
        // min and max bounds across all polygons in path
        var d = getPathString(gd, options);
        var polygons = readPaths(d, gd);
        shapex0 = Infinity;
        shapey0 = Infinity;
        shapex1 = -Infinity;
        shapey1 = -Infinity;
        for(var i = 0; i < polygons.length; i++) {
            for(var j = 0; j < polygons[i].length; j++) {
                var p = polygons[i][j];
                for(var k = 1; k < p.length; k += 2) {
                    var _x = p[k];
                    var _y = p[k + 1];

                    shapex0 = Math.min(shapex0, _x);
                    shapex1 = Math.max(shapex1, _x);
                    shapey0 = Math.min(shapey0, _y);
                    shapey1 = Math.max(shapey1, _y);
                }
            }
        }
    } else {
        // Otherwise, we use the x and y bounds defined in the shape options
        // and convert them to pixel coordinates
        // Setup conversion functions
        var xa = Axes.getFromId(gd, options.xref);
        var xShiftStart = options.x0shift;
        var xShiftEnd = options.x1shift;
        var xRefType = Axes.getRefType(options.xref);
        var ya = Axes.getFromId(gd, options.yref);
        var yShiftStart = options.y0shift;
        var yShiftEnd = options.y1shift;
        var yRefType = Axes.getRefType(options.yref);
        var x2p = function(v, shift) {
            var dataToPixel = helpers.getDataToPixel(gd, xa, shift, false, xRefType);
            return dataToPixel(v);
        };
        var y2p = function(v, shift) {
            var dataToPixel = helpers.getDataToPixel(gd, ya, shift, true, yRefType);
            return dataToPixel(v);
        };
        shapex0 = x2p(options.x0, xShiftStart);
        shapex1 = x2p(options.x1, xShiftEnd);
        shapey0 = y2p(options.y0, yShiftStart);
        shapey1 = y2p(options.y1, yShiftEnd);
    }

    // Handle `auto` angle
    var textangle = options.label.textangle;
    if(textangle === 'auto') {
        if(options.type === 'line') {
            // Auto angle for line is same angle as line
            textangle = calcTextAngle(shapex0, shapey0, shapex1, shapey1);
        } else {
            // Auto angle for all other shapes is 0
            textangle = 0;
        }
    }

    // Do an initial render so we can get the text bounding box height
    labelText.call(function(s) {
        s.call(Drawing.font, font).attr({});
        svgTextUtils.convertToTspans(s, gd);
        return s;
    });
    var textBB = Drawing.bBox(labelText.node());

    // Calculate correct (x,y) for text
    // We also determine true xanchor since xanchor depends on position when set to 'auto'
    var textPos = calcTextPosition(shapex0, shapey0, shapex1, shapey1, options, textangle, textBB);
    var textx = textPos.textx;
    var texty = textPos.texty;
    var xanchor = textPos.xanchor;

    // Update (x,y) position, xanchor, and angle
    labelText.attr({
        'text-anchor': {
            left: 'start',
            center: 'middle',
            right: 'end'
        }[xanchor],
        y: texty,
        x: textx,
        transform: 'rotate(' + textangle + ',' + textx + ',' + texty + ')'
    }).call(svgTextUtils.positionText, textx, texty);
};

function calcTextAngle(shapex0, shapey0, shapex1, shapey1) {
    var dy, dx;
    dx = Math.abs(shapex1 - shapex0);
    if(shapex1 >= shapex0) {
        dy = shapey0 - shapey1;
    } else {
        dy = shapey1 - shapey0;
    }
    return -180 / Math.PI * Math.atan2(dy, dx);
}

function calcTextPosition(shapex0, shapey0, shapex1, shapey1, shapeOptions, actualTextAngle, textBB) {
    var textPosition = shapeOptions.label.textposition;
    var textAngle = shapeOptions.label.textangle;
    var textPadding = shapeOptions.label.padding;
    var shapeType = shapeOptions.type;
    var textAngleRad = Math.PI / 180 * actualTextAngle;
    var sinA = Math.sin(textAngleRad);
    var cosA = Math.cos(textAngleRad);
    var xanchor = shapeOptions.label.xanchor;
    var yanchor = shapeOptions.label.yanchor;

    var textx, texty, paddingX, paddingY;

    // Text position functions differently for lines vs. other shapes
    if(shapeType === 'line') {
        // Set base position for start vs. center vs. end of line (default is 'center')
        if(textPosition === 'start') {
            textx = shapex0;
            texty = shapey0;
        } else if(textPosition === 'end') {
            textx = shapex1;
            texty = shapey1;
        } else { // Default: center
            textx = (shapex0 + shapex1) / 2;
            texty = (shapey0 + shapey1) / 2;
        }

        // Set xanchor if xanchor is 'auto'
        if(xanchor === 'auto') {
            if(textPosition === 'start') {
                if(textAngle === 'auto') {
                    if(shapex1 > shapex0) xanchor = 'left';
                    else if(shapex1 < shapex0) xanchor = 'right';
                    else xanchor = 'center';
                } else {
                    if(shapex1 > shapex0) xanchor = 'right';
                    else if(shapex1 < shapex0) xanchor = 'left';
                    else xanchor = 'center';
                }
            } else if(textPosition === 'end') {
                if(textAngle === 'auto') {
                    if(shapex1 > shapex0) xanchor = 'right';
                    else if(shapex1 < shapex0) xanchor = 'left';
                    else xanchor = 'center';
                } else {
                    if(shapex1 > shapex0) xanchor = 'left';
                    else if(shapex1 < shapex0) xanchor = 'right';
                    else xanchor = 'center';
                }
            } else {
                xanchor = 'center';
            }
        }

        // Special case for padding when angle is 'auto' for lines
        // Padding should be treated as an orthogonal offset in this case
        // Otherwise, padding is just a simple x and y offset
        var paddingConstantsX = { left: 1, center: 0, right: -1 };
        var paddingConstantsY = { bottom: -1, middle: 0, top: 1 };
        if(textAngle === 'auto') {
            // Set direction to apply padding (based on `yanchor` only)
            var paddingDirection = paddingConstantsY[yanchor];
            paddingX = -textPadding * sinA * paddingDirection;
            paddingY = textPadding * cosA * paddingDirection;
        } else {
            // Set direction to apply padding (based on `xanchor` and `yanchor`)
            var paddingDirectionX = paddingConstantsX[xanchor];
            var paddingDirectionY = paddingConstantsY[yanchor];
            paddingX = textPadding * paddingDirectionX;
            paddingY = textPadding * paddingDirectionY;
        }
        textx = textx + paddingX;
        texty = texty + paddingY;
    } else {
        // Text position for shapes that are not lines
        // calc horizontal position
        // Horizontal needs a little extra padding to look balanced
        paddingX = textPadding + 3;
        if(textPosition.indexOf('right') !== -1) {
            textx = Math.max(shapex0, shapex1) - paddingX;
            if(xanchor === 'auto') xanchor = 'right';
        } else if(textPosition.indexOf('left') !== -1) {
            textx = Math.min(shapex0, shapex1) + paddingX;
            if(xanchor === 'auto') xanchor = 'left';
        } else { // Default: center
            textx = (shapex0 + shapex1) / 2;
            if(xanchor === 'auto') xanchor = 'center';
        }

        // calc vertical position
        if(textPosition.indexOf('top') !== -1) {
            texty = Math.min(shapey0, shapey1);
        } else if(textPosition.indexOf('bottom') !== -1) {
            texty = Math.max(shapey0, shapey1);
        } else {
            texty = (shapey0 + shapey1) / 2;
        }
        // Apply padding
        paddingY = textPadding;
        if(yanchor === 'bottom') {
            texty = texty - paddingY;
        } else if(yanchor === 'top') {
            texty = texty + paddingY;
        }
    }

    // Shift vertical (& horizontal) position according to `yanchor`
    var shiftFraction = FROM_TL[yanchor];
    // Adjust so that text is anchored at top of first line rather than at baseline of first line
    var baselineAdjust = shapeOptions.label.font.size;
    var textHeight = textBB.height;
    var xshift = (textHeight * shiftFraction - baselineAdjust) * sinA;
    var yshift = -(textHeight * shiftFraction - baselineAdjust) * cosA;

    return { textx: textx + xshift, texty: texty + yshift, xanchor: xanchor };
}
