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

var upDown = true; // for Ancestors

module.exports = function drawAncestors(gd, cd, entry, slices, opts) {
    var barDifY = opts.barDifY;
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

    var eachWidth = opts.width / entry.height;

    var sliceData = partition(entry, [width, height], {
        packing: 'dice',
        pad: {
            inner: 0,
            top: 0,
            left: eachWidth,
            right: 0,
            bottom: 0
        }
    }).descendants();

    // filter out slices that won't show up on graph
    sliceData = sliceData.filter(function(pt) { return pt.height > 0; });

    slices = slices.data(sliceData, function(pt) {
        if(isNaN(pt.x0)) pt.x0 = 0;
        if(isNaN(pt.x1)) pt.x1 = width;

        return helpers.getPtId(pt);
    });

    slices.enter().append('g')
        .classed('pathbar', true);

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
        pt._hoverX = viewX(pt.x0) + eachWidth / 2;
        pt._hoverY = viewY(pt.y0) + height / 2;

        var sliceTop = d3.select(this);

        var slicePath = Lib.ensureSingle(sliceTop, 'path', 'surface', function(s) {
            s.style('pointer-events', 'all');
        });

        if(hasTransition) {
            slicePath.transition().attrTween('d', function(pt2) {
                var interp = makeUpdateSliceIntepolator(pt2, upDown, refRect, [width, height]);
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

        var tx = helpers.getLabelStr(pt.data.data.label);
        if(!pt.children) tx = ' '; // don't display last label on the menu - should use space instead of empty string

        sliceText.text(tx)
            .classed('slicetext', true)
            .attr('text-anchor', 'start')
            .call(Drawing.font, helpers.determineTextFont(trace, pt, fullLayout.font, trace.pathdir))
            .call(svgTextUtils.convertToTspans, gd);

        pt.textBB = Drawing.bBox(sliceText.node());
        pt.transform = toMoveInsideSlice(
            pt.x0,
            Math.min(pt.x0 + eachWidth, pt.x1),
            pt.y0 + barDifY,
            pt.y1 + barDifY,
            pt.textBB,
            {
                isMenu: true
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
                var interp = makeUpdateTextInterpolar(pt2, upDown, refRect, [width, height]);
                return function(t) { return helpers.strTransform(interp(t)); };
            });
        } else {
            sliceText.attr('transform', helpers.strTransform(pt));
        }
    });
};
