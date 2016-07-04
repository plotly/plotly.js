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
var Drawing = require('../drawing');
var Color = require('../color');
var svgTextUtils = require('../../lib/svg_text_utils');


var Titles = module.exports = {};

/**
 * Titles - (re)draw titles on the axes and plot:
 * @param {DOM element} gd - the graphDiv
 * @param {string} titleClass - the css class of this title
 * @param {object} options - how and what to draw
 *      propContainer - the layout object containing `title` and `titlefont`
 *          attributes that apply to this title
 *      propName - the full name of the title property (for Plotly.relayout)
 *      [traceIndex] - include only if this property applies to one trace
 *          (such as a colorbar title) - then editing pipes to Plotly.restyle
 *          instead of Plotly.relayout
 *      dfltName - the name of the title in placeholder text
 *      [avoid] {object} - include if this title should move to avoid other elements
 *          selection - d3 selection of elements to avoid
 *          side - which direction to move if there is a conflict
 *          [offsetLeft] - if these elements are subject to a translation
 *              wrt the title element
 *          [offsetTop]
 *      attributes {object} - position and alignment attributes
 *          x - pixels
 *          y - pixels
 *          text-anchor - start|middle|end
 *      transform {object} - how to transform the title after positioning
 *          rotate - degrees
 *          offset - shift up/down in the rotated frame (unused?)
 *      containerGroup - if an svg <g> element already exists to hold this
 *          title, include here. Otherwise it will go in fullLayout._infolayer
 */
Titles.draw = function(gd, titleClass, options) {
    var cont = options.propContainer,
        prop = options.propName,
        traceIndex = options.traceIndex,
        name = options.dfltName,
        avoid = options.avoid || {},
        attributes = options.attributes,
        transform = options.transform,
        group = options.containerGroup,

        fullLayout = gd._fullLayout,
        font = cont.titlefont.family,
        fontSize = cont.titlefont.size,
        fontColor = cont.titlefont.color,

        opacity = 1,
        isplaceholder = false,
        txt = cont.title.trim();
    if(txt === '') opacity = 0;
    if(txt.match(/Click to enter .+ title/)) {
        opacity = 0.2;
        isplaceholder = true;
    }

    if(!group) {
        group = fullLayout._infolayer.selectAll('.g-' + titleClass)
            .data([0]);
        group.enter().append('g')
            .classed('g-' + titleClass, true);
    }

    var el = group.selectAll('text')
        .data([0]);
    el.enter().append('text');
    el.text(txt)
        // this is hacky, but convertToTspans uses the class
        // to determine whether to rotate mathJax...
        // so we need to clear out any old class and put the
        // correct one (only relevant for colorbars, at least
        // for now) - ie don't use .classed
        .attr('class', titleClass);

    function titleLayout(titleEl) {
        Lib.syncOrAsync([drawTitle, scootTitle], titleEl);
    }

    function drawTitle(titleEl) {
        titleEl.attr('transform', transform ?
            'rotate(' + [transform.rotate, attributes.x, attributes.y] +
                ') translate(0, ' + transform.offset + ')' :
            null);

        titleEl.style({
            'font-family': font,
            'font-size': d3.round(fontSize, 2) + 'px',
            fill: Color.rgb(fontColor),
            opacity: opacity * Color.opacity(fontColor),
            'font-weight': Plots.fontWeight
        })
        .attr(attributes)
        .call(svgTextUtils.convertToTspans)
        .attr(attributes);

        titleEl.selectAll('tspan.line')
            .attr(attributes);
        return Plots.previousPromises(gd);
    }

    function scootTitle(titleElIn) {
        var titleGroup = d3.select(titleElIn.node().parentNode);

        if(avoid && avoid.selection && avoid.side && txt) {
            titleGroup.attr('transform', null);

            // move toward avoid.side (= left, right, top, bottom) if needed
            // can include pad (pixels, default 2)
            var shift = 0,
                backside = {
                    left: 'right',
                    right: 'left',
                    top: 'bottom',
                    bottom: 'top'
                }[avoid.side],
                shiftSign = (['left', 'top'].indexOf(avoid.side) !== -1) ?
                    -1 : 1,
                pad = isNumeric(avoid.pad) ? avoid.pad : 2,
                titlebb = Drawing.bBox(titleGroup.node()),
                paperbb = {
                    left: 0,
                    top: 0,
                    right: fullLayout.width,
                    bottom: fullLayout.height
                },
                maxshift = avoid.maxShift || (
                    (paperbb[avoid.side] - titlebb[avoid.side]) *
                    ((avoid.side === 'left' || avoid.side === 'top') ? -1 : 1));
            // Prevent the title going off the paper
            if(maxshift < 0) shift = maxshift;
            else {
                // so we don't have to offset each avoided element,
                // give the title the opposite offset
                titlebb.left -= avoid.offsetLeft;
                titlebb.right -= avoid.offsetLeft;
                titlebb.top -= avoid.offsetTop;
                titlebb.bottom -= avoid.offsetTop;

                // iterate over a set of elements (avoid.selection)
                // to avoid collisions with
                avoid.selection.each(function() {
                    var avoidbb = Drawing.bBox(this);

                    if(Lib.bBoxIntersect(titlebb, avoidbb, pad)) {
                        shift = Math.max(shift, shiftSign * (
                            avoidbb[avoid.side] - titlebb[backside]) + pad);
                    }
                });
                shift = Math.min(maxshift, shift);
            }
            if(shift > 0 || maxshift < 0) {
                var shiftTemplate = {
                    left: [-shift, 0],
                    right: [shift, 0],
                    top: [0, -shift],
                    bottom: [0, shift]
                }[avoid.side];
                titleGroup.attr('transform',
                    'translate(' + shiftTemplate + ')');
            }
        }
    }

    el.attr({'data-unformatted': txt})
        .call(titleLayout);

    var placeholderText = 'Click to enter ' + name + ' title';

    function setPlaceholder() {
        opacity = 0;
        isplaceholder = true;
        txt = placeholderText;
        fullLayout._infolayer.select('.' + titleClass)
            .attr({'data-unformatted': txt})
            .text(txt)
            .on('mouseover.opacity', function() {
                d3.select(this).transition()
                    .duration(100).style('opacity', 1);
            })
            .on('mouseout.opacity', function() {
                d3.select(this).transition()
                    .duration(1000).style('opacity', 0);
            });
    }

    if(gd._context.editable) {
        if(!txt) setPlaceholder();

        el.call(svgTextUtils.makeEditable)
            .on('edit', function(text) {
                if(traceIndex !== undefined) Plotly.restyle(gd, prop, text, traceIndex);
                else Plotly.relayout(gd, prop, text);
            })
            .on('cancel', function() {
                this.text(this.attr('data-unformatted'))
                    .call(titleLayout);
            })
            .on('input', function(d) {
                this.text(d || ' ').attr(attributes)
                    .selectAll('tspan.line')
                        .attr(attributes);
            });
    }
    else if(!txt || txt.match(/Click to enter .+ title/)) {
        el.remove();
    }
    el.classed('js-placeholder', isplaceholder);
};
