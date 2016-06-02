/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');
var Drawing = require('../drawing');
var Axes = require('../../plots/cartesian/axes');

module.exports = function draw(gd) {

    var fullLayout = gd._fullLayout,
        imageDataAbove = [],
        imageDataSubplot = [],
        imageDataBelow = [];

    if(!fullLayout.images) return;


    // Sort into top, subplot, and bottom layers
    for(var i = 0; i < fullLayout.images.length; i++) {
        var img = fullLayout.images[i];

        if(img.layer === 'below' && img.xref !== 'paper' && img.yref !== 'paper') {
            imageDataSubplot.push(img);
        } else if(img.layer === 'above') {
            imageDataAbove.push(img);
        } else {
            imageDataBelow.push(img);
        }
    }


    var anchors = {
        x: {
            left: { sizing: 'xMin', offset: 0 },
            center: { sizing: 'xMid', offset: -1 / 2 },
            right: { sizing: 'xMax', offset: -1 }
        },
        y: {
            top: { sizing: 'YMin', offset: 0 },
            middle: { sizing: 'YMid', offset: -1 / 2 },
            bottom: { sizing: 'YMax', offset: -1 }
        }
    };


    // Images must be converted to dataURL's for exporting.
    function setImage(d) {

        var thisImage = d3.select(this);

        var imagePromise = new Promise(function(resolve) {

            var img = new Image();

            // If not set, a `tainted canvas` error is thrown
            img.setAttribute('crossOrigin', 'anonymous');
            img.onerror = errorHandler;
            img.onload = function() {

                var canvas = document.createElement('canvas');
                canvas.width = this.width;
                canvas.height = this.height;

                var ctx = canvas.getContext('2d');
                ctx.drawImage(this, 0, 0);

                var dataURL = canvas.toDataURL('image/png');

                thisImage.attr('xlink:href', dataURL);
            };


            thisImage.on('error', errorHandler);
            thisImage.on('load', resolve);

            img.src = d.source;

            function errorHandler() {
                thisImage.remove();
                resolve();
            }
        });

        gd._promises.push(imagePromise);
    }

    function applyAttributes(d) {

        var thisImage = d3.select(this);

        // Axes if specified
        var xref = Axes.getFromId(gd, d.xref),
            yref = Axes.getFromId(gd, d.yref);

        var size = fullLayout._size,
            width = xref ? Math.abs(xref.l2p(d.sizex) - xref.l2p(0)) : d.sizex * size.w,
            height = yref ? Math.abs(yref.l2p(d.sizey) - yref.l2p(0)) : d.sizey * size.h;

        // Offsets for anchor positioning
        var xOffset = width * anchors.x[d.xanchor].offset + size.l,
            yOffset = height * anchors.y[d.yanchor].offset + size.t;

        var sizing = anchors.x[d.xanchor].sizing + anchors.y[d.yanchor].sizing;

        // Final positions
        var xPos = (xref ? xref.l2p(d.x) : d.x * size.w) + xOffset,
            yPos = (yref ? yref.l2p(d.y) : size.h - d.y * size.h) + yOffset;


        // Construct the proper aspectRatio attribute
        switch(d.sizing) {
            case 'fill':
                sizing += ' slice';
                break;

            case 'stretch':
                sizing = 'none';
                break;
        }

        thisImage.attr({
            x: xPos,
            y: yPos,
            width: width,
            height: height,
            preserveAspectRatio: sizing,
            opacity: d.opacity
        });


        // Set proper clipping on images
        var xId = xref ? xref._id : '',
            yId = yref ? yref._id : '',
            clipAxes = xId + yId;

        thisImage.call(Drawing.setClipUrl, 'clip' + fullLayout._uid + clipAxes);
    }


    // Required for updating images
    function keyFunction(d) {
        return d.source;
    }


    var imagesBelow = fullLayout._imageLowerLayer.selectAll('image')
            .data(imageDataBelow, keyFunction),
        imagesSubplot = fullLayout._imageSubplotLayer.selectAll('image')
            .data(imageDataSubplot, keyFunction),
        imagesAbove = fullLayout._imageUpperLayer.selectAll('image')
            .data(imageDataAbove, keyFunction);

    imagesBelow.enter().append('image').each(setImage);
    imagesSubplot.enter().append('image').each(setImage);
    imagesAbove.enter().append('image').each(setImage);

    imagesBelow.exit().remove();
    imagesSubplot.exit().remove();
    imagesAbove.exit().remove();

    imagesBelow.each(applyAttributes);
    imagesSubplot.each(applyAttributes);
    imagesAbove.each(applyAttributes);
};
