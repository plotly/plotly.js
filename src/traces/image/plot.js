/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');
var Lib = require('../../lib');
var xmlnsNamespaces = require('../../constants/xmlns_namespaces');
var constants = require('./constants');

function compatibleAxis(ax) {
    return ax.type === 'linear' &&
        // y axis must be reversed but x axis mustn't be
        ((ax.range[1] > ax.range[0]) === (ax._id.charAt(0) === 'x'));
}

module.exports = function plot(gd, plotinfo, cdimage, imageLayer) {
    var xa = plotinfo.xaxis;
    var ya = plotinfo.yaxis;

    var supportsPixelatedImage = !Lib.isSafari() && !gd._context._exportedPlot;

    Lib.makeTraceGroups(imageLayer, cdimage, 'im').each(function(cd) {
        var plotGroup = d3.select(this);
        var cd0 = cd[0];
        var trace = cd0.trace;
        var fastImage = supportsPixelatedImage && trace._isFromSource && compatibleAxis(xa) && compatibleAxis(ya);
        trace._fastImage = fastImage;

        var z = cd0.z;
        var x0 = cd0.x0;
        var y0 = cd0.y0;
        var w = cd0.w;
        var h = cd0.h;
        var dx = trace.dx;
        var dy = trace.dy;

        var left, right, temp, top, bottom, i;
        // in case of log of a negative
        i = 0;
        while(left === undefined && i < w) {
            left = xa.c2p(x0 + i * dx);
            i++;
        }
        i = w;
        while(right === undefined && i > 0) {
            right = xa.c2p(x0 + i * dx);
            i--;
        }
        i = 0;
        while(top === undefined && i < h) {
            top = ya.c2p(y0 + i * dy);
            i++;
        }
        i = h;
        while(bottom === undefined && i > 0) {
            bottom = ya.c2p(y0 + i * dy);
            i--;
        }

        if(right < left) {
            temp = right;
            right = left;
            left = temp;
        }

        if(bottom < top) {
            temp = top;
            top = bottom;
            bottom = temp;
        }

        // Reduce image size when zoomed in to save memory
        if(!fastImage) {
            var extra = 0.5; // half the axis size
            left = Math.max(-extra * xa._length, left);
            right = Math.min((1 + extra) * xa._length, right);
            top = Math.max(-extra * ya._length, top);
            bottom = Math.min((1 + extra) * ya._length, bottom);
        }

        var imageWidth = Math.round(right - left);
        var imageHeight = Math.round(bottom - top);

        // if image is entirely off-screen, don't even draw it
        var isOffScreen = (imageWidth <= 0 || imageHeight <= 0);
        if(isOffScreen) {
            var noImage = plotGroup.selectAll('image').data([]);
            noImage.exit().remove();
            return;
        }

        // Create a new canvas and draw magnified pixels on it
        function drawMagnifiedPixelsOnCanvas(readPixel) {
            var colormodel = trace.colormodel;
            var canvas = document.createElement('canvas');
            canvas.width = imageWidth;
            canvas.height = imageHeight;
            var context = canvas.getContext('2d');

            var ipx = function(i) {return Lib.constrain(Math.round(xa.c2p(x0 + i * dx) - left), 0, imageWidth);};
            var jpx = function(j) {return Lib.constrain(Math.round(ya.c2p(y0 + j * dy) - top), 0, imageHeight);};

            var fmt = constants.colormodel[colormodel].fmt;
            var c;
            for(i = 0; i < cd0.w; i++) {
                var ipx0 = ipx(i); var ipx1 = ipx(i + 1);
                if(ipx1 === ipx0 || isNaN(ipx1) || isNaN(ipx0)) continue;
                for(var j = 0; j < cd0.h; j++) {
                    var jpx0 = jpx(j); var jpx1 = jpx(j + 1);
                    if(jpx1 === jpx0 || isNaN(jpx1) || isNaN(jpx0) || !readPixel(i, j)) continue;
                    c = trace._scaler(readPixel(i, j));
                    if(c) {
                        context.fillStyle = colormodel + '(' + fmt(c).join(',') + ')';
                    } else {
                        // Return a transparent pixel
                        context.fillStyle = 'rgba(0,0,0,0)';
                    }
                    context.fillRect(ipx0, jpx0, ipx1 - ipx0, jpx1 - jpx0);
                }
            }

            return canvas;
        }

        function sizeImage(image) {
            image.attr({
                height: imageHeight,
                width: imageWidth,
                x: left,
                y: top
            });
        }

        var data = (trace._isFromSource && !fastImage) ? [cd, {hidden: true}] : [cd];
        var image3 = plotGroup.selectAll('image')
            .data(data);

        image3.enter().append('svg:image').attr({
            xmlns: xmlnsNamespaces.svg,
            preserveAspectRatio: 'none'
        });

        if(fastImage) sizeImage(image3);
        image3.exit().remove();

        // Pixelated image rendering
        // http://phrogz.net/tmp/canvas_image_zoom.html
        // https://developer.mozilla.org/en-US/docs/Web/CSS/image-rendering
        image3
            .attr('style', 'image-rendering: optimizeSpeed; image-rendering: -moz-crisp-edges; image-rendering: -o-crisp-edges; image-rendering: -webkit-optimize-contrast; image-rendering: optimize-contrast; image-rendering: crisp-edges; image-rendering: pixelated;');

        var p = new Promise(function(resolve) {
            if(trace._isFromZ) {
                resolve();
            } else if(trace._isFromSource) {
                // Transfer image to a canvas to access pixel information
                trace._canvas = trace._canvas || document.createElement('canvas');
                trace._canvas.width = w;
                trace._canvas.height = h;
                var context = trace._canvas.getContext('2d');

                var sel;
                if(fastImage) {
                    // Use the displayed image
                    sel = image3;
                } else {
                    // Use the hidden image
                    sel = d3.select(image3[0][1]);
                }

                var image = sel.node();
                image.onload = function() {
                    context.drawImage(image, 0, 0);
                    resolve();
                };
                sel.attr('xlink:href', trace.source);
            }
        })
        .then(function() {
            if(!fastImage) {
                var canvas;
                if(trace._isFromZ) {
                    canvas = drawMagnifiedPixelsOnCanvas(function(i, j) {return z[j][i];});
                } else if(trace._isFromSource) {
                    var context = trace._canvas.getContext('2d');
                    var data = context.getImageData(0, 0, w, h).data;
                    canvas = drawMagnifiedPixelsOnCanvas(function(i, j) {
                        var index = 4 * (j * w + i);
                        return [
                            data[index],
                            data[index + 1],
                            data[index + 2],
                            data[index + 3]
                        ];
                    });
                }
                var href = canvas.toDataURL('image/png');
                var displayImage = d3.select(image3.node());
                sizeImage(displayImage);
                displayImage.attr('xlink:href', href);
            }
        });

        gd._promises.push(p);
    });
};
