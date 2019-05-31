/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var glslify = require('glslify');
var vertexShaderSource = glslify('./shaders/vertex.glsl');
var contextShaderSource = glslify('./shaders/context_vertex.glsl');
var fragmentShaderSource = glslify('./shaders/fragment.glsl');

var Lib = require('../../lib');

// don't change; otherwise near/far plane lines are lost
var depthLimitEpsilon = 1e-6;
// just enough buffer for an extra bit at single-precision floating point
// which on [0, 1] is 6e-8 (1/2^24)
var filterEpsilon = 1e-7;

// precision of multiselect is the full range divided into this many parts
var maskHeight = 2048;

var gpuDimensionCount = 64;
var sectionVertexCount = 2;
var vec4NumberCount = 4;
var bitsPerByte = 8;
var channelCount = gpuDimensionCount / bitsPerByte; // == 8 bytes needed to have 64 bits

var contextColor = [119, 119, 119]; // middle gray to not drawn the focus; looks good on a black or white background

var dummyPixel = new Uint8Array(4);
var pickPixel = new Uint8Array(4);

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
        var count;

        count = Math.min(blockLineCount, sampleCount - blockNumber * blockLineCount);

        item.offset = sectionVertexCount * blockNumber * blockLineCount;
        item.count = sectionVertexCount * count;
        if(blockNumber === 0) {
            // stop drawing possibly stale glyphs before clearing
            window.cancelAnimationFrame(renderState.currentRafs[rafKey]);
            delete renderState.currentRafs[rafKey];
            clear(regl, item.scissorX, item.scissorY, item.scissorWidth, item.viewBoxSize[1]);
        }

        if(renderState.clearOnly) {
            return;
        }

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

function palette(unitToColor, context, opacity) {
    var result = [];
    for(var j = 0; j < 256; j++) {
        var c = unitToColor(j / 255);
        result.push((context ? contextColor : c).concat(opacity));
    }
    return result;
}

// Maps the sample index [0...sampleCount - 1] to a range of [0, 1] as the shader expects colors in the [0, 1] range.
// but first it shifts the sample index by 0, 8 or 16 bits depending on rgbIndex [0..2]
// with the end result that each line will be of a unique color, making it possible for the pick handler
// to uniquely identify which line is hovered over (bijective mapping).
// The inverse, i.e. readPixel is invoked from 'parcoords.js'
function calcPickColor(j, rgbIndex) {
    return (j >>> 8 * rgbIndex) % 256 / 255;
}

function makePoints(sampleCount, dims, color) {
    var len = dims.length;
    var points = [];
    for(var j = 0; j < sampleCount; j++) {
        for(var k = 0; k < gpuDimensionCount; k++) {
            points.push(
                k < len ? dims[k].paddedUnitValues[j] :
                    k === gpuDimensionCount - 1 ? adjustDepth(color[j]) :
                        k >= gpuDimensionCount - 4 ? calcPickColor(j, gpuDimensionCount - 2 - k) : 0.5
            );
        }
    }
    return points;
}

function makeVecAttr(vecIndex, sampleCount, points) {
    var pointPairs = [];
    for(var i = 0; i < sampleCount; i++) {
        for(var j = 0; j < sectionVertexCount; j++) {
            for(var k = 0; k < vec4NumberCount; k++) {
                var q = vecIndex * vec4NumberCount + k;
                pointPairs.push(points[i * gpuDimensionCount + q]);
                if(q === gpuDimensionCount - 1 && j % 2 === 0) {
                    pointPairs[pointPairs.length - 1] *= -1;
                }
            }
        }
    }
    return pointPairs;
}

function setAttributes(attributes, sampleCount, points) {
    for(var i = 0; i < 16; i++) {
        attributes['p' + i.toString(16)](makeVecAttr(i, sampleCount, points));
    }
}

function emptyAttributes(regl) {
    var attributes = {};
    for(var i = 0; i < 16; i++) {
        attributes['p' + i.toString(16)] = regl.buffer({usage: 'dynamic', type: 'float', data: new Uint8Array(0)});
    }
    return attributes;
}

module.exports = function(canvasGL, d) {
    // context & pick describe which canvas we're talking about - won't change with new data
    var context = d.context;
    var pick = d.pick;

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

    update(d);

    var glAes = regl({

        profile: false,

        blend: {
            enable: context,
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
            enable: !context,
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

        vert: context ? contextShaderSource : vertexShaderSource,

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
            mask: regl.prop('maskTexture'),
            isPickLayer: regl.prop('isPickLayer'),
            maskHeight: regl.prop('maskHeight'),
            colorClamp: regl.prop('colorClamp')
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
        var color = pick ? lines.color.map(function(_, i) {return i / lines.color.length;}) : lines.color;
        var contextOpacity = Math.max(1 / 255, Math.pow(1 / color.length, 1 / 3));

        var points = makePoints(sampleCount, initialDims, color);
        setAttributes(attributes, sampleCount, points);

        paletteTexture = regl.texture(Lib.extendFlat({
            data: palette(model.unitToColor, context, Math.round((context ? contextOpacity : 1) * 255))
        }, paletteTextureConfig));
    }

    var colorClamp = [0, 1];

    function setColorDomain(unitDomain) {
        colorClamp[0] = unitDomain[0];
        colorClamp[1] = unitDomain[1];
    }

    var previousAxisOrder = [];

    function makeItem(leftmost, rightmost, itemNumber, i0, i1, x, y, panelSizeX, canvasPanelSizeY, crossfilterDimensionIndex, constraints, isPickLayer) {
        var dims = [0, 1].map(function() {return [0, 1, 2, 3].map(function() {return new Float32Array(16);});});

        for(var j = 0; j < 4; j++) {
            for(var k = 0; k < 16; k++) {
                var id = 16 * j + k;
                dims[0][j][k] = id === i0 ? 1 : 0;
                dims[1][j][k] = id === i1 ? 1 : 0;
            }
        }

        var overdrag = model.lines.canvasOverdrag;
        var domain = model.domain;
        var canvasWidth = model.canvasWidth;
        var canvasHeight = model.canvasHeight;

        var itemModel = Lib.extendFlat({
            key: crossfilterDimensionIndex,
            resolution: [canvasWidth, canvasHeight],
            viewBoxPos: [x + overdrag, y],
            viewBoxSize: [panelSizeX, canvasPanelSizeY],
            i0: i0,
            i1: i1,

            dim0A: dims[0][0],
            dim0B: dims[0][1],
            dim0C: dims[0][2],
            dim0D: dims[0][3],
            dim1A: dims[1][0],
            dim1B: dims[1][1],
            dim1C: dims[1][2],
            dim1D: dims[1][3],

            colorClamp: colorClamp,
            isPickLayer: +isPickLayer,

            scissorX: (itemNumber === leftmost ? 0 : x + overdrag) + (model.pad.l - overdrag) + model.layoutWidth * domain.x[0],
            scissorWidth: (itemNumber === rightmost ? canvasWidth - x + overdrag : panelSizeX + 0.5) + (itemNumber === leftmost ? x + overdrag : 0),
            scissorY: y + model.pad.b + model.layoutHeight * domain.y[0],
            scissorHeight: canvasPanelSizeY,

            viewportX: model.pad.l - overdrag + model.layoutWidth * domain.x[0],
            viewportY: model.pad.b + model.layoutHeight * domain.y[0],
            viewportWidth: canvasWidth,
            viewportHeight: canvasHeight
        }, constraints);

        return itemModel;
    }

    function makeConstraints() {
        var limits = [0, 1].map(function() {return [0, 1, 2, 3].map(function() {return new Float32Array(16);});});
        for(var j = 0; j < 4; j++) {
            for(var k = 0; k < 16; k++) {
                var id = 16 * j + k;
                var p = (id < initialDims.length) ?
                    initialDims[id].brush.filter.getBounds() : [0, 1];

                limits[0][j][k] = p[0] - filterEpsilon;
                limits[1][j][k] = p[1] + filterEpsilon;
            }
        }

        function expandedPixelRange(bounds) {
            var maskHMinus = maskHeight - 1;
            return [
                Math.max(0, Math.floor(bounds[0] * maskHMinus)),
                Math.min(maskHMinus, Math.ceil(bounds[1] * maskHMinus))
            ];
        }

        var mask = [];
        for(var i = 0; i < maskHeight * channelCount; i++) {
            mask[i] = 255;
        }

        for(var dimIndex = 0; dimIndex < initialDims.length; dimIndex++) {
            var bitIndex = dimIndex % bitsPerByte;
            var byteIndex = (dimIndex - bitIndex) / bitsPerByte;
            var bitMask = Math.pow(2, bitIndex);
            var dim = initialDims[dimIndex];
            var ranges = dim.brush.filter.get();
            if(ranges.length < 2) continue; // bail if the bounding box based filter is sufficient

            var prevEnd = expandedPixelRange(ranges[0])[1];
            for(var ri = 1; ri < ranges.length; ri++) {
                var nextRange = expandedPixelRange(ranges[ri]);
                for(var pi = prevEnd + 1; pi < nextRange[0]; pi++) {
                    mask[pi * channelCount + byteIndex] &= ~bitMask;
                }
                prevEnd = Math.max(prevEnd, nextRange[1]);
            }
        }

        var textureData = {
            // 8 units x 8 bits = 64 bits, just sufficient for the almost 64 dimensions we support
            shape: [channelCount, maskHeight],
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
            loA: limits[0][0],
            loB: limits[0][1],
            loC: limits[0][2],
            loD: limits[0][3],
            hiA: limits[1][0],
            hiB: limits[1][1],
            hiC: limits[1][2],
            hiD: limits[1][3]
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
        var constraints = context ? {} : makeConstraints();

        for(i = 0; i < panelCount; i++) {
            var panel = panels[i];
            var dim0 = panel.dim0;
            var dim1 = panel.dim1;
            var i0 = dim0.crossfilterDimensionIndex;
            var i1 = dim1.crossfilterDimensionIndex;
            var x = panel.canvasX;
            var y = panel.canvasY;
            var panelSizeX = panel.panelSizeX;
            var panelSizeY = panel.panelSizeY;
            var nextX = x + panelSizeX;
            if(setChanged || !previousAxisOrder[i0] || previousAxisOrder[i0][0] !== x || previousAxisOrder[i0][1] !== nextX) {
                previousAxisOrder[i0] = [x, nextX];
                var item = makeItem(leftmost, rightmost, i, i0, i1, x, y, panelSizeX, panelSizeY, dim0.crossfilterDimensionIndex, constraints, !!d.pick);
                renderState.clearOnly = clearOnly;
                renderBlock(regl, glAes, renderState, setChanged ? model.lines.blockLineCount : sampleCount, sampleCount, item);
            }
        }
    }

    function readPixel(canvasX, canvasY) {
        regl.read({
            x: canvasX,
            y: canvasY,
            width: 1,
            height: 1,
            data: pickPixel
        });
        return pickPixel;
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
        setColorDomain: setColorDomain,
        render: renderGLParcoords,
        readPixel: readPixel,
        readPixels: readPixels,
        destroy: destroy,
        update: update
    };
};
