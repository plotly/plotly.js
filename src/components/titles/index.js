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
var axisIds = require('../../plots/cartesian/axis_ids');


var Titles = module.exports = {};

/**
 * Titles - (re)draw titles on the axes and plot:
 *  title can be 'xtitle', 'ytitle', 'gtitle'
 */
Titles.draw = function(gd, title) {
    var fullLayout = gd._fullLayout,
        gs = fullLayout._size,
        axletter = title.charAt(0),
        colorbar = (title.substr(1, 2) === 'cb');

    var cbnum, cont, options;

    if(colorbar) {
        var uid = title.substr(3).replace('title', '');
        gd._fullData.some(function(trace, i) {
            if(trace.uid === uid) {
                cbnum = i;
                cont = gd.calcdata[i][0].t.cb.axis;
                return true;
            }
        });
    }
    else cont = fullLayout[axisIds.id2name(title.replace('title', ''))] || fullLayout;

    var prop = (cont === fullLayout) ? 'title' : cont._name+'.title',
        name = colorbar ? 'colorscale' :
            ((cont._id || axletter).toUpperCase()+' axis'),
        font = cont.titlefont.family,
        fontSize = cont.titlefont.size,
        fontColor = cont.titlefont.color,
        x,
        y,
        transform = '',
        xa,
        ya,
        avoid = {
            selection: d3.select(gd).selectAll('g.'+cont._id+'tick'),
            side: cont.side
        },
        // multiples of fontsize to offset label from axis
        offsetBase = colorbar ? 0 : 1.5,
        avoidTransform;

    // find the transform applied to the parents of the avoid selection
    // which doesn't get picked up by Drawing.bBox
    if(colorbar) {
        avoid.offsetLeft = gs.l;
        avoid.offsetTop = gs.t;
    }
    else if(avoid.selection.size()) {
        avoidTransform = d3.select(avoid.selection.node().parentNode)
            .attr('transform')
            .match(/translate\(([-\.\d]+),([-\.\d]+)\)/);
        if(avoidTransform) {
            avoid.offsetLeft = +avoidTransform[1];
            avoid.offsetTop = +avoidTransform[2];
        }
    }

    if(colorbar && cont.titleside) {
        // argh, we only make it here if the title is on top or bottom,
        // not right
        x = gs.l + cont.titlex * gs.w;
        y = gs.t + (1 - cont.titley) * gs.h + ((cont.titleside === 'top') ?
                3 + fontSize * 0.75 : - 3 - fontSize * 0.25);
        options = {x: x, y: y, 'text-anchor': 'start'};
        avoid = {};

        // convertToTspans rotates any 'y...' by 90 degrees...
        // TODO: need a better solution than this hack
        title = 'h' + title;
    }
    else if(axletter === 'x') {
        xa = cont;
        ya = (xa.anchor === 'free') ?
            {_offset: gs.t + (1 - (xa.position || 0)) * gs.h, _length: 0} :
            axisIds.getFromId(gd, xa.anchor);

        x = xa._offset + xa._length / 2;
        y = ya._offset + ((xa.side === 'top') ?
            -10 - fontSize*(offsetBase + (xa.showticklabels ? 1 : 0)) :
            ya._length + 10 +
                fontSize*(offsetBase + (xa.showticklabels ? 1.5 : 0.5)));

        options = {x: x, y: y, 'text-anchor': 'middle'};
        if(!avoid.side) avoid.side = 'bottom';
    }
    else if(axletter === 'y') {
        ya = cont;
        xa = (ya.anchor === 'free') ?
            {_offset: gs.l + (ya.position || 0) * gs.w, _length: 0} :
            axisIds.getFromId(gd, ya.anchor);

        y = ya._offset + ya._length / 2;
        x = xa._offset + ((ya.side === 'right') ?
            xa._length + 10 +
                fontSize*(offsetBase + (ya.showticklabels ? 1 : 0.5)) :
            -10 - fontSize*(offsetBase + (ya.showticklabels ? 0.5 : 0)));

        options = {x: x, y: y, 'text-anchor': 'middle'};
        transform = {rotate: '-90', offset: 0};
        if(!avoid.side) avoid.side = 'left';
    }
    else {
        // plot title
        name = 'Plot';
        fontSize = fullLayout.titlefont.size;
        x = fullLayout.width / 2;
        y = fullLayout._size.t / 2;
        options = {x: x, y: y, 'text-anchor': 'middle'};
        avoid = {};
    }

    var opacity = 1,
        isplaceholder = false,
        txt = cont.title.trim();
    if(txt === '') opacity = 0;
    if(txt.match(/Click to enter .+ title/)) {
        opacity = 0.2;
        isplaceholder = true;
    }

    var group;
    if(colorbar) {
        group = d3.select(gd)
            .selectAll('.' + cont._id.substr(1) + ' .cbtitle');
        // this class-to-rotate thing with convertToTspans is
        // getting hackier and hackier... delete groups with the
        // wrong class
        var otherClass = title.charAt(0) === 'h' ?
            title.substr(1) : ('h' + title);
        group.selectAll('.' + otherClass + ',.' + otherClass + '-math-group')
            .remove();
    }
    else {
        group = fullLayout._infolayer.selectAll('.g-' + title)
            .data([0]);
        group.enter().append('g')
            .classed('g-' + title, true);
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
        .attr('class', title);

    function titleLayout(titleEl) {
        Lib.syncOrAsync([drawTitle,scootTitle], titleEl);
    }

    function drawTitle(titleEl) {
        titleEl.attr('transform', transform ?
            'rotate(' + [transform.rotate, options.x, options.y] +
                ') translate(0, ' + transform.offset + ')' :
            null);

        titleEl.style({
            'font-family': font,
            'font-size': d3.round(fontSize,2) + 'px',
            fill: Color.rgb(fontColor),
            opacity: opacity * Color.opacity(fontColor),
            'font-weight': Plots.fontWeight
        })
        .attr(options)
        .call(svgTextUtils.convertToTspans)
        .attr(options);

        titleEl.selectAll('tspan.line')
            .attr(options);
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
                shiftSign = (['left','top'].indexOf(avoid.side) !== -1) ?
                    -1 : 1,
                pad = isNumeric(avoid.pad) ? avoid.pad : 2,
                titlebb = Drawing.bBox(titleGroup.node()),
                paperbb = {
                    left: 0,
                    top: 0,
                    right: fullLayout.width,
                    bottom: fullLayout.height
                },
                maxshift = colorbar ? fullLayout.width:
                    (paperbb[avoid.side]-titlebb[avoid.side]) *
                    ((avoid.side === 'left' || avoid.side === 'top') ? -1 : 1);
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

    var placeholderText = 'Click to enter ' + name.replace(/\d+/, '') + ' title';

    function setPlaceholder() {
        opacity = 0;
        isplaceholder = true;
        txt = placeholderText;
        fullLayout._infolayer.select('.' + title)
            .attr({'data-unformatted': txt})
            .text(txt)
            .on('mouseover.opacity', function() {
                d3.select(this).transition()
                    .duration(100).style('opacity', 1);
            })
            .on('mouseout.opacity',function() {
                d3.select(this).transition()
                    .duration(1000).style('opacity', 0);
            });
    }

    if(gd._context.editable) {
        if(!txt) setPlaceholder();

        el.call(svgTextUtils.makeEditable)
            .on('edit', function(text) {
                if(colorbar) {
                    var trace = gd._fullData[cbnum];
                    if(Plots.traceIs(trace, 'markerColorscale')) {
                        Plotly.restyle(gd, 'marker.colorbar.title', text, cbnum);
                    }
                    else Plotly.restyle(gd, 'colorbar.title', text, cbnum);
                }
                else Plotly.relayout(gd,prop,text);
            })
            .on('cancel', function() {
                this.text(this.attr('data-unformatted'))
                    .call(titleLayout);
            })
            .on('input', function(d) {
                this.text(d || ' ').attr(options)
                    .selectAll('tspan.line')
                        .attr(options);
            });
    }
    else if(!txt || txt.match(/Click to enter .+ title/)) {
        el.remove();
    }
    el.classed('js-placeholder', isplaceholder);
};
