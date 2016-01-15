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

var Lib = require('../../lib');
var Color = require('../color');
var subTypes = require('../../traces/scatter/subtypes');


var errorBars = module.exports = {};

errorBars.attributes = require('./attributes');

errorBars.supplyDefaults = require('./defaults');

errorBars.calc = require('./calc');

errorBars.calcFromTrace = function(trace, layout) {
    var x = trace.x || [],
        y = trace.y,
        len = x.length || y.length;

    var calcdataMock = new Array(len);

    for(var i = 0; i < len; i++) {
        calcdataMock[i] = {
            x: x[i],
            y: y[i]
        };
    }

    calcdataMock[0].trace = trace;

    errorBars.calc({
        calcdata: [calcdataMock],
        _fullLayout: layout
    });

    return calcdataMock;
};

// the main drawing function for errorbars
errorBars.plot = function(gd, plotinfo, cd) {
    //  ___   <-- "errorhats"
    //   |
    //   |    <-- "errorbars"
    //   |
    //  ___   <-- "errorshoes"

    var xa = plotinfo.x(),
        ya = plotinfo.y();

    // first remove all existing errorbars
    // TODO: use enter/exit instead
    plotinfo.plot.select('.errorlayer').selectAll('g.errorbars').remove();
    var coords;

    // draw the errorbars
    plotinfo.plot.select('.errorlayer').selectAll('g.errorbars')
        .data(cd)
      .enter().append('g')
        .attr('class','errorbars')
        .each(function(d){
            var trace = d[0].trace,
                xObj = trace.error_x,
                yObj = trace.error_y,
                sparse = subTypes.hasMarkers(trace) &&
                    trace.marker.maxdisplayed>0;

            if(!yObj.visible && !xObj.visible) return;

            d3.select(this).selectAll('g')
                .data(Lib.identity)
              .enter().append('g')
                .each(function(d){
                    coords = errorcoords(d, xa, ya);
                    var eb = d3.select(this),
                        path;
                    if(sparse && !d.vis) return;

                    if(yObj.visible && isNumeric(coords.x) &&
                            isNumeric(coords.yh) &&
                            isNumeric(coords.ys)){
                        var yw = yObj.width;
                        path = 'M'+(coords.x-yw)+','+coords.yh+'h'+(2*yw) + // hat
                            'm-'+yw+',0V'+coords.ys; // bar
                        if(!coords.noYS) path += 'm-'+yw+',0h'+(2*yw); // shoe

                        eb.append('path')
                            .classed('yerror', true)
                            .attr('d', path);
                    }
                    if(xObj.visible && isNumeric(coords.y) &&
                            isNumeric(coords.xh) &&
                            isNumeric(coords.xs)){
                        var xw = (xObj.copy_ystyle ? yObj : xObj).width;
                        path = 'M'+coords.xh+','+(coords.y-xw)+'v'+(2*xw) + // hat
                            'm0,-'+xw+'H'+coords.xs; // bar
                        if(!coords.noXS) path += 'm0,-'+xw+'v'+(2*xw); // shoe

                        eb.append('path')
                            .classed('xerror', true)
                            .attr('d', path);
                    }
                });
        });
};

errorBars.style = function(gd){
    d3.select(gd).selectAll('g.errorbars').each(function(d){
        var eb = d3.select(this),
            trace = d[0].trace,
            yObj = trace.error_y||{},
            xObj = trace.error_x||{};

        eb.selectAll('g path.yerror')
            .style('stroke-width', yObj.thickness+'px')
            .call(Color.stroke, yObj.color);

        if(xObj.copy_ystyle) xObj = yObj;

        eb.selectAll('g path.xerror')
            .style('stroke-width', xObj.thickness+'px')
            .call(Color.stroke, xObj.color);
    });
};

function errorcoords(d, xa, ya) {
    // compute the coordinates of the error-bar objects
    var out = {
        x: xa.c2p(d.x),
        y: ya.c2p(d.y)
    };

    // calculate the error bar size and hat and shoe locations
    if(d.yh!==undefined) {
        out.yh = ya.c2p(d.yh);
        out.ys = ya.c2p(d.ys);

        // if the shoes go off-scale (ie log scale, error bars past zero)
        // clip the bar and hide the shoes
        if(!isNumeric(out.ys)) {
            out.noYS = true;
            out.ys = ya.c2p(d.ys, true);
        }
    }
    if(d.xh!==undefined) {
        out.xh = xa.c2p(d.xh);
        out.xs = xa.c2p(d.xs);

        if(!isNumeric(out.xs)) {
            out.noXS = true;
            out.xs = xa.c2p(d.xs, true);
        }
    }

    return out;
}

errorBars.hoverInfo = function(calcPoint, trace, hoverPoint) {
    if(trace.error_y.visible) {
        hoverPoint.yerr = calcPoint.yh - calcPoint.y;
        if(!trace.error_y.symmetric) hoverPoint.yerrneg = calcPoint.y - calcPoint.ys;
    }
    if(trace.error_x.visible) {
        hoverPoint.xerr = calcPoint.xh - calcPoint.x;
        if(!trace.error_x.symmetric) hoverPoint.xerrneg = calcPoint.x - calcPoint.xs;
    }
};
