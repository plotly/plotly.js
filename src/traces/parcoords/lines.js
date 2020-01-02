/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var glslify = require('glslify');
var vertexShaderSource = glslify('./shaders/vertex.glsl');
var fragmentShaderSource = glslify('./shaders/fragment.glsl');
var maxDim = require('./constants').maxDimensionCount;

var Lib = require('../../lib');

// don't change; otherwise near/far plane lines are lost
var depthLimitEpsilon = 1e-6;

// precision of multiselect is the full range divided into this many parts
var maskHeight = 2048;

var dummyPixel = new Uint8Array(4);
var dataPixel = new Uint8Array(4);

var paletteTextureConfig = {
    shape: [256, 1],
    format: 'rgba',
    type: 'uint8',
    mag: 'nearest',
    min: 'nearest'
};

function ensureDraw(regl) {
    regl.read({
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        data: dummyPixel
    });
}

function clear(regl, x, y, width, height) {
    var gl = regl._gl;
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x, y, width, height);
    regl.clear({color: [0, 0, 0, 0], depth: 1}); // clearing is done in scissored panel only
}

function renderBlock(regl, glAes, renderState, blockLineCount, sampleCount, item) {
    var rafKey = item.key;

    function render(blockNumber) {
        var count = Math.min(blockLineCount, sampleCount - blockNumber * blockLineCount);

        if(blockNumber === 0) {
            // stop drawing possibly stale glyphs before clearing
            window.cancelAnimationFrame(renderState.currentRafs[rafKey]);
            delete renderState.currentRafs[rafKey];
            clear(regl, item.scissorX, item.scissorY, item.scissorWidth, item.viewBoxSize[1]);
        }

        if(renderState.clearOnly) {
            return;
        }

        item.count = 2 * count;
        item.offset = 2 * blockNumber * blockLineCount;
        glAes(item);

        if(blockNumber * blockLineCount + count < sampleCount) {
            renderState.currentRafs[rafKey] = window.requestAnimationFrame(function() {
                render(blockNumber + 1);
            });
        }

        renderState.drawCompleted = false;
    }

    if(!renderState.drawCompleted) {
        ensureDraw(regl);
        renderState.drawCompleted = true;
    }

    // start with rendering item 0; recursion handles the rest
    render(0);
}

function adjustDepth(d) {
    // WebGL matrix operations use floats with limited precision, potentially causing a number near a border of [0, 1]
    // to end up slightly outside the border. With an epsilon, we reduce the chance that a line gets clipped by the
    // near or the far plane.
    return Math.max(depthLimitEpsilon, Math.min(1 - depthLimitEpsilon, d));
}

function palette(unitToColor, opacity) {
    var result = new Array(256);
    for(var i = 0; i < 256; i++) {
        result[i] = unitToColor(i / 255).concat(opacity);
    }
    return result;
}

// Maps the sample index [0...sampleCount - 1] to a range of [0, 1] as the shader expects colors in the [0, 1] range.
// but first it shifts the sample index by 0, 8 or 16 bits depending on rgbIndex [0..2]
// with the end result that each line will be of a unique color, making it possible for the pick handler
// to uniquely identify which line is hovered over (bijective mapping).
// The inverse, i.e. readPixel is invoked from 'parcoords.js'
function calcPickColor(i, rgbIndex) {
    return (i >>> 8 * rgbIndex) % 256 / 255;
}

function makePoints(sampleCount, dims, color) {
    var points = new Array(sampleCount * (maxDim + 4));
    var n = 0;
    for(var i = 0; i < sampleCount; i++) {
        for(var k = 0; k < maxDim; k++) {
            points[n++] = (k < dims.length) ? dims[k].paddedUnitValues[i] : 0.5;
        }
        points[n++] = calcPickColor(i, 2);
        points[n++] = calcPickColor(i, 1);
        points[n++] = calcPickColor(i, 0);
        points[n++] = adjustDepth(color[i]);
    }
    return points;
}

function makeVecAttr(vecIndex, sampleCount, points) {
    var pointPairs = new Array(sampleCount * 8);
    var n = 0;
    for(var i = 0; i < sampleCount; i++) {
        for(var j = 0; j < 2; j++) {
            for(var k = 0; k < 4; k++) {
                var q = vecIndex * 4 + k;
                var v = points[i * 64 + q];
                if(q === 63 && j === 0) {
                    v *= -1;
                }
                pointPairs[n++] = v;
            }
        }
    }
    return pointPairs;
}

function pad2(num) {
    var s = '0' + num;
    return s.substr(s.length - 2);
}

function getAttrName(i) {
    return (i < maxDim) ? 'p' + pad2(i + 1) + '_' + pad2(i + 4) : 'colors';
}

function setAttributes(attributes, sampleCount, points) {
    for(var i = 0; i <= maxDim; i += 4) {
        attributes[getAttrName(i)](makeVecAttr(i / 4, sampleCount, points));
    }
}

function emptyAttributes(regl) {
    var attributes = {};
    for(var i = 0; i <= maxDim; i += 4) {
        attributes[getAttrName(i)] = regl.buffer({usage: 'dynamic', type: 'float', data: new Uint8Array(0)});
    }
    return attributes;
}

function makeItem(model, leftmost, rightmost, itemNumber, i0, i1, x, y, panelSizeX, panelSizeY, crossfilterDimensionIndex, drwLayer, constraints) {
    var dims = [[], []];
    for(var k = 0; k < 64; k++) {
        dims[0][k] = (k === i0) ? 1 : 0;
        dims[1][k] = (k === i1) ? 1 : 0;
    }

    var overdrag = model.lines.canvasOverdrag;
    var domain = model.domain;
    var canvasWidth = model.canvasWidth;
    var canvasHeight = model.canvasHeight;

    var deselectedLinesColor = model.deselectedLines.color;

    var itemModel = Lib.extendFlat({
        key: crossfilterDimensionIndex,
        resolution: [canvasWidth, canvasHeight],
        viewBoxPos: [x + overdrag, y],
        viewBoxSize: [panelSizeX, panelSizeY],
        i0: i0,
        i1: i1,

        dim0A: dims[0].slice(0, 16),
        dim0B: dims[0].slice(16, 32),
        dim0C: dims[0].slice(32, 48),
        dim0D: dims[0].slice(48, 64),
        dim1A: dims[1].slice(0, 16),
        dim1B: dims[1].slice(16, 32),
        dim1C: dims[1].slice(32, 48),
        dim1D: dims[1].slice(48, 64),

        drwLayer: drwLayer,
        contextColor: [
            deselectedLinesColor[0] / 255,
            deselectedLinesColor[1] / 255,
            deselectedLinesColor[2] / 255,
            deselectedLinesColor[3] < 1 ?
                deselectedLinesColor[3] :
                Math.max(1 / 255, Math.pow(1 / model.lines.color.length, 1 / 3))
        ],

        scissorX: (itemNumber === leftmost ? 0 : x + overdrag) + (model.pad.l - overdrag) + model.layoutWidth * domain.x[0],
        scissorWidth: (itemNumber === rightmost ? canvasWidth - x + overdrag : panelSizeX + 0.5) + (itemNumber === leftmost ? x + overdrag : 0),
        scissorY: y + model.pad.b + model.layoutHeight * domain.y[0],
        scissorHeight: panelSizeY,

        viewportX: model.pad.l - overdrag + model.layoutWidth * domain.x[0],
        viewportY: model.pad.b + model.layoutHeight * domain.y[0],
        viewportWidth: canvasWidth,
        viewportHeight: canvasHeight
    }, constraints);

    return itemModel;
}

function expandedPixelRange(bounds) {
    var dh = maskHeight - 1;
    var a = Math.max(0, Math.floor(bounds[0] * dh), 0);
    var b = Math.min(dh, Math.ceil(bounds[1] * dh), dh);
    return [
        Math.min(a, b),
        Math.max(a, b)
    ];
}

module.exports = function(canvasGL, d) {
    // context & pick describe which canvas we're talking about - won't change with new data
    var isContext = d.context;
    var isPick = d.pick;

    var regl = d.regl;

    var renderState = {
        currentRafs: {},
        drawCompleted: true,
        clearOnly: false
    };

    // state to be set by update and used later
    var model;
    var vm;
    var initialDims;
    var sampleCount;
    var attributes = emptyAttributes(regl);
    var maskTexture;
    var paletteTexture = regl.texture(paletteTextureConfig);

    var prevAxisOrder = [];

    update(d);

    var glAes = regl({

        profile: false,

        blend: {
            enable: isContext,
            func: {
                srcRGB: 'src alpha',
                dstRGB: 'one minus src alpha',
                srcAlpha: 1,
                dstAlpha: 1 // 'one minus src alpha'
            },
            equation: {
                rgb: 'add',
                alpha: 'add'
            },
            color: [0, 0, 0, 0]
        },

        depth: {
            enable: !isContext,
            mask: true,
            func: 'less',
            range: [0, 1]
        },

        // for polygons
        cull: {
            enable: true,
            face: 'back'
        },

        scissor: {
            enable: true,
            box: {
                x: regl.prop('scissorX'),
                y: regl.prop('scissorY'),
                width: regl.prop('scissorWidth'),
                height: regl.prop('scissorHeight')
            }
        },

        viewport: {
            x: regl.prop('viewportX'),
            y: regl.prop('viewportY'),
            width: regl.prop('viewportWidth'),
            height: regl.prop('viewportHeight')
        },

        dither: false,

        vert: vertexShaderSource,

        frag: fragmentShaderSource,

        primitive: 'lines',
        lineWidth: 1,
        attributes: attributes,
        uniforms: {
            resolution: regl.prop('resolution'),
            viewBoxPos: regl.prop('viewBoxPos'),
            viewBoxSize: regl.prop('viewBoxSize'),
            dim0A: regl.prop('dim0A'),
            dim1A: regl.prop('dim1A'),
            dim0B: regl.prop('dim0B'),
            dim1B: regl.prop('dim1B'),
            dim0C: regl.prop('dim0C'),
            dim1C: regl.prop('dim1C'),
            dim0D: regl.prop('dim0D'),
            dim1D: regl.prop('dim1D'),
            loA: regl.prop('loA'),
            hiA: regl.prop('hiA'),
            loB: regl.prop('loB'),
            hiB: regl.prop('hiB'),
            loC: regl.prop('loC'),
            hiC: regl.prop('hiC'),
            loD: regl.prop('loD'),
            hiD: regl.prop('hiD'),
            palette: paletteTexture,
            contextColor: regl.prop('contextColor'),
            mask: regl.prop('maskTexture'),
            drwLayer: regl.prop('drwLayer'),
            maskHeight: regl.prop('maskHeight')
        },
        offset: regl.prop('offset'),
        count: regl.prop('count')
    });

    function update(dNew) {
        model = dNew.model;
        vm = dNew.viewModel;
        initialDims = vm.dimensions.slice();
        sampleCount = initialDims[0] ? initialDims[0].values.length : 0;

        var lines = model.lines;
        var color = isPick ? lines.color.map(function(_, i) {return i / lines.color.length;}) : lines.color;

        var points = makePoints(sampleCount, initialDims, color);
        setAttributes(attributes, sampleCount, points);

        if(!isContext && !isPick) {
            paletteTexture = regl.texture(Lib.extendFlat({
                data: palette(model.unitToColor, 255)
            }, paletteTextureConfig));
        }
    }

    function makeConstraints(isContext) {
        var i, j, k;

        var limits = [[], []];
        for(k = 0; k < 64; k++) {
            var p = (!isContext && k < initialDims.length) ?
                initialDims[k].brush.filter.getBounds() : [-Infinity, Infinity];

            limits[0][k] = p[0];
            limits[1][k] = p[1];
        }

        var len = maskHeight * 8;
        var mask = new Array(len);
        for(i = 0; i < len; i++) {
            mask[i] = 255;
        }
        if(!isContext) {
            for(i = 0; i < initialDims.length; i++) {
                var u = i % 8;
                var v = (i - u) / 8;
                var bitMask = Math.pow(2, u);
                var dim = initialDims[i];
                var ranges = dim.brush.filter.get();
                if(ranges.length < 2) continue; // bail if the bounding box based filter is sufficient

                var prevEnd = expandedPixelRange(ranges[0])[1];
                for(j = 1; j < ranges.length; j++) {
                    var nextRange = expandedPixelRange(ranges[j]);
                    for(k = prevEnd + 1; k < nextRange[0]; k++) {
                        mask[k * 8 + v] &= ~bitMask;
                    }
                    prevEnd = Math.max(prevEnd, nextRange[1]);
                }
            }
        }

        var textureData = {
            // 8 units x 8 bits = 64 bits, just sufficient for the almost 64 dimensions we support
            shape: [8, maskHeight],
            format: 'alpha',
            type: 'uint8',
            mag: 'nearest',
            min: 'nearest',
            data: mask
        };
        if(maskTexture) maskTexture(textureData);
        else maskTexture = regl.texture(textureData);

        return {
            maskTexture: maskTexture,
            maskHeight: maskHeight,
            loA: limits[0].slice(0, 16),
            loB: limits[0].slice(16, 32),
            loC: limits[0].slice(32, 48),
            loD: limits[0].slice(48, 64),
            hiA: limits[1].slice(0, 16),
            hiB: limits[1].slice(16, 32),
            hiC: limits[1].slice(32, 48),
            hiD: limits[1].slice(48, 64),
        };
    }

    function renderGLParcoords(panels, setChanged, clearOnly) {
        var panelCount = panels.length;
        var i;

        var leftmost;
        var rightmost;
        var lowestX = Infinity;
        var highestX = -Infinity;

        for(i = 0; i < panelCount; i++) {
            if(panels[i].dim0.canvasX < lowestX) {
                lowestX = panels[i].dim0.canvasX;
                leftmost = i;
            }
            if(panels[i].dim1.canvasX > highestX) {
                highestX = panels[i].dim1.canvasX;
                rightmost = i;
            }
        }

        if(panelCount === 0) {
            // clear canvas here, as the panel iteration below will not enter the loop body
            clear(regl, 0, 0, model.canvasWidth, model.canvasHeight);
        }
        var constraints = makeConstraints(isContext);

        for(i = 0; i < panelCount; i++) {
            var p = panels[i];
            var i0 = p.dim0.crossfilterDimensionIndex;
            var i1 = p.dim1.crossfilterDimensionIndex;
            var x = p.canvasX;
            var y = p.canvasY;
            var nextX = x + p.panelSizeX;
            if(setChanged ||
                !prevAxisOrder[i0] ||
                prevAxisOrder[i0][0] !== x ||
                prevAxisOrder[i0][1] !== nextX
            ) {
                prevAxisOrder[i0] = [x, nextX];

                var item = makeItem(
                    model,
                    leftmost, rightmost, i, i0, i1, x, y,
                    p.panelSizeX, p.panelSizeY,
                    p.dim0.crossfilterDimensionIndex,
                    isContext ? 0 : isPick ? 2 : 1,
                    constraints
                );

                renderState.clearOnly = clearOnly;

                var blockLineCount = setChanged ? model.lines.blockLineCount : sampleCount;
                renderBlock(
                    regl, glAes, renderState, blockLineCount, sampleCount, item
                );
            }
        }
    }

    function readPixel(canvasX, canvasY) {
        regl.read({
            x: canvasX,
            y: canvasY,
            width: 1,
            height: 1,
            data: dataPixel
        });
        return dataPixel;
    }

    function readPixels(canvasX, canvasY, width, height) {
        var pixelArray = new Uint8Array(4 * width * height);
        regl.read({
            x: canvasX,
            y: canvasY,
            width: width,
            height: height,
            data: pixelArray
        });
        return pixelArray;
    }

    function destroy() {
        canvasGL.style['pointer-events'] = 'none';
        paletteTexture.destroy();
        if(maskTexture) maskTexture.destroy();
        for(var k in attributes) attributes[k].destroy();
    }

    return {
        render: renderGLParcoords,
        readPixel: readPixel,
        readPixels: readPixels,
        destroy: destroy,
        update: update
    };
};
