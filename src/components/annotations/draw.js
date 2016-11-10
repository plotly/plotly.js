/**
* Copyright 2012-2016, Plotly, Inc.
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
var arrowhead = require('./draw_arrow_head');


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
        annPosPx = {x: 0, y: 0},
        textangle = +options.textangle || 0;

    // create the components
    // made a single group to contain all, so opacity can work right
    // with border/arrow together this could handle a whole bunch of
    // cleanup at this point, but works for now
    var anngroup = fullLayout._infolayer.append('g')
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
    var anng = anngroup.append('g')
        .classed('annotation-text-g', true)
        .attr('data-index', String(index));

    var ann = anng.append('g');

    var borderwidth = options.borderwidth,
        borderpad = options.borderpad,
        borderfull = borderwidth + borderpad;

    var annbg = ann.append('rect')
        .attr('class', 'bg')
        .style('stroke-width', borderwidth + 'px')
        .call(Color.stroke, options.bordercolor)
        .call(Color.fill, options.bgcolor);

    var font = options.font;

    var anntext = ann.append('text')
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
        anntext.selectAll('tspan.line').attr({y: 0, x: 0});

        var mathjaxGroup = ann.select('.annotation-math-group'),
            hasMathjax = !mathjaxGroup.empty(),
            anntextBB = Drawing.bBox(
                (hasMathjax ? mathjaxGroup : anntext).node()),
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
                ax = Axes.getFromId(gd, axRef),
                dimAngle = (textangle + (axLetter === 'x' ? 0 : 90)) * Math.PI / 180,
                annSize = outerwidth * Math.abs(Math.cos(dimAngle)) +
                          outerheight * Math.abs(Math.sin(dimAngle)),
                anchor = options[axLetter + 'anchor'],
                alignPosition;

            // calculate pixel position
            if(ax) {
                // hide the annotation if it's pointing
                // outside the visible plot (as long as the axis
                // isn't autoranged - then we need to draw it
                // anyway to get its bounding box)
                var posFraction = ax.r2fraction(options[axLetter]);
                if(!ax.autorange && (posFraction < 0 || posFraction > 1)) {
                    if(options['a' + axLetter + 'ref'] === axRef) {
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
                annPosPx[axLetter] = ax._offset + ax.r2p(options[axLetter]);
                alignPosition = 0.5;
            }
            else {
                alignPosition = options[axLetter];
                if(axLetter === 'y') alignPosition = 1 - alignPosition;
                annPosPx[axLetter] = (axLetter === 'x') ?
                    (gs.l + gs.w * alignPosition) :
                    (gs.t + gs.h * alignPosition);
            }

            var alignShift = 0;
            if(options['a' + axLetter + 'ref'] === axRef) {
                annPosPx['aa' + axLetter] = ax._offset + ax.r2p(options['a' + axLetter]);
            } else {
                if(options.showarrow) {
                    alignShift = options['a' + axLetter];
                }
                else {
                    alignShift = annSize * shiftFraction(alignPosition, anchor);
                }
                annPosPx[axLetter] += alignShift;
            }

            // save the current axis type for later log/linear changes
            options['_' + axLetter + 'type'] = ax && ax.type;

            // save the size and shift in this dim for autorange
            options['_' + axLetter + 'size'] = annSize;
            options['_' + axLetter + 'shift'] = alignShift;
        });

        if(annotationIsOffscreen) {
            ann.remove();
            return;
        }

        var arrowX, arrowY;

        // make sure the arrowhead (if there is one)
        // and the annotation center are visible
        if(options.showarrow) {
            if(options.axref === options.xref) {
                // we don't want to constrain if the tail is absolute
                // or the slope (which is meaningful) will change.
                arrowX = annPosPx.x;
            } else {
                arrowX = Lib.constrain(annPosPx.x - options.ax, 1, fullLayout.width - 1);
            }

            if(options.ayref === options.yref) {
                // we don't want to constrain if the tail is absolute
                // or the slope (which is meaningful) will change.
                arrowY = annPosPx.y;
            } else {
                arrowY = Lib.constrain(annPosPx.y - options.ay, 1, fullLayout.height - 1);
            }
        }
        annPosPx.x = Lib.constrain(annPosPx.x, 1, fullLayout.width - 1);
        annPosPx.y = Lib.constrain(annPosPx.y, 1, fullLayout.height - 1);

        var texty = borderfull - anntextBB.top,
            textx = borderfull - anntextBB.left;

        if(hasMathjax) {
            mathjaxGroup.select('svg').attr({x: borderfull - 1, y: borderfull});
        }
        else {
            anntext.attr({x: textx, y: texty});
            anntext.selectAll('tspan.line').attr({y: texty, x: textx});
        }

        annbg.call(Drawing.setRect, borderwidth / 2, borderwidth / 2,
            outerwidth - borderwidth, outerheight - borderwidth);

        var annX = 0, annY = 0;
        if(options.axref === options.xref) {
            annX = Math.round(annPosPx.aax - outerwidth / 2);
        } else {
            annX = Math.round(annPosPx.x - outerwidth / 2);
        }

        if(options.ayref === options.yref) {
            annY = Math.round(annPosPx.aay - outerheight / 2);
        } else {
            annY = Math.round(annPosPx.y - outerheight / 2);
        }

        ann.call(Lib.setTranslate, annX, annY);

        var annbase = 'annotations[' + index + ']';

        // add the arrow
        // uses options[arrowwidth,arrowcolor,arrowhead] for styling
        var drawArrow = function(dx, dy) {
            d3.select(gd)
                .selectAll('.annotation-arrow-g[data-index="' + index + '"]')
                .remove();
            // find where to start the arrow:
            // at the border of the textbox, if that border is visible,
            // or at the edge of the lines of text, if the border is hidden
            // TODO: tspan bounding box fails in chrome
            // looks like there may be a cross-browser solution, see
            // http://stackoverflow.com/questions/5364980/
            //    how-to-get-the-width-of-an-svg-tspan-element
            var arrowX0, arrowY0;

            if(options.axref === options.xref) {
                arrowX0 = annPosPx.aax + dx;
            } else {
                arrowX0 = annPosPx.x + dx;
            }

            if(options.ayref === options.yref) {
                arrowY0 = annPosPx.aay + dy;
            } else {
                arrowY0 = annPosPx.y + dy;
            }

                // create transform matrix and related functions
            var transform =
                    Lib.rotationXYMatrix(textangle, arrowX0, arrowY0),
                applyTransform = Lib.apply2DTransform(transform),
                applyTransform2 = Lib.apply2DTransform2(transform),

                // calculate and transform bounding box
                xHalf = annbg.attr('width') / 2,
                yHalf = annbg.attr('height') / 2,
                edges = [
                    [arrowX0 - xHalf, arrowY0 - yHalf, arrowX0 - xHalf, arrowY0 + yHalf],
                    [arrowX0 - xHalf, arrowY0 + yHalf, arrowX0 + xHalf, arrowY0 + yHalf],
                    [arrowX0 + xHalf, arrowY0 + yHalf, arrowX0 + xHalf, arrowY0 - yHalf],
                    [arrowX0 + xHalf, arrowY0 - yHalf, arrowX0 - xHalf, arrowY0 - yHalf]
                ].map(applyTransform2);

            // Remove the line if it ends inside the box.  Use ray
            // casting for rotated boxes: see which edges intersect a
            // line from the arrowhead to far away and reduce with xor
            // to get the parity of the number of intersections.
            if(edges.reduce(function(a, x) {
                return a ^
                    !!lineIntersect(arrowX, arrowY, arrowX + 1e6, arrowY + 1e6,
                            x[0], x[1], x[2], x[3]);
            }, false)) {
                // no line or arrow - so quit drawArrow now
                return;
            }

            edges.forEach(function(x) {
                var p = lineIntersect(arrowX0, arrowY0, arrowX, arrowY,
                            x[0], x[1], x[2], x[3]);
                if(p) {
                    arrowX0 = p.x;
                    arrowY0 = p.y;
                }
            });

            var strokewidth = options.arrowwidth,
                arrowColor = options.arrowcolor;

            var arrowgroup = anngroup.append('g')
                .style({opacity: Color.opacity(arrowColor)})
                .classed('annotation-arrow-g', true)
                .attr('data-index', String(index));

            var arrow = arrowgroup.append('path')
                .attr('d', 'M' + arrowX0 + ',' + arrowY0 + 'L' + arrowX + ',' + arrowY)
                .style('stroke-width', strokewidth + 'px')
                .call(Color.stroke, Color.rgb(arrowColor));

            arrowhead(arrow, options.arrowhead, 'end', options.arrowsize);

            var arrowdrag = arrowgroup.append('path')
                .classed('annotation', true)
                .classed('anndrag', true)
                .attr({
                    'data-index': String(index),
                    d: 'M3,3H-3V-3H3ZM0,0L' + (arrowX0 - arrowX) + ',' + (arrowY0 - arrowY),
                    transform: 'translate(' + arrowX + ',' + arrowY + ')'
                })
                .style('stroke-width', (strokewidth + 6) + 'px')
                .call(Color.stroke, 'rgba(0,0,0,0)')
                .call(Color.fill, 'rgba(0,0,0,0)');

            if(gd._context.editable) {
                var update,
                    annx0,
                    anny0;

                dragElement.init({
                    element: arrowdrag.node(),
                    prepFn: function() {
                        var pos = Lib.getTranslate(ann);

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
                        arrowgroup.attr('transform', 'translate(' + dx + ',' + dy + ')');

                        var annxy0 = applyTransform(annx0, anny0),
                            xcenter = annxy0[0] + dx,
                            ycenter = annxy0[1] + dy;
                        ann.call(Lib.setTranslate, xcenter, ycenter);

                        update[annbase + '.x'] = xa ?
                            xa.p2r(xa.r2p(options.x) + dx) :
                            ((arrowX + dx - gs.l) / gs.w);
                        update[annbase + '.y'] = ya ?
                            ya.p2r(ya.r2p(options.y) + dy) :
                            (1 - ((arrowY + dy - gs.t) / gs.h));

                        if(options.axref === options.xref) {
                            update[annbase + '.ax'] = xa ?
                                xa.p2r(xa.r2p(options.ax) + dx) :
                                ((arrowX + dx - gs.l) / gs.w);
                        }

                        if(options.ayref === options.yref) {
                            update[annbase + '.ay'] = ya ?
                                ya.p2r(ya.r2p(options.ay) + dy) :
                                (1 - ((arrowY + dy - gs.t) / gs.h));
                        }

                        anng.attr({
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

        // create transform matrix and related functions
        var transform = Lib.rotationXYMatrix(textangle,
                annPosPx.x, annPosPx.y),
            applyTransform = Lib.apply2DTransform(transform);

        // user dragging the annotation (text, not arrow)
        if(gd._context.editable) {
            var x0,
                y0,
                update;

            dragElement.init({
                element: ann.node(),
                prepFn: function() {
                    var pos = Lib.getTranslate(ann);

                    x0 = pos.x;
                    y0 = pos.y;
                    update = {};
                },
                moveFn: function(dx, dy) {
                    ann.call(Lib.setTranslate, x0 + dx, y0 + dy);
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

                    var xy1 = applyTransform(x0, y0),
                        x1 = xy1[0] + dx,
                        y1 = xy1[1] + dy;

                    ann.call(Lib.setTranslate, x0 + dx, y0 + dy);

                    anng.attr({
                        transform: 'rotate(' + textangle + ',' +
                               x1 + ',' + y1 + ')'
                    });

                    setCursor(ann, csr);
                },
                doneFn: function(dragged) {
                    setCursor(ann);
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
        anntext.call(svgTextUtils.makeEditable, ann)
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
    else anntext.call(textLayout);

    // rotate and position text and background
    anng.attr({transform: 'rotate(' + textangle + ',' +
                        annPosPx.x + ',' + annPosPx.y + ')'})
        .call(Drawing.setPosition, annPosPx.x, annPosPx.y);
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
