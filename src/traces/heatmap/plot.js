'use strict';

var d3 = require('@plotly/d3');
var tinycolor = require('tinycolor2');

var Registry = require('../../registry');
var Drawing = require('../../components/drawing');
var Axes = require('../../plots/cartesian/axes');
var Lib = require('../../lib');
var svgTextUtils = require('../../lib/svg_text_utils');
var formatLabels = require('../scatter/format_labels');
var Color = require('../../components/color');
var extractOpts = require('../../components/colorscale').extractOpts;
var makeColorScaleFuncFromTrace = require('../../components/colorscale').makeColorScaleFuncFromTrace;
var xmlnsNamespaces = require('../../constants/xmlns_namespaces');
var alignmentConstants = require('../../constants/alignment');
var LINE_SPACING = alignmentConstants.LINE_SPACING;
var supportsPixelatedImage = require('../../lib/supports_pixelated_image');
var PIXELATED_IMAGE_STYLE = require('../../constants/pixelated_image').STYLE;

var labelClass = 'heatmap-label';

function selectLabels(plotGroup) {
    return plotGroup.selectAll('g.' + labelClass);
}

function removeLabels(plotGroup) {
    selectLabels(plotGroup).remove();
}

module.exports = function (gd, plotinfo, cdheatmaps, heatmapLayer) {
    var xa = plotinfo.xaxis;
    var ya = plotinfo.yaxis;

    Lib.makeTraceGroups(heatmapLayer, cdheatmaps, 'hm').each(function (cd) {
        var plotGroup = d3.select(this);
        var cd0 = cd[0];
        var trace = cd0.trace;
        var xGap = trace.xgap || 0;
        var yGap = trace.ygap || 0;

        var z = cd0.z;
        var x = cd0.x;
        var y = cd0.y;
        var xc = cd0.xCenter;
        var yc = cd0.yCenter;
        var isContour = Registry.traceIs(trace, 'contour');
        var zsmooth = isContour ? 'best' : trace.zsmooth;

        // get z dims
        var m = z.length;
        var n = Lib.maxRowLength(z);
        var xrev = false;
        var yrev = false;

        var left, right, temp, top, bottom, i, j, k;

        // TODO: if there are multiple overlapping categorical heatmaps,
        // or if we allow category sorting, then the categories may not be
        // sequential... may need to reorder and/or expand z

        // Get edges of png in pixels (xa.c2p() maps axes coordinates to pixel coordinates)
        // figure out if either axis is reversed (y is usually reversed, in pixel coords)
        // also clip the image to maximum 50% outside the visible plot area
        // bigger image lets you pan more naturally, but slows performance.
        // TODO: use low-resolution images outside the visible plot for panning
        // these while loops find the first and last brick bounds that are defined
        // (in case of log of a negative)
        i = 0;
        while (left === undefined && i < x.length - 1) {
            left = xa.c2p(x[i]);
            i++;
        }
        i = x.length - 1;
        while (right === undefined && i > 0) {
            right = xa.c2p(x[i]);
            i--;
        }

        if (right < left) {
            temp = right;
            right = left;
            left = temp;
            xrev = true;
        }

        i = 0;
        while (top === undefined && i < y.length - 1) {
            top = ya.c2p(y[i]);
            i++;
        }
        i = y.length - 1;
        while (bottom === undefined && i > 0) {
            bottom = ya.c2p(y[i]);
            i--;
        }

        if (bottom < top) {
            temp = top;
            top = bottom;
            bottom = temp;
            yrev = true;
        }

        // for contours with heatmap fill, we generate the boundaries based on
        // brick centers but then use the brick edges for drawing the bricks
        if (isContour) {
            xc = x;
            yc = y;
            x = cd0.xfill;
            y = cd0.yfill;
        }

        var drawingMethod = 'default';
        if (zsmooth) {
            drawingMethod = zsmooth === 'best' ? 'smooth' : 'fast';
        } else if (trace._islinear && xGap === 0 && yGap === 0 && supportsPixelatedImage()) {
            drawingMethod = 'fast';
        }

        // make an image that goes at most half a screen off either side, to keep
        // time reasonable when you zoom in. if drawingMethod is fast, don't worry
        // about this, because zooming doesn't increase number of pixels
        // if zsmooth is best, don't include anything off screen because it takes too long
        if (drawingMethod !== 'fast') {
            var extra = zsmooth === 'best' ? 0 : 0.5;
            left = Math.max(-extra * xa._length, left);
            right = Math.min((1 + extra) * xa._length, right);
            top = Math.max(-extra * ya._length, top);
            bottom = Math.min((1 + extra) * ya._length, bottom);
        }

        var imageWidth = Math.round(right - left);
        var imageHeight = Math.round(bottom - top);

        // setup image nodes

        // if image is entirely off-screen, don't even draw it
        var isOffScreen = left >= xa._length || right <= 0 || top >= ya._length || bottom <= 0;

        if (isOffScreen) {
            var noImage = plotGroup.selectAll('image').data([]);
            noImage.exit().remove();

            removeLabels(plotGroup);
            return;
        }

        // generate image data

        var canvasW, canvasH;
        if (drawingMethod === 'fast') {
            canvasW = n;
            canvasH = m;
        } else {
            canvasW = imageWidth;
            canvasH = imageHeight;
        }

        var canvas = document.createElement('canvas');
        canvas.width = canvasW;
        canvas.height = canvasH;
        var context = canvas.getContext('2d', { willReadFrequently: true });

        var sclFunc = makeColorScaleFuncFromTrace(trace, { noNumericCheck: true, returnArray: true });

        // map brick boundaries to image pixels
        var xpx, ypx;
        if (drawingMethod === 'fast') {
            xpx = xrev
                ? function (index) {
                      return n - 1 - index;
                  }
                : Lib.identity;
            ypx = yrev
                ? function (index) {
                      return m - 1 - index;
                  }
                : Lib.identity;
        } else {
            xpx = function (index) {
                return Lib.constrain(Math.round(xa.c2p(x[index]) - left), 0, imageWidth);
            };
            ypx = function (index) {
                return Lib.constrain(Math.round(ya.c2p(y[index]) - top), 0, imageHeight);
            };
        }

        // build the pixel map brick-by-brick
        // cruise through z-matrix row-by-row
        // build a brick at each z-matrix value
        var yi = ypx(0);
        var yb = [yi, yi];
        var xbi = xrev ? 0 : 1;
        var ybi = yrev ? 0 : 1;
        // for collecting an average luminosity of the heatmap
        var pixcount = 0;
        var rcount = 0;
        var gcount = 0;
        var bcount = 0;

        var xb, xi, v, row, c;

        function setColor(v, pixsize) {
            if (v !== undefined) {
                var c = sclFunc(v);
                c[0] = Math.round(c[0]);
                c[1] = Math.round(c[1]);
                c[2] = Math.round(c[2]);

                pixcount += pixsize;
                rcount += c[0] * pixsize;
                gcount += c[1] * pixsize;
                bcount += c[2] * pixsize;
                return c;
            }
            return [0, 0, 0, 0];
        }

        function interpColor(r0, r1, xinterp, yinterp) {
            var z00 = r0[xinterp.bin0];
            if (z00 === undefined) return setColor(undefined, 1);

            var z01 = r0[xinterp.bin1];
            var z10 = r1[xinterp.bin0];
            var z11 = r1[xinterp.bin1];
            var dx = z01 - z00 || 0;
            var dy = z10 - z00 || 0;
            var dxy;

            // the bilinear interpolation term needs different calculations
            // for all the different permutations of missing data
            // among the neighbors of the main point, to ensure
            // continuity across brick boundaries.
            if (z01 === undefined) {
                if (z11 === undefined) dxy = 0;
                else if (z10 === undefined) dxy = 2 * (z11 - z00);
                else dxy = ((2 * z11 - z10 - z00) * 2) / 3;
            } else if (z11 === undefined) {
                if (z10 === undefined) dxy = 0;
                else dxy = ((2 * z00 - z01 - z10) * 2) / 3;
            } else if (z10 === undefined) dxy = ((2 * z11 - z01 - z00) * 2) / 3;
            else dxy = z11 + z00 - z01 - z10;

            return setColor(z00 + xinterp.frac * dx + yinterp.frac * (dy + xinterp.frac * dxy));
        }

        if (drawingMethod !== 'default') {
            // works fastest with imageData
            var pxIndex = 0;
            var pixels;

            try {
                pixels = new Uint8Array(canvasW * canvasH * 4);
            } catch (e) {
                pixels = new Array(canvasW * canvasH * 4);
            }

            if (drawingMethod === 'smooth') {
                // zsmooth="best"
                var xForPx = xc || x;
                var yForPx = yc || y;
                var xPixArray = new Array(xForPx.length);
                var yPixArray = new Array(yForPx.length);
                var xinterpArray = new Array(imageWidth);
                var findInterpX = xc ? findInterpFromCenters : findInterp;
                var findInterpY = yc ? findInterpFromCenters : findInterp;
                var yinterp, r0, r1;

                // first make arrays of x and y pixel locations of brick boundaries
                for (i = 0; i < xForPx.length; i++) xPixArray[i] = Math.round(xa.c2p(xForPx[i]) - left);
                for (i = 0; i < yForPx.length; i++) yPixArray[i] = Math.round(ya.c2p(yForPx[i]) - top);

                // then make arrays of interpolations
                // (bin0=closest, bin1=next, frac=fractional dist.)
                for (i = 0; i < imageWidth; i++) xinterpArray[i] = findInterpX(i, xPixArray);

                // now do the interpolations and fill the png
                for (j = 0; j < imageHeight; j++) {
                    yinterp = findInterpY(j, yPixArray);
                    r0 = z[yinterp.bin0];
                    r1 = z[yinterp.bin1];
                    for (i = 0; i < imageWidth; i++, pxIndex += 4) {
                        c = interpColor(r0, r1, xinterpArray[i], yinterp);
                        putColor(pixels, pxIndex, c);
                    }
                }
            } else {
                // drawingMethod = "fast" (zsmooth = "fast"|false)
                for (j = 0; j < m; j++) {
                    row = z[j];
                    yb = ypx(j);
                    for (i = 0; i < n; i++) {
                        c = setColor(row[i], 1);
                        pxIndex = (yb * n + xpx(i)) * 4;
                        putColor(pixels, pxIndex, c);
                    }
                }
            }

            var imageData = context.createImageData(canvasW, canvasH);
            try {
                imageData.data.set(pixels);
            } catch (e) {
                var pxArray = imageData.data;
                var dlen = pxArray.length;
                for (j = 0; j < dlen; j++) {
                    pxArray[j] = pixels[j];
                }
            }

            context.putImageData(imageData, 0, 0);
        } else {
            // rawingMethod = "default" (zsmooth = false)
            // filling potentially large bricks works fastest with fillRect
            // gaps do not need to be exact integers, but if they *are* we will get
            // cleaner edges by rounding at least one edge
            var xGapLeft = Math.floor(xGap / 2);
            var yGapTop = Math.floor(yGap / 2);

            for (j = 0; j < m; j++) {
                row = z[j];
                yb.reverse();
                yb[ybi] = ypx(j + 1);
                if (yb[0] === yb[1] || yb[0] === undefined || yb[1] === undefined) {
                    continue;
                }
                xi = xpx(0);
                xb = [xi, xi];
                for (i = 0; i < n; i++) {
                    // build one color brick!
                    xb.reverse();
                    xb[xbi] = xpx(i + 1);
                    if (xb[0] === xb[1] || xb[0] === undefined || xb[1] === undefined) {
                        continue;
                    }
                    v = row[i];
                    c = setColor(v, (xb[1] - xb[0]) * (yb[1] - yb[0]));
                    context.fillStyle = 'rgba(' + c.join(',') + ')';

                    context.fillRect(xb[0] + xGapLeft, yb[0] + yGapTop, xb[1] - xb[0] - xGap, yb[1] - yb[0] - yGap);
                }
            }
        }

        rcount = Math.round(rcount / pixcount);
        gcount = Math.round(gcount / pixcount);
        bcount = Math.round(bcount / pixcount);
        var avgColor = tinycolor('rgb(' + rcount + ',' + gcount + ',' + bcount + ')');

        gd._hmpixcount = (gd._hmpixcount || 0) + pixcount;
        gd._hmlumcount = (gd._hmlumcount || 0) + pixcount * avgColor.getLuminance();

        var image3 = plotGroup.selectAll('image').data(cd);

        image3.enter().append('svg:image').attr({
            xmlns: xmlnsNamespaces.svg,
            preserveAspectRatio: 'none'
        });

        image3.attr({
            height: imageHeight,
            width: imageWidth,
            x: left,
            y: top,
            'xlink:href': canvas.toDataURL('image/png')
        });

        if (drawingMethod === 'fast' && !zsmooth) {
            image3.attr('style', PIXELATED_IMAGE_STYLE);
        }

        removeLabels(plotGroup);

        var texttemplate = trace.texttemplate;
        if (texttemplate) {
            // dummy axis for formatting the z value
            var cOpts = extractOpts(trace);
            var dummyAx = {
                type: 'linear',
                range: [cOpts.min, cOpts.max],
                _separators: xa._separators,
                _numFormat: xa._numFormat
            };

            var aHistogram2dContour = trace.type === 'histogram2dcontour';
            var aContour = trace.type === 'contour';
            var iStart = aContour ? 1 : 0;
            var iStop = aContour ? m - 1 : m;
            var jStart = aContour ? 1 : 0;
            var jStop = aContour ? n - 1 : n;

            var textData = [];
            for (i = iStart; i < iStop; i++) {
                var yVal;
                if (aContour) {
                    yVal = cd0.y[i];
                } else if (aHistogram2dContour) {
                    if (i === 0 || i === m - 1) continue;
                    yVal = cd0.y[i];
                } else if (cd0.yCenter) {
                    yVal = cd0.yCenter[i];
                } else {
                    if (i + 1 === m && cd0.y[i + 1] === undefined) continue;
                    yVal = (cd0.y[i] + cd0.y[i + 1]) / 2;
                }

                var _y = Math.round(ya.c2p(yVal));
                if (0 > _y || _y > ya._length) continue;

                for (j = jStart; j < jStop; j++) {
                    var xVal;
                    if (aContour) {
                        xVal = cd0.x[j];
                    } else if (aHistogram2dContour) {
                        if (j === 0 || j === n - 1) continue;
                        xVal = cd0.x[j];
                    } else if (cd0.xCenter) {
                        xVal = cd0.xCenter[j];
                    } else {
                        if (j + 1 === n && cd0.x[j + 1] === undefined) continue;
                        xVal = (cd0.x[j] + cd0.x[j + 1]) / 2;
                    }

                    var _x = Math.round(xa.c2p(xVal));
                    if (0 > _x || _x > xa._length) continue;

                    var obj = formatLabels(
                        {
                            x: xVal,
                            y: yVal
                        },
                        trace,
                        gd._fullLayout
                    );

                    obj.x = xVal;
                    obj.y = yVal;

                    var zVal = cd0.z[i][j];
                    if (zVal === undefined) {
                        obj.z = '';
                        obj.zLabel = '';
                    } else {
                        obj.z = zVal;
                        obj.zLabel = Axes.tickText(dummyAx, zVal, 'hover').text;
                    }

                    var theText = cd0.text && cd0.text[i] && cd0.text[i][j];
                    if (theText === undefined || theText === false) theText = '';
                    obj.text = theText;

                    var _t = Lib.texttemplateString({
                        data: [obj, trace._meta],
                        fallback: trace.texttemplatefallback,
                        labels: obj,
                        locale: gd._fullLayout._d3locale,
                        template: texttemplate
                    });
                    if (!_t) continue;

                    var lines = _t.split('<br>');
                    var nL = lines.length;
                    var nC = 0;
                    for (k = 0; k < nL; k++) {
                        nC = Math.max(nC, lines[k].length);
                    }

                    textData.push({
                        l: nL, // number of lines
                        c: nC, // maximum number of chars in a line
                        t: _t, // text
                        x: _x,
                        y: _y,
                        z: zVal
                    });
                }
            }

            var font = trace.textfont;
            var fontSize = font.size;
            var globalFontSize = gd._fullLayout.font.size;

            if (!fontSize || fontSize === 'auto') {
                var minW = Infinity;
                var minH = Infinity;
                var maxL = 0;
                var maxC = 0;

                for (k = 0; k < textData.length; k++) {
                    var d = textData[k];
                    maxL = Math.max(maxL, d.l);
                    maxC = Math.max(maxC, d.c);

                    if (k < textData.length - 1) {
                        var nextD = textData[k + 1];
                        var dx = Math.abs(nextD.x - d.x);
                        var dy = Math.abs(nextD.y - d.y);

                        if (dx) minW = Math.min(minW, dx);
                        if (dy) minH = Math.min(minH, dy);
                    }
                }

                if (!isFinite(minW) || !isFinite(minH)) {
                    fontSize = globalFontSize;
                } else {
                    minW -= xGap;
                    minH -= yGap;

                    minW /= maxC;
                    minH /= maxL;

                    minW /= LINE_SPACING / 2;
                    minH /= LINE_SPACING;

                    fontSize = Math.min(Math.floor(minW), Math.floor(minH), globalFontSize);
                }
            }
            if (fontSize <= 0 || !isFinite(fontSize)) return;

            var xFn = function (d) {
                return d.x;
            };
            var yFn = function (d) {
                return d.y - fontSize * ((d.l * LINE_SPACING) / 2 - 1);
            };

            var labels = selectLabels(plotGroup).data(textData);

            labels
                .enter()
                .append('g')
                .classed(labelClass, 1)
                .append('text')
                .attr('text-anchor', 'middle')
                .each(function (d) {
                    var thisLabel = d3.select(this);

                    var fontColor = font.color;
                    if (!fontColor || fontColor === 'auto') {
                        fontColor = Color.contrast(
                            d.z === undefined ? gd._fullLayout.plot_bgcolor : 'rgba(' + sclFunc(d.z).join() + ')'
                        );
                    }

                    thisLabel
                        .attr('data-notex', 1)
                        .call(svgTextUtils.positionText, xFn(d), yFn(d))
                        .call(Drawing.font, {
                            family: font.family,
                            size: fontSize,
                            color: fontColor,
                            weight: font.weight,
                            style: font.style,
                            variant: font.variant,
                            textcase: font.textcase,
                            lineposition: font.lineposition,
                            shadow: font.shadow
                        })
                        .text(d.t)
                        .call(svgTextUtils.convertToTspans, gd);
                });
        }
    });
};

// get interpolated bin value. Returns {bin0:closest bin, frac:fractional dist to next, bin1:next bin}
function findInterp(pixel, pixArray) {
    var maxBin = pixArray.length - 2;
    var bin = Lib.constrain(Lib.findBin(pixel, pixArray), 0, maxBin);
    var pix0 = pixArray[bin];
    var pix1 = pixArray[bin + 1];
    var interp = Lib.constrain(bin + (pixel - pix0) / (pix1 - pix0) - 0.5, 0, maxBin);
    var bin0 = Math.round(interp);
    var frac = Math.abs(interp - bin0);

    if (!interp || interp === maxBin || !frac) {
        return {
            bin0: bin0,
            bin1: bin0,
            frac: 0
        };
    }
    return {
        bin0: bin0,
        frac: frac,
        bin1: Math.round(bin0 + frac / (interp - bin0))
    };
}

function findInterpFromCenters(pixel, centerPixArray) {
    var maxBin = centerPixArray.length - 1;
    var bin = Lib.constrain(Lib.findBin(pixel, centerPixArray), 0, maxBin);
    var pix0 = centerPixArray[bin];
    var pix1 = centerPixArray[bin + 1];
    var frac = (pixel - pix0) / (pix1 - pix0) || 0;
    if (frac <= 0) {
        return {
            bin0: bin,
            bin1: bin,
            frac: 0
        };
    }
    if (frac < 0.5) {
        return {
            bin0: bin,
            bin1: bin + 1,
            frac: frac
        };
    }
    return {
        bin0: bin + 1,
        bin1: bin,
        frac: 1 - frac
    };
}

function putColor(pixels, pxIndex, c) {
    pixels[pxIndex] = c[0];
    pixels[pxIndex + 1] = c[1];
    pixels[pxIndex + 2] = c[2];
    pixels[pxIndex + 3] = Math.round(c[3] * 255);
}
