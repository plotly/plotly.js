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
var Drawing = require('../../components/drawing');
var svgTextUtils = require('../../lib/svg_text_utils');

var partition = require('./partition');
var styleOne = require('./style').styleOne;
var constants = require('./constants');
var helpers = require('../sunburst/helpers');
var attachFxHandlers = require('../sunburst/fx');

var onPathbar = true; // for Ancestors

module.exports = function drawAncestors(gd, cd, entry, slices, opts) {
    var barDifY = opts.barDifY;
    var width = opts.width;
    var height = opts.height;
    var viewX = opts.viewX;
    var viewY = opts.viewY;
    var pathSlice = opts.pathSlice;
    var toMoveInsideSlice = opts.toMoveInsideSlice;
    var strTransform = opts.strTransform;
    var hasTransition = opts.hasTransition;
    var handleSlicesExit = opts.handleSlicesExit;
    var makeUpdateSliceInterpolator = opts.makeUpdateSliceInterpolator;
    var makeUpdateTextInterpolator = opts.makeUpdateTextInterpolator;
    var refRect = {};

    var fullLayout = gd._fullLayout;
    var cd0 = cd[0];
    var trace = cd0.trace;
    var hierarchy = cd0.hierarchy;

    var eachWidth = width / trace._entryDepth;

    var pathIds = helpers.listPath(entry.data, 'id');

    var sliceData = partition(hierarchy.copy(), [width, height], {
        packing: 'dice',
        pad: {
            inner: 0,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
        }
    }).descendants();

    // edit slices that show up on graph
    sliceData = sliceData.filter(function(pt) {
        var level = pathIds.indexOf(pt.data.id);
        if(level === -1) return false;

        pt.x0 = eachWidth * level;
        pt.x1 = eachWidth * (level + 1);
        pt.y0 = barDifY;
        pt.y1 = barDifY + height;

        pt.onPathbar = true;

        return true;
    });

    sliceData.reverse();

    slices = slices.data(sliceData, helpers.getPtId);

    slices.enter().append('g')
        .classed('pathbar', true);

    handleSlicesExit(slices, onPathbar, refRect, [width, height], pathSlice);

    slices.order();

    var updateSlices = slices;
    if(hasTransition) {
        updateSlices = updateSlices.transition().each('end', function() {
            // N.B. gd._transitioning is (still) *true* by the time
            // transition updates get here
            var sliceTop = d3.select(this);
            helpers.setSliceCursor(sliceTop, gd, {
                hideOnRoot: false,
                hideOnLeaves: false,
                isTransitioning: false
            });
        });
    }

    updateSlices.each(function(pt) {
        pt._hoverX = viewX(pt.x1 - Math.min(width, height) / 2);
        pt._hoverY = viewY(pt.y1 - height / 2);

        var sliceTop = d3.select(this);

        var slicePath = Lib.ensureSingle(sliceTop, 'path', 'surface', function(s) {
            s.style('pointer-events', 'all');
        });

        if(hasTransition) {
            slicePath.transition().attrTween('d', function(pt2) {
                var interp = makeUpdateSliceInterpolator(pt2, onPathbar, refRect, [width, height]);
                return function(t) { return pathSlice(interp(t)); };
            });
        } else {
            slicePath.attr('d', pathSlice);
        }

        sliceTop
            .call(attachFxHandlers, entry, gd, cd, {
                styleOne: styleOne,
                eventDataKeys: constants.eventDataKeys,
                transitionTime: constants.CLICK_TRANSITION_TIME,
                transitionEasing: constants.CLICK_TRANSITION_EASING
            })
            .call(helpers.setSliceCursor, gd, {
                hideOnRoot: false,
                hideOnLeaves: false,
                isTransitioning: gd._transitioning
            });

        slicePath.call(styleOne, pt, trace, {
            hovered: false
        });

        pt._text = (helpers.getPtLabel(pt) || '').split('<br>').join(' ') || '';

        var sliceTextGroup = Lib.ensureSingle(sliceTop, 'g', 'slicetext');
        var sliceText = Lib.ensureSingle(sliceTextGroup, 'text', '', function(s) {
            // prohibit tex interpretation until we can handle
            // tex and regular text together
            s.attr('data-notex', 1);
        });

        var font = Lib.ensureUniformFontSize(gd, helpers.determineTextFont(trace, pt, fullLayout.font, {
            onPathbar: true
        }));

        sliceText.text(pt._text || ' ') // use one space character instead of a blank string to avoid jumps during transition
            .classed('slicetext', true)
            .attr('text-anchor', 'start')
            .call(Drawing.font, font)
            .call(svgTextUtils.convertToTspans, gd);

        pt.textBB = Drawing.bBox(sliceText.node());
        pt.transform = toMoveInsideSlice(pt, {
            fontSize: font.size,
            onPathbar: true
        });
        pt.transform.fontSize = font.size;

        if(hasTransition) {
            sliceText.transition().attrTween('transform', function(pt2) {
                var interp = makeUpdateTextInterpolator(pt2, onPathbar, refRect, [width, height]);
                return function(t) { return strTransform(interp(t)); };
            });
        } else {
            sliceText.attr('transform', strTransform(pt));
        }
    });
};
