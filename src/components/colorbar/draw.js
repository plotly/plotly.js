/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var Plotly = require('../../plotly');
var Plots = require('../../plots/plots');
var Axes = require('../../plots/cartesian/axes');
var Fx = require('../../plots/cartesian/graph_interact');
var Lib = require('../../lib');
var Drawing = require('../drawing');
var Color = require('../color');
var Titles = require('../titles');

var handleAxisDefaults = require('../../plots/cartesian/axis_defaults');
var handleAxisPositionDefaults = require('../../plots/cartesian/position_defaults');
var axisLayoutAttrs = require('../../plots/cartesian/layout_attributes');

var attributes = require('./attributes');


module.exports = function draw(gd, id) {
    // opts: options object, containing everything from attributes
    // plus a few others that are the equivalent of the colorbar "data"
    var opts = {};
    Object.keys(attributes).forEach(function(k) {
        opts[k] = null;
    });
    // fillcolor can be a d3 scale, domain is z values, range is colors
    // or leave it out for no fill,
    // or set to a string constant for single-color fill
    opts.fillcolor = null;
    // line.color has the same options as fillcolor
    opts.line = {color: null, width: null, dash: null};
    // levels of lines to draw.
    // note that this DOES NOT determine the extent of the bar
    // that's given by the domain of fillcolor
    // (or line.color if no fillcolor domain)
    opts.levels = {start: null, end: null, size: null};
    // separate fill levels (for example, heatmap coloring of a
    // contour map) if this is omitted, fillcolors will be
    // evaluated halfway between levels
    opts.filllevels = null;

    function component() {
        var fullLayout = gd._fullLayout;
        if((typeof opts.fillcolor !== 'function') &&
                (typeof opts.line.color !== 'function')) {
            fullLayout._infolayer.selectAll('g.'+id).remove();
            return;
        }
        var zrange = d3.extent(((typeof opts.fillcolor === 'function') ?
                opts.fillcolor : opts.line.color).domain()),
            linelevels = [],
            filllevels = [],
            l,
            linecolormap = typeof opts.line.color === 'function' ?
                opts.line.color : function() { return opts.line.color; },
            fillcolormap = typeof opts.fillcolor === 'function' ?
                opts.fillcolor : function() { return opts.fillcolor; };

        var l0 = opts.levels.end + opts.levels.size/100,
            ls = opts.levels.size,
            zr0 = (1.001 * zrange[0] - 0.001 * zrange[1]),
            zr1 = (1.001 * zrange[1] - 0.001 * zrange[0]);
        for(l = opts.levels.start; (l - l0) * ls < 0; l += ls) {
            if(l > zr0 && l < zr1) linelevels.push(l);
        }

        if(typeof opts.fillcolor === 'function') {
            if(opts.filllevels) {
                l0 = opts.filllevels.end + opts.filllevels.size / 100;
                ls = opts.filllevels.size;
                for(l = opts.filllevels.start; (l - l0) * ls < 0; l += ls) {
                    if(l > zrange[0] && l < zrange[1]) filllevels.push(l);
                }
            }
            else {
                filllevels = linelevels.map(function(v) {
                    return v-opts.levels.size / 2;
                });
                filllevels.push(filllevels[filllevels.length - 1] +
                    opts.levels.size);
            }
        }
        else if(opts.fillcolor && typeof opts.fillcolor==='string') {
            // doesn't matter what this value is, with a single value
            // we'll make a single fill rect covering the whole bar
            filllevels = [0];
        }

        if(opts.levels.size<0) {
            linelevels.reverse();
            filllevels.reverse();
        }

        // now make a Plotly Axes object to scale with and draw ticks
        // TODO: does not support orientation other than right

        // we calculate pixel sizes based on the specified graph size,
        // not the actual (in case something pushed the margins around)
        // which is a little odd but avoids an odd iterative effect
        // when the colorbar itself is pushing the margins.
        // but then the fractional size is calculated based on the
        // actual graph size, so that the axes will size correctly.
        var originalPlotHeight = fullLayout.height - fullLayout.margin.t - fullLayout.margin.b,
            originalPlotWidth = fullLayout.width - fullLayout.margin.l - fullLayout.margin.r,
            thickPx = Math.round(opts.thickness *
                (opts.thicknessmode==='fraction' ? originalPlotWidth : 1)),
            thickFrac = thickPx / fullLayout._size.w,
            lenPx = Math.round(opts.len *
                (opts.lenmode==='fraction' ? originalPlotHeight : 1)),
            lenFrac = lenPx / fullLayout._size.h,
            xpadFrac = opts.xpad/fullLayout._size.w,
            yExtraPx = (opts.borderwidth + opts.outlinewidth)/2,
            ypadFrac = opts.ypad / fullLayout._size.h,

            // x positioning: do it initially just for left anchor,
            // then fix at the end (since we don't know the width yet)
            xLeft = Math.round(opts.x*fullLayout._size.w + opts.xpad),
            // for dragging... this is getting a little muddled...
            xLeftFrac = opts.x - thickFrac *
                ({middle: 0.5, right: 1}[opts.xanchor]||0),

            // y positioning we can do correctly from the start
            yBottomFrac = opts.y + lenFrac *
                (({top: -0.5, bottom: 0.5}[opts.yanchor] || 0) - 0.5),
            yBottomPx = Math.round(fullLayout._size.h * (1-yBottomFrac)),
            yTopPx = yBottomPx-lenPx,
            titleEl,
            cbAxisIn = {
                type: 'linear',
                range: zrange,
                tickmode: opts.tickmode,
                nticks: opts.nticks,
                tick0: opts.tick0,
                dtick: opts.dtick,
                tickvals: opts.tickvals,
                ticktext: opts.ticktext,
                ticks: opts.ticks,
                ticklen: opts.ticklen,
                tickwidth: opts.tickwidth,
                tickcolor: opts.tickcolor,
                showticklabels: opts.showticklabels,
                tickfont: opts.tickfont,
                tickangle: opts.tickangle,
                tickformat: opts.tickformat,
                exponentformat: opts.exponentformat,
                showexponent: opts.showexponent,
                showtickprefix: opts.showtickprefix,
                tickprefix: opts.tickprefix,
                showticksuffix: opts.showticksuffix,
                ticksuffix: opts.ticksuffix,
                title: opts.title,
                titlefont: opts.titlefont,
                anchor: 'free',
                position: 1
            },
            cbAxisOut = {},
            axisOptions = {
                letter: 'y',
                font: fullLayout.font,
                noHover: true
            };

        // Coerce w.r.t. Axes layoutAttributes:
        // re-use axes.js logic without updating _fullData
        function coerce(attr, dflt) {
            return Lib.coerce(cbAxisIn, cbAxisOut, axisLayoutAttrs, attr, dflt);
        }

        // Prepare the Plotly axis object
        handleAxisDefaults(cbAxisIn, cbAxisOut, coerce, axisOptions);
        handleAxisPositionDefaults(cbAxisIn, cbAxisOut, coerce, axisOptions);

        cbAxisOut._id = 'y' + id;
        cbAxisOut._td = gd;

        // position can't go in through supplyDefaults
        // because that restricts it to [0,1]
        cbAxisOut.position = opts.x + xpadFrac + thickFrac;

        // save for other callers to access this axis
        component.axis = cbAxisOut;

        if(['top','bottom'].indexOf(opts.titleside)!==-1) {
            cbAxisOut.titleside = opts.titleside;
            cbAxisOut.titlex = opts.x + xpadFrac;
            cbAxisOut.titley = yBottomFrac +
                (opts.titleside==='top' ? lenFrac-ypadFrac : ypadFrac);
        }

        if(opts.line.color && opts.tickmode === 'auto') {
            cbAxisOut.tickmode = 'linear';
            cbAxisOut.tick0 = opts.levels.start;
            var dtick = opts.levels.size;
            // expand if too many contours, so we don't get too many ticks
            var autoNtick = Lib.constrain(
                    (yBottomPx-yTopPx)/50, 4, 15) + 1,
                dtFactor = (zrange[1]-zrange[0]) /
                    ((opts.nticks||autoNtick)*dtick);
            if(dtFactor>1) {
                var dtexp = Math.pow(10,Math.floor(
                    Math.log(dtFactor)/Math.LN10));
                dtick *= dtexp * Lib.roundUp(dtFactor/dtexp,[2,5,10]);
                // if the contours are at round multiples, reset tick0
                // so they're still at round multiples. Otherwise,
                // keep the first label on the first contour level
                if((Math.abs(opts.levels.start)/
                        opts.levels.size+1e-6)%1 < 2e-6) {
                    cbAxisOut.tick0 = 0;
                }
            }
            cbAxisOut.dtick = dtick;
        }

        // set domain after init, because we may want to
        // allow it outside [0,1]
        cbAxisOut.domain = [
            yBottomFrac+ypadFrac,
            yBottomFrac+lenFrac-ypadFrac
        ];
        cbAxisOut.setScale();

        // now draw the elements
        var container = fullLayout._infolayer.selectAll('g.'+id).data([0]);
        container.enter().append('g').classed(id,true)
            .each(function() {
                var s = d3.select(this);
                s.append('rect').classed('cbbg',true);
                s.append('g').classed('cbfills',true);
                s.append('g').classed('cblines',true);
                s.append('g').classed('cbaxis',true).classed('crisp',true);
                s.append('g').classed('cbtitleunshift',true)
                    .append('g').classed('cbtitle',true);
                s.append('rect').classed('cboutline',true);
            });
        container.attr('transform','translate('+Math.round(fullLayout._size.l)+
            ','+Math.round(fullLayout._size.t)+')');
        // TODO: this opposite transform is a hack until we make it
        // more rational which items get this offset
        var titleCont = container.select('.cbtitleunshift')
            .attr('transform', 'translate(-'+
                Math.round(fullLayout._size.l) + ',-' +
                Math.round(fullLayout._size.t) + ')');

        cbAxisOut._axislayer = container.select('.cbaxis');
        var titleHeight = 0;
        if(['top', 'bottom'].indexOf(opts.titleside) !== -1) {
            // draw the title so we know how much room it needs
            // when we squish the axis
            Titles.draw(gd, cbAxisOut._id + 'title');
        }

        function drawAxis() {
            if(['top','bottom'].indexOf(opts.titleside)!==-1) {
                // squish the axis top to make room for the title
                var titleGroup = container.select('.cbtitle'),
                    titleText = titleGroup.select('text'),
                    titleTrans =
                        [-opts.outlinewidth/2, opts.outlinewidth/2],
                    mathJaxNode = titleGroup
                        .select('.h'+cbAxisOut._id+'title-math-group')
                        .node(),
                    lineSize = 15.6;
                if(titleText.node()) {
                    lineSize =
                        parseInt(titleText.style('font-size'), 10) * 1.3;
                }
                if(mathJaxNode) {
                    titleHeight = Drawing.bBox(mathJaxNode).height;
                    if(titleHeight>lineSize) {
                        // not entirely sure how mathjax is doing
                        // vertical alignment, but this seems to work.
                        titleTrans[1] -= (titleHeight-lineSize)/2;
                    }
                }
                else if(titleText.node() &&
                        !titleText.classed('js-placeholder')) {
                    titleHeight = Drawing.bBox(
                        titleGroup.node()).height;
                }
                if(titleHeight) {
                    // buffer btwn colorbar and title
                    // TODO: configurable
                    titleHeight += 5;

                    if(opts.titleside==='top') {
                        cbAxisOut.domain[1] -= titleHeight/fullLayout._size.h;
                        titleTrans[1] *= -1;
                    }
                    else {
                        cbAxisOut.domain[0] += titleHeight/fullLayout._size.h;
                        var nlines = Math.max(1,
                            titleText.selectAll('tspan.line').size());
                        titleTrans[1] += (1-nlines)*lineSize;
                    }

                    titleGroup.attr('transform',
                        'translate('+titleTrans+')');

                    cbAxisOut.setScale();
                }
            }

            container.selectAll('.cbfills,.cblines,.cbaxis')
                .attr('transform','translate(0,'+
                    Math.round(fullLayout._size.h*(1-cbAxisOut.domain[1]))+')');

            var fills = container.select('.cbfills')
                .selectAll('rect.cbfill')
                    .data(filllevels);
            fills.enter().append('rect')
                .classed('cbfill',true)
                .style('stroke','none');
            fills.exit().remove();
            fills.each(function(d,i) {
                var z = [
                    (i===0) ? zrange[0] :
                        (filllevels[i]+filllevels[i-1])/2,
                    (i===filllevels.length-1) ? zrange[1] :
                        (filllevels[i]+filllevels[i+1])/2
                ]
                .map(cbAxisOut.c2p)
                .map(Math.round);

                // offset the side adjoining the next rectangle so they
                // overlap, to prevent antialiasing gaps
                if(i!==filllevels.length-1) {
                    z[1] += (z[1]>z[0]) ? 1 : -1;
                }
                d3.select(this).attr({
                    x: xLeft,
                    width: Math.max(thickPx,2),
                    y: d3.min(z),
                    height: Math.max(d3.max(z)-d3.min(z),2)
                })
                .style('fill',fillcolormap(d));
            });

            var lines = container.select('.cblines')
                .selectAll('path.cbline')
                    .data(opts.line.color && opts.line.width ?
                        linelevels : []);
            lines.enter().append('path')
                .classed('cbline',true);
            lines.exit().remove();
            lines.each(function(d) {
                d3.select(this)
                    .attr('d','M'+xLeft+',' +
                        (Math.round(cbAxisOut.c2p(d))+(opts.line.width/2)%1) +
                        'h'+thickPx)
                    .call(Drawing.lineGroupStyle,
                        opts.line.width, linecolormap(d), opts.line.dash);
            });

            // force full redraw of labels and ticks
            cbAxisOut._axislayer.selectAll('g.'+cbAxisOut._id+'tick,path')
                .remove();

            cbAxisOut._pos = xLeft+thickPx +
                (opts.outlinewidth||0)/2 - (opts.ticks==='outside' ? 1 : 0);
            cbAxisOut.side = 'right';

            return Axes.doTicks(gd, cbAxisOut);
        }

        function positionCB() {
            // wait for the axis & title to finish rendering before
            // continuing positioning
            // TODO: why are we redrawing multiple times now with this?
            // I guess autoMargin doesn't like being post-promise?
            var innerWidth = thickPx + opts.outlinewidth/2 +
                    Drawing.bBox(cbAxisOut._axislayer.node()).width;
            titleEl = titleCont.select('text');
            if(titleEl.node() && !titleEl.classed('js-placeholder')) {
                var mathJaxNode = titleCont
                        .select('.h'+cbAxisOut._id+'title-math-group')
                        .node(),
                    titleWidth;
                if(mathJaxNode &&
                        ['top','bottom'].indexOf(opts.titleside)!==-1) {
                    titleWidth = Drawing.bBox(mathJaxNode).width;
                }
                else {
                    // note: the formula below works for all titlesides,
                    // (except for top/bottom mathjax, above)
                    // but the weird fullLayout._size.l is because the titleunshift
                    // transform gets removed by Drawing.bBox
                    titleWidth =
                        Drawing.bBox(titleCont.node()).right -
                        xLeft - fullLayout._size.l;
                }
                innerWidth = Math.max(innerWidth,titleWidth);
            }

            var outerwidth = 2*opts.xpad + innerWidth +
                    opts.borderwidth + opts.outlinewidth/2,
                outerheight = yBottomPx-yTopPx;

            container.select('.cbbg').attr({
                x: xLeft-opts.xpad -
                    (opts.borderwidth + opts.outlinewidth)/2,
                y: yTopPx - yExtraPx,
                width: Math.max(outerwidth,2),
                height: Math.max(outerheight + 2*yExtraPx,2)
            })
            .call(Color.fill, opts.bgcolor)
            .call(Color.stroke, opts.bordercolor)
            .style({'stroke-width': opts.borderwidth});

            container.selectAll('.cboutline').attr({
                x: xLeft,
                y: yTopPx + opts.ypad +
                    (opts.titleside==='top' ? titleHeight : 0),
                width: Math.max(thickPx,2),
                height: Math.max(outerheight - 2*opts.ypad - titleHeight, 2)
            })
            .call(Color.stroke, opts.outlinecolor)
            .style({
                fill: 'None',
                'stroke-width': opts.outlinewidth
            });

            // fix positioning for xanchor!='left'
            var xoffset = ({center: 0.5, right: 1}[opts.xanchor] || 0) *
                outerwidth;
            container.attr('transform',
                'translate('+(fullLayout._size.l-xoffset)+','+fullLayout._size.t+')');

            //auto margin adjustment
            Plots.autoMargin(gd, id,{
                x: opts.x,
                y: opts.y,
                l: outerwidth * ({right: 1, center: 0.5}[opts.xanchor] || 0),
                r: outerwidth * ({left: 1, center: 0.5}[opts.xanchor] || 0),
                t: outerheight * ({bottom: 1, middle: 0.5}[opts.yanchor] || 0),
                b: outerheight * ({top: 1, middle: 0.5}[opts.yanchor] || 0)
            });
        }

        var cbDone = Lib.syncOrAsync([
            Plots.previousPromises,
            drawAxis,
            Plots.previousPromises,
            positionCB
        ], gd);

        if(cbDone && cbDone.then) (gd._promises || []).push(cbDone);

        // dragging...
        if(gd._context.editable) {
            var t0,
                xf,
                yf;

            Fx.dragElement({
                element: container.node(),
                prepFn: function() {
                    t0 = container.attr('transform');
                    Fx.setCursor(container);
                },
                moveFn: function(dx, dy) {
                    var gs = gd._fullLayout._size;

                    container.attr('transform',
                        t0+' ' + 'translate('+dx+','+dy+')');

                    xf = Fx.dragAlign(xLeftFrac + (dx/gs.w), thickFrac,
                        0, 1, opts.xanchor);
                    yf = Fx.dragAlign(yBottomFrac - (dy/gs.h), lenFrac,
                        0, 1, opts.yanchor);

                    var csr = Fx.dragCursors(xf, yf,
                        opts.xanchor, opts.yanchor);
                    Fx.setCursor(container, csr);
                },
                doneFn: function(dragged) {
                    Fx.setCursor(container);

                    if(dragged && xf!==undefined && yf!==undefined) {
                        var idNum = id.substr(2),
                            traceNum;
                        gd._fullData.some(function(trace) {
                            if(trace.uid===idNum) {
                                traceNum = trace.index;
                                return true;
                            }
                        });

                        Plotly.restyle(gd,
                            {'colorbar.x': xf, 'colorbar.y': yf},
                            traceNum);
                    }
                }
            });
        }
        return cbDone;
    }

    // setter/getters for every item defined in opts
    Object.keys(opts).forEach(function(name) {
        component[name] = function(v) {
            // getter
            if(!arguments.length) return opts[name];

            // setter - for multi-part properties,
            // set only the parts that are provided
            opts[name] = Lib.isPlainObject(opts[name]) ?
                 Lib.extendFlat(opts[name], v) :
                 v;

            return component;
        };
    });

    // or use .options to set multiple options at once via a dictionary
    component.options = function(o) {
        Object.keys(o).forEach(function(name) {
            // in case something random comes through
            // that's not an option, ignore it
            if(typeof component[name]==='function') {
                component[name](o[name]);
            }
        });
        return component;
    };

    component._opts = opts;

    return component;
};
