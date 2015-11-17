/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');
var d3 = require('d3');
var isNumeric = require('fast-isnumeric');

var errorBars = module.exports = {};

errorBars.attributes = require('./attributes');

errorBars.supplyDefaults = function(traceIn, traceOut, defaultColor, opts) {
    var objName = 'error_' + opts.axis,
        containerOut = traceOut[objName] = {},
        containerIn = traceIn[objName] || {};

    function coerce (attr, dflt) {
        return Plotly.Lib.coerce(containerIn, containerOut, errorBars.attributes, attr, dflt);
    }

    var visible = coerce('visible', 'array' in containerIn || 'value' in containerIn);
    if(visible) {
        var type = coerce('type', 'array' in containerIn ? 'data' : 'percent'),
            symmetric = true;
        if(type!=='sqrt') {
            symmetric = coerce('symmetric',
                !((type==='data' ? 'arrayminus' : 'valueminus') in containerIn));
        }

        if(type==='data') {
            var array = coerce('array');
            if(!array) containerOut.array = [];
            coerce('traceref');
            if(!symmetric) {
                var arrayminus = coerce('arrayminus');
                if(!arrayminus) containerOut.arrayminus = [];
                coerce('tracerefminus');
            }
        }
        else if(type==='percent' || type==='constant') {
            coerce('value');
            if(!symmetric) coerce('valueminus');
        }

        var copyAttr = 'copy_'+opts.inherit+'style';
        if(opts.inherit) {
            var inheritObj = traceOut['error_' + opts.inherit];
            if((inheritObj||{}).visible) {
                coerce(copyAttr, !(containerIn.color ||
                                   isNumeric(containerIn.thickness) ||
                                   isNumeric(containerIn.width)));
            }
        }
        if(!opts.inherit || !containerOut[copyAttr]) {
            coerce('color', defaultColor);
            coerce('thickness');
            coerce('width', Plotly.Plots.traceIs(traceOut, 'gl3d') ? 0 : 4);
        }
    }
};

errorBars.pushRef2GDC = function(gd, selCurve, astr, val){
    // Copy the error bar data into gdc
    // This is called from the style-box, where
    // either the reference trace was selected.
    // This function copies the data from the referenced trace
    // into the gdc object
    // selCurve: the selected curve (i.e. gdc = gd[selCurve])
    // astr: the string that was modified
    var iRef,
        various = false,
        parts = astr.split('.'),
        container = parts[0],
        attr = parts[1],
        letter = container.charAt(container.length-1);
    if(attr==='type'){
        if(selCurve==='various'){
            various = true;
            selCurve = 0;
        }
        // if the 'trace' type was just selected
        iRef = Number(gd.calcdata[Number(selCurve)][0].trace['error_' + letter].traceref)||0;
    }
    else if(attr==='traceref' || attr==='tracerefminus'){
        if(selCurve==='various') various = true;
        // if the trace reference was just modified
        iRef = Number(val)||0;
    }

    // now copy the appropriate referenced error bar data into gdc
    // TODO: do this through restyle so we can undo it
    // the error bar data that we're referencing
    var newdata = gd.data[iRef][letter].map(Number);

    function setarrays(i) {
        var eb = gd.data[i][container];
        eb[attr==='tracerefminus' ? 'arrayminus' : 'array'] = newdata;
    }

    if(!various) setarrays(Number(selCurve));
    else{
        // copy all of the data
        // TODO: this won't work right if we just select some traces, right?
        for(var i=0; i<gd.data.length; i++){ setarrays(i); }
    }
};

// size the error bar itself (for all types except data)
function errorval(type, dataval, errval) {
    if(type === 'percent') return Math.abs(dataval * errval / 100);
    if(type === 'constant') return Math.abs(errval);
    if(type === 'sqrt') return Math.sqrt(Math.abs(dataval));

    return 0;
}

errorBars.calc = function(gd) {
    (gd.calcdata||[]).forEach(function(cdi){
        var trace = cdi[0].trace;

        if(!Plotly.Plots.traceIs(trace, 'errorBarsOK')) return;

        var xObj = trace.error_x || {},
            yObj = trace.error_y || {},
            xa = Plotly.Axes.getFromId(gd, trace.xaxis),
            ya = Plotly.Axes.getFromId(gd, trace.yaxis),
            xvis = xObj.visible && ['linear', 'log'].indexOf(xa.type)!==-1,
            yvis = yObj.visible && ['linear', 'log'].indexOf(ya.type)!==-1;

        if(!xvis && !yvis) return;

        var xvals = [],
            yvals = [];

        cdi.forEach(function(d,j) {
            try {
                if(isNumeric(ya.c2l(d.y)) && isNumeric(xa.c2l(d.x))){
                    [
                        {letter:'x', obj: xObj, visible: xvis, vals: xvals},
                        {letter:'y', obj: yObj, visible: yvis, vals: yvals}
                    ].forEach(function(o){
                        if(o.visible) {
                            var dataVal = d[o.letter],
                                obj = o.obj,
                                ep, en;
                            if(o.obj.type==='data') {
                                ep = Number(obj.array[j]);
                                en = (obj.symmetric || !('arrayminus' in obj)) ?
                                    ep : Number(obj.arrayminus[j]);
                            }
                            else {
                                ep = errorval(obj.type, dataVal, obj.value);
                                en = (obj.symmetric || !('valueminus' in obj)) ?
                                    ep : errorval(obj.type, dataVal, obj.valueminus);
                            }
                            if(isNumeric(ep) && isNumeric(en)) {
                                var shoe = d[o.letter + 'h'] = dataVal + ep;
                                var hat = d[o.letter + 's'] = dataVal - en;
                                o.vals.push(shoe, hat);
                            }
                        }
                    });
                }
            }
            catch(e) { console.log(e); }
        });
        Plotly.Axes.expand(ya, yvals, {padded: true});
        Plotly.Axes.expand(xa, xvals, {padded: true});
    });
};

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
                sparse = Plotly.Scatter.hasMarkers(trace) &&
                    trace.marker.maxdisplayed>0;

            if(!yObj.visible && !xObj.visible) return;

            d3.select(this).selectAll('g')
                .data(Plotly.Lib.identity)
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
            .call(Plotly.Color.stroke, yObj.color);

        if(xObj.copy_ystyle) xObj = yObj;

        eb.selectAll('g path.xerror')
            .style('stroke-width', xObj.thickness+'px')
            .call(Plotly.Color.stroke, xObj.color);
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
