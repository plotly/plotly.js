/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var tinycolor = require('tinycolor2');

var Plots = require('../../plots/plots');
var Registry = require('../../registry');
var Axes = require('../../plots/cartesian/axes');
var dragElement = require('../dragelement');
var Lib = require('../../lib');
var extendFlat = require('../../lib/extend').extendFlat;
var setCursor = require('../../lib/setcursor');
var Drawing = require('../drawing');
var Color = require('../color');
var Titles = require('../titles');
var svgTextUtils = require('../../lib/svg_text_utils');
var LINE_SPACING = require('../../constants/alignment').LINE_SPACING;

var handleAxisDefaults = require('../../plots/cartesian/axis_defaults');
var handleAxisPositionDefaults = require('../../plots/cartesian/position_defaults');
var axisLayoutAttrs = require('../../plots/cartesian/layout_attributes');

var attributes = require('./attributes');
var cn = require('./constants').cn;

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
        var fullLayout = gd._fullLayout,
            gs = fullLayout._size;
        if((typeof opts.fillcolor !== 'function') &&
                (typeof opts.line.color !== 'function')) {
            fullLayout._infolayer.selectAll('g.' + id).remove();
            return;
        }
        var zrange = d3.extent(((typeof opts.fillcolor === 'function') ?
            opts.fillcolor : opts.line.color).domain());
        var linelevels = [];
        var filllevels = [];
        var linecolormap = typeof opts.line.color === 'function' ?
            opts.line.color : function() { return opts.line.color; };
        var fillcolormap = typeof opts.fillcolor === 'function' ?
            opts.fillcolor : function() { return opts.fillcolor; };
        var l;
        var i;

        var l0 = opts.levels.end + opts.levels.size / 100,
            ls = opts.levels.size,
            zr0 = (1.001 * zrange[0] - 0.001 * zrange[1]),
            zr1 = (1.001 * zrange[1] - 0.001 * zrange[0]);
        for(i = 0; i < 1e5; i++) {
            l = opts.levels.start + i * ls;
            if(ls > 0 ? (l >= l0) : (l <= l0)) break;
            if(l > zr0 && l < zr1) linelevels.push(l);
        }

        if(typeof opts.fillcolor === 'function') {
            if(opts.filllevels) {
                l0 = opts.filllevels.end + opts.filllevels.size / 100;
                ls = opts.filllevels.size;
                for(i = 0; i < 1e5; i++) {
                    l = opts.filllevels.start + i * ls;
                    if(ls > 0 ? (l >= l0) : (l <= l0)) break;
                    if(l > zrange[0] && l < zrange[1]) filllevels.push(l);
                }
            }
            else {
                filllevels = linelevels.map(function(v) {
                    return v - opts.levels.size / 2;
                });
                filllevels.push(filllevels[filllevels.length - 1] +
                    opts.levels.size);
            }
        }
        else if(opts.fillcolor && typeof opts.fillcolor === 'string') {
            // doesn't matter what this value is, with a single value
            // we'll make a single fill rect covering the whole bar
            filllevels = [0];
        }

        if(opts.levels.size < 0) {
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
                (opts.thicknessmode === 'fraction' ? originalPlotWidth : 1)),
            thickFrac = thickPx / gs.w,
            lenPx = Math.round(opts.len *
                (opts.lenmode === 'fraction' ? originalPlotHeight : 1)),
            lenFrac = lenPx / gs.h,
            xpadFrac = opts.xpad / gs.w,
            yExtraPx = (opts.borderwidth + opts.outlinewidth) / 2,
            ypadFrac = opts.ypad / gs.h,

            // x positioning: do it initially just for left anchor,
            // then fix at the end (since we don't know the width yet)
            xLeft = Math.round(opts.x * gs.w + opts.xpad),
            // for dragging... this is getting a little muddled...
            xLeftFrac = opts.x - thickFrac *
                ({middle: 0.5, right: 1}[opts.xanchor]||0),

            // y positioning we can do correctly from the start
            yBottomFrac = opts.y + lenFrac *
                (({top: -0.5, bottom: 0.5}[opts.yanchor] || 0) - 0.5),
            yBottomPx = Math.round(gs.h * (1 - yBottomFrac)),
            yTopPx = yBottomPx - lenPx,
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
                separatethousands: opts.separatethousands,
                showexponent: opts.showexponent,
                showtickprefix: opts.showtickprefix,
                tickprefix: opts.tickprefix,
                showticksuffix: opts.showticksuffix,
                ticksuffix: opts.ticksuffix,
                title: opts.title,
                titlefont: opts.titlefont,
                showline: true,
                anchor: 'free',
                position: 1
            },
            cbAxisOut = {
                type: 'linear',
                _id: 'y' + id
            },
            axisOptions = {
                letter: 'y',
                font: fullLayout.font,
                noHover: true,
                calendar: fullLayout.calendar  // not really necessary (yet?)
            };

        // Coerce w.r.t. Axes layoutAttributes:
        // re-use axes.js logic without updating _fullData
        function coerce(attr, dflt) {
            return Lib.coerce(cbAxisIn, cbAxisOut, axisLayoutAttrs, attr, dflt);
        }

        // Prepare the Plotly axis object
        handleAxisDefaults(cbAxisIn, cbAxisOut, coerce, axisOptions, fullLayout);
        handleAxisPositionDefaults(cbAxisIn, cbAxisOut, coerce, axisOptions);

        // position can't go in through supplyDefaults
        // because that restricts it to [0,1]
        cbAxisOut.position = opts.x + xpadFrac + thickFrac;

        // save for other callers to access this axis
        component.axis = cbAxisOut;

        if(['top', 'bottom'].indexOf(opts.titleside) !== -1) {
            cbAxisOut.titleside = opts.titleside;
            cbAxisOut.titlex = opts.x + xpadFrac;
            cbAxisOut.titley = yBottomFrac +
                (opts.titleside === 'top' ? lenFrac - ypadFrac : ypadFrac);
        }

        if(opts.line.color && opts.tickmode === 'auto') {
            cbAxisOut.tickmode = 'linear';
            cbAxisOut.tick0 = opts.levels.start;
            var dtick = opts.levels.size;
            // expand if too many contours, so we don't get too many ticks
            var autoNtick = Lib.constrain(
                    (yBottomPx - yTopPx) / 50, 4, 15) + 1,
                dtFactor = (zrange[1] - zrange[0]) /
                    ((opts.nticks || autoNtick) * dtick);
            if(dtFactor > 1) {
                var dtexp = Math.pow(10, Math.floor(
                    Math.log(dtFactor) / Math.LN10));
                dtick *= dtexp * Lib.roundUp(dtFactor / dtexp, [2, 5, 10]);
                // if the contours are at round multiples, reset tick0
                // so they're still at round multiples. Otherwise,
                // keep the first label on the first contour level
                if((Math.abs(opts.levels.start) /
                        opts.levels.size + 1e-6) % 1 < 2e-6) {
                    cbAxisOut.tick0 = 0;
                }
            }
            cbAxisOut.dtick = dtick;
        }

        // set domain after init, because we may want to
        // allow it outside [0,1]
        cbAxisOut.domain = [
            yBottomFrac + ypadFrac,
            yBottomFrac + lenFrac - ypadFrac
        ];
        cbAxisOut.setScale();

        // now draw the elements
        var container = Lib.ensureSingle(fullLayout._infolayer, 'g', id, function(s) {
            s.classed(cn.colorbar, true)
                .each(function() {
                    var s = d3.select(this);
                    s.append('rect').classed(cn.cbbg, true);
                    s.append('g').classed(cn.cbfills, true);
                    s.append('g').classed(cn.cblines, true);
                    s.append('g').classed(cn.cbaxis, true).classed(cn.crisp, true);
                    s.append('g').classed(cn.cbtitleunshift, true)
                        .append('g').classed(cn.cbtitle, true);
                    s.append('rect').classed(cn.cboutline, true);
                    s.select('.cbtitle').datum(0);
                });
        });

        container.attr('transform', 'translate(' + Math.round(gs.l) +
            ',' + Math.round(gs.t) + ')');
        // TODO: this opposite transform is a hack until we make it
        // more rational which items get this offset
        var titleCont = container.select('.cbtitleunshift')
            .attr('transform', 'translate(-' +
                Math.round(gs.l) + ',-' +
                Math.round(gs.t) + ')');

        cbAxisOut._axislayer = container.select('.cbaxis');
        var titleHeight = 0;
        if(['top', 'bottom'].indexOf(opts.titleside) !== -1) {
            // draw the title so we know how much room it needs
            // when we squish the axis. This one only applies to
            // top or bottom titles, not right side.
            var x = gs.l + (opts.x + xpadFrac) * gs.w,
                fontSize = cbAxisOut.titlefont.size,
                y;

            if(opts.titleside === 'top') {
                y = (1 - (yBottomFrac + lenFrac - ypadFrac)) * gs.h +
                    gs.t + 3 + fontSize * 0.75;
            }
            else {
                y = (1 - (yBottomFrac + ypadFrac)) * gs.h +
                    gs.t - 3 - fontSize * 0.25;
            }
            drawTitle(cbAxisOut._id + 'title', {
                attributes: {x: x, y: y, 'text-anchor': 'start'}
            });
        }

        function drawAxis() {
            if(['top', 'bottom'].indexOf(opts.titleside) !== -1) {
                // squish the axis top to make room for the title
                var titleGroup = container.select('.cbtitle'),
                    titleText = titleGroup.select('text'),
                    titleTrans =
                        [-opts.outlinewidth / 2, opts.outlinewidth / 2],
                    mathJaxNode = titleGroup
                        .select('.h' + cbAxisOut._id + 'title-math-group')
                        .node(),
                    lineSize = 15.6;
                if(titleText.node()) {
                    lineSize =
                        parseInt(titleText.node().style.fontSize, 10) * LINE_SPACING;
                }
                if(mathJaxNode) {
                    titleHeight = Drawing.bBox(mathJaxNode).height;
                    if(titleHeight > lineSize) {
                        // not entirely sure how mathjax is doing
                        // vertical alignment, but this seems to work.
                        titleTrans[1] -= (titleHeight - lineSize) / 2;
                    }
                }
                else if(titleText.node() &&
                        !titleText.classed(cn.jsPlaceholder)) {
                    titleHeight = Drawing.bBox(titleText.node()).height;
                }
                if(titleHeight) {
                    // buffer btwn colorbar and title
                    // TODO: configurable
                    titleHeight += 5;

                    if(opts.titleside === 'top') {
                        cbAxisOut.domain[1] -= titleHeight / gs.h;
                        titleTrans[1] *= -1;
                    }
                    else {
                        cbAxisOut.domain[0] += titleHeight / gs.h;
                        var nlines = svgTextUtils.lineCount(titleText);
                        titleTrans[1] += (1 - nlines) * lineSize;
                    }

                    titleGroup.attr('transform',
                        'translate(' + titleTrans + ')');

                    cbAxisOut.setScale();
                }
            }

            container.selectAll('.cbfills,.cblines')
                .attr('transform', 'translate(0,' +
                    Math.round(gs.h * (1 - cbAxisOut.domain[1])) + ')');

            cbAxisOut._axislayer.attr('transform', 'translate(0,' +
                Math.round(-gs.t) + ')');

            var fills = container.select('.cbfills')
                .selectAll('rect.cbfill')
                    .data(filllevels);
            fills.enter().append('rect')
                .classed(cn.cbfill, true)
                .style('stroke', 'none');
            fills.exit().remove();
            fills.each(function(d, i) {
                var z = [
                    (i === 0) ? zrange[0] :
                        (filllevels[i] + filllevels[i - 1]) / 2,
                    (i === filllevels.length - 1) ? zrange[1] :
                        (filllevels[i] + filllevels[i + 1]) / 2
                ]
                .map(cbAxisOut.c2p)
                .map(Math.round);

                // offset the side adjoining the next rectangle so they
                // overlap, to prevent antialiasing gaps
                if(i !== filllevels.length - 1) {
                    z[1] += (z[1] > z[0]) ? 1 : -1;
                }


                // Tinycolor can't handle exponents and
                // at this scale, removing it makes no difference.
                var colorString = fillcolormap(d).replace('e-', ''),
                    opaqueColor = tinycolor(colorString).toHexString();

                // Colorbar cannot currently support opacities so we
                // use an opaque fill even when alpha channels present
                d3.select(this).attr({
                    x: xLeft,
                    width: Math.max(thickPx, 2),
                    y: d3.min(z),
                    height: Math.max(d3.max(z) - d3.min(z), 2),
                    fill: opaqueColor
                });
            });

            var lines = container.select('.cblines')
                .selectAll('path.cbline')
                    .data(opts.line.color && opts.line.width ?
                        linelevels : []);
            lines.enter().append('path')
                .classed(cn.cbline, true);
            lines.exit().remove();
            lines.each(function(d) {
                d3.select(this)
                    .attr('d', 'M' + xLeft + ',' +
                        (Math.round(cbAxisOut.c2p(d)) + (opts.line.width / 2) % 1) +
                        'h' + thickPx)
                    .call(Drawing.lineGroupStyle,
                        opts.line.width, linecolormap(d), opts.line.dash);
            });

            // force full redraw of labels and ticks
            cbAxisOut._axislayer.selectAll('g.' + cbAxisOut._id + 'tick,path')
                .remove();

            cbAxisOut._pos = xLeft + thickPx +
                (opts.outlinewidth||0) / 2 - (opts.ticks === 'outside' ? 1 : 0);
            cbAxisOut.side = 'right';

            // separate out axis and title drawing,
            // so we don't need such complicated logic in Titles.draw
            // if title is on the top or bottom, we've already drawn it
            // this title call only handles side=right
            return Lib.syncOrAsync([
                function() {
                    return Axes.doTicksSingle(gd, cbAxisOut, true);
                },
                function() {
                    if(['top', 'bottom'].indexOf(opts.titleside) === -1) {
                        var fontSize = cbAxisOut.titlefont.size,
                            y = cbAxisOut._offset + cbAxisOut._length / 2,
                            x = gs.l + (cbAxisOut.position || 0) * gs.w + ((cbAxisOut.side === 'right') ?
                                10 + fontSize * ((cbAxisOut.showticklabels ? 1 : 0.5)) :
                                -10 - fontSize * ((cbAxisOut.showticklabels ? 0.5 : 0)));

                        // the 'h' + is a hack to get around the fact that
                        // convertToTspans rotates any 'y...' class by 90 degrees.
                        // TODO: find a better way to control this.
                        drawTitle('h' + cbAxisOut._id + 'title', {
                            avoid: {
                                selection: d3.select(gd).selectAll('g.' + cbAxisOut._id + 'tick'),
                                side: opts.titleside,
                                offsetLeft: gs.l,
                                offsetTop: 0,
                                maxShift: fullLayout.width
                            },
                            attributes: {x: x, y: y, 'text-anchor': 'middle'},
                            transform: {rotate: '-90', offset: 0}
                        });
                    }
                }]);
        }

        function drawTitle(titleClass, titleOpts) {
            var trace = getTrace(),
                propName;
            if(Registry.traceIs(trace, 'markerColorscale')) {
                propName = 'marker.colorbar.title';
            }
            else propName = 'colorbar.title';

            var dfltTitleOpts = {
                propContainer: cbAxisOut,
                propName: propName,
                traceIndex: trace.index,
                placeholder: fullLayout._dfltTitle.colorbar,
                containerGroup: container.select('.cbtitle')
            };

            // this class-to-rotate thing with convertToTspans is
            // getting hackier and hackier... delete groups with the
            // wrong class (in case earlier the colorbar was drawn on
            // a different side, I think?)
            var otherClass = titleClass.charAt(0) === 'h' ?
                titleClass.substr(1) : ('h' + titleClass);
            container.selectAll('.' + otherClass + ',.' + otherClass + '-math-group')
                .remove();

            Titles.draw(gd, titleClass,
                extendFlat(dfltTitleOpts, titleOpts || {}));
        }

        function positionCB() {
            // wait for the axis & title to finish rendering before
            // continuing positioning
            // TODO: why are we redrawing multiple times now with this?
            // I guess autoMargin doesn't like being post-promise?
            var innerWidth = thickPx + opts.outlinewidth / 2 +
                    Drawing.bBox(cbAxisOut._axislayer.node()).width;
            titleEl = titleCont.select('text');
            if(titleEl.node() && !titleEl.classed(cn.jsPlaceholder)) {
                var mathJaxNode = titleCont
                        .select('.h' + cbAxisOut._id + 'title-math-group')
                        .node(),
                    titleWidth;
                if(mathJaxNode &&
                        ['top', 'bottom'].indexOf(opts.titleside) !== -1) {
                    titleWidth = Drawing.bBox(mathJaxNode).width;
                }
                else {
                    // note: the formula below works for all titlesides,
                    // (except for top/bottom mathjax, above)
                    // but the weird gs.l is because the titleunshift
                    // transform gets removed by Drawing.bBox
                    titleWidth =
                        Drawing.bBox(titleCont.node()).right -
                        xLeft - gs.l;
                }
                innerWidth = Math.max(innerWidth, titleWidth);
            }

            var outerwidth = 2 * opts.xpad + innerWidth +
                    opts.borderwidth + opts.outlinewidth / 2,
                outerheight = yBottomPx - yTopPx;

            container.select('.cbbg').attr({
                x: xLeft - opts.xpad -
                    (opts.borderwidth + opts.outlinewidth) / 2,
                y: yTopPx - yExtraPx,
                width: Math.max(outerwidth, 2),
                height: Math.max(outerheight + 2 * yExtraPx, 2)
            })
            .call(Color.fill, opts.bgcolor)
            .call(Color.stroke, opts.bordercolor)
            .style({'stroke-width': opts.borderwidth});

            container.selectAll('.cboutline').attr({
                x: xLeft,
                y: yTopPx + opts.ypad +
                    (opts.titleside === 'top' ? titleHeight : 0),
                width: Math.max(thickPx, 2),
                height: Math.max(outerheight - 2 * opts.ypad - titleHeight, 2)
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
                'translate(' + (gs.l - xoffset) + ',' + gs.t + ')');

            // auto margin adjustment
            Plots.autoMargin(gd, id, {
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
        if(gd._context.edits.colorbarPosition) {
            var t0,
                xf,
                yf;

            dragElement.init({
                element: container.node(),
                gd: gd,
                prepFn: function() {
                    t0 = container.attr('transform');
                    setCursor(container);
                },
                moveFn: function(dx, dy) {
                    container.attr('transform',
                        t0 + ' ' + 'translate(' + dx + ',' + dy + ')');

                    xf = dragElement.align(xLeftFrac + (dx / gs.w), thickFrac,
                        0, 1, opts.xanchor);
                    yf = dragElement.align(yBottomFrac - (dy / gs.h), lenFrac,
                        0, 1, opts.yanchor);

                    var csr = dragElement.getCursor(xf, yf,
                        opts.xanchor, opts.yanchor);
                    setCursor(container, csr);
                },
                doneFn: function() {
                    setCursor(container);

                    if(xf !== undefined && yf !== undefined) {
                        Registry.call('restyle',
                            gd,
                            {'colorbar.x': xf, 'colorbar.y': yf},
                            getTrace().index
                        );
                    }
                }
            });
        }
        return cbDone;
    }

    function getTrace() {
        var idNum = id.substr(2),
            i,
            trace;
        for(i = 0; i < gd._fullData.length; i++) {
            trace = gd._fullData[i];
            if(trace.uid === idNum) return trace;
        }
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
            if(typeof component[name] === 'function') {
                component[name](o[name]);
            }
        });
        return component;
    };

    component._opts = opts;

    return component;
};
