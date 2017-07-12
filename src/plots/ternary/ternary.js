/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var tinycolor = require('tinycolor2');

var Plotly = require('../../plotly');
var Lib = require('../../lib');
var Color = require('../../components/color');
var Drawing = require('../../components/drawing');
var setConvert = require('../cartesian/set_convert');
var extendFlat = require('../../lib/extend').extendFlat;
var Plots = require('../plots');
var Axes = require('../cartesian/axes');
var dragElement = require('../../components/dragelement');
var Fx = require('../../components/fx');
var Titles = require('../../components/titles');
var prepSelect = require('../cartesian/select');
var constants = require('../cartesian/constants');


function Ternary(options, fullLayout) {
    this.id = options.id;
    this.graphDiv = options.graphDiv;
    this.init(fullLayout);
    this.makeFramework();
}

module.exports = Ternary;

var proto = Ternary.prototype;

proto.init = function(fullLayout) {
    this.container = fullLayout._ternarylayer;
    this.defs = fullLayout._defs;
    this.layoutId = fullLayout._uid;
    this.traceHash = {};
};

proto.plot = function(ternaryCalcData, fullLayout) {
    var _this = this;
    var ternaryLayout = fullLayout[_this.id];
    var graphSize = fullLayout._size;

    _this._hasClipOnAxisFalse = false;
    for(var i = 0; i < ternaryCalcData.length; i++) {
        var trace = ternaryCalcData[i][0].trace;

        if(trace.cliponaxis === false) {
            _this._hasClipOnAxisFalse = true;
            break;
        }
    }

    _this.adjustLayout(ternaryLayout, graphSize);

    Plots.generalUpdatePerTraceModule(_this, ternaryCalcData, ternaryLayout);

    _this.layers.plotbg.select('path').call(Color.fill, ternaryLayout.bgcolor);
};

proto.makeFramework = function() {
    var _this = this;

    var defGroup = _this.defs.selectAll('g.clips')
        .data([0]);
    defGroup.enter().append('g')
        .classed('clips', true);

    // clippath for this ternary subplot
    var clipId = _this.clipId = 'clip' + _this.layoutId + _this.id;
    _this.clipDef = defGroup.selectAll('#' + clipId)
        .data([0]);
    _this.clipDef.enter().append('clipPath').attr('id', clipId)
        .append('path').attr('d', 'M0,0Z');

    // 'relative' clippath (i.e. no translation) for this ternary subplot
    var clipIdRelative = _this.clipIdRelative = 'clip-relative' + _this.layoutId + _this.id;
    _this.clipDefRelative = defGroup.selectAll('#' + clipIdRelative)
        .data([0]);
    _this.clipDefRelative.enter().append('clipPath').attr('id', clipIdRelative)
        .append('path').attr('d', 'M0,0Z');

    // container for everything in this ternary subplot
    _this.plotContainer = _this.container.selectAll('g.' + _this.id)
        .data([0]);
    _this.plotContainer.enter().append('g')
        .classed(_this.id, true);

    _this.layers = {};

    // inside that container, we have one container for the data, and
    // one each for the three axes around it.
    var plotLayers = [
        'draglayer',
        'plotbg',
        'backplot',
        'grids',
        'frontplot',
        'aaxis', 'baxis', 'caxis', 'axlines'
    ];
    var toplevel = _this.plotContainer.selectAll('g.toplevel')
        .data(plotLayers);
    toplevel.enter().append('g')
        .attr('class', function(d) { return 'toplevel ' + d; })
        .each(function(d) {
            var s = d3.select(this);
            _this.layers[d] = s;

            // containers for different trace types.
            // NOTE - this is different from cartesian, where all traces
            // are in front of grids. Here I'm putting maps behind the grids
            // so the grids will always be visible if they're requested.
            // Perhaps we want that for cartesian too?
            if(d === 'frontplot') s.append('g').classed('scatterlayer', true);
            else if(d === 'backplot') s.append('g').classed('maplayer', true);
            else if(d === 'plotbg') s.append('path').attr('d', 'M0,0Z');
            else if(d === 'axlines') {
                s.selectAll('path').data(['aline', 'bline', 'cline'])
                    .enter().append('path').each(function(d) {
                        d3.select(this).classed(d, true);
                    });
            }
        });

    var grids = _this.plotContainer.select('.grids').selectAll('g.grid')
        .data(['agrid', 'bgrid', 'cgrid']);
    grids.enter().append('g')
        .attr('class', function(d) { return 'grid ' + d; })
        .each(function(d) { _this.layers[d] = d3.select(this); });

    _this.plotContainer.selectAll('.backplot,.grids')
        .call(Drawing.setClipUrl, clipId);
};

var w_over_h = Math.sqrt(4 / 3);

proto.adjustLayout = function(ternaryLayout, graphSize) {
    var _this = this,
        domain = ternaryLayout.domain,
        xDomainCenter = (domain.x[0] + domain.x[1]) / 2,
        yDomainCenter = (domain.y[0] + domain.y[1]) / 2,
        xDomain = domain.x[1] - domain.x[0],
        yDomain = domain.y[1] - domain.y[0],
        wmax = xDomain * graphSize.w,
        hmax = yDomain * graphSize.h,
        sum = ternaryLayout.sum,
        amin = ternaryLayout.aaxis.min,
        bmin = ternaryLayout.baxis.min,
        cmin = ternaryLayout.caxis.min;

    var x0, y0, w, h, xDomainFinal, yDomainFinal;

    if(wmax > w_over_h * hmax) {
        h = hmax;
        w = h * w_over_h;
    }
    else {
        w = wmax;
        h = w / w_over_h;
    }

    xDomainFinal = xDomain * w / wmax;
    yDomainFinal = yDomain * h / hmax;

    x0 = graphSize.l + graphSize.w * xDomainCenter - w / 2;
    y0 = graphSize.t + graphSize.h * (1 - yDomainCenter) - h / 2;

    _this.x0 = x0;
    _this.y0 = y0;
    _this.w = w;
    _this.h = h;
    _this.sum = sum;

    // set up the x and y axis objects we'll use to lay out the points
    _this.xaxis = {
        type: 'linear',
        range: [amin + 2 * cmin - sum, sum - amin - 2 * bmin],
        domain: [
            xDomainCenter - xDomainFinal / 2,
            xDomainCenter + xDomainFinal / 2
        ],
        _id: 'x'
    };
    setConvert(_this.xaxis, _this.graphDiv._fullLayout);
    _this.xaxis.setScale();
    _this.xaxis.isPtWithinRange = function(d) {
        return (
            d.a >= _this.aaxis.range[0] &&
            d.a <= _this.aaxis.range[1] &&
            d.b >= _this.baxis.range[1] &&
            d.b <= _this.baxis.range[0] &&
            d.c >= _this.caxis.range[1] &&
            d.c <= _this.caxis.range[0]
        );
    };

    _this.yaxis = {
        type: 'linear',
        range: [amin, sum - bmin - cmin],
        domain: [
            yDomainCenter - yDomainFinal / 2,
            yDomainCenter + yDomainFinal / 2
        ],
        _id: 'y'
    };
    setConvert(_this.yaxis, _this.graphDiv._fullLayout);
    _this.yaxis.setScale();
    _this.yaxis.isPtWithinRange = function() { return true; };

    // set up the modified axes for tick drawing
    var yDomain0 = _this.yaxis.domain[0];

    // aaxis goes up the left side. Set it up as a y axis, but with
    // fictitious angles and domain, but then rotate and translate
    // it into place at the end
    var aaxis = _this.aaxis = extendFlat({}, ternaryLayout.aaxis, {
        visible: true,
        range: [amin, sum - bmin - cmin],
        side: 'left',
        _counterangle: 30,
        // tickangle = 'auto' means 0 anyway for a y axis, need to coerce to 0 here
        // so we can shift by 30.
        tickangle: (+ternaryLayout.aaxis.tickangle || 0) - 30,
        domain: [yDomain0, yDomain0 + yDomainFinal * w_over_h],
        _axislayer: _this.layers.aaxis,
        _gridlayer: _this.layers.agrid,
        _pos: 0, // _this.xaxis.domain[0] * graphSize.w,
        _id: 'y',
        _length: w,
        _gridpath: 'M0,0l' + h + ',-' + (w / 2)
    });
    setConvert(aaxis, _this.graphDiv._fullLayout);
    aaxis.setScale();

    // baxis goes across the bottom (backward). We can set it up as an x axis
    // without any enclosing transformation.
    var baxis = _this.baxis = extendFlat({}, ternaryLayout.baxis, {
        visible: true,
        range: [sum - amin - cmin, bmin],
        side: 'bottom',
        _counterangle: 30,
        domain: _this.xaxis.domain,
        _axislayer: _this.layers.baxis,
        _gridlayer: _this.layers.bgrid,
        _counteraxis: _this.aaxis,
        _pos: 0, // (1 - yDomain0) * graphSize.h,
        _id: 'x',
        _length: w,
        _gridpath: 'M0,0l-' + (w / 2) + ',-' + h
    });
    setConvert(baxis, _this.graphDiv._fullLayout);
    baxis.setScale();
    aaxis._counteraxis = baxis;

    // caxis goes down the right side. Set it up as a y axis, with
    // post-transformation similar to aaxis
    var caxis = _this.caxis = extendFlat({}, ternaryLayout.caxis, {
        visible: true,
        range: [sum - amin - bmin, cmin],
        side: 'right',
        _counterangle: 30,
        tickangle: (+ternaryLayout.caxis.tickangle || 0) + 30,
        domain: [yDomain0, yDomain0 + yDomainFinal * w_over_h],
        _axislayer: _this.layers.caxis,
        _gridlayer: _this.layers.cgrid,
        _counteraxis: _this.baxis,
        _pos: 0, // _this.xaxis.domain[1] * graphSize.w,
        _id: 'y',
        _length: w,
        _gridpath: 'M0,0l-' + h + ',' + (w / 2)
    });
    setConvert(caxis, _this.graphDiv._fullLayout);
    caxis.setScale();

    var triangleClip = 'M' + x0 + ',' + (y0 + h) + 'h' + w + 'l-' + (w / 2) + ',-' + h + 'Z';
    _this.clipDef.select('path').attr('d', triangleClip);
    _this.layers.plotbg.select('path').attr('d', triangleClip);

    var triangleClipRelative = 'M0,' + h + 'h' + w + 'l-' + (w / 2) + ',-' + h + 'Z';
    _this.clipDefRelative.select('path').attr('d', triangleClipRelative);

    var plotTransform = 'translate(' + x0 + ',' + y0 + ')';
    _this.plotContainer.selectAll('.scatterlayer,.maplayer')
        .attr('transform', plotTransform);

    _this.clipDefRelative.select('path').attr('transform', null);

    // TODO: shift axes to accommodate linewidth*sin(30) tick mark angle

    var bTransform = 'translate(' + x0 + ',' + (y0 + h) + ')';

    _this.layers.baxis.attr('transform', bTransform);
    _this.layers.bgrid.attr('transform', bTransform);

    var aTransform = 'translate(' + (x0 + w / 2) + ',' + y0 + ')rotate(30)';
    _this.layers.aaxis.attr('transform', aTransform);
    _this.layers.agrid.attr('transform', aTransform);

    var cTransform = 'translate(' + (x0 + w / 2) + ',' + y0 + ')rotate(-30)';
    _this.layers.caxis.attr('transform', cTransform);
    _this.layers.cgrid.attr('transform', cTransform);

    _this.drawAxes(true);

    // remove crispEdges - all the off-square angles in ternary plots
    // make these counterproductive.
    _this.plotContainer.selectAll('.crisp').classed('crisp', false);

    var axlines = _this.layers.axlines;
    axlines.select('.aline')
        .attr('d', aaxis.showline ?
            'M' + x0 + ',' + (y0 + h) + 'l' + (w / 2) + ',-' + h : 'M0,0')
        .call(Color.stroke, aaxis.linecolor || '#000')
        .style('stroke-width', (aaxis.linewidth || 0) + 'px');
    axlines.select('.bline')
        .attr('d', baxis.showline ?
            'M' + x0 + ',' + (y0 + h) + 'h' + w : 'M0,0')
        .call(Color.stroke, baxis.linecolor || '#000')
        .style('stroke-width', (baxis.linewidth || 0) + 'px');
    axlines.select('.cline')
        .attr('d', caxis.showline ?
            'M' + (x0 + w / 2) + ',' + y0 + 'l' + (w / 2) + ',' + h : 'M0,0')
        .call(Color.stroke, caxis.linecolor || '#000')
        .style('stroke-width', (caxis.linewidth || 0) + 'px');

    if(!_this.graphDiv._context.staticPlot) {
        _this.initInteractions();
    }

    _this.plotContainer.select('.frontplot')
        .call(Drawing.setClipUrl, _this._hasClipOnAxisFalse ? null : _this.clipId);
};

proto.drawAxes = function(doTitles) {
    var _this = this,
        gd = _this.graphDiv,
        titlesuffix = _this.id.substr(7) + 'title',
        aaxis = _this.aaxis,
        baxis = _this.baxis,
        caxis = _this.caxis;
    // 3rd arg true below skips titles, so we can configure them
    // correctly later on.
    Axes.doTicks(gd, aaxis, true);
    Axes.doTicks(gd, baxis, true);
    Axes.doTicks(gd, caxis, true);

    if(doTitles) {
        var apad = Math.max(aaxis.showticklabels ? aaxis.tickfont.size / 2 : 0,
            (caxis.showticklabels ? caxis.tickfont.size * 0.75 : 0) +
            (caxis.ticks === 'outside' ? caxis.ticklen * 0.87 : 0));
        Titles.draw(gd, 'a' + titlesuffix, {
            propContainer: aaxis,
            propName: _this.id + '.aaxis.title',
            dfltName: 'Component A',
            attributes: {
                x: _this.x0 + _this.w / 2,
                y: _this.y0 - aaxis.titlefont.size / 3 - apad,
                'text-anchor': 'middle'
            }
        });

        var bpad = (baxis.showticklabels ? baxis.tickfont.size : 0) +
            (baxis.ticks === 'outside' ? baxis.ticklen : 0) + 3;

        Titles.draw(gd, 'b' + titlesuffix, {
            propContainer: baxis,
            propName: _this.id + '.baxis.title',
            dfltName: 'Component B',
            attributes: {
                x: _this.x0 - bpad,
                y: _this.y0 + _this.h + baxis.titlefont.size * 0.83 + bpad,
                'text-anchor': 'middle'
            }
        });

        Titles.draw(gd, 'c' + titlesuffix, {
            propContainer: caxis,
            propName: _this.id + '.caxis.title',
            dfltName: 'Component C',
            attributes: {
                x: _this.x0 + _this.w + bpad,
                y: _this.y0 + _this.h + caxis.titlefont.size * 0.83 + bpad,
                'text-anchor': 'middle'
            }
        });
    }
};

// hard coded paths for zoom corners
// uses the same sizing as cartesian, length is MINZOOM/2, width is 3px
var CLEN = constants.MINZOOM / 2 + 0.87;
var BLPATH = 'm-0.87,.5h' + CLEN + 'v3h-' + (CLEN + 5.2) +
    'l' + (CLEN / 2 + 2.6) + ',-' + (CLEN * 0.87 + 4.5) +
    'l2.6,1.5l-' + (CLEN / 2) + ',' + (CLEN * 0.87) + 'Z';
var BRPATH = 'm0.87,.5h-' + CLEN + 'v3h' + (CLEN + 5.2) +
    'l-' + (CLEN / 2 + 2.6) + ',-' + (CLEN * 0.87 + 4.5) +
    'l-2.6,1.5l' + (CLEN / 2) + ',' + (CLEN * 0.87) + 'Z';
var TOPPATH = 'm0,1l' + (CLEN / 2) + ',' + (CLEN * 0.87) +
    'l2.6,-1.5l-' + (CLEN / 2 + 2.6) + ',-' + (CLEN * 0.87 + 4.5) +
    'l-' + (CLEN / 2 + 2.6) + ',' + (CLEN * 0.87 + 4.5) +
    'l2.6,1.5l' + (CLEN / 2) + ',-' + (CLEN * 0.87) + 'Z';
var STARTMARKER = 'm0.5,0.5h5v-2h-5v-5h-2v5h-5v2h5v5h2Z';

// I guess this could be shared with cartesian... but for now it's separate.
var SHOWZOOMOUTTIP = true;

proto.initInteractions = function() {
    var _this = this,
        dragger = _this.layers.plotbg.select('path').node(),
        gd = _this.graphDiv,
        zoomContainer = gd._fullLayout._zoomlayer;

    // use plotbg for the main interactions
    var dragOptions = {
        element: dragger,
        gd: gd,
        plotinfo: {
            xaxis: _this.xaxis,
            yaxis: _this.yaxis
        },
        doubleclick: doubleClick,
        subplot: _this.id,
        prepFn: function(e, startX, startY) {
            // these aren't available yet when initInteractions
            // is called
            dragOptions.xaxes = [_this.xaxis];
            dragOptions.yaxes = [_this.yaxis];
            var dragModeNow = gd._fullLayout.dragmode;
            if(e.shiftKey) {
                if(dragModeNow === 'pan') dragModeNow = 'zoom';
                else dragModeNow = 'pan';
            }

            if(dragModeNow === 'lasso') dragOptions.minDrag = 1;
            else dragOptions.minDrag = undefined;

            if(dragModeNow === 'zoom') {
                dragOptions.moveFn = zoomMove;
                dragOptions.doneFn = zoomDone;
                zoomPrep(e, startX, startY);
            }
            else if(dragModeNow === 'pan') {
                dragOptions.moveFn = plotDrag;
                dragOptions.doneFn = dragDone;
                panPrep();
                clearSelect();
            }
            else if(dragModeNow === 'select' || dragModeNow === 'lasso') {
                prepSelect(e, startX, startY, dragOptions, dragModeNow);
            }
        }
    };

    var x0, y0, mins0, span0, mins, lum, path0, dimmed, zb, corners;

    function zoomPrep(e, startX, startY) {
        var dragBBox = dragger.getBoundingClientRect();
        x0 = startX - dragBBox.left;
        y0 = startY - dragBBox.top;
        mins0 = {
            a: _this.aaxis.range[0],
            b: _this.baxis.range[1],
            c: _this.caxis.range[1]
        };
        mins = mins0;
        span0 = _this.aaxis.range[1] - mins0.a;
        lum = tinycolor(_this.graphDiv._fullLayout[_this.id].bgcolor).getLuminance();
        path0 = 'M0,' + _this.h + 'L' + (_this.w / 2) + ', 0L' + _this.w + ',' + _this.h + 'Z';
        dimmed = false;

        zb = zoomContainer.append('path')
            .attr('class', 'zoombox')
            .attr('transform', 'translate(' + _this.x0 + ', ' + _this.y0 + ')')
            .style({
                'fill': lum > 0.2 ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0)',
                'stroke-width': 0
            })
            .attr('d', path0);

        corners = zoomContainer.append('path')
            .attr('class', 'zoombox-corners')
            .attr('transform', 'translate(' + _this.x0 + ', ' + _this.y0 + ')')
            .style({
                fill: Color.background,
                stroke: Color.defaultLine,
                'stroke-width': 1,
                opacity: 0
            })
            .attr('d', 'M0,0Z');

        clearSelect();
    }

    function getAFrac(x, y) { return 1 - (y / _this.h); }
    function getBFrac(x, y) { return 1 - ((x + (_this.h - y) / Math.sqrt(3)) / _this.w); }
    function getCFrac(x, y) { return ((x - (_this.h - y) / Math.sqrt(3)) / _this.w); }

    function zoomMove(dx0, dy0) {
        var x1 = x0 + dx0,
            y1 = y0 + dy0,
            afrac = Math.max(0, Math.min(1, getAFrac(x0, y0), getAFrac(x1, y1))),
            bfrac = Math.max(0, Math.min(1, getBFrac(x0, y0), getBFrac(x1, y1))),
            cfrac = Math.max(0, Math.min(1, getCFrac(x0, y0), getCFrac(x1, y1))),
            xLeft = ((afrac / 2) + cfrac) * _this.w,
            xRight = (1 - (afrac / 2) - bfrac) * _this.w,
            xCenter = (xLeft + xRight) / 2,
            xSpan = xRight - xLeft,
            yBottom = (1 - afrac) * _this.h,
            yTop = yBottom - xSpan / w_over_h;

        if(xSpan < constants.MINZOOM) {
            mins = mins0;
            zb.attr('d', path0);
            corners.attr('d', 'M0,0Z');
        }
        else {
            mins = {
                a: mins0.a + afrac * span0,
                b: mins0.b + bfrac * span0,
                c: mins0.c + cfrac * span0
            };
            zb.attr('d', path0 + 'M' + xLeft + ',' + yBottom +
                'H' + xRight + 'L' + xCenter + ',' + yTop +
                'L' + xLeft + ',' + yBottom + 'Z');
            corners.attr('d', 'M' + x0 + ',' + y0 + STARTMARKER +
                'M' + xLeft + ',' + yBottom + BLPATH +
                'M' + xRight + ',' + yBottom + BRPATH +
                'M' + xCenter + ',' + yTop + TOPPATH);
        }

        if(!dimmed) {
            zb.transition()
                .style('fill', lum > 0.2 ? 'rgba(0,0,0,0.4)' :
                    'rgba(255,255,255,0.3)')
                .duration(200);
            corners.transition()
                .style('opacity', 1)
                .duration(200);
            dimmed = true;
        }
    }

    function zoomDone(dragged, numClicks) {
        if(mins === mins0) {
            if(numClicks === 2) doubleClick();

            return removeZoombox(gd);
        }

        removeZoombox(gd);

        var attrs = {};
        attrs[_this.id + '.aaxis.min'] = mins.a;
        attrs[_this.id + '.baxis.min'] = mins.b;
        attrs[_this.id + '.caxis.min'] = mins.c;

        Plotly.relayout(gd, attrs);

        if(SHOWZOOMOUTTIP && gd.data && gd._context.showTips) {
            Lib.notifier('Double-click to<br>zoom back out', 'long');
            SHOWZOOMOUTTIP = false;
        }
    }

    function panPrep() {
        mins0 = {
            a: _this.aaxis.range[0],
            b: _this.baxis.range[1],
            c: _this.caxis.range[1]
        };
        mins = mins0;
    }

    function plotDrag(dx, dy) {
        var dxScaled = dx / _this.xaxis._m,
            dyScaled = dy / _this.yaxis._m;
        mins = {
            a: mins0.a - dyScaled,
            b: mins0.b + (dxScaled + dyScaled) / 2,
            c: mins0.c - (dxScaled - dyScaled) / 2
        };
        var minsorted = [mins.a, mins.b, mins.c].sort(),
            minindices = {
                a: minsorted.indexOf(mins.a),
                b: minsorted.indexOf(mins.b),
                c: minsorted.indexOf(mins.c)
            };
        if(minsorted[0] < 0) {
            if(minsorted[1] + minsorted[0] / 2 < 0) {
                minsorted[2] += minsorted[0] + minsorted[1];
                minsorted[0] = minsorted[1] = 0;
            }
            else {
                minsorted[2] += minsorted[0] / 2;
                minsorted[1] += minsorted[0] / 2;
                minsorted[0] = 0;
            }
            mins = {
                a: minsorted[minindices.a],
                b: minsorted[minindices.b],
                c: minsorted[minindices.c]
            };
            dy = (mins0.a - mins.a) * _this.yaxis._m;
            dx = (mins0.c - mins.c - mins0.b + mins.b) * _this.xaxis._m;
        }

        // move the data (translate, don't redraw)
        var plotTransform = 'translate(' + (_this.x0 + dx) + ',' + (_this.y0 + dy) + ')';
        _this.plotContainer.selectAll('.scatterlayer,.maplayer')
            .attr('transform', plotTransform);

        var plotTransform2 = 'translate(' + -dx + ',' + -dy + ')';
        _this.clipDefRelative.select('path').attr('transform', plotTransform2);

        // move the ticks
        _this.aaxis.range = [mins.a, _this.sum - mins.b - mins.c];
        _this.baxis.range = [_this.sum - mins.a - mins.c, mins.b];
        _this.caxis.range = [_this.sum - mins.a - mins.b, mins.c];

        _this.drawAxes(false);
        _this.plotContainer.selectAll('.crisp').classed('crisp', false);

        if(_this._hasClipOnAxisFalse) {
            var scatterPoints = _this.plotContainer
                .select('.scatterlayer').selectAll('.points');

            scatterPoints.selectAll('.point')
                .call(Drawing.hideOutsideRangePoints, _this);

            scatterPoints.selectAll('.textpoint')
                .call(Drawing.hideOutsideRangePoints, _this);
        }
    }

    function dragDone(dragged, numClicks) {
        if(dragged) {
            var attrs = {};
            attrs[_this.id + '.aaxis.min'] = mins.a;
            attrs[_this.id + '.baxis.min'] = mins.b;
            attrs[_this.id + '.caxis.min'] = mins.c;

            Plotly.relayout(gd, attrs);
        }
        else if(numClicks === 2) doubleClick();
    }

    function clearSelect() {
        // until we get around to persistent selections, remove the outline
        // here. The selection itself will be removed when the plot redraws
        // at the end.
        zoomContainer.selectAll('.select-outline').remove();
    }

    function doubleClick() {
        var attrs = {};
        attrs[_this.id + '.aaxis.min'] = 0;
        attrs[_this.id + '.baxis.min'] = 0;
        attrs[_this.id + '.caxis.min'] = 0;
        gd.emit('plotly_doubleclick', null);
        Plotly.relayout(gd, attrs);
    }

    // finally, set up hover and click
    // these event handlers must already be set before dragElement.init
    // so it can stash them and override them.
    dragger.onmousemove = function(evt) {
        Fx.hover(gd, evt, _this.id);
        gd._fullLayout._lasthover = dragger;
        gd._fullLayout._hoversubplot = _this.id;
    };

    dragger.onmouseout = function(evt) {
        if(gd._dragging) return;

        dragElement.unhover(gd, evt);
    };

    dragger.onclick = function(evt) {
        Fx.click(gd, evt, _this.id);
    };

    dragElement.init(dragOptions);
};

function removeZoombox(gd) {
    d3.select(gd)
        .selectAll('.zoombox,.js-zoombox-backdrop,.js-zoombox-menu,.zoombox-corners')
        .remove();
}
