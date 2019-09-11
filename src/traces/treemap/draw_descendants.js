/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');
var Lib = require('../../lib');
var Drawing = require('../../components/drawing');
var svgTextUtils = require('../../lib/svg_text_utils');

var partition = require('./partition');
var styleOne = require('./style').styleOne;
var constants = require('./constants');
var helpers = require('../sunburst/helpers');
var sunburstPlot = require('../sunburst/plot');
var attachFxHandlers = sunburstPlot.attachFxHandlers;
var formatSliceLabel = sunburstPlot.formatSliceLabel;

var upDown = false; // for Descendants

module.exports = function drawDescendants(gd, cd, entry, slices, opts) {
    var width = opts.width;
    var height = opts.height;

    var viewX = opts.viewX;
    var viewY = opts.viewY;

    var refRect = opts.refRect;
    var pathSlice = opts.pathSlice;
    var toMoveInsideSlice = opts.toMoveInsideSlice;

    var hasTransition = opts.hasTransition;
    var handleSlicesExit = opts.handleSlicesExit;
    var makeUpdateSliceIntepolator = opts.makeUpdateSliceIntepolator;
    var makeUpdateTextInterpolar = opts.makeUpdateTextInterpolar;

    var fullLayout = gd._fullLayout;
    var cd0 = cd[0];
    var trace = cd0.trace;

    var hasLeft = trace.textposition.indexOf('left') !== -1;
    var hasRight = trace.textposition.indexOf('right') !== -1;
    var hasBottom = trace.textposition.indexOf('bottom') !== -1;

    var noRoomForHeader = (!hasBottom && !trace.marker.pad.top) || (hasBottom && !trace.marker.pad.bottom);

    // N.B. slice data isn't the calcdata,
    // grab corresponding calcdata item in sliceData[i].data.data
    var allData = partition(entry, [width, height], {
        packing: trace.tiling.packing,
        squarifyratio: trace.tiling.squarifyratio,
        mirrorX: trace.tiling.mirror.indexOf('x') > -1,
        mirrorY: trace.tiling.mirror.indexOf('y') > -1,
        pad: {
            inner: trace.tiling.pad,
            top: trace.marker.pad.top,
            left: trace.marker.pad.left,
            right: trace.marker.pad.right,
            bottom: trace.marker.pad.bottom,
        }
    });

    var getRefRect = function() {
        if(!trace._clickedInfo) return refRect;
        return helpers.findChildPt(allData, trace._clickedInfo.id);
    };

    var sliceData = allData.descendants();

    // filter out slices that won't show up on graph
    sliceData = sliceData.filter(function(pt) { return pt.depth < trace._maxDepth; });

    slices = slices.data(sliceData, function(pt) { return helpers.getPtId(pt); });

    slices.enter().append('g')
        .classed('slice', true);

    handleSlicesExit(slices, upDown, refRect, [width, height], pathSlice);

    slices.order();

    var updateSlices = slices;
    if(hasTransition) {
        updateSlices = updateSlices.transition().each('end', function() {
            // N.B. gd._transitioning is (still) *true* by the time
            // transition updates get here
            var sliceTop = d3.select(this);
            helpers.setSliceCursor(sliceTop, gd, { isTransitioning: false });
        });
    }

    updateSlices.each(function(pt) {
        var isHeader = helpers.isHeader(pt, trace);

        pt._hoverX = viewX(pt.x1 - trace.marker.pad.right),
        pt._hoverY = hasBottom ?
                viewY(pt.y1 - trace.marker.pad.bottom / 2) :
                viewY(pt.y0 + trace.marker.pad.top / 2);

        var sliceTop = d3.select(this);

        var slicePath = Lib.ensureSingle(sliceTop, 'path', 'surface', function(s) {
            s.style('pointer-events', 'all');
        });

        if(hasTransition) {
            slicePath.transition().attrTween('d', function(pt2) {
                var interp = makeUpdateSliceIntepolator(pt2, upDown, getRefRect(), [width, height]);
                return function(t) { return pathSlice(interp(t)); };
            });
        } else {
            slicePath.attr('d', pathSlice);
        }

        sliceTop
            .call(attachFxHandlers, entry, gd, cd, styleOne, constants)
            .call(helpers.setSliceCursor, gd, { isTransitioning: gd._transitioning });

        slicePath.call(styleOne, pt, trace);

        var sliceTextGroup = Lib.ensureSingle(sliceTop, 'g', 'slicetext');
        var sliceText = Lib.ensureSingle(sliceTextGroup, 'text', '', function(s) {
            // prohibit tex interpretation until we can handle
            // tex and regular text together
            s.attr('data-notex', 1);
        });

        if(isHeader && noRoomForHeader) return;

        var tx = formatSliceLabel(pt, entry, trace, cd, fullLayout);

        sliceText.text(tx)
            .classed('slicetext', true)
            .attr('text-anchor', hasRight ? 'end' : (hasLeft || isHeader) ? 'start' : 'middle')
            .call(Drawing.font, helpers.determineTextFont(trace, pt, fullLayout.font))
            .call(svgTextUtils.convertToTspans, gd);

        pt.textBB = Drawing.bBox(sliceText.node());
        pt.transform = toMoveInsideSlice(
            pt.x0,
            pt.x1,
            pt.y0,
            pt.y1,
            pt.textBB,
            {
                isHeader: isHeader
            }
        );

        if(helpers.isOutsideText(trace, pt)) {
            // consider in/out diff font sizes
            pt.transform.targetY -= (
                helpers.getOutsideTextFontKey('size', trace, pt, fullLayout.font) -
                helpers.getInsideTextFontKey('size', trace, pt, fullLayout.font)
            );
        }

        if(hasTransition) {
            sliceText.transition().attrTween('transform', function(pt2) {
                var interp = makeUpdateTextInterpolar(pt2, upDown, getRefRect(), [width, height]);
                return function(t) { return helpers.strTransform(interp(t)); };
            });
        } else {
            sliceText.attr('transform', helpers.strTransform(pt));
        }
    });
};
