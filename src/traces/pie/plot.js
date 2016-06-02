/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');

var Fx = require('../../plots/cartesian/graph_interact');
var Color = require('../../components/color');
var Drawing = require('../../components/drawing');
var svgTextUtils = require('../../lib/svg_text_utils');

var helpers = require('./helpers');

module.exports = function plot(gd, cdpie) {
    var fullLayout = gd._fullLayout;

    scalePies(cdpie, fullLayout._size);

    var pieGroups = fullLayout._pielayer.selectAll('g.trace').data(cdpie);

    pieGroups.enter().append('g')
        .attr({
            'stroke-linejoin': 'round', // TODO: miter might look better but can sometimes cause problems
                                        // maybe miter with a small-ish stroke-miterlimit?
            'class': 'trace'
        });
    pieGroups.exit().remove();
    pieGroups.order();

    pieGroups.each(function(cd) {
        var pieGroup = d3.select(this),
            cd0 = cd[0],
            trace = cd0.trace,
            tiltRads = 0, //trace.tilt * Math.PI / 180,
            depthLength = (trace.depth||0) * cd0.r * Math.sin(tiltRads) / 2,
            tiltAxis = trace.tiltaxis || 0,
            tiltAxisRads = tiltAxis * Math.PI / 180,
            depthVector = [
                depthLength * Math.sin(tiltAxisRads),
                depthLength * Math.cos(tiltAxisRads)
            ],
            rSmall = cd0.r * Math.cos(tiltRads);

        var pieParts = pieGroup.selectAll('g.part')
            .data(trace.tilt ? ['top', 'sides'] : ['top']);

        pieParts.enter().append('g').attr('class', function(d) {
            return d + ' part';
        });
        pieParts.exit().remove();
        pieParts.order();

        setCoords(cd);

        pieGroup.selectAll('.top').each(function() {
            var slices = d3.select(this).selectAll('g.slice').data(cd);

            slices.enter().append('g')
                .classed('slice', true);
            slices.exit().remove();

            var quadrants = [
                    [[], []], // y<0: x<0, x>=0
                    [[], []] // y>=0: x<0, x>=0
                ],
                hasOutsideText = false;

            slices.each(function(pt) {
                if(pt.hidden) {
                    d3.select(this).selectAll('path,g').remove();
                    return;
                }

                quadrants[pt.pxmid[1] < 0 ? 0 : 1][pt.pxmid[0] < 0 ? 0 : 1].push(pt);

                var cx = cd0.cx + depthVector[0],
                    cy = cd0.cy + depthVector[1],
                    sliceTop = d3.select(this),
                    slicePath = sliceTop.selectAll('path.surface').data([pt]),
                    hasHoverData = false;

                function handleMouseOver(evt) {
                    // in case fullLayout or fullData has changed without a replot
                    var fullLayout2 = gd._fullLayout,
                        trace2 = gd._fullData[trace.index],
                        hoverinfo = trace2.hoverinfo;

                    if(hoverinfo === 'all') hoverinfo = 'label+text+value+percent+name';

                    // in case we dragged over the pie from another subplot,
                    // or if hover is turned off
                    if(gd._dragging || fullLayout2.hovermode === false ||
                            hoverinfo === 'none' || !hoverinfo) {
                        return;
                    }

                    var rInscribed = getInscribedRadiusFraction(pt, cd0),
                        hoverCenterX = cx + pt.pxmid[0] * (1 - rInscribed),
                        hoverCenterY = cy + pt.pxmid[1] * (1 - rInscribed),
                        separators = fullLayout.separators,
                        thisText = [];

                    if(hoverinfo.indexOf('label') !== -1) thisText.push(pt.label);
                    if(trace2.text && trace2.text[pt.i] && hoverinfo.indexOf('text') !== -1) {
                        thisText.push(trace2.text[pt.i]);
                    }
                    if(hoverinfo.indexOf('value') !== -1) thisText.push(helpers.formatPieValue(pt.v, separators));
                    if(hoverinfo.indexOf('percent') !== -1) thisText.push(helpers.formatPiePercent(pt.v / cd0.vTotal, separators));

                    Fx.loneHover({
                        x0: hoverCenterX - rInscribed * cd0.r,
                        x1: hoverCenterX + rInscribed * cd0.r,
                        y: hoverCenterY,
                        text: thisText.join('<br>'),
                        name: hoverinfo.indexOf('name') !== -1 ? trace2.name : undefined,
                        color: pt.color,
                        idealAlign: pt.pxmid[0] < 0 ? 'left' : 'right'
                    }, {
                        container: fullLayout2._hoverlayer.node(),
                        outerContainer: fullLayout2._paper.node()
                    });

                    Fx.hover(gd, evt, 'pie');

                    hasHoverData = true;
                }

                function handleMouseOut(evt) {
                    gd.emit('plotly_unhover', {
                        points: [evt]
                    });

                    if(hasHoverData) {
                        Fx.loneUnhover(fullLayout._hoverlayer.node());
                        hasHoverData = false;
                    }
                }

                function handleClick() {
                    gd._hoverdata = [pt];
                    gd._hoverdata.trace = cd.trace;
                    Fx.click(gd, { target: true });
                }

                slicePath.enter().append('path')
                    .classed('surface', true)
                    .style({'pointer-events': 'all'});

                sliceTop.select('path.textline').remove();

                sliceTop
                    .on('mouseover', handleMouseOver)
                    .on('mouseout', handleMouseOut)
                    .on('click', handleClick);

                if(trace.pull) {
                    var pull = +(Array.isArray(trace.pull) ? trace.pull[pt.i] : trace.pull) || 0;
                    if(pull > 0) {
                        cx += pull * pt.pxmid[0];
                        cy += pull * pt.pxmid[1];
                    }
                }

                pt.cxFinal = cx;
                pt.cyFinal = cy;

                function arc(start, finish, cw, scale) {
                    return 'a' + (scale * cd0.r) + ',' + (scale * rSmall) + ' ' + tiltAxis + ' ' +
                        pt.largeArc + (cw ? ' 1 ' : ' 0 ') +
                        (scale * (finish[0] - start[0])) + ',' + (scale * (finish[1] - start[1]));
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
                    }
                    else slicePath.attr('d', outerCircle);
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
                var textPosition = Array.isArray(trace.textposition) ?
                        trace.textposition[pt.i] : trace.textposition,
                    sliceTextGroup = sliceTop.selectAll('g.slicetext')
                    .data(pt.text && (textPosition !== 'none') ? [0] : []);

                sliceTextGroup.enter().append('g')
                    .classed('slicetext', true);
                sliceTextGroup.exit().remove();

                sliceTextGroup.each(function() {
                    var sliceText = d3.select(this).selectAll('text').data([0]);

                    sliceText.enter().append('text')
                        // prohibit tex interpretation until we can handle
                        // tex and regular text together
                        .attr('data-notex', 1);
                    sliceText.exit().remove();

                    sliceText.text(pt.text)
                        .attr({
                            'class': 'slicetext',
                            transform: '',
                            'data-bb': '',
                            'text-anchor': 'middle',
                            x: 0,
                            y: 0
                        })
                        .call(Drawing.font, textPosition === 'outside' ?
                            trace.outsidetextfont : trace.insidetextfont)
                        .call(svgTextUtils.convertToTspans);
                    sliceText.selectAll('tspan.line').attr({x: 0, y: 0});

                    // position the text relative to the slice
                    // TODO: so far this only accounts for flat
                    var textBB = Drawing.bBox(sliceText.node()),
                        transform;

                    if(textPosition === 'outside') {
                        transform = transformOutsideText(textBB, pt);
                    } else {
                        transform = transformInsideText(textBB, pt, cd0);
                        if(textPosition === 'auto' && transform.scale < 1) {
                            sliceText.call(Drawing.font, trace.outsidetextfont);
                            if(trace.outsidetextfont.family !== trace.insidetextfont.family ||
                                    trace.outsidetextfont.size !== trace.insidetextfont.size) {
                                sliceText.attr({'data-bb': ''});
                                textBB = Drawing.bBox(sliceText.node());
                            }
                            transform = transformOutsideText(textBB, pt);
                        }
                    }

                    var translateX = cx + pt.pxmid[0] * transform.rCenter + (transform.x || 0),
                        translateY = cy + pt.pxmid[1] * transform.rCenter + (transform.y || 0);

                    // save some stuff to use later ensure no labels overlap
                    if(transform.outside) {
                        pt.yLabelMin = translateY - textBB.height / 2;
                        pt.yLabelMid = translateY;
                        pt.yLabelMax = translateY + textBB.height / 2;
                        pt.labelExtraX = 0;
                        pt.labelExtraY = 0;
                        hasOutsideText = true;
                    }

                    sliceText.attr('transform',
                        'translate(' + translateX + ',' + translateY + ')' +
                        (transform.scale < 1 ? ('scale(' + transform.scale + ')') : '') +
                        (transform.rotate ? ('rotate(' + transform.rotate + ')') : '') +
                        'translate(' +
                            (-(textBB.left + textBB.right) / 2) + ',' +
                            (-(textBB.top + textBB.bottom) / 2) +
                        ')');
                });
            });

            // now make sure no labels overlap (at least within one pie)
            if(hasOutsideText) scootLabels(quadrants, trace);
            slices.each(function(pt) {
                if(pt.labelExtraX || pt.labelExtraY) {
                    // first move the text to its new location
                    var sliceTop = d3.select(this),
                        sliceText = sliceTop.select('g.slicetext text');

                    sliceText.attr('transform', 'translate(' + pt.labelExtraX + ',' + pt.labelExtraY + ')' +
                        sliceText.attr('transform'));

                    // then add a line to the new location
                    var lineStartX = pt.cxFinal + pt.pxmid[0],
                        lineStartY = pt.cyFinal + pt.pxmid[1],
                        textLinePath = 'M' + lineStartX + ',' + lineStartY,
                        finalX = (pt.yLabelMax - pt.yLabelMin) * (pt.pxmid[0] < 0 ? -1 : 1) / 4;
                    if(pt.labelExtraX) {
                        var yFromX = pt.labelExtraX * pt.pxmid[1] / pt.pxmid[0],
                            yNet = pt.yLabelMid + pt.labelExtraY - (pt.cyFinal + pt.pxmid[1]);

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

                    sliceTop.append('path')
                        .classed('textline', true)
                        .call(Color.stroke, trace.outsidetextfont.color)
                        .attr({
                            'stroke-width': Math.min(2, trace.outsidetextfont.size / 8),
                            d: textLinePath,
                            fill: 'none'
                        });
                }
            });
        });
    });

    // This is for a bug in Chrome (as of 2015-07-22, and does not affect FF)
    // if insidetextfont and outsidetextfont are different sizes, sometimes the size
    // of an "em" gets taken from the wrong element at first so lines are
    // spaced wrong. You just have to tell it to try again later and it gets fixed.
    // I have no idea why we haven't seen this in other contexts. Also, sometimes
    // it gets the initial draw correct but on redraw it gets confused.
    setTimeout(function() {
        pieGroups.selectAll('tspan').each(function() {
            var s = d3.select(this);
            if(s.attr('dy')) s.attr('dy', s.attr('dy'));
        });
    }, 0);
};


function transformInsideText(textBB, pt, cd0) {
    var textDiameter = Math.sqrt(textBB.width * textBB.width + textBB.height * textBB.height),
        textAspect = textBB.width / textBB.height,
        halfAngle = Math.PI * Math.min(pt.v / cd0.vTotal, 0.5),
        ring = 1 - cd0.trace.hole,
        rInscribed = getInscribedRadiusFraction(pt, cd0),

        // max size text can be inserted inside without rotating it
        // this inscribes the text rectangle in a circle, which is then inscribed
        // in the slice, so it will be an underestimate, which some day we may want
        // to improve so this case can get more use
        transform = {
            scale: rInscribed * cd0.r * 2 / textDiameter,

            // and the center position and rotation in this case
            rCenter: 1 - rInscribed,
            rotate: 0
        };

    if(transform.scale >= 1) return transform;

        // max size if text is rotated radially
    var Qr = textAspect + 1 / (2 * Math.tan(halfAngle)),
        maxHalfHeightRotRadial = cd0.r * Math.min(
            1 / (Math.sqrt(Qr * Qr + 0.5) + Qr),
            ring / (Math.sqrt(textAspect * textAspect + ring / 2) + textAspect)
        ),
        radialTransform = {
            scale: maxHalfHeightRotRadial * 2 / textBB.height,
            rCenter: Math.cos(maxHalfHeightRotRadial / cd0.r) -
                maxHalfHeightRotRadial * textAspect / cd0.r,
            rotate: (180 / Math.PI * pt.midangle + 720) % 180 - 90
        },

        // max size if text is rotated tangentially
        aspectInv = 1 / textAspect,
        Qt = aspectInv + 1 / (2 * Math.tan(halfAngle)),
        maxHalfWidthTangential = cd0.r * Math.min(
            1 / (Math.sqrt(Qt * Qt + 0.5) + Qt),
            ring / (Math.sqrt(aspectInv * aspectInv + ring / 2) + aspectInv)
        ),
        tangentialTransform = {
            scale: maxHalfWidthTangential * 2 / textBB.width,
            rCenter: Math.cos(maxHalfWidthTangential / cd0.r) -
                maxHalfWidthTangential / textAspect / cd0.r,
            rotate: (180 / Math.PI * pt.midangle + 810) % 180 - 90
        },
        // if we need a rotated transform, pick the biggest one
        // even if both are bigger than 1
        rotatedTransform = tangentialTransform.scale > radialTransform.scale ?
            tangentialTransform : radialTransform;

    if(transform.scale < 1 && rotatedTransform.scale > transform.scale) return rotatedTransform;
    return transform;
}

function getInscribedRadiusFraction(pt, cd0) {
    if(pt.v === cd0.vTotal && !cd0.trace.hole) return 1;// special case of 100% with no hole

    var halfAngle = Math.PI * Math.min(pt.v / cd0.vTotal, 0.5);
    return Math.min(1 / (1 + 1 / Math.sin(halfAngle)), (1 - cd0.trace.hole) / 2);
}

function transformOutsideText(textBB, pt) {
    var x = pt.pxmid[0],
        y = pt.pxmid[1],
        dx = textBB.width / 2,
        dy = textBB.height / 2;

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

function scootLabels(quadrants, trace) {
    var xHalf,
        yHalf,
        equatorFirst,
        farthestX,
        farthestY,
        xDiffSign,
        yDiffSign,
        thisQuad,
        oppositeQuad,
        wholeSide,
        i,
        thisQuadOutside,
        firstOppositeOutsidePt;

    function topFirst(a, b) { return a.pxmid[1] - b.pxmid[1]; }
    function bottomFirst(a, b) { return b.pxmid[1] - a.pxmid[1]; }

    function scootOneLabel(thisPt, prevPt) {
        if(!prevPt) prevPt = {};

        var prevOuterY = prevPt.labelExtraY + (yHalf ? prevPt.yLabelMax : prevPt.yLabelMin),
            thisInnerY = yHalf ? thisPt.yLabelMin : thisPt.yLabelMax,
            thisOuterY = yHalf ? thisPt.yLabelMax : thisPt.yLabelMin,
            thisSliceOuterY = thisPt.cyFinal + farthestY(thisPt.px0[1], thisPt.px1[1]),
            newExtraY = prevOuterY - thisInnerY,
            xBuffer,
            i,
            otherPt,
            otherOuterY,
            otherOuterX,
            newExtraX;
        // make sure this label doesn't overlap other labels
        // this *only* has us move these labels vertically
        if(newExtraY * yDiffSign > 0) thisPt.labelExtraY = newExtraY;

        // make sure this label doesn't overlap any slices
        if(!Array.isArray(trace.pull)) return; // this can only happen with array pulls

        for(i = 0; i < wholeSide.length; i++) {
            otherPt = wholeSide[i];

            // overlap can only happen if the other point is pulled more than this one
            if(otherPt === thisPt || ((trace.pull[thisPt.i] || 0) >= trace.pull[otherPt.i] || 0)) continue;

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

function scalePies(cdpie, plotSize) {
    var pieBoxWidth,
        pieBoxHeight,
        i,
        j,
        cd0,
        trace,
        tiltAxisRads,
        maxPull,
        scaleGroups = [],
        scaleGroup,
        minPxPerValUnit;

    // first figure out the center and maximum radius for each pie
    for(i = 0; i < cdpie.length; i++) {
        cd0 = cdpie[i][0];
        trace = cd0.trace;
        pieBoxWidth = plotSize.w * (trace.domain.x[1] - trace.domain.x[0]);
        pieBoxHeight = plotSize.h * (trace.domain.y[1] - trace.domain.y[0]);
        tiltAxisRads = trace.tiltaxis * Math.PI / 180;

        maxPull = trace.pull;
        if(Array.isArray(maxPull)) {
            maxPull = 0;
            for(j = 0; j < trace.pull.length; j++) {
                if(trace.pull[j] > maxPull) maxPull = trace.pull[j];
            }
        }

        cd0.r = Math.min(
                pieBoxWidth / maxExtent(trace.tilt, Math.sin(tiltAxisRads), trace.depth),
                pieBoxHeight / maxExtent(trace.tilt, Math.cos(tiltAxisRads), trace.depth)
            ) / (2 + 2 * maxPull);

        cd0.cx = plotSize.l + plotSize.w * (trace.domain.x[1] + trace.domain.x[0]) / 2;
        cd0.cy = plotSize.t + plotSize.h * (2 - trace.domain.y[1] - trace.domain.y[0]) / 2;

        if(trace.scalegroup && scaleGroups.indexOf(trace.scalegroup) === -1) {
            scaleGroups.push(trace.scalegroup);
        }
    }

    // Then scale any pies that are grouped
    for(j = 0; j < scaleGroups.length; j++) {
        minPxPerValUnit = Infinity;
        scaleGroup = scaleGroups[j];

        for(i = 0; i < cdpie.length; i++) {
            cd0 = cdpie[i][0];
            if(cd0.trace.scalegroup === scaleGroup) {
                minPxPerValUnit = Math.min(minPxPerValUnit,
                    cd0.r * cd0.r / cd0.vTotal);
            }
        }

        for(i = 0; i < cdpie.length; i++) {
            cd0 = cdpie[i][0];
            if(cd0.trace.scalegroup === scaleGroup) {
                cd0.r = Math.sqrt(minPxPerValUnit * cd0.vTotal);
            }
        }
    }

}

function setCoords(cd) {
    var cd0 = cd[0],
        trace = cd0.trace,
        tilt = trace.tilt,
        tiltAxisRads,
        tiltAxisSin,
        tiltAxisCos,
        tiltRads,
        crossTilt,
        inPlane,
        currentAngle = trace.rotation * Math.PI / 180,
        angleFactor = 2 * Math.PI / cd0.vTotal,
        firstPt = 'px0',
        lastPt = 'px1',
        i,
        cdi,
        currentCoords;

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

    if(tilt) {
        tiltRads = tilt * Math.PI / 180;
        tiltAxisRads = trace.tiltaxis * Math.PI / 180;
        crossTilt = Math.sin(tiltAxisRads) * Math.cos(tiltAxisRads);
        inPlane = 1 - Math.cos(tiltRads);
        tiltAxisSin = Math.sin(tiltAxisRads);
        tiltAxisCos = Math.cos(tiltAxisRads);
    }

    function getCoords(angle) {
        var xFlat = cd0.r * Math.sin(angle),
            yFlat = -cd0.r * Math.cos(angle);

        if(!tilt) return [xFlat, yFlat];

        return [
            xFlat * (1 - inPlane * tiltAxisSin * tiltAxisSin) + yFlat * crossTilt * inPlane,
            xFlat * crossTilt * inPlane + yFlat * (1 - inPlane * tiltAxisCos * tiltAxisCos),
            Math.sin(tiltRads) * (yFlat * tiltAxisCos - xFlat * tiltAxisSin)
        ];
    }

    currentCoords = getCoords(currentAngle);

    for(i = 0; i < cd.length; i++) {
        cdi = cd[i];
        if(cdi.hidden) continue;

        cdi[firstPt] = currentCoords;

        currentAngle += angleFactor * cdi.v / 2;
        cdi.pxmid = getCoords(currentAngle);
        cdi.midangle = currentAngle;

        currentAngle += angleFactor * cdi.v / 2;
        currentCoords = getCoords(currentAngle);

        cdi[lastPt] = currentCoords;

        cdi.largeArc = (cdi.v > cd0.vTotal / 2) ? 1 : 0;
    }
}

function maxExtent(tilt, tiltAxisFraction, depth) {
    if(!tilt) return 1;
    var sinTilt = Math.sin(tilt * Math.PI / 180);
    return Math.max(0.01, // don't let it go crazy if you tilt the pie totally on its side
        depth * sinTilt * Math.abs(tiltAxisFraction) +
        2 * Math.sqrt(1 - sinTilt * sinTilt * tiltAxisFraction * tiltAxisFraction));
}
