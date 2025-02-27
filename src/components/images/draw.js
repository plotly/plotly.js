'use strict';

var d3 = require('@plotly/d3');
var Drawing = require('../drawing');
var Axes = require('../../plots/cartesian/axes');
var axisIds = require('../../plots/cartesian/axis_ids');
var xmlnsNamespaces = require('../../constants/xmlns_namespaces');

module.exports = function draw(gd) {
    var fullLayout = gd._fullLayout;
    var imageDataAbove = [];
    var imageDataSubplot = {};
    var imageDataBelow = [];
    var subplot;
    var i;

    // Sort into top, subplot, and bottom layers
    for(i = 0; i < fullLayout.images.length; i++) {
        var img = fullLayout.images[i];

        if(img.visible) {
            if(img.layer === 'below' && img.xref !== 'paper' && img.yref !== 'paper') {
                subplot = axisIds.ref2id(img.xref) + axisIds.ref2id(img.yref);

                var plotinfo = fullLayout._plots[subplot];

                if(!plotinfo) {
                    // Fall back to _imageLowerLayer in case the requested subplot doesn't exist.
                    // This can happen if you reference the image to an x / y axis combination
                    // that doesn't have any data on it (and layer is below)
                    imageDataBelow.push(img);
                    continue;
                }

                if(plotinfo.mainplot) {
                    subplot = plotinfo.mainplot.id;
                }

                if(!imageDataSubplot[subplot]) {
                    imageDataSubplot[subplot] = [];
                }
                imageDataSubplot[subplot].push(img);
            } else if(img.layer === 'above') {
                imageDataAbove.push(img);
            } else {
                imageDataBelow.push(img);
            }
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

        if(this._imgSrc === d.source) {
            return;
        }

        thisImage.attr('xmlns', xmlnsNamespaces.svg);

        if(!gd._context.staticPlot || (d.source && d.source.slice(0, 5) === 'data:')) {
            thisImage.attr('xlink:href', d.source);
            this._imgSrc = d.source;
        } else {
            var imagePromise = new Promise(function(resolve) {
                var img = new Image();
                this.img = img;

                // If not set, a `tainted canvas` error is thrown
                img.setAttribute('crossOrigin', 'anonymous');
                img.onerror = errorHandler;
                img.onload = function() {
                    var canvas = document.createElement('canvas');
                    canvas.width = this.width;
                    canvas.height = this.height;

                    var ctx = canvas.getContext('2d', {willReadFrequently: true});
                    ctx.drawImage(this, 0, 0);

                    var dataURL = canvas.toDataURL('image/png');

                    thisImage.attr('xlink:href', dataURL);

                    // resolve promise in onload handler instead of on 'load' to support IE11
                    // see https://github.com/plotly/plotly.js/issues/1685
                    // for more details
                    resolve();
                };

                thisImage.on('error', errorHandler);

                img.src = d.source;
                this._imgSrc = d.source;

                function errorHandler() {
                    thisImage.remove();
                    resolve();
                }
            }.bind(this));

            gd._promises.push(imagePromise);
        }
    }

    function applyAttributes(d) {
        var thisImage = d3.select(this);

        // Axes if specified
        var xa = Axes.getFromId(gd, d.xref);
        var ya = Axes.getFromId(gd, d.yref);
        var xIsDomain = Axes.getRefType(d.xref) === 'domain';
        var yIsDomain = Axes.getRefType(d.yref) === 'domain';

        var size = fullLayout._size;
        var width, height;
        if(xa !== undefined) {
            width = ((typeof(d.xref) === 'string') && xIsDomain) ?
                xa._length * d.sizex :
                Math.abs(xa.l2p(d.sizex) - xa.l2p(0));
        } else {
            width = d.sizex * size.w;
        }
        if(ya !== undefined) {
            height = ((typeof(d.yref) === 'string') && yIsDomain) ?
                ya._length * d.sizey :
                Math.abs(ya.l2p(d.sizey) - ya.l2p(0));
        } else {
            height = d.sizey * size.h;
        }

        // Offsets for anchor positioning
        var xOffset = width * anchors.x[d.xanchor].offset;
        var yOffset = height * anchors.y[d.yanchor].offset;

        var sizing = anchors.x[d.xanchor].sizing + anchors.y[d.yanchor].sizing;

        // Final positions
        var xPos, yPos;
        if(xa !== undefined) {
            xPos = ((typeof(d.xref) === 'string') && xIsDomain) ?
                xa._length * d.x + xa._offset :
                xa.r2p(d.x) + xa._offset;
        } else {
            xPos = d.x * size.w + size.l;
        }
        xPos += xOffset;
        if(ya !== undefined) {
            yPos = ((typeof(d.yref) === 'string') && yIsDomain) ?
                // consistent with "paper" yref value, where positive values
                // move up the page
                ya._length * (1 - d.y) + ya._offset :
                ya.r2p(d.y) + ya._offset;
        } else {
            yPos = size.h - d.y * size.h + size.t;
        }
        yPos += yOffset;

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
        var xId = xa && (Axes.getRefType(d.xref) !== 'domain') ? xa._id : '';
        var yId = ya && (Axes.getRefType(d.yref) !== 'domain') ? ya._id : '';
        var clipAxes = xId + yId;

        Drawing.setClipUrl(
            thisImage,
            clipAxes ? ('clip' + fullLayout._uid + clipAxes) : null,
            gd
        );
    }

    function imgDataFunc(d) {
        return [d.xref, d.x, d.sizex, d.yref, d.y, d.sizey].join('_');
    }

    function imgSort(a, b) { return a._index - b._index; }

    var imagesBelow = fullLayout._imageLowerLayer.selectAll('image')
        .data(imageDataBelow, imgDataFunc);
    var imagesAbove = fullLayout._imageUpperLayer.selectAll('image')
        .data(imageDataAbove, imgDataFunc);

    imagesBelow.enter().append('image');
    imagesAbove.enter().append('image');

    imagesBelow.exit().remove();
    imagesAbove.exit().remove();

    imagesBelow.each(function(d) {
        setImage.bind(this)(d);
        applyAttributes.bind(this)(d);
    });
    imagesAbove.each(function(d) {
        setImage.bind(this)(d);
        applyAttributes.bind(this)(d);
    });
    imagesBelow.sort(imgSort);
    imagesAbove.sort(imgSort);

    var allSubplots = Object.keys(fullLayout._plots);
    for(i = 0; i < allSubplots.length; i++) {
        subplot = allSubplots[i];
        var subplotObj = fullLayout._plots[subplot];

        // filter out overlaid plots (which have their images on the main plot)
        if(!subplotObj.imagelayer) continue;

        var imagesOnSubplot = subplotObj.imagelayer.selectAll('image')
            // even if there are no images on this subplot, we need to run
            // enter and exit in case there were previously
            .data(imageDataSubplot[subplot] || [], imgDataFunc);

        imagesOnSubplot.enter().append('image');
        imagesOnSubplot.exit().remove();

        imagesOnSubplot.each(function(d) {
            setImage.bind(this)(d);
            applyAttributes.bind(this)(d);
        });
        imagesOnSubplot.sort(imgSort);
    }
};
