/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var isNumeric = require('fast-isnumeric');

var Plotly = require('../../plotly');
var Plots = require('../../plots/plots');
var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');
var Color = require('../color');
var Drawing = require('../drawing');
var svgTextUtils = require('../../lib/svg_text_utils');
var setCursor = require('../../lib/setcursor');
var dragElement = require('../dragelement');

var handleAnnotationDefaults = require('./annotation_defaults');
var supplyLayoutDefaults = require('./defaults');
var drawArrowHead = require('./draw_arrow_head');


// Annotations are stored in gd.layout.annotations, an array of objects
// index can point to one item in this array,
//  or non-numeric to simply add a new one
//  or -1 to modify all existing
// opt can be the full options object, or one key (to be set to value)
//  or undefined to simply redraw
// if opt is blank, val can be 'add' or a full options object to add a new
//  annotation at that point in the array, or 'remove' to delete this one

module.exports = {
    draw: draw,
    drawOne: drawOne
};

function draw(gd) {
    var fullLayout = gd._fullLayout;

    fullLayout._infolayer.selectAll('.annotation').remove();

    for(var i = 0; i < fullLayout.annotations.length; i++) {
        if(fullLayout.annotations[i].visible) {
            drawOne(gd, i);
        }
    }

    return Plots.previousPromises(gd);
}

function drawOne(gd, index, opt, value) {
    var layout = gd.layout,
        fullLayout = gd._fullLayout,
        i;

    if(!isNumeric(index) || index === -1) {

        // no index provided - we're operating on ALL annotations
        if(!index && Array.isArray(value)) {
            // a whole annotation array is passed in
            // (as in, redo of delete all)
            layout.annotations = value;
            supplyLayoutDefaults(layout, fullLayout);
            draw(gd);
            return;
        }
        else if(value === 'remove') {
            // delete all
            delete layout.annotations;
            fullLayout.annotations = [];
            draw(gd);
            return;
        }
        else if(opt && value !== 'add') {
            // make the same change to all annotations
            for(i = 0; i < fullLayout.annotations.length; i++) {
                drawOne(gd, i, opt, value);
            }
            return;
        }
        else {
            // add a new empty annotation
            index = fullLayout.annotations.length;
            fullLayout.annotations.push({});
        }
    }

    if(!opt && value) {
        if(value === 'remove') {
            fullLayout._infolayer.selectAll('.annotation[data-index="' + index + '"]')
                .remove();
            fullLayout.annotations.splice(index, 1);
            layout.annotations.splice(index, 1);
            for(i = index; i < fullLayout.annotations.length; i++) {
                fullLayout._infolayer
                    .selectAll('.annotation[data-index="' + (i + 1) + '"]')
                    .attr('data-index', String(i));

                // redraw all annotations past the removed one,
                // so they bind to the right events
                drawOne(gd, i);
            }
            return;
        }
        else if(value === 'add' || Lib.isPlainObject(value)) {
            fullLayout.annotations.splice(index, 0, {});

            var rule = Lib.isPlainObject(value) ?
                    Lib.extendFlat({}, value) :
                    {text: 'New text'};

            if(layout.annotations) {
                layout.annotations.splice(index, 0, rule);
            } else {
                layout.annotations = [rule];
            }

            for(i = fullLayout.annotations.length - 1; i > index; i--) {
                fullLayout._infolayer
                    .selectAll('.annotation[data-index="' + (i - 1) + '"]')
                    .attr('data-index', String(i));
                drawOne(gd, i);
            }
        }
    }

    // remove the existing annotation if there is one
    fullLayout._infolayer.selectAll('.annotation[data-index="' + index + '"]').remove();

    // remember a few things about what was already there,
    var optionsIn = layout.annotations[index],
        oldPrivate = fullLayout.annotations[index];

    // not sure how we're getting here... but C12 is seeing a bug
    // where we fail here when they add/remove annotations
    if(!optionsIn) return;

    // alter the input annotation as requested
    var optionsEdit = {};
    if(typeof opt === 'string' && opt) optionsEdit[opt] = value;
    else if(Lib.isPlainObject(opt)) optionsEdit = opt;

    var optionKeys = Object.keys(optionsEdit);
    for(i = 0; i < optionKeys.length; i++) {
        var k = optionKeys[i];
        Lib.nestedProperty(optionsIn, k).set(optionsEdit[k]);
    }

    // return early in visible: false updates
    if(optionsIn.visible === false) return;

    var gs = fullLayout._size;
    var oldRef = {xref: optionsIn.xref, yref: optionsIn.yref};

    var axLetters = ['x', 'y'];
    for(i = 0; i < 2; i++) {
        var axLetter = axLetters[i];
        // if we don't have an explicit position already,
        // don't set one just because we're changing references
        // or axis type.
        // the defaults will be consistent most of the time anyway,
        // except in log/linear changes
        if(optionsEdit[axLetter] !== undefined ||
                optionsIn[axLetter] === undefined) {
            continue;
        }

        var axOld = Axes.getFromId(gd, Axes.coerceRef(oldRef, {}, gd, axLetter, '', 'paper')),
            axNew = Axes.getFromId(gd, Axes.coerceRef(optionsIn, {}, gd, axLetter, '', 'paper')),
            position = optionsIn[axLetter],
            axTypeOld = oldPrivate['_' + axLetter + 'type'];

        if(optionsEdit[axLetter + 'ref'] !== undefined) {

            // TODO: include ax / ay / axref / ayref here if not 'pixel'
            // or even better, move all of this machinery out of here and into
            // streambed as extra attributes to a regular relayout call
            // we should do this after v2.0 when it can work equivalently for
            // annotations, shapes, and images.

            var autoAnchor = optionsIn[axLetter + 'anchor'] === 'auto',
                plotSize = (axLetter === 'x' ? gs.w : gs.h),
                halfSizeFrac = (oldPrivate['_' + axLetter + 'size'] || 0) /
                    (2 * plotSize);
            if(axOld && axNew) { // data -> different data
                // go to the same fraction of the axis length
                // whether or not these axes share a domain

                position = axNew.fraction2r(axOld.r2fraction(position));
            }
            else if(axOld) { // data -> paper
                // first convert to fraction of the axis
                position = axOld.r2fraction(position);

                // next scale the axis to the whole plot
                position = axOld.domain[0] +
                    position * (axOld.domain[1] - axOld.domain[0]);

                // finally see if we need to adjust auto alignment
                // because auto always means middle / center alignment for data,
                // but it changes for page alignment based on the closest side
                if(autoAnchor) {
                    var posPlus = position + halfSizeFrac,
                        posMinus = position - halfSizeFrac;
                    if(position + posMinus < 2 / 3) position = posMinus;
                    else if(position + posPlus > 4 / 3) position = posPlus;
                }
            }
            else if(axNew) { // paper -> data
                // first see if we need to adjust auto alignment
                if(autoAnchor) {
                    if(position < 1 / 3) position += halfSizeFrac;
                    else if(position > 2 / 3) position -= halfSizeFrac;
                }

                // next convert to fraction of the axis
                position = (position - axNew.domain[0]) /
                    (axNew.domain[1] - axNew.domain[0]);

                // finally convert to data coordinates
                position = axNew.fraction2r(position);
            }
        }

        if(axNew && axNew === axOld && axTypeOld) {
            if(axTypeOld === 'log' && axNew.type !== 'log') {
                position = Math.pow(10, position);
            }
            else if(axTypeOld !== 'log' && axNew.type === 'log') {
                position = (position > 0) ?
                    Math.log(position) / Math.LN10 : undefined;
            }
        }

        optionsIn[axLetter] = position;
    }

    var options = {};
    handleAnnotationDefaults(optionsIn, options, fullLayout);
    fullLayout.annotations[index] = options;

    var xa = Axes.getFromId(gd, options.xref),
        ya = Axes.getFromId(gd, options.yref),

        // calculated pixel positions
        // x & y each will get text, head, and tail as appropriate
        annPosPx = {x: {}, y: {}},
        textangle = +options.textangle || 0;

    // create the components
    // made a single group to contain all, so opacity can work right
    // with border/arrow together this could handle a whole bunch of
    // cleanup at this point, but works for now
    var annGroup = fullLayout._infolayer.append('g')
        .classed('annotation', true)
        .attr('data-index', String(index))
        .style('opacity', options.opacity)
        .on('click', function() {
            gd._dragging = false;
            gd.emit('plotly_clickannotation', {
                index: index,
                annotation: optionsIn,
                fullAnnotation: options
            });
        });

    // another group for text+background so that they can rotate together
    var annTextGroup = annGroup.append('g')
        .classed('annotation-text-g', true)
        .attr('data-index', String(index));

    var annTextGroupInner = annTextGroup.append('g');

    var borderwidth = options.borderwidth,
        borderpad = options.borderpad,
        borderfull = borderwidth + borderpad;

    var annTextBG = annTextGroupInner.append('rect')
        .attr('class', 'bg')
        .style('stroke-width', borderwidth + 'px')
        .call(Color.stroke, options.bordercolor)
        .call(Color.fill, options.bgcolor);

    var font = options.font;

    var annText = annTextGroupInner.append('text')
        .classed('annotation', true)
        .attr('data-unformatted', options.text)
        .text(options.text);

    function textLayout(s) {
        s.call(Drawing.font, font)
        .attr({
            'text-anchor': {
                left: 'start',
                right: 'end'
            }[options.align] || 'middle'
        });

        svgTextUtils.convertToTspans(s, drawGraphicalElements);
        return s;
    }

    function drawGraphicalElements() {

        // make sure lines are aligned the way they will be
        // at the end, even if their position changes
        annText.selectAll('tspan.line').attr({y: 0, x: 0});

        var mathjaxGroup = annTextGroupInner.select('.annotation-math-group'),
            hasMathjax = !mathjaxGroup.empty(),
            anntextBB = Drawing.bBox(
                (hasMathjax ? mathjaxGroup : annText).node()),
            annwidth = anntextBB.width,
            annheight = anntextBB.height,
            outerwidth = Math.round(annwidth + 2 * borderfull),
            outerheight = Math.round(annheight + 2 * borderfull);


        // save size in the annotation object for use by autoscale
        options._w = annwidth;
        options._h = annheight;

        function shiftFraction(v, anchor) {
            if(anchor === 'auto') {
                if(v < 1 / 3) anchor = 'left';
                else if(v > 2 / 3) anchor = 'right';
                else anchor = 'center';
            }
            return {
                center: 0,
                middle: 0,
                left: 0.5,
                bottom: -0.5,
                right: -0.5,
                top: 0.5
            }[anchor];
        }

        var annotationIsOffscreen = false;
        ['x', 'y'].forEach(function(axLetter) {
            var axRef = options[axLetter + 'ref'] || axLetter,
                tailRef = options['a' + axLetter + 'ref'],
                ax = Axes.getFromId(gd, axRef),
                dimAngle = (textangle + (axLetter === 'x' ? 0 : -90)) * Math.PI / 180,
                // note that these two can be either positive or negative
                annSizeFromWidth = outerwidth * Math.cos(dimAngle),
                annSizeFromHeight = outerheight * Math.sin(dimAngle),
                // but this one is the positive total size
                annSize = Math.abs(annSizeFromWidth) + Math.abs(annSizeFromHeight),
                anchor = options[axLetter + 'anchor'],
                posPx = annPosPx[axLetter],
                basePx,
                textPadShift,
                alignPosition,
                autoAlignFraction,
                textShift;

            /*
             * calculate the *primary* pixel position
             * which is the arrowhead if there is one,
             * otherwise the text anchor point
             */
            if(ax) {
                /*
                 * hide the annotation if it's pointing outside the visible plot
                 * as long as the axis isn't autoranged - then we need to draw it
                 * anyway to get its bounding box. When we're dragging, an axis can
                 * still look autoranged even though it won't be when the drag finishes.
                 */
                var posFraction = ax.r2fraction(options[axLetter]);
                if((gd._dragging || !ax.autorange) && (posFraction < 0 || posFraction > 1)) {
                    if(tailRef === axRef) {
                        posFraction = ax.r2fraction(options['a' + axLetter]);
                        if(posFraction < 0 || posFraction > 1) {
                            annotationIsOffscreen = true;
                        }
                    }
                    else {
                        annotationIsOffscreen = true;
                    }

                    if(annotationIsOffscreen) return;
                }
                basePx = ax._offset + ax.r2p(options[axLetter]);
                autoAlignFraction = 0.5;
            }
            else {
                if(axLetter === 'x') {
                    alignPosition = options[axLetter];
                    basePx = gs.l + gs.w * alignPosition;
                }
                else {
                    alignPosition = 1 - options[axLetter];
                    basePx = gs.t + gs.h * alignPosition;
                }
                autoAlignFraction = options.showarrow ? 0.5 : alignPosition;
            }

            // now translate this into pixel positions of head, tail, and text
            // as well as paddings for autorange
            if(options.showarrow) {
                posPx.head = basePx;

                var arrowLength = options['a' + axLetter];

                // with an arrow, the text rotates around the anchor point
                textShift = annSizeFromWidth * shiftFraction(0.5, options.xanchor) -
                    annSizeFromHeight * shiftFraction(0.5, options.yanchor);

                if(tailRef === axRef) {
                    posPx.tail = ax._offset + ax.r2p(arrowLength);
                    // tail is data-referenced: autorange pads the text in px from the tail
                    textPadShift = textShift;
                }
                else {
                    posPx.tail = basePx + arrowLength;
                    // tail is specified in px from head, so autorange also pads vs head
                    textPadShift = textShift + arrowLength;
                }

                posPx.text = posPx.tail + textShift;

                // constrain pixel/paper referenced so the draggers are at least
                // partially visible
                var maxPx = fullLayout[(axLetter === 'x') ? 'width' : 'height'];
                if(axRef === 'paper') {
                    posPx.head = Lib.constrain(posPx.head, 1, maxPx - 1);
                }
                if(tailRef === 'pixel') {
                    var shiftPlus = -Math.max(posPx.tail - 3, posPx.text),
                        shiftMinus = Math.min(posPx.tail + 3, posPx.text) - maxPx;
                    if(shiftPlus > 0) {
                        posPx.tail += shiftPlus;
                        posPx.text += shiftPlus;
                    }
                    else if(shiftMinus > 0) {
                        posPx.tail -= shiftMinus;
                        posPx.text -= shiftMinus;
                    }
                }
            }
            else {
                // with no arrow, the text rotates and *then* we put the anchor
                // relative to the new bounding box
                textShift = annSize * shiftFraction(autoAlignFraction, anchor);
                textPadShift = textShift;
                posPx.text = basePx + textShift;
            }

            options['_' + axLetter + 'padplus'] = (annSize / 2) + textPadShift;
            options['_' + axLetter + 'padminus'] = (annSize / 2) - textPadShift;

            // save the current axis type for later log/linear changes
            options['_' + axLetter + 'type'] = ax && ax.type;
        });

        if(annotationIsOffscreen) {
            annTextGroupInner.remove();
            return;
        }

        if(hasMathjax) {
            mathjaxGroup.select('svg').attr({x: borderfull - 1, y: borderfull});
        }
        else {
            var texty = borderfull - anntextBB.top,
                textx = borderfull - anntextBB.left;
            annText.attr({x: textx, y: texty});
            annText.selectAll('tspan.line').attr({y: texty, x: textx});
        }

        annTextBG.call(Drawing.setRect, borderwidth / 2, borderwidth / 2,
            outerwidth - borderwidth, outerheight - borderwidth);

        annTextGroupInner.call(Drawing.setTranslate,
            Math.round(annPosPx.x.text - outerwidth / 2),
            Math.round(annPosPx.y.text - outerheight / 2));

        /*
         * rotate text and background
         * we already calculated the text center position *as rotated*
         * because we needed that for autoranging anyway, so now whether
         * we have an arrow or not, we rotate about the text center.
         */
        annTextGroup.attr({transform: 'rotate(' + textangle + ',' +
                            annPosPx.x.text + ',' + annPosPx.y.text + ')'});

        var annbase = 'annotations[' + index + ']';

        /*
         * add the arrow
         * uses options[arrowwidth,arrowcolor,arrowhead] for styling
         * dx and dy are normally zero, but when you are dragging the textbox
         * while the head stays put, dx and dy are the pixel offsets
         */
        var drawArrow = function(dx, dy) {
            d3.select(gd)
                .selectAll('.annotation-arrow-g[data-index="' + index + '"]')
                .remove();

            var headX = annPosPx.x.head,
                headY = annPosPx.y.head,
                tailX = annPosPx.x.tail + dx,
                tailY = annPosPx.y.tail + dy,
                textX = annPosPx.x.text + dx,
                textY = annPosPx.y.text + dy,

                // find the edge of the text box, where we'll start the arrow:
                // create transform matrix to rotate the text box corners
                transform = Lib.rotationXYMatrix(textangle, textX, textY),
                applyTransform = Lib.apply2DTransform(transform),
                applyTransform2 = Lib.apply2DTransform2(transform),

                // calculate and transform bounding box
                width = +annTextBG.attr('width'),
                height = +annTextBG.attr('height'),
                xLeft = textX - 0.5 * width,
                xRight = xLeft + width,
                yTop = textY - 0.5 * height,
                yBottom = yTop + height,
                edges = [
                    [xLeft, yTop, xLeft, yBottom],
                    [xLeft, yBottom, xRight, yBottom],
                    [xRight, yBottom, xRight, yTop],
                    [xRight, yTop, xLeft, yTop]
                ].map(applyTransform2);

            // Remove the line if it ends inside the box.  Use ray
            // casting for rotated boxes: see which edges intersect a
            // line from the arrowhead to far away and reduce with xor
            // to get the parity of the number of intersections.
            if(edges.reduce(function(a, x) {
                return a ^
                    !!lineIntersect(headX, headY, headX + 1e6, headY + 1e6,
                            x[0], x[1], x[2], x[3]);
            }, false)) {
                // no line or arrow - so quit drawArrow now
                return;
            }

            edges.forEach(function(x) {
                var p = lineIntersect(tailX, tailY, headX, headY,
                            x[0], x[1], x[2], x[3]);
                if(p) {
                    tailX = p.x;
                    tailY = p.y;
                }
            });

            var strokewidth = options.arrowwidth,
                arrowColor = options.arrowcolor;

            var arrowGroup = annGroup.append('g')
                .style({opacity: Color.opacity(arrowColor)})
                .classed('annotation-arrow-g', true)
                .attr('data-index', String(index));

            var arrow = arrowGroup.append('path')
                .attr('d', 'M' + tailX + ',' + tailY + 'L' + headX + ',' + headY)
                .style('stroke-width', strokewidth + 'px')
                .call(Color.stroke, Color.rgb(arrowColor));

            drawArrowHead(arrow, options.arrowhead, 'end', options.arrowsize, options.standoff);

            // the arrow dragger is a small square right at the head, then a line to the tail,
            // all expanded by a stroke width of 6px plus the arrow line width
            if(gd._context.editable && arrow.node().parentNode) {
                var arrowDragHeadX = headX;
                var arrowDragHeadY = headY;
                if(options.standoff) {
                    var arrowLength = Math.sqrt(Math.pow(headX - tailX, 2) + Math.pow(headY - tailY, 2));
                    arrowDragHeadX += options.standoff * (tailX - headX) / arrowLength;
                    arrowDragHeadY += options.standoff * (tailY - headY) / arrowLength;
                }
                var arrowDrag = arrowGroup.append('path')
                    .classed('annotation', true)
                    .classed('anndrag', true)
                    .attr({
                        'data-index': String(index),
                        d: 'M3,3H-3V-3H3ZM0,0L' + (tailX - arrowDragHeadX) + ',' + (tailY - arrowDragHeadY),
                        transform: 'translate(' + arrowDragHeadX + ',' + arrowDragHeadY + ')'
                    })
                    .style('stroke-width', (strokewidth + 6) + 'px')
                    .call(Color.stroke, 'rgba(0,0,0,0)')
                    .call(Color.fill, 'rgba(0,0,0,0)');

                var update,
                    annx0,
                    anny0;

                // dragger for the arrow & head: translates the whole thing
                // (head/tail/text) all together
                dragElement.init({
                    element: arrowDrag.node(),
                    prepFn: function() {
                        var pos = Drawing.getTranslate(annTextGroupInner);

                        annx0 = pos.x;
                        anny0 = pos.y;
                        update = {};
                        if(xa && xa.autorange) {
                            update[xa._name + '.autorange'] = true;
                        }
                        if(ya && ya.autorange) {
                            update[ya._name + '.autorange'] = true;
                        }
                    },
                    moveFn: function(dx, dy) {
                        var annxy0 = applyTransform(annx0, anny0),
                            xcenter = annxy0[0] + dx,
                            ycenter = annxy0[1] + dy;
                        annTextGroupInner.call(Drawing.setTranslate, xcenter, ycenter);

                        update[annbase + '.x'] = xa ?
                            xa.p2r(xa.r2p(options.x) + dx) :
                            ((headX + dx - gs.l) / gs.w);
                        update[annbase + '.y'] = ya ?
                            ya.p2r(ya.r2p(options.y) + dy) :
                            (1 - ((headY + dy - gs.t) / gs.h));

                        if(options.axref === options.xref) {
                            update[annbase + '.ax'] = xa ?
                                xa.p2r(xa.r2p(options.ax) + dx) :
                                ((headX + dx - gs.l) / gs.w);
                        }

                        if(options.ayref === options.yref) {
                            update[annbase + '.ay'] = ya ?
                                ya.p2r(ya.r2p(options.ay) + dy) :
                                (1 - ((headY + dy - gs.t) / gs.h));
                        }

                        arrowGroup.attr('transform', 'translate(' + dx + ',' + dy + ')');
                        annTextGroup.attr({
                            transform: 'rotate(' + textangle + ',' +
                                   xcenter + ',' + ycenter + ')'
                        });
                    },
                    doneFn: function(dragged) {
                        if(dragged) {
                            Plotly.relayout(gd, update);
                            var notesBox = document.querySelector('.js-notes-box-panel');
                            if(notesBox) notesBox.redraw(notesBox.selectedObj);
                        }
                    }
                });
            }
        };

        if(options.showarrow) drawArrow(0, 0);

        // user dragging the annotation (text, not arrow)
        if(gd._context.editable) {
            var update,
                baseTextTransform;

            // dragger for the textbox: if there's an arrow, just drag the
            // textbox and tail, leave the head untouched
            dragElement.init({
                element: annTextGroupInner.node(),
                prepFn: function() {
                    baseTextTransform = annTextGroup.attr('transform');
                    update = {};
                },
                moveFn: function(dx, dy) {
                    var csr = 'pointer';
                    if(options.showarrow) {
                        if(options.axref === options.xref) {
                            update[annbase + '.ax'] = xa.p2r(xa.r2p(options.ax) + dx);
                        } else {
                            update[annbase + '.ax'] = options.ax + dx;
                        }

                        if(options.ayref === options.yref) {
                            update[annbase + '.ay'] = ya.p2r(ya.r2p(options.ay) + dy);
                        } else {
                            update[annbase + '.ay'] = options.ay + dy;
                        }

                        drawArrow(dx, dy);
                    }
                    else {
                        if(xa) update[annbase + '.x'] = options.x + dx / xa._m;
                        else {
                            var widthFraction = options._xsize / gs.w,
                                xLeft = options.x + options._xshift / gs.w - widthFraction / 2;

                            update[annbase + '.x'] = dragElement.align(xLeft + dx / gs.w,
                                widthFraction, 0, 1, options.xanchor);
                        }

                        if(ya) update[annbase + '.y'] = options.y + dy / ya._m;
                        else {
                            var heightFraction = options._ysize / gs.h,
                                yBottom = options.y - options._yshift / gs.h - heightFraction / 2;

                            update[annbase + '.y'] = dragElement.align(yBottom - dy / gs.h,
                                heightFraction, 0, 1, options.yanchor);
                        }
                        if(!xa || !ya) {
                            csr = dragElement.getCursor(
                                xa ? 0.5 : update[annbase + '.x'],
                                ya ? 0.5 : update[annbase + '.y'],
                                options.xanchor, options.yanchor
                            );
                        }
                    }

                    annTextGroup.attr({
                        transform: 'translate(' + dx + ',' + dy + ')' + baseTextTransform
                    });

                    setCursor(annTextGroupInner, csr);
                },
                doneFn: function(dragged) {
                    setCursor(annTextGroupInner);
                    if(dragged) {
                        Plotly.relayout(gd, update);
                        var notesBox = document.querySelector('.js-notes-box-panel');
                        if(notesBox) notesBox.redraw(notesBox.selectedObj);
                    }
                }
            });
        }
    }

    if(gd._context.editable) {
        annText.call(svgTextUtils.makeEditable, annTextGroupInner)
            .call(textLayout)
            .on('edit', function(_text) {
                options.text = _text;
                this.attr({'data-unformatted': options.text});
                this.call(textLayout);
                var update = {};
                update['annotations[' + index + '].text'] = options.text;
                if(xa && xa.autorange) {
                    update[xa._name + '.autorange'] = true;
                }
                if(ya && ya.autorange) {
                    update[ya._name + '.autorange'] = true;
                }
                Plotly.relayout(gd, update);
            });
    }
    else annText.call(textLayout);
}

// look for intersection of two line segments
//   (1->2 and 3->4) - returns array [x,y] if they do, null if not
function lineIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    var a = x2 - x1,
        b = x3 - x1,
        c = x4 - x3,
        d = y2 - y1,
        e = y3 - y1,
        f = y4 - y3,
        det = a * f - c * d;
    // parallel lines? intersection is undefined
    // ignore the case where they are colinear
    if(det === 0) return null;
    var t = (b * f - c * e) / det,
        u = (b * d - a * e) / det;
    // segments do not intersect?
    if(u < 0 || u > 1 || t < 0 || t > 1) return null;

    return {x: x1 + a * t, y: y1 + d * t};
}
