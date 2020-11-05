/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');

var Plots = require('../../plots/plots');
var Fx = require('../../components/fx');
var Color = require('../../components/color');
var Drawing = require('../../components/drawing');
var Lib = require('../../lib');
var strScale = Lib.strScale;
var strTranslate = Lib.strTranslate;
var svgTextUtils = require('../../lib/svg_text_utils');
var uniformText = require('../bar/uniform_text');
var recordMinTextSize = uniformText.recordMinTextSize;
var clearMinTextSize = uniformText.clearMinTextSize;
var TEXTPAD = require('../bar/constants').TEXTPAD;

var helpers = require('./helpers');
var eventData = require('./event_data');
var isValidTextValue = require('../../lib').isValidTextValue;

function plot(gd, cdModule) {
    var fullLayout = gd._fullLayout;
    var gs = fullLayout._size;

    clearMinTextSize('pie', fullLayout);

    prerenderTitles(cdModule, gd);
    layoutAreas(cdModule, gs);

    var plotGroups = Lib.makeTraceGroups(fullLayout._pielayer, cdModule, 'trace').each(function(cd) {
        var plotGroup = d3.select(this);
        var cd0 = cd[0];
        var trace = cd0.trace;

        setCoords(cd);

        // TODO: miter might look better but can sometimes cause problems
        // maybe miter with a small-ish stroke-miterlimit?
        plotGroup.attr('stroke-linejoin', 'round');

        plotGroup.each(function() {
            var slices = d3.select(this).selectAll('g.slice').data(cd);

            slices.enter().append('g')
                .classed('slice', true);
            slices.exit().remove();

            var quadrants = [
                [[], []], // y<0: x<0, x>=0
                [[], []] // y>=0: x<0, x>=0
            ];
            var hasOutsideText = false;

            slices.each(function(pt, i) {
                if(pt.hidden) {
                    d3.select(this).selectAll('path,g').remove();
                    return;
                }

                // to have consistent event data compared to other traces
                pt.pointNumber = pt.i;
                pt.curveNumber = trace.index;

                quadrants[pt.pxmid[1] < 0 ? 0 : 1][pt.pxmid[0] < 0 ? 0 : 1].push(pt);

                var cx = cd0.cx;
                var cy = cd0.cy;
                var sliceTop = d3.select(this);
                var slicePath = sliceTop.selectAll('path.surface').data([pt]);

                slicePath.enter().append('path')
                    .classed('surface', true)
                    .style({'pointer-events': 'all'});

                sliceTop.call(attachFxHandlers, gd, cd);

                if(trace.pull) {
                    var pull = +helpers.castOption(trace.pull, pt.pts) || 0;
                    if(pull > 0) {
                        cx += pull * pt.pxmid[0];
                        cy += pull * pt.pxmid[1];
                    }
                }

                pt.cxFinal = cx;
                pt.cyFinal = cy;

                function arc(start, finish, cw, scale) {
                    var dx = scale * (finish[0] - start[0]);
                    var dy = scale * (finish[1] - start[1]);

                    return 'a' +
                        (scale * cd0.r) + ',' + (scale * cd0.r) + ' 0 ' +
                        pt.largeArc + (cw ? ' 1 ' : ' 0 ') + dx + ',' + dy;
                }

                var hole = trace.hole;
                if(pt.v === cd0.vTotal) { // 100% fails bcs arc start and end are identical
                    var outerCircle = 'M' + (cx + pt.px0[0]) + ',' + (cy + pt.px0[1]) +
                        arc(pt.px0, pt.pxmid, true, 1) +
                        arc(pt.pxmid, pt.px0, true, 1) + 'Z';
                    if(hole) {
                        slicePath.attr('d',
                            'M' + (cx + hole * pt.px0[0]) + ',' + (cy + hole * pt.px0[1]) +
                            arc(pt.px0, pt.pxmid, false, hole) +
                            arc(pt.pxmid, pt.px0, false, hole) +
                            'Z' + outerCircle);
                    } else slicePath.attr('d', outerCircle);
                } else {
                    var outerArc = arc(pt.px0, pt.px1, true, 1);

                    if(hole) {
                        var rim = 1 - hole;
                        slicePath.attr('d',
                            'M' + (cx + hole * pt.px1[0]) + ',' + (cy + hole * pt.px1[1]) +
                            arc(pt.px1, pt.px0, false, hole) +
                            'l' + (rim * pt.px0[0]) + ',' + (rim * pt.px0[1]) +
                            outerArc +
                            'Z');
                    } else {
                        slicePath.attr('d',
                            'M' + cx + ',' + cy +
                            'l' + pt.px0[0] + ',' + pt.px0[1] +
                            outerArc +
                            'Z');
                    }
                }

                // add text
                formatSliceLabel(gd, pt, cd0);
                var textPosition = helpers.castOption(trace.textposition, pt.pts);
                var sliceTextGroup = sliceTop.selectAll('g.slicetext')
                    .data(pt.text && (textPosition !== 'none') ? [0] : []);

                sliceTextGroup.enter().append('g')
                    .classed('slicetext', true);
                sliceTextGroup.exit().remove();

                sliceTextGroup.each(function() {
                    var sliceText = Lib.ensureSingle(d3.select(this), 'text', '', function(s) {
                        // prohibit tex interpretation until we can handle
                        // tex and regular text together
                        s.attr('data-notex', 1);
                    });

                    var font = Lib.ensureUniformFontSize(gd, textPosition === 'outside' ?
                        determineOutsideTextFont(trace, pt, fullLayout.font) :
                        determineInsideTextFont(trace, pt, fullLayout.font)
                    );

                    sliceText.text(pt.text)
                        .attr({
                            'class': 'slicetext',
                            transform: '',
                            'text-anchor': 'middle'
                        })
                        .call(Drawing.font, font)
                        .call(svgTextUtils.convertToTspans, gd);

                    // position the text relative to the slice
                    var textBB = Drawing.bBox(sliceText.node());
                    var transform;

                    if(textPosition === 'outside') {
                        transform = transformOutsideText(textBB, pt);
                    } else {
                        transform = transformInsideText(textBB, pt, cd0);
                        if(textPosition === 'auto' && transform.scale < 1) {
                            var newFont = Lib.ensureUniformFontSize(gd, trace.outsidetextfont);

                            sliceText.call(Drawing.font, newFont);
                            textBB = Drawing.bBox(sliceText.node());

                            transform = transformOutsideText(textBB, pt);
                        }
                    }

                    var textPosAngle = transform.textPosAngle;
                    var textXY = textPosAngle === undefined ? pt.pxmid : getCoords(cd0.r, textPosAngle);
                    transform.targetX = cx + textXY[0] * transform.rCenter + (transform.x || 0);
                    transform.targetY = cy + textXY[1] * transform.rCenter + (transform.y || 0);
                    computeTransform(transform, textBB);

                    // save some stuff to use later ensure no labels overlap
                    if(transform.outside) {
                        var targetY = transform.targetY;
                        pt.yLabelMin = targetY - textBB.height / 2;
                        pt.yLabelMid = targetY;
                        pt.yLabelMax = targetY + textBB.height / 2;
                        pt.labelExtraX = 0;
                        pt.labelExtraY = 0;
                        hasOutsideText = true;
                    }

                    transform.fontSize = font.size;
                    recordMinTextSize(trace.type, transform, fullLayout);
                    cd[i].transform = transform;

                    sliceText.attr('transform', Lib.getTextTransform(transform));
                });
            });

            // add the title
            var titleTextGroup = d3.select(this).selectAll('g.titletext')
                .data(trace.title.text ? [0] : []);

            titleTextGroup.enter().append('g')
                .classed('titletext', true);
            titleTextGroup.exit().remove();

            titleTextGroup.each(function() {
                var titleText = Lib.ensureSingle(d3.select(this), 'text', '', function(s) {
                    // prohibit tex interpretation as above
                    s.attr('data-notex', 1);
                });

                var txt = trace.title.text;
                if(trace._meta) {
                    txt = Lib.templateString(txt, trace._meta);
                }

                titleText.text(txt)
                    .attr({
                        'class': 'titletext',
                        transform: '',
                        'text-anchor': 'middle',
                    })
                .call(Drawing.font, trace.title.font)
                .call(svgTextUtils.convertToTspans, gd);

                var transform;

                if(trace.title.position === 'middle center') {
                    transform = positionTitleInside(cd0);
                } else {
                    transform = positionTitleOutside(cd0, gs);
                }

                titleText.attr('transform',
                    strTranslate(transform.x, transform.y) +
                    strScale(Math.min(1, transform.scale)) +
                    strTranslate(transform.tx, transform.ty));
            });

            // now make sure no labels overlap (at least within one pie)
            if(hasOutsideText) scootLabels(quadrants, trace);

            plotTextLines(slices, trace);

            if(hasOutsideText && trace.automargin) {
                // TODO if we ever want to improve perf,
                // we could reuse the textBB computed above together
                // with the sliceText transform info
                var traceBbox = Drawing.bBox(plotGroup.node());

                var domain = trace.domain;
                var vpw = gs.w * (domain.x[1] - domain.x[0]);
                var vph = gs.h * (domain.y[1] - domain.y[0]);
                var xgap = (0.5 * vpw - cd0.r) / gs.w;
                var ygap = (0.5 * vph - cd0.r) / gs.h;

                Plots.autoMargin(gd, 'pie.' + trace.uid + '.automargin', {
                    xl: domain.x[0] - xgap,
                    xr: domain.x[1] + xgap,
                    yb: domain.y[0] - ygap,
                    yt: domain.y[1] + ygap,
                    l: Math.max(cd0.cx - cd0.r - traceBbox.left, 0),
                    r: Math.max(traceBbox.right - (cd0.cx + cd0.r), 0),
                    b: Math.max(traceBbox.bottom - (cd0.cy + cd0.r), 0),
                    t: Math.max(cd0.cy - cd0.r - traceBbox.top, 0),
                    pad: 5
                });
            }
        });
    });

    // This is for a bug in Chrome (as of 2015-07-22, and does not affect FF)
    // if insidetextfont and outsidetextfont are different sizes, sometimes the size
    // of an "em" gets taken from the wrong element at first so lines are
    // spaced wrong. You just have to tell it to try again later and it gets fixed.
    // I have no idea why we haven't seen this in other contexts. Also, sometimes
    // it gets the initial draw correct but on redraw it gets confused.
    setTimeout(function() {
        plotGroups.selectAll('tspan').each(function() {
            var s = d3.select(this);
            if(s.attr('dy')) s.attr('dy', s.attr('dy'));
        });
    }, 0);
}

// TODO add support for transition
function plotTextLines(slices, trace) {
    slices.each(function(pt) {
        var sliceTop = d3.select(this);

        if(!pt.labelExtraX && !pt.labelExtraY) {
            sliceTop.select('path.textline').remove();
            return;
        }

        // first move the text to its new location
        var sliceText = sliceTop.select('g.slicetext text');

        pt.transform.targetX += pt.labelExtraX;
        pt.transform.targetY += pt.labelExtraY;

        sliceText.attr('transform', Lib.getTextTransform(pt.transform));

        // then add a line to the new location
        var lineStartX = pt.cxFinal + pt.pxmid[0];
        var lineStartY = pt.cyFinal + pt.pxmid[1];
        var textLinePath = 'M' + lineStartX + ',' + lineStartY;
        var finalX = (pt.yLabelMax - pt.yLabelMin) * (pt.pxmid[0] < 0 ? -1 : 1) / 4;

        if(pt.labelExtraX) {
            var yFromX = pt.labelExtraX * pt.pxmid[1] / pt.pxmid[0];
            var yNet = pt.yLabelMid + pt.labelExtraY - (pt.cyFinal + pt.pxmid[1]);

            if(Math.abs(yFromX) > Math.abs(yNet)) {
                textLinePath +=
                    'l' + (yNet * pt.pxmid[0] / pt.pxmid[1]) + ',' + yNet +
                    'H' + (lineStartX + pt.labelExtraX + finalX);
            } else {
                textLinePath += 'l' + pt.labelExtraX + ',' + yFromX +
                    'v' + (yNet - yFromX) +
                    'h' + finalX;
            }
        } else {
            textLinePath +=
                'V' + (pt.yLabelMid + pt.labelExtraY) +
                'h' + finalX;
        }

        Lib.ensureSingle(sliceTop, 'path', 'textline')
            .call(Color.stroke, trace.outsidetextfont.color)
            .attr({
                'stroke-width': Math.min(2, trace.outsidetextfont.size / 8),
                d: textLinePath,
                fill: 'none'
            });
    });
}

function attachFxHandlers(sliceTop, gd, cd) {
    var cd0 = cd[0];
    var trace = cd0.trace;
    var cx = cd0.cx;
    var cy = cd0.cy;

    // hover state vars
    // have we drawn a hover label, so it should be cleared later
    if(!('_hasHoverLabel' in trace)) trace._hasHoverLabel = false;
    // have we emitted a hover event, so later an unhover event should be emitted
    // note that click events do not depend on this - you can still get them
    // with hovermode: false or if you were earlier dragging, then clicked
    // in the same slice that you moused up in
    if(!('_hasHoverEvent' in trace)) trace._hasHoverEvent = false;

    sliceTop.on('mouseover', function(pt) {
        // in case fullLayout or fullData has changed without a replot
        var fullLayout2 = gd._fullLayout;
        var trace2 = gd._fullData[trace.index];

        if(gd._dragging || fullLayout2.hovermode === false) return;

        var hoverinfo = trace2.hoverinfo;
        if(Array.isArray(hoverinfo)) {
            // super hacky: we need to pull out the *first* hoverinfo from
            // pt.pts, then put it back into an array in a dummy trace
            // and call castHoverinfo on that.
            // TODO: do we want to have Fx.castHoverinfo somehow handle this?
            // it already takes an array for index, for 2D, so this seems tricky.
            hoverinfo = Fx.castHoverinfo({
                hoverinfo: [helpers.castOption(hoverinfo, pt.pts)],
                _module: trace._module
            }, fullLayout2, 0);
        }

        if(hoverinfo === 'all') hoverinfo = 'label+text+value+percent+name';

        // in case we dragged over the pie from another subplot,
        // or if hover is turned off
        if(trace2.hovertemplate || (hoverinfo !== 'none' && hoverinfo !== 'skip' && hoverinfo)) {
            var rInscribed = pt.rInscribed || 0;
            var hoverCenterX = cx + pt.pxmid[0] * (1 - rInscribed);
            var hoverCenterY = cy + pt.pxmid[1] * (1 - rInscribed);
            var separators = fullLayout2.separators;
            var text = [];

            if(hoverinfo && hoverinfo.indexOf('label') !== -1) text.push(pt.label);
            pt.text = helpers.castOption(trace2.hovertext || trace2.text, pt.pts);
            if(hoverinfo && hoverinfo.indexOf('text') !== -1) {
                var tx = pt.text;
                if(Lib.isValidTextValue(tx)) text.push(tx);
            }
            pt.value = pt.v;
            pt.valueLabel = helpers.formatPieValue(pt.v, separators);
            if(hoverinfo && hoverinfo.indexOf('value') !== -1) text.push(pt.valueLabel);
            pt.percent = pt.v / cd0.vTotal;
            pt.percentLabel = helpers.formatPiePercent(pt.percent, separators);
            if(hoverinfo && hoverinfo.indexOf('percent') !== -1) text.push(pt.percentLabel);

            var hoverLabel = trace2.hoverlabel;
            var hoverFont = hoverLabel.font;

            Fx.loneHover({
                trace: trace,
                x0: hoverCenterX - rInscribed * cd0.r,
                x1: hoverCenterX + rInscribed * cd0.r,
                y: hoverCenterY,
                text: text.join('<br>'),
                name: (trace2.hovertemplate || hoverinfo.indexOf('name') !== -1) ? trace2.name : undefined,
                idealAlign: pt.pxmid[0] < 0 ? 'left' : 'right',
                color: helpers.castOption(hoverLabel.bgcolor, pt.pts) || pt.color,
                borderColor: helpers.castOption(hoverLabel.bordercolor, pt.pts),
                fontFamily: helpers.castOption(hoverFont.family, pt.pts),
                fontSize: helpers.castOption(hoverFont.size, pt.pts),
                fontColor: helpers.castOption(hoverFont.color, pt.pts),
                nameLength: helpers.castOption(hoverLabel.namelength, pt.pts),
                textAlign: helpers.castOption(hoverLabel.align, pt.pts),
                hovertemplate: helpers.castOption(trace2.hovertemplate, pt.pts),
                hovertemplateLabels: pt,
                eventData: [eventData(pt, trace2)]
            }, {
                container: fullLayout2._hoverlayer.node(),
                outerContainer: fullLayout2._paper.node(),
                gd: gd
            });

            trace._hasHoverLabel = true;
        }

        trace._hasHoverEvent = true;
        gd.emit('plotly_hover', {
            points: [eventData(pt, trace2)],
            event: d3.event
        });
    });

    sliceTop.on('mouseout', function(evt) {
        var fullLayout2 = gd._fullLayout;
        var trace2 = gd._fullData[trace.index];
        var pt = d3.select(this).datum();

        if(trace._hasHoverEvent) {
            evt.originalEvent = d3.event;
            gd.emit('plotly_unhover', {
                points: [eventData(pt, trace2)],
                event: d3.event
            });
            trace._hasHoverEvent = false;
        }

        if(trace._hasHoverLabel) {
            Fx.loneUnhover(fullLayout2._hoverlayer.node());
            trace._hasHoverLabel = false;
        }
    });

    sliceTop.on('click', function(pt) {
        // TODO: this does not support right-click. If we want to support it, we
        // would likely need to change pie to use dragElement instead of straight
        // mapbox event binding. Or perhaps better, make a simple wrapper with the
        // right mousedown, mousemove, and mouseup handlers just for a left/right click
        // mapbox would use this too.
        var fullLayout2 = gd._fullLayout;
        var trace2 = gd._fullData[trace.index];

        if(gd._dragging || fullLayout2.hovermode === false) return;

        gd._hoverdata = [eventData(pt, trace2)];
        Fx.click(gd, d3.event);
    });
}

function determineOutsideTextFont(trace, pt, layoutFont) {
    var color =
        helpers.castOption(trace.outsidetextfont.color, pt.pts) ||
        helpers.castOption(trace.textfont.color, pt.pts) ||
        layoutFont.color;

    var family =
        helpers.castOption(trace.outsidetextfont.family, pt.pts) ||
        helpers.castOption(trace.textfont.family, pt.pts) ||
        layoutFont.family;

    var size =
        helpers.castOption(trace.outsidetextfont.size, pt.pts) ||
        helpers.castOption(trace.textfont.size, pt.pts) ||
        layoutFont.size;

    return {
        color: color,
        family: family,
        size: size
    };
}

function determineInsideTextFont(trace, pt, layoutFont) {
    var customColor = helpers.castOption(trace.insidetextfont.color, pt.pts);
    if(!customColor && trace._input.textfont) {
        // Why not simply using trace.textfont? Because if not set, it
        // defaults to layout.font which has a default color. But if
        // textfont.color and insidetextfont.color don't supply a value,
        // a contrasting color shall be used.
        customColor = helpers.castOption(trace._input.textfont.color, pt.pts);
    }

    var family =
        helpers.castOption(trace.insidetextfont.family, pt.pts) ||
        helpers.castOption(trace.textfont.family, pt.pts) ||
        layoutFont.family;

    var size =
        helpers.castOption(trace.insidetextfont.size, pt.pts) ||
        helpers.castOption(trace.textfont.size, pt.pts) ||
        layoutFont.size;

    return {
        color: customColor || Color.contrast(pt.color),
        family: family,
        size: size
    };
}

function prerenderTitles(cdModule, gd) {
    var cd0, trace;

    // Determine the width and height of the title for each pie.
    for(var i = 0; i < cdModule.length; i++) {
        cd0 = cdModule[i][0];
        trace = cd0.trace;

        if(trace.title.text) {
            var txt = trace.title.text;
            if(trace._meta) {
                txt = Lib.templateString(txt, trace._meta);
            }

            var dummyTitle = Drawing.tester.append('text')
              .attr('data-notex', 1)
              .text(txt)
              .call(Drawing.font, trace.title.font)
              .call(svgTextUtils.convertToTspans, gd);
            var bBox = Drawing.bBox(dummyTitle.node(), true);
            cd0.titleBox = {
                width: bBox.width,
                height: bBox.height,
            };
            dummyTitle.remove();
        }
    }
}

function transformInsideText(textBB, pt, cd0) {
    var r = cd0.r || pt.rpx1;
    var rInscribed = pt.rInscribed;

    var isEmpty = pt.startangle === pt.stopangle;
    if(isEmpty) {
        return {
            rCenter: 1 - rInscribed,
            scale: 0,
            rotate: 0,
            textPosAngle: 0
        };
    }

    var ring = pt.ring;
    var isCircle = (ring === 1) && (Math.abs(pt.startangle - pt.stopangle) === Math.PI * 2);

    var halfAngle = pt.halfangle;
    var midAngle = pt.midangle;

    var orientation = cd0.trace.insidetextorientation;
    var isHorizontal = orientation === 'horizontal';
    var isTangential = orientation === 'tangential';
    var isRadial = orientation === 'radial';
    var isAuto = orientation === 'auto';

    var allTransforms = [];
    var newT;

    if(!isAuto) {
        // max size if text is placed (horizontally) at the top or bottom of the arc

        var considerCrossing = function(angle, key) {
            if(isCrossing(pt, angle)) {
                var dStart = Math.abs(angle - pt.startangle);
                var dStop = Math.abs(angle - pt.stopangle);

                var closestEdge = dStart < dStop ? dStart : dStop;

                if(key === 'tan') {
                    newT = calcTanTransform(textBB, r, ring, closestEdge, 0);
                } else { // case of 'rad'
                    newT = calcRadTransform(textBB, r, ring, closestEdge, Math.PI / 2);
                }
                newT.textPosAngle = angle;

                allTransforms.push(newT);
            }
        };

        // to cover all cases with trace.rotation added
        var i;
        if(isHorizontal || isTangential) {
            // top
            for(i = 4; i >= -4; i -= 2) considerCrossing(Math.PI * i, 'tan');
            // bottom
            for(i = 4; i >= -4; i -= 2) considerCrossing(Math.PI * (i + 1), 'tan');
        }
        if(isHorizontal || isRadial) {
            // left
            for(i = 4; i >= -4; i -= 2) considerCrossing(Math.PI * (i + 1.5), 'rad');
            // right
            for(i = 4; i >= -4; i -= 2) considerCrossing(Math.PI * (i + 0.5), 'rad');
        }
    }

    if(isCircle || isAuto || isHorizontal) {
        // max size text can be inserted inside without rotating it
        // this inscribes the text rectangle in a circle, which is then inscribed
        // in the slice, so it will be an underestimate, which some day we may want
        // to improve so this case can get more use
        var textDiameter = Math.sqrt(textBB.width * textBB.width + textBB.height * textBB.height);

        newT = {
            scale: rInscribed * r * 2 / textDiameter,

            // and the center position and rotation in this case
            rCenter: 1 - rInscribed,
            rotate: 0
        };

        newT.textPosAngle = (pt.startangle + pt.stopangle) / 2;
        if(newT.scale >= 1) return newT;

        allTransforms.push(newT);
    }

    if(isAuto || isRadial) {
        newT = calcRadTransform(textBB, r, ring, halfAngle, midAngle);
        newT.textPosAngle = (pt.startangle + pt.stopangle) / 2;
        allTransforms.push(newT);
    }

    if(isAuto || isTangential) {
        newT = calcTanTransform(textBB, r, ring, halfAngle, midAngle);
        newT.textPosAngle = (pt.startangle + pt.stopangle) / 2;
        allTransforms.push(newT);
    }

    var id = 0;
    var maxScale = 0;
    for(var k = 0; k < allTransforms.length; k++) {
        var s = allTransforms[k].scale;
        if(maxScale < s) {
            maxScale = s;
            id = k;
        }

        if(!isAuto && maxScale >= 1) {
            // respect test order for non-auto options
            break;
        }
    }
    return allTransforms[id];
}

function isCrossing(pt, angle) {
    var start = pt.startangle;
    var stop = pt.stopangle;
    return (
        (start > angle && angle > stop) ||
        (start < angle && angle < stop)
    );
}

function calcRadTransform(textBB, r, ring, halfAngle, midAngle) {
    r = Math.max(0, r - 2 * TEXTPAD);

    // max size if text is rotated radially
    var a = textBB.width / textBB.height;
    var s = calcMaxHalfSize(a, halfAngle, r, ring);
    return {
        scale: s * 2 / textBB.height,
        rCenter: calcRCenter(a, s / r),
        rotate: calcRotate(midAngle)
    };
}

function calcTanTransform(textBB, r, ring, halfAngle, midAngle) {
    r = Math.max(0, r - 2 * TEXTPAD);

    // max size if text is rotated tangentially
    var a = textBB.height / textBB.width;
    var s = calcMaxHalfSize(a, halfAngle, r, ring);
    return {
        scale: s * 2 / textBB.width,
        rCenter: calcRCenter(a, s / r),
        rotate: calcRotate(midAngle + Math.PI / 2)
    };
}

function calcRCenter(a, b) {
    return Math.cos(b) - a * b;
}

function calcRotate(t) {
    return (180 / Math.PI * t + 720) % 180 - 90;
}

function calcMaxHalfSize(a, halfAngle, r, ring) {
    var q = a + 1 / (2 * Math.tan(halfAngle));
    return r * Math.min(
        1 / (Math.sqrt(q * q + 0.5) + q),
        ring / (Math.sqrt(a * a + ring / 2) + a)
    );
}

function getInscribedRadiusFraction(pt, cd0) {
    if(pt.v === cd0.vTotal && !cd0.trace.hole) return 1;// special case of 100% with no hole

    return Math.min(1 / (1 + 1 / Math.sin(pt.halfangle)), pt.ring / 2);
}

function transformOutsideText(textBB, pt) {
    var x = pt.pxmid[0];
    var y = pt.pxmid[1];
    var dx = textBB.width / 2;
    var dy = textBB.height / 2;

    if(x < 0) dx *= -1;
    if(y < 0) dy *= -1;

    return {
        scale: 1,
        rCenter: 1,
        rotate: 0,
        x: dx + Math.abs(dy) * (dx > 0 ? 1 : -1) / 2,
        y: dy / (1 + x * x / (y * y)),
        outside: true
    };
}

function positionTitleInside(cd0) {
    var textDiameter =
        Math.sqrt(cd0.titleBox.width * cd0.titleBox.width + cd0.titleBox.height * cd0.titleBox.height);
    return {
        x: cd0.cx,
        y: cd0.cy,
        scale: cd0.trace.hole * cd0.r * 2 / textDiameter,
        tx: 0,
        ty: - cd0.titleBox.height / 2 + cd0.trace.title.font.size
    };
}

function positionTitleOutside(cd0, plotSize) {
    var scaleX = 1;
    var scaleY = 1;
    var maxPull;

    var trace = cd0.trace;
    // position of the baseline point of the text box in the plot, before scaling.
    // we anchored the text in the middle, so the baseline is on the bottom middle
    // of the first line of text.
    var topMiddle = {
        x: cd0.cx,
        y: cd0.cy
    };
    // relative translation of the text box after scaling
    var translate = {
        tx: 0,
        ty: 0
    };

    // we reason below as if the baseline is the top middle point of the text box.
    // so we must add the font size to approximate the y-coord. of the top.
    // note that this correction must happen after scaling.
    translate.ty += trace.title.font.size;
    maxPull = getMaxPull(trace);

    if(trace.title.position.indexOf('top') !== -1) {
        topMiddle.y -= (1 + maxPull) * cd0.r;
        translate.ty -= cd0.titleBox.height;
    } else if(trace.title.position.indexOf('bottom') !== -1) {
        topMiddle.y += (1 + maxPull) * cd0.r;
    }

    var rx = applyAspectRatio(cd0.r, cd0.trace.aspectratio);

    var maxWidth = plotSize.w * (trace.domain.x[1] - trace.domain.x[0]) / 2;
    if(trace.title.position.indexOf('left') !== -1) {
        // we start the text at the left edge of the pie
        maxWidth = maxWidth + rx;
        topMiddle.x -= (1 + maxPull) * rx;
        translate.tx += cd0.titleBox.width / 2;
    } else if(trace.title.position.indexOf('center') !== -1) {
        maxWidth *= 2;
    } else if(trace.title.position.indexOf('right') !== -1) {
        maxWidth = maxWidth + rx;
        topMiddle.x += (1 + maxPull) * rx;
        translate.tx -= cd0.titleBox.width / 2;
    }
    scaleX = maxWidth / cd0.titleBox.width;
    scaleY = getTitleSpace(cd0, plotSize) / cd0.titleBox.height;
    return {
        x: topMiddle.x,
        y: topMiddle.y,
        scale: Math.min(scaleX, scaleY),
        tx: translate.tx,
        ty: translate.ty
    };
}

function applyAspectRatio(x, aspectratio) {
    return x / ((aspectratio === undefined) ? 1 : aspectratio);
}

function getTitleSpace(cd0, plotSize) {
    var trace = cd0.trace;
    var pieBoxHeight = plotSize.h * (trace.domain.y[1] - trace.domain.y[0]);
    // use at most half of the plot for the title
    return Math.min(cd0.titleBox.height, pieBoxHeight / 2);
}

function getMaxPull(trace) {
    var maxPull = trace.pull;
    if(!maxPull) return 0;

    var j;
    if(Array.isArray(maxPull)) {
        maxPull = 0;
        for(j = 0; j < trace.pull.length; j++) {
            if(trace.pull[j] > maxPull) maxPull = trace.pull[j];
        }
    }
    return maxPull;
}

function scootLabels(quadrants, trace) {
    var xHalf, yHalf, equatorFirst, farthestX, farthestY,
        xDiffSign, yDiffSign, thisQuad, oppositeQuad,
        wholeSide, i, thisQuadOutside, firstOppositeOutsidePt;

    function topFirst(a, b) { return a.pxmid[1] - b.pxmid[1]; }
    function bottomFirst(a, b) { return b.pxmid[1] - a.pxmid[1]; }

    function scootOneLabel(thisPt, prevPt) {
        if(!prevPt) prevPt = {};

        var prevOuterY = prevPt.labelExtraY + (yHalf ? prevPt.yLabelMax : prevPt.yLabelMin);
        var thisInnerY = yHalf ? thisPt.yLabelMin : thisPt.yLabelMax;
        var thisOuterY = yHalf ? thisPt.yLabelMax : thisPt.yLabelMin;
        var thisSliceOuterY = thisPt.cyFinal + farthestY(thisPt.px0[1], thisPt.px1[1]);
        var newExtraY = prevOuterY - thisInnerY;

        var xBuffer, i, otherPt, otherOuterY, otherOuterX, newExtraX;

        // make sure this label doesn't overlap other labels
        // this *only* has us move these labels vertically
        if(newExtraY * yDiffSign > 0) thisPt.labelExtraY = newExtraY;

        // make sure this label doesn't overlap any slices
        if(!Array.isArray(trace.pull)) return; // this can only happen with array pulls

        for(i = 0; i < wholeSide.length; i++) {
            otherPt = wholeSide[i];

            // overlap can only happen if the other point is pulled more than this one
            if(otherPt === thisPt || (
                (helpers.castOption(trace.pull, thisPt.pts) || 0) >=
                (helpers.castOption(trace.pull, otherPt.pts) || 0))
            ) {
                continue;
            }

            if((thisPt.pxmid[1] - otherPt.pxmid[1]) * yDiffSign > 0) {
                // closer to the equator - by construction all of these happen first
                // move the text vertically to get away from these slices
                otherOuterY = otherPt.cyFinal + farthestY(otherPt.px0[1], otherPt.px1[1]);
                newExtraY = otherOuterY - thisInnerY - thisPt.labelExtraY;

                if(newExtraY * yDiffSign > 0) thisPt.labelExtraY += newExtraY;
            } else if((thisOuterY + thisPt.labelExtraY - thisSliceOuterY) * yDiffSign > 0) {
                // farther from the equator - happens after we've done all the
                // vertical moving we're going to do
                // move horizontally to get away from these more polar slices

                // if we're moving horz. based on a slice that's several slices away from this one
                // then we need some extra space for the lines to labels between them
                xBuffer = 3 * xDiffSign * Math.abs(i - wholeSide.indexOf(thisPt));

                otherOuterX = otherPt.cxFinal + farthestX(otherPt.px0[0], otherPt.px1[0]);
                newExtraX = otherOuterX + xBuffer - (thisPt.cxFinal + thisPt.pxmid[0]) - thisPt.labelExtraX;

                if(newExtraX * xDiffSign > 0) thisPt.labelExtraX += newExtraX;
            }
        }
    }

    for(yHalf = 0; yHalf < 2; yHalf++) {
        equatorFirst = yHalf ? topFirst : bottomFirst;
        farthestY = yHalf ? Math.max : Math.min;
        yDiffSign = yHalf ? 1 : -1;

        for(xHalf = 0; xHalf < 2; xHalf++) {
            farthestX = xHalf ? Math.max : Math.min;
            xDiffSign = xHalf ? 1 : -1;

            // first sort the array
            // note this is a copy of cd, so cd itself doesn't get sorted
            // but we can still modify points in place.
            thisQuad = quadrants[yHalf][xHalf];
            thisQuad.sort(equatorFirst);

            oppositeQuad = quadrants[1 - yHalf][xHalf];
            wholeSide = oppositeQuad.concat(thisQuad);

            thisQuadOutside = [];
            for(i = 0; i < thisQuad.length; i++) {
                if(thisQuad[i].yLabelMid !== undefined) thisQuadOutside.push(thisQuad[i]);
            }

            firstOppositeOutsidePt = false;
            for(i = 0; yHalf && i < oppositeQuad.length; i++) {
                if(oppositeQuad[i].yLabelMid !== undefined) {
                    firstOppositeOutsidePt = oppositeQuad[i];
                    break;
                }
            }

            // each needs to avoid the previous
            for(i = 0; i < thisQuadOutside.length; i++) {
                var prevPt = i && thisQuadOutside[i - 1];
                // bottom half needs to avoid the first label of the top half
                // top half we still need to call scootOneLabel on the first slice
                // so we can avoid other slices, but we don't pass a prevPt
                if(firstOppositeOutsidePt && !i) prevPt = firstOppositeOutsidePt;
                scootOneLabel(thisQuadOutside[i], prevPt);
            }
        }
    }
}

function layoutAreas(cdModule, plotSize) {
    var scaleGroups = [];

    // figure out the center and maximum radius
    for(var i = 0; i < cdModule.length; i++) {
        var cd0 = cdModule[i][0];
        var trace = cd0.trace;

        var domain = trace.domain;
        var width = plotSize.w * (domain.x[1] - domain.x[0]);
        var height = plotSize.h * (domain.y[1] - domain.y[0]);
        // leave some space for the title, if it will be displayed outside
        if(trace.title.text && trace.title.position !== 'middle center') {
            height -= getTitleSpace(cd0, plotSize);
        }

        var rx = width / 2;
        var ry = height / 2;
        if(trace.type === 'funnelarea' && !trace.scalegroup) {
            ry /= trace.aspectratio;
        }

        cd0.r = Math.min(rx, ry) / (1 + getMaxPull(trace));

        cd0.cx = plotSize.l + plotSize.w * (trace.domain.x[1] + trace.domain.x[0]) / 2;
        cd0.cy = plotSize.t + plotSize.h * (1 - trace.domain.y[0]) - height / 2;
        if(trace.title.text && trace.title.position.indexOf('bottom') !== -1) {
            cd0.cy -= getTitleSpace(cd0, plotSize);
        }

        if(trace.scalegroup && scaleGroups.indexOf(trace.scalegroup) === -1) {
            scaleGroups.push(trace.scalegroup);
        }
    }

    groupScale(cdModule, scaleGroups);
}

function groupScale(cdModule, scaleGroups) {
    var cd0, i, trace;

    // scale those that are grouped
    for(var k = 0; k < scaleGroups.length; k++) {
        var min = Infinity;
        var g = scaleGroups[k];

        for(i = 0; i < cdModule.length; i++) {
            cd0 = cdModule[i][0];
            trace = cd0.trace;

            if(trace.scalegroup === g) {
                var area;
                if(trace.type === 'pie') {
                    area = cd0.r * cd0.r;
                } else if(trace.type === 'funnelarea') {
                    var rx, ry;

                    if(trace.aspectratio > 1) {
                        rx = cd0.r;
                        ry = rx / trace.aspectratio;
                    } else {
                        ry = cd0.r;
                        rx = ry * trace.aspectratio;
                    }

                    rx *= (1 + trace.baseratio) / 2;

                    area = rx * ry;
                }

                min = Math.min(min, area / cd0.vTotal);
            }
        }

        for(i = 0; i < cdModule.length; i++) {
            cd0 = cdModule[i][0];
            trace = cd0.trace;
            if(trace.scalegroup === g) {
                var v = min * cd0.vTotal;
                if(trace.type === 'funnelarea') {
                    v /= (1 + trace.baseratio) / 2;
                    v /= trace.aspectratio;
                }

                cd0.r = Math.sqrt(v);
            }
        }
    }
}

function setCoords(cd) {
    var cd0 = cd[0];
    var r = cd0.r;
    var trace = cd0.trace;
    var currentAngle = helpers.getRotationAngle(trace.rotation);
    var angleFactor = 2 * Math.PI / cd0.vTotal;
    var firstPt = 'px0';
    var lastPt = 'px1';

    var i, cdi, currentCoords;

    if(trace.direction === 'counterclockwise') {
        for(i = 0; i < cd.length; i++) {
            if(!cd[i].hidden) break; // find the first non-hidden slice
        }
        if(i === cd.length) return; // all slices hidden

        currentAngle += angleFactor * cd[i].v;
        angleFactor *= -1;
        firstPt = 'px1';
        lastPt = 'px0';
    }

    currentCoords = getCoords(r, currentAngle);

    for(i = 0; i < cd.length; i++) {
        cdi = cd[i];
        if(cdi.hidden) continue;

        cdi[firstPt] = currentCoords;

        cdi.startangle = currentAngle;
        currentAngle += angleFactor * cdi.v / 2;
        cdi.pxmid = getCoords(r, currentAngle);
        cdi.midangle = currentAngle;
        currentAngle += angleFactor * cdi.v / 2;
        currentCoords = getCoords(r, currentAngle);
        cdi.stopangle = currentAngle;

        cdi[lastPt] = currentCoords;

        cdi.largeArc = (cdi.v > cd0.vTotal / 2) ? 1 : 0;

        cdi.halfangle = Math.PI * Math.min(cdi.v / cd0.vTotal, 0.5);
        cdi.ring = 1 - trace.hole;
        cdi.rInscribed = getInscribedRadiusFraction(cdi, cd0);
    }
}

function getCoords(r, angle) {
    return [r * Math.sin(angle), -r * Math.cos(angle)];
}

function formatSliceLabel(gd, pt, cd0) {
    var fullLayout = gd._fullLayout;
    var trace = cd0.trace;
    // look for textemplate
    var texttemplate = trace.texttemplate;

    // now insert text
    var textinfo = trace.textinfo;
    if(!texttemplate && textinfo && textinfo !== 'none') {
        var parts = textinfo.split('+');
        var hasFlag = function(flag) { return parts.indexOf(flag) !== -1; };
        var hasLabel = hasFlag('label');
        var hasText = hasFlag('text');
        var hasValue = hasFlag('value');
        var hasPercent = hasFlag('percent');

        var separators = fullLayout.separators;
        var text;

        text = hasLabel ? [pt.label] : [];
        if(hasText) {
            var tx = helpers.getFirstFilled(trace.text, pt.pts);
            if(isValidTextValue(tx)) text.push(tx);
        }
        if(hasValue) text.push(helpers.formatPieValue(pt.v, separators));
        if(hasPercent) text.push(helpers.formatPiePercent(pt.v / cd0.vTotal, separators));
        pt.text = text.join('<br>');
    }

    function makeTemplateVariables(pt) {
        return {
            label: pt.label,
            value: pt.v,
            valueLabel: helpers.formatPieValue(pt.v, fullLayout.separators),
            percent: pt.v / cd0.vTotal,
            percentLabel: helpers.formatPiePercent(pt.v / cd0.vTotal, fullLayout.separators),
            color: pt.color,
            text: pt.text,
            customdata: Lib.castOption(trace, pt.i, 'customdata')
        };
    }

    if(texttemplate) {
        var txt = Lib.castOption(trace, pt.i, 'texttemplate');
        if(!txt) {
            pt.text = '';
        } else {
            var obj = makeTemplateVariables(pt);
            var ptTx = helpers.getFirstFilled(trace.text, pt.pts);
            if(isValidTextValue(ptTx) || ptTx === '') obj.text = ptTx;
            pt.text = Lib.texttemplateString(txt, obj, gd._fullLayout._d3locale, obj, trace._meta || {});
        }
    }
}

function computeTransform(
    transform,  // inout
    textBB      // in
) {
    var a = transform.rotate * Math.PI / 180;
    var cosA = Math.cos(a);
    var sinA = Math.sin(a);
    var midX = (textBB.left + textBB.right) / 2;
    var midY = (textBB.top + textBB.bottom) / 2;
    transform.textX = midX * cosA - midY * sinA;
    transform.textY = midX * sinA + midY * cosA;
    transform.noCenter = true;
}

module.exports = {
    plot: plot,
    formatSliceLabel: formatSliceLabel,
    transformInsideText: transformInsideText,
    determineInsideTextFont: determineInsideTextFont,
    positionTitleOutside: positionTitleOutside,
    prerenderTitles: prerenderTitles,
    layoutAreas: layoutAreas,
    attachFxHandlers: attachFxHandlers,
    computeTransform: computeTransform
};
