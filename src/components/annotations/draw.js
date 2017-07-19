/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var Plotly = require('../../plotly');
var Plots = require('../../plots/plots');
var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');
var Color = require('../color');
var Drawing = require('../drawing');
var Fx = require('../fx');
var svgTextUtils = require('../../lib/svg_text_utils');
var setCursor = require('../../lib/setcursor');
var dragElement = require('../dragelement');

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
    drawOne: drawOne,
    drawRaw: drawRaw
};

/*
 * draw: draw all annotations without any new modifications
 */
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

/*
 * drawOne: draw a single cartesian or paper-ref annotation, potentially with modifications
 *
 * index (int): the annotation to draw
 */
function drawOne(gd, index) {
    var fullLayout = gd._fullLayout;
    var options = fullLayout.annotations[index] || {};
    var xa = Axes.getFromId(gd, options.xref);
    var ya = Axes.getFromId(gd, options.yref);

    drawRaw(gd, options, index, false, xa, ya);
}

/**
 * drawRaw: draw a single annotation, potentially with modifications
 *
 * @param {DOM element} gd
 * @param {object} options : this annotation's fullLayout options
 * @param {integer} index : index in 'annotations' container of the annotation to draw
 * @param {string} subplotId : id of the annotation's subplot
 *  - use false for 2d (i.e. cartesian or paper-ref) annotations
 * @param {object | undefined} xa : full x-axis object to compute subplot pos-to-px
 * @param {object | undefined} ya : ... y-axis
 */
function drawRaw(gd, options, index, subplotId, xa, ya) {
    var fullLayout = gd._fullLayout;
    var gs = gd._fullLayout._size;
    var edits = gd._context.edits;

    var className;
    var annbase;

    if(subplotId) {
        className = 'annotation-' + subplotId;
        annbase = subplotId + '.annotations[' + index + ']';
    } else {
        className = 'annotation';
        annbase = 'annotations[' + index + ']';
    }

    // remove the existing annotation if there is one
    fullLayout._infolayer
        .selectAll('.' + className + '[data-index="' + index + '"]')
        .remove();

    var annClipID = 'clip' + fullLayout._uid + '_ann' + index;

    // this annotation is gone - quit now after deleting it
    // TODO: use d3 idioms instead of deleting and redrawing every time
    if(!options._input || options.visible === false) {
        d3.selectAll('#' + annClipID).remove();
        return;
    }

    // calculated pixel positions
    // x & y each will get text, head, and tail as appropriate
    var annPosPx = {x: {}, y: {}},
        textangle = +options.textangle || 0;

    // create the components
    // made a single group to contain all, so opacity can work right
    // with border/arrow together this could handle a whole bunch of
    // cleanup at this point, but works for now
    var annGroup = fullLayout._infolayer.append('g')
        .classed(className, true)
        .attr('data-index', String(index))
        .style('opacity', options.opacity);

    // another group for text+background so that they can rotate together
    var annTextGroup = annGroup.append('g')
        .classed('annotation-text-g', true);

    var editTextPosition = edits[options.showarrow ? 'annotationTail' : 'annotationPosition'];
    var textEvents = options.captureevents || edits.annotationText || editTextPosition;

    var annTextGroupInner = annTextGroup.append('g')
        .style('pointer-events', textEvents ? 'all' : null)
        .call(setCursor, 'default')
        .on('click', function() {
            gd._dragging = false;

            var eventData = {
                index: index,
                annotation: options._input,
                fullAnnotation: options,
                event: d3.event
            };

            if(subplotId) {
                eventData.subplotId = subplotId;
            }

            gd.emit('plotly_clickannotation', eventData);
        });

    if(options.hovertext) {
        annTextGroupInner
        .on('mouseover', function() {
            var hoverOptions = options.hoverlabel;
            var hoverFont = hoverOptions.font;
            var bBox = this.getBoundingClientRect();
            var bBoxRef = gd.getBoundingClientRect();

            Fx.loneHover({
                x0: bBox.left - bBoxRef.left,
                x1: bBox.right - bBoxRef.left,
                y: (bBox.top + bBox.bottom) / 2 - bBoxRef.top,
                text: options.hovertext,
                color: hoverOptions.bgcolor,
                borderColor: hoverOptions.bordercolor,
                fontFamily: hoverFont.family,
                fontSize: hoverFont.size,
                fontColor: hoverFont.color
            }, {
                container: fullLayout._hoverlayer.node(),
                outerContainer: fullLayout._paper.node(),
                gd: gd
            });
        })
        .on('mouseout', function() {
            Fx.loneUnhover(fullLayout._hoverlayer.node());
        });
    }

    var borderwidth = options.borderwidth,
        borderpad = options.borderpad,
        borderfull = borderwidth + borderpad;

    var annTextBG = annTextGroupInner.append('rect')
        .attr('class', 'bg')
        .style('stroke-width', borderwidth + 'px')
        .call(Color.stroke, options.bordercolor)
        .call(Color.fill, options.bgcolor);

    var isSizeConstrained = options.width || options.height;

    var annTextClip = fullLayout._defs.select('.clips')
        .selectAll('#' + annClipID)
        .data(isSizeConstrained ? [0] : []);

    annTextClip.enter().append('clipPath')
        .classed('annclip', true)
        .attr('id', annClipID)
      .append('rect');
    annTextClip.exit().remove();

    var font = options.font;

    var annText = annTextGroupInner.append('text')
        .classed('annotation-text', true)
        .text(options.text);

    function textLayout(s) {
        s.call(Drawing.font, font)
        .attr({
            'text-anchor': {
                left: 'start',
                right: 'end'
            }[options.align] || 'middle'
        });

        svgTextUtils.convertToTspans(s, gd, drawGraphicalElements);
        return s;
    }

    function drawGraphicalElements() {
        // if the text has *only* a link, make the whole box into a link
        var anchor3 = annText.selectAll('a');
        if(anchor3.size() === 1 && anchor3.text() === annText.text()) {
            var wholeLink = annTextGroupInner.insert('a', ':first-child').attr({
                'xlink:xlink:href': anchor3.attr('xlink:href'),
                'xlink:xlink:show': anchor3.attr('xlink:show')
            })
            .style({cursor: 'pointer'});

            wholeLink.node().appendChild(annTextBG.node());
        }

        var mathjaxGroup = annTextGroupInner.select('.annotation-text-math-group');
        var hasMathjax = !mathjaxGroup.empty();
        var anntextBB = Drawing.bBox(
                (hasMathjax ? mathjaxGroup : annText).node());
        var textWidth = anntextBB.width;
        var textHeight = anntextBB.height;
        var annWidth = options.width || textWidth;
        var annHeight = options.height || textHeight;
        var outerWidth = Math.round(annWidth + 2 * borderfull);
        var outerHeight = Math.round(annHeight + 2 * borderfull);


        // save size in the annotation object for use by autoscale
        options._w = annWidth;
        options._h = annHeight;

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
        var letters = ['x', 'y'];

        for(var i = 0; i < letters.length; i++) {
            var axLetter = letters[i],
                axRef = options[axLetter + 'ref'] || axLetter,
                tailRef = options['a' + axLetter + 'ref'],
                ax = {x: xa, y: ya}[axLetter],
                dimAngle = (textangle + (axLetter === 'x' ? 0 : -90)) * Math.PI / 180,
                // note that these two can be either positive or negative
                annSizeFromWidth = outerWidth * Math.cos(dimAngle),
                annSizeFromHeight = outerHeight * Math.sin(dimAngle),
                // but this one is the positive total size
                annSize = Math.abs(annSizeFromWidth) + Math.abs(annSizeFromHeight),
                anchor = options[axLetter + 'anchor'],
                overallShift = options[axLetter + 'shift'] * (axLetter === 'x' ? 1 : -1),
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

                    if(annotationIsOffscreen) continue;
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

                posPx.tail += overallShift;
                posPx.head += overallShift;
            }
            else {
                // with no arrow, the text rotates and *then* we put the anchor
                // relative to the new bounding box
                textShift = annSize * shiftFraction(autoAlignFraction, anchor);
                textPadShift = textShift;
                posPx.text = basePx + textShift;
            }

            posPx.text += overallShift;
            textShift += overallShift;
            textPadShift += overallShift;

            // padplus/minus are used by autorange
            options['_' + axLetter + 'padplus'] = (annSize / 2) + textPadShift;
            options['_' + axLetter + 'padminus'] = (annSize / 2) - textPadShift;

            // size/shift are used during dragging
            options['_' + axLetter + 'size'] = annSize;
            options['_' + axLetter + 'shift'] = textShift;
        }

        if(annotationIsOffscreen) {
            annTextGroupInner.remove();
            return;
        }

        var xShift = 0;
        var yShift = 0;

        if(options.align !== 'left') {
            xShift = (annWidth - textWidth) * (options.align === 'center' ? 0.5 : 1);
        }
        if(options.valign !== 'top') {
            yShift = (annHeight - textHeight) * (options.valign === 'middle' ? 0.5 : 1);
        }

        if(hasMathjax) {
            mathjaxGroup.select('svg').attr({
                x: borderfull + xShift - 1,
                y: borderfull + yShift
            })
            .call(Drawing.setClipUrl, isSizeConstrained ? annClipID : null);
        }
        else {
            var texty = borderfull + yShift - anntextBB.top;
            var textx = borderfull + xShift - anntextBB.left;

            annText.call(svgTextUtils.positionText, textx, texty)
                .call(Drawing.setClipUrl, isSizeConstrained ? annClipID : null);
        }

        annTextClip.select('rect').call(Drawing.setRect, borderfull, borderfull,
            annWidth, annHeight);

        annTextBG.call(Drawing.setRect, borderwidth / 2, borderwidth / 2,
            outerWidth - borderwidth, outerHeight - borderwidth);

        annTextGroupInner.call(Drawing.setTranslate,
            Math.round(annPosPx.x.text - outerWidth / 2),
            Math.round(annPosPx.y.text - outerHeight / 2));

        /*
         * rotate text and background
         * we already calculated the text center position *as rotated*
         * because we needed that for autoranging anyway, so now whether
         * we have an arrow or not, we rotate about the text center.
         */
        annTextGroup.attr({transform: 'rotate(' + textangle + ',' +
                            annPosPx.x.text + ',' + annPosPx.y.text + ')'});

        /*
         * add the arrow
         * uses options[arrowwidth,arrowcolor,arrowhead] for styling
         * dx and dy are normally zero, but when you are dragging the textbox
         * while the head stays put, dx and dy are the pixel offsets
         */
        var drawArrow = function(dx, dy) {
            annGroup
                .selectAll('.annotation-arrow-g')
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
                    !!Lib.segmentsIntersect(headX, headY, headX + 1e6, headY + 1e6,
                            x[0], x[1], x[2], x[3]);
            }, false)) {
                // no line or arrow - so quit drawArrow now
                return;
            }

            edges.forEach(function(x) {
                var p = Lib.segmentsIntersect(tailX, tailY, headX, headY,
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
                .classed('annotation-arrow-g', true);

            var arrow = arrowGroup.append('path')
                .attr('d', 'M' + tailX + ',' + tailY + 'L' + headX + ',' + headY)
                .style('stroke-width', strokewidth + 'px')
                .call(Color.stroke, Color.rgb(arrowColor));

            drawArrowHead(arrow, options.arrowhead, 'end', options.arrowsize, options.standoff);

            // the arrow dragger is a small square right at the head, then a line to the tail,
            // all expanded by a stroke width of 6px plus the arrow line width
            if(edits.annotationPosition && arrow.node().parentNode && !subplotId) {
                var arrowDragHeadX = headX;
                var arrowDragHeadY = headY;
                if(options.standoff) {
                    var arrowLength = Math.sqrt(Math.pow(headX - tailX, 2) + Math.pow(headY - tailY, 2));
                    arrowDragHeadX += options.standoff * (tailX - headX) / arrowLength;
                    arrowDragHeadY += options.standoff * (tailY - headY) / arrowLength;
                }
                var arrowDrag = arrowGroup.append('path')
                    .classed('annotation-arrow', true)
                    .classed('anndrag', true)
                    .attr({
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
                    gd: gd,
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
                            (options.x + (dx / gs.w));
                        update[annbase + '.y'] = ya ?
                            ya.p2r(ya.r2p(options.y) + dy) :
                            (options.y - (dy / gs.h));

                        if(options.axref === options.xref) {
                            update[annbase + '.ax'] = xa.p2r(xa.r2p(options.ax) + dx);
                        }

                        if(options.ayref === options.yref) {
                            update[annbase + '.ay'] = ya.p2r(ya.r2p(options.ay) + dy);
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
        if(editTextPosition) {
            var update,
                baseTextTransform;

            // dragger for the textbox: if there's an arrow, just drag the
            // textbox and tail, leave the head untouched
            dragElement.init({
                element: annTextGroupInner.node(),
                gd: gd,
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
                    else if(!subplotId) {
                        if(xa) update[annbase + '.x'] = options.x + dx / xa._m;
                        else {
                            var widthFraction = options._xsize / gs.w,
                                xLeft = options.x + (options._xshift - options.xshift) / gs.w -
                                    widthFraction / 2;

                            update[annbase + '.x'] = dragElement.align(xLeft + dx / gs.w,
                                widthFraction, 0, 1, options.xanchor);
                        }

                        if(ya) update[annbase + '.y'] = options.y + dy / ya._m;
                        else {
                            var heightFraction = options._ysize / gs.h,
                                yBottom = options.y - (options._yshift + options.yshift) / gs.h -
                                    heightFraction / 2;

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
                    else return;

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

    if(edits.annotationText) {
        annText.call(svgTextUtils.makeEditable, {delegate: annTextGroupInner, gd: gd})
            .call(textLayout)
            .on('edit', function(_text) {
                options.text = _text;
                this.call(textLayout);

                var update = {};
                update[annbase + '.text'] = options.text;

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
