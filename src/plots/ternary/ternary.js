/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var Color = require('../../components/color');
var Drawing = require('../../components/drawing');
var setConvert = require('../cartesian/set_convert');
var extendFlat = require('../../lib/extend').extendFlat;
var Axes = require('../cartesian/axes');
var filterVisible = require('../../lib/filter_visible');


function Ternary(options, fullLayout) {
    this.id = options.id;
    this.graphDiv = options.graphDiv;
    this.container = fullLayout._ternarylayer;
    this.defs = fullLayout._defs;
    this.layoutId = fullLayout._uid;
    this.traceHash = {};

    this.makeFramework();
}

module.exports = Ternary;

var proto = Ternary.prototype;

proto.plot = function(ternaryData, fullLayout) {
    var _this = this,
        ternaryLayout = fullLayout[_this.id],
        graphSize = fullLayout._size,
        i;

    _this.adjustLayout(ternaryLayout, graphSize);

    var traceHashOld = _this.traceHash;
    var traceHash = {};

    for(i = 0; i < ternaryData.length; i++) {
        var trace = ternaryData[i];

        traceHash[trace.type] = traceHash[trace.type] || [];
        traceHash[trace.type].push(trace);
    }

    var moduleNamesOld = Object.keys(traceHashOld);
    var moduleNames = Object.keys(traceHash);

    // when a trace gets deleted, make sure that its module's
    // plot method is called so that it is properly
    // removed from the DOM.
    for(i = 0; i < moduleNamesOld.length; i++) {
        var moduleName = moduleNamesOld[i];

        if(moduleNames.indexOf(moduleName) === -1) {
            var fakeModule = traceHashOld[moduleName][0];
            fakeModule.visible = false;
            traceHash[moduleName] = [fakeModule];
        }
    }

    moduleNames = Object.keys(traceHash);

    for(i = 0; i < moduleNames.length; i++) {
        var moduleData = traceHash[moduleNames[i]];
        var _module = moduleData[0]._module;

        _module.plot(_this, filterVisible(moduleData), ternaryLayout);
    }

    _this.traceHash = traceHash;

    _this.layers.plotbg.select('path').call(Color.fill, ternaryLayout.bgcolor);
};

proto.makeFramework = function() {
    var _this = this;

    var defGroup = _this.defs.selectAll('g.clips')
        .data([0]);
    defGroup.enter().append('g')
        .classed('clips', true);

    // clippath for this ternary subplot
    var clipId = 'clip' + _this.layoutId + _this.id;
    _this.clipDef = defGroup.selectAll('#' + clipId)
        .data([0]);
    _this.clipDef.enter().append('clipPath').attr('id', clipId)
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
        'aaxis', 'baxis', 'caxis','axlines'
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

    _this.plotContainer.selectAll('.backplot,.frontplot,.grids')
        .call(Drawing.setClipUrl, clipId);
};

var w_over_h = Math.sqrt(4/3);

proto.adjustLayout = function(ternaryLayout, graphSize) {
    var _this = this,
        domain = ternaryLayout.domain,
        xDomainCenter = (domain.x[0] + domain.x[1]) / 2,
        yDomainCenter = (domain.y[0] + domain.y[1]) / 2,
        xDomain = domain.x[1] - domain.x[0],
        yDomain = domain.y[1] - domain.y[0],
        wmax = xDomain * graphSize.w,
        hmax = yDomain * graphSize.h,
        sum = ternaryLayout.sum;

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
    y0 = graphSize.t + graphSize.h * yDomainCenter - h / 2;

    _this.x0 = x0;
    _this.y0 = y0;
    _this.w = w;
    _this.h = h;

    // set up the x and y axis objects we'll use to lay out the points
    _this.xaxis = {
        type: 'linear',
        range: [-sum, sum],
        domain: [
            xDomainCenter - xDomainFinal / 2,
            xDomainCenter + xDomainFinal / 2
        ],
        _id: 'x',
        _td: _this.graphDiv
    };
    setConvert(_this.xaxis);
    _this.xaxis.setScale();

    _this.yaxis = {
        type: 'linear',
        range: [0, sum],
        domain: [
            yDomainCenter - yDomainFinal / 2,
            yDomainCenter + yDomainFinal / 2
        ],
        _id: 'y',
        _td: _this.graphDiv
    };
    setConvert(_this.yaxis);
    _this.yaxis.setScale();

    // set up the modified axes for tick drawing
    var amin = ternaryLayout.aaxis.min,
        bmin = ternaryLayout.baxis.min,
        cmin = ternaryLayout.caxis.min,
        yDomain0 = _this.yaxis.domain[0];

    // aaxis goes up the left side. Set it up as a y axis, but with
    // fictitious angles and domain, but then rotate and translate
    // it into place at the end
    var aaxis = _this.aaxis = extendFlat({}, ternaryLayout.aaxis, {
        range: [amin, sum - bmin - cmin],
        side: 'left',
        _counterangle: 30,
        // tickangle = 'auto' means 0 anyway for a y axis, need to coerce to 0 here
        // so we can shift by 30.
        tickangle: (+ternaryLayout.aaxis.tickangle || 0) - 30,
        domain: [yDomain0, yDomain0 + yDomainFinal * w_over_h],
        _axislayer: _this.layers.aaxis,
        _gridlayer: _this.layers.agrid,
        _pos: 0, //_this.xaxis.domain[0] * graphSize.w,
        _td: _this.graphDiv,
        _id: 'y',
        _length: w,
        _gridpath: 'M0,0l' + h + ',-' + (w / 2)
    });
    setConvert(aaxis);

    // baxis goes across the bottom (backward). We can set it up as an x axis
    // without any enclosing transformation.
    var baxis = _this.baxis = extendFlat({}, ternaryLayout.baxis, {
        range: [sum - amin - cmin, bmin],
        side: 'bottom',
        _counterangle: 30,
        domain: _this.xaxis.domain,
        _axislayer: _this.layers.baxis,
        _gridlayer: _this.layers.bgrid,
        _counteraxis: _this.aaxis,
        _pos: 0, //(1 - yDomain0) * graphSize.h,
        _td: _this.graphDiv,
        _id: 'x',
        _length: w,
        _gridpath: 'M0,0l-' + (w / 2) + ',-' + h
    });
    setConvert(baxis);
    aaxis._counteraxis = baxis;

    // caxis goes down the right side. Set it up as a y axis, with
    // post-transformation similar to aaxis
    var caxis = _this.caxis = extendFlat({}, ternaryLayout.caxis, {
        range: [sum - amin - bmin, cmin],
        side: 'right',
        _counterangle: 30,
        tickangle: (+ternaryLayout.caxis.tickangle || 0) + 30,
        domain: [yDomain0, yDomain0 + yDomainFinal * w_over_h],
        _axislayer: _this.layers.caxis,
        _gridlayer: _this.layers.cgrid,
        _counteraxis: _this.baxis,
        _pos: 0, //_this.xaxis.domain[1] * graphSize.w,
        _td: _this.graphDiv,
        _id: 'y',
        _length: w,
        _gridpath: 'M0,0l-' + h + ',' + (w / 2)
    });
    setConvert(caxis);

    var triangleClip = 'M' + x0 + ',' + (y0 + h) + 'h' + w + 'l-' + (w/2) + ',-' + h + 'Z';
    _this.clipDef.select('path').attr('d', triangleClip);
    _this.layers.plotbg.select('path').attr('d', triangleClip);

    var plotTransform = 'translate(' + x0 + ',' + y0 + ')';
    _this.plotContainer.selectAll('.scatterlayer,.maplayer')
        .attr('transform', plotTransform);

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

    // TODO: titles (3rd arg true below ignores them)
    Axes.doTicks(_this.graphDiv, aaxis, true);
    Axes.doTicks(_this.graphDiv, baxis, true);
    Axes.doTicks(_this.graphDiv, caxis, true);

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
};
