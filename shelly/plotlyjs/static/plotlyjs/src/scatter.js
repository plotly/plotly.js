'use strict';
/* jshint camelcase: false */

// ---external global dependencies
/* global d3:false */

var scatter = module.exports = {},
    Plotly = require('./plotly');

// mark this module as allowing error bars
scatter.errorBarsOK = true;

// traces with < this many points are by default shown
// with points and lines, > just get lines
scatter.PTS_LINESONLY = 20;

scatter.attributes = {
    x: {type: 'data_array'},
    x0: {
        type: 'any',
        dflt: 0
    },
    dx: {
        type: 'number',
        dflt: 1
    },
    y: {type: 'data_array'},
    y0: {
        type: 'any',
        dflt: 0
    },
    dy: {
        type: 'number',
        dflt: 1
    },
    text: {
        type: 'string',
        dflt: '',
        arrayOk: true
    },
    mode: {
        type: 'flaglist',
        flags: ['lines','markers','text'],
        extras: ['none']
    },
    line: {
        color: {
            type: 'color'
        },
        width: {
            type: 'number',
            min: 0,
            dflt: 2
        },
        shape: {
            type: 'enumerated',
            values: ['linear', 'spline', 'hv', 'vh', 'hvh', 'vhv'],
            dflt: 'linear'
        },
        smoothing: {
            type: 'number',
            min: 0,
            max: 1.3,
            dflt: 1
        },
        dash: {
            type: 'string',
            // string type usually doesn't take values... this one should really be
            // a special type or at least a special coercion function, from the GUI
            // you only get these values but elsewhere the user can supply a list of
            // dash lengths in px, and it will be honored
            values: ['solid', 'dot', 'dash', 'longdash', 'dashdot', 'longdashdot'],
            dflt: 'solid'
        }
    },
    connectgaps: {
        type: 'boolean',
        dflt: false
    },
    fill: {
        type: 'enumerated',
        values: ['none', 'tozeroy', 'tozerox', 'tonexty', 'tonextx'],
        dflt: 'none'
    },
    fillcolor: {type: 'color'},
    marker: {
        symbol: {
            type: 'enumerated',
            values: Plotly.Drawing.symbolList,
            dflt: 'circle',
            arrayOk: true
        },
        opacity: {
            type: 'number',
            min: 0,
            max: 1,
            arrayOk: true
        },
        size: {
            type: 'number',
            min: 0,
            dflt: 6,
            arrayOk: true
        },
        color: {
            type: 'color',
            arrayOk: true
        },
        maxdisplayed: {
            type: 'number',
            min: 0,
            dflt: 0
        },
        sizeref: {
            type: 'number',
            dflt: 1
        },
        sizemode: {
            type: 'enumerated',
            values: ['diameter', 'area'],
            dflt: 'diameter'
        },
        colorscale: {
            type: 'colorscale',
            dflt: Plotly.Color.defaultScale
        },
        cauto: {
            type: 'boolean',
            dflt: true
        },
        cmax: {
            type: 'number',
            dflt: 10
        },
        cmin: {
            type: 'number',
            dflt: -10
        },
        line: {
            color: {
                type: 'color',
                arrayOk: true
            },
            width: {
                type: 'number',
                min: 0,
                arrayOk: true
            },
            colorscale: {
                type: 'colorscale',
                dflt: Plotly.Color.defaultScale
            },
            cauto: {
                type: 'boolean',
                dflt: true
            },
            cmax: {
                type: 'number',
                dflt: 10
            },
            cmin: {
                type: 'number',
                dflt: -10
            }
        }
    },
    textposition: {
        type: 'enumerated',
        values: [
            'top left', 'top center', 'top right',
            'middle left', 'middle center', 'middle right',
            'bottom left', 'bottom center', 'bottom right'
        ],
        dflt: 'middle center',
        arrayOk: true
    },
    // TODO: all three of the sub-attributes here should be arrayOk
    textfont: {type: 'font'},
    _nestedModules: {  // nested module coupling
        'error_y': 'ErrorBars',
        'error_x': 'ErrorBars'
        // TODO: we should add colorbar?
    }
};

scatter.handleXYDefaults = function(traceIn, traceOut, coerce) {
    var len,
        x = coerce('x'),
        y = coerce('y');

    if(x) {
        if(y) {
            len = Math.min(x.length, y.length);
            // TODO: not sure we should do this here... but I think
            // the way it works in calc is wrong, because it'll delete data
            // which could be a problem eg in streaming / editing if x and y
            // come in at different times
            // so we need to revisit calc before taking this out
            if(len<x.length) traceOut.x = x.slice(0, len);
            if(len<y.length) traceOut.y = y.slice(0, len);
        }
        else {
            len = x.length;
            coerce('y0');
            coerce('dy');
        }
    }
    else {
        if(!y) return 0;

        len = traceOut.y.length;
        coerce('x0');
        coerce('dx');
    }
    return len;
};

scatter.supplyDefaults = function(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut, scatter.attributes, attr, dflt);
    }

    var len = scatter.handleXYDefaults(traceIn, traceOut, coerce),
        // TODO: default mode by orphan points...
        defaultMode = len < scatter.PTS_LINESONLY ? 'lines+markers' : 'lines';
    if(!len) {
        traceOut.visible = false;
        return;
    }

    coerce('text');
    coerce('mode', defaultMode);

    if(scatter.hasLines(traceOut)) {
        scatter.lineDefaults(traceIn, traceOut, defaultColor, layout);
    }

    if(scatter.hasMarkers(traceOut)) {
        scatter.markerDefaults(traceIn, traceOut, defaultColor, layout);
    }

    if(scatter.hasText(traceOut)) {
        coerce('textposition');
        coerce('textfont', layout.font);
        if(!scatter.hasMarkers(traceOut)) coerce('marker.maxdisplayed');
    }

    coerce('fill');
    if(traceOut.fill!=='none') {
        var inheritColorFromMarker = false;
        if(traceOut.marker) {
            // don't try to inherit a color array
            var markerColor = traceOut.marker.color,
                markerLineColor = (traceOut.marker.line||{}).color;
            if(markerColor && !Array.isArray(markerColor)) {
                inheritColorFromMarker = markerColor;
            }
            else if(markerLineColor && !Array.isArray(markerLineColor)) {
                inheritColorFromMarker = markerLineColor;
            }
        }
        coerce('fillcolor', Plotly.Color.addOpacity(
            (traceOut.line||{}).color ||
            inheritColorFromMarker ||
            defaultColor, 0.5));
        if(!scatter.hasLines(traceOut)) lineShapeDefaults(traceIn, traceOut);
    }

    Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'y'});
    Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'x', inherit: 'y'});
};

scatter.lineDefaults = function(traceIn, traceOut, defaultColor) {
    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut, scatter.attributes, attr, dflt);
    }

    var markerColor = (traceIn.marker||{}).color;
    // don't try to inherit a color array
    coerce('line.color', (Array.isArray(markerColor) ? false : markerColor) ||
                         defaultColor);
    coerce('line.width');

    lineShapeDefaults(traceIn, traceOut);

    coerce('connectgaps');
    coerce('line.dash');
};

function lineShapeDefaults(traceIn, traceOut) {
    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut, scatter.attributes, attr, dflt);
    }

    var shape = coerce('line.shape');
    if(shape==='spline') coerce('line.smoothing');
}

scatter.markerDefaults = function(traceIn, traceOut, defaultColor) {
    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut, scatter.attributes, attr, dflt);
    }

    var isBubble = scatter.isBubble(traceIn),
        lineColor = (traceIn.line||{}).color,
        defaultMLC;
    if(lineColor) defaultColor = lineColor;

    coerce('marker.symbol');
    coerce('marker.opacity', isBubble ? 0.7 : 1);
    coerce('marker.size');
    coerce('marker.maxdisplayed');

    scatter.colorScalableDefaults('marker.', coerce, defaultColor);

    // if there's a line with a different color than the marker, use
    // that line color as the default marker line color
    // mostly this is for transparent markers to behave nicely
    if(lineColor && traceOut.marker.color!==lineColor) {
        defaultMLC = lineColor;
    }
    else if(isBubble) defaultMLC = Plotly.Color.background;
    else defaultMLC = Plotly.Color.defaultLine;
    scatter.colorScalableDefaults('marker.line.', coerce, defaultMLC);

    coerce('marker.line.width', isBubble ? 1 : 0);

    if(isBubble) {
        coerce('marker.sizeref');
        coerce('marker.sizemode');
    }
};

scatter.colorScalableDefaults = function(prefix, coerce, dflt) {
    var colorAttr = prefix + 'color',
        colorVal = coerce(colorAttr, dflt),
        attrs = [
            prefix + 'colorscale',
            prefix + 'cauto',
            prefix + 'cmax',
            prefix + 'cmin'
        ];

    if(Array.isArray(colorVal)) {
        for (var i = 0; i < attrs.length; i++) {
            coerce(attrs[i]);
        }
    }
};

scatter.cleanData = function(fullData) {
    var i,
        tracei,
        filli,
        j,
        tracej;

    // remove opacity for any trace that has a fill or is filled to
    for(i = 0; i < fullData.length; i++) {
        tracei = fullData[i];
        filli = tracei.fill;
        if(filli==='none' || (tracei.type !== 'scatter')) continue;
        tracei.opacity = undefined;

        if(filli === 'tonexty' || filli === 'tonextx') {
            for(j = i - 1; j >= 0; j--) {
                tracej = fullData[j];
                if((tracej.type === 'scatter') &&
                        (tracej.xaxis === tracei.xaxis) &&
                        (tracej.yaxis === tracei.yaxis)) {
                    tracej.opacity = undefined;
                    break;
                }
            }
        }
    }
};

scatter.hasLines = function(trace) {
    return trace.visible && trace.mode &&
        trace.mode.indexOf('lines') !== -1;
};

scatter.hasMarkers = function(trace) {
    return trace.visible && trace.mode &&
        trace.mode.indexOf('markers') !== -1;
};

scatter.hasText = function(trace) {
    return trace.visible && trace.mode &&
        trace.mode.indexOf('text') !== -1;
};

scatter.isBubble = function(trace) {
    return (typeof trace.marker === 'object' &&
                Array.isArray(trace.marker.size));
};

scatter.calc = function(gd,trace) {
    var xa = Plotly.Axes.getFromId(gd,trace.xaxis||'x'),
        ya = Plotly.Axes.getFromId(gd,trace.yaxis||'y');
    Plotly.Lib.markTime('in Scatter.calc');
    var x = xa.makeCalcdata(trace,'x');
    Plotly.Lib.markTime('finished convert x');
    var y = ya.makeCalcdata(trace,'y');
    Plotly.Lib.markTime('finished convert y');
    var serieslen = Math.min(x.length,y.length),
        s,
        i;

    // cancel minimum tick spacings (only applies to bars and boxes)
    xa._minDtick = 0;
    ya._minDtick = 0;

    if(x.length>serieslen) x.splice(serieslen, x.length-serieslen);
    if(y.length>serieslen) y.splice(serieslen, y.length-serieslen);

    // check whether bounds should be tight, padded, extended to zero...
    // most cases both should be padded on both ends, so start with that.
    var xOptions = {padded:true},
        yOptions = {padded:true};

    if(scatter.hasMarkers(trace)) {

        // Treat size like x or y arrays --- Run d2c
        // this needs to go before ppad computation
        s = trace.marker.size;
        if (Array.isArray(s)) {
            // I tried auto-type but category and dates dont make much sense.
            var ax = {type: 'linear'};
            Plotly.Axes.setConvert(ax);
            s = ax.makeCalcdata(trace.marker, 'size');
            if(s.length>serieslen) s.splice(serieslen, s.length-serieslen);
        }

        var sizeref = 1.6*(trace.marker.sizeref||1),
            markerTrans;
        if(trace.marker.sizemode==='area') {
            markerTrans = function(v) {
                return Math.max(Math.sqrt((v||0)/sizeref),3);
            };
        }
        else {
            markerTrans = function(v) {
                return Math.max((v||0)/sizeref,3);
            };
        }
        xOptions.ppad = yOptions.ppad = Array.isArray(s) ?
            s.map(markerTrans) : markerTrans(s);

    }
    // TODO: text size

    // include zero (tight) and extremes (padded) if fill to zero
    // (unless the shape is closed, then it's just filling the shape regardless)
    if((trace.fill==='tozerox' || (trace.fill==='tonextx' && gd.firstscatter)) &&
            (x[0]!==x[serieslen-1] || y[0]!==y[serieslen-1])) {
        xOptions.tozero = true;
    }

    // if no error bars, markers or text, or fill to y=0 remove x padding
    else if(!trace.error_y.visible &&
            (['tonexty', 'tozeroy'].indexOf(trace.fill)!==-1 ||
             (!scatter.hasMarkers(trace) && !scatter.hasText(trace)))) {
        xOptions.padded = false;
        xOptions.ppad = 0;
    }

    // now check for y - rather different logic, though still mostly padded both ends
    // include zero (tight) and extremes (padded) if fill to zero
    // (unless the shape is closed, then it's just filling the shape regardless)
    if((trace.fill==='tozeroy' || (trace.fill==='tonexty' && gd.firstscatter)) &&
            (x[0]!==x[serieslen-1] || y[0]!==y[serieslen-1])) {
        yOptions.tozero = true;
    }

    // tight y: any x fill
    else if(['tonextx', 'tozerox'].indexOf(trace.fill)!==-1) {
        yOptions.padded = false;
    }

    Plotly.Lib.markTime('ready for Axes.expand');
    Plotly.Axes.expand(xa, x, xOptions);
    Plotly.Lib.markTime('done expand x');
    Plotly.Axes.expand(ya, y, yOptions);
    Plotly.Lib.markTime('done expand y');

    // create the "calculated data" to plot
    var cd = new Array(serieslen);
    for(i = 0; i < serieslen; i++) {
        cd[i] = ($.isNumeric(x[i]) && $.isNumeric(y[i])) ?
            {x: x[i], y: y[i]} : {x: false, y: false};
    }

    // this has migrated up from arraysToCalcdata as we have a reference to 's' here
    if (typeof s !== undefined) Plotly.Lib.mergeArray(s, cd, 'ms');

    gd.firstscatter = false;
    return cd;
};

scatter.selectMarkers = function(gd, plotinfo, cdscatter) {
    var xa = plotinfo.x(),
        ya = plotinfo.y(),
        xr = d3.extent(xa.range.map(xa.l2c)),
        yr = d3.extent(ya.range.map(ya.l2c));

    cdscatter.forEach(function(d,i) {
        var trace = d[0].trace;
        if(!scatter.hasMarkers(trace)) return;
        // if marker.maxdisplayed is used, select a maximum of
        // mnum markers to show, from the set that are in the viewport
        var mnum = trace.marker.maxdisplayed;

        // TODO: remove some as we get away from the viewport?
        if(mnum===0) return;

        var cd = d.filter(function(v) {
                return v.x>=xr[0] && v.x<=xr[1] && v.y>=yr[0] && v.y<=yr[1];
            }),
            inc = Math.ceil(cd.length/mnum),
            tnum = 0;
        cdscatter.forEach(function(cdj, j) {
            var tracei = cdj[0].trace;
            if(scatter.hasMarkers(tracei) &&
                    tracei.marker.maxdisplayed>0 && j<i) {
                tnum++;
            }
        });

        // if multiple traces use maxdisplayed, stagger which markers we
        // display this formula offsets successive traces by 1/3 of the
        // increment, adding an extra small amount after each triplet so
        // it's not quite periodic
        var i0 = Math.round(tnum*inc/3 + Math.floor(tnum/3)*inc/7.1);

        // for error bars: save in cd which markers to show
        // so we don't have to repeat this
        d.forEach(function(v){ delete v.vis; });
        cd.forEach(function(v,i) {
            if(Math.round((i+i0)%inc)===0) v.vis = true;
        });
    });
};

// arrayOk attributes, merge them into calcdata array
scatter.arraysToCalcdata = function(cd) {
    var trace = cd[0].trace,
        marker = trace.marker;

    Plotly.Lib.mergeArray(trace.text, cd, 'tx');
    Plotly.Lib.mergeArray(trace.textposition, cd, 'tp');
    if(trace.textfont) {
        Plotly.Lib.mergeArray(trace.textfont.size, cd, 'ts');
        Plotly.Lib.mergeArray(trace.textfont.color, cd, 'tc');
        Plotly.Lib.mergeArray(trace.textfont.family, cd, 'tf');
    }

    if(marker && marker.line) {
        var markerLine = marker.line;
        Plotly.Lib.mergeArray(marker.opacity, cd, 'mo');
        Plotly.Lib.mergeArray(marker.symbol, cd, 'mx');
        Plotly.Lib.mergeArray(marker.color, cd, 'mc');
        Plotly.Lib.mergeArray(markerLine.color, cd, 'mlc');
        Plotly.Lib.mergeArray(markerLine.width, cd, 'mlw');
    }
};

scatter.plot = function(gd, plotinfo, cdscatter) {
    scatter.selectMarkers(gd, plotinfo, cdscatter);

    var xa = plotinfo.x(),
        ya = plotinfo.y();

    // make the container for scatter plots
    // (so error bars can find them along with bars)
    var scattertraces = plotinfo.plot.select('.scatterlayer')
        .selectAll('g.trace.scatter')
        .data(cdscatter);
    scattertraces.enter().append('g')
        .attr('class','trace scatter')
        .style('stroke-miterlimit',2);

    // BUILD LINES AND FILLS
    var prevpath='',
        tozero,tonext,nexttonext;
    scattertraces.each(function(d){
        var trace = d[0].trace,
            line = trace.line;
        if(trace.visible !== true) return;

        scatter.arraysToCalcdata(d);

        if(!scatter.hasLines(trace) && trace.fill==='none') return;

        var tr = d3.select(this),
            thispath,
            // fullpath is all paths for this curve, joined together straight
            // across gaps, for filling
            fullpath = '',
            // revpath is fullpath reversed, for fill-to-next
            revpath = '',
            // functions for converting a point array to a path
            pathfn, revpathbase, revpathfn;

        // make the fill-to-zero path now, so it shows behind the line
        // fill to next puts the fill associated with one trace
        // grouped with the previous
        if(trace.fill.substr(0,6)==='tozero' ||
                (trace.fill.substr(0,2)==='to' && !prevpath)) {
            tozero = tr.append('path')
                .classed('js-fill',true);
        }
        else tozero = null;

        // make the fill-to-next path now for the NEXT trace, so it shows
        // behind both lines.
        // nexttonext was created last time, but give it
        // this curve's data for fill color
        if(nexttonext) tonext = nexttonext.datum(d);

        // now make a new nexttonext for next time
        nexttonext = tr.append('path').classed('js-fill',true);

        if(['hv','vh','hvh','vhv'].indexOf(line.shape)!==-1) {
            pathfn = Plotly.Drawing.steps(line.shape);
            revpathbase = Plotly.Drawing.steps(
                line.shape.split('').reverse().join('')
            );
        }
        else if(line.shape==='spline') {
            pathfn = revpathbase = function(pts) {
                return Plotly.Drawing.smoothopen(pts, line.smoothing);
            };
        }
        else {
            pathfn = revpathbase = function(pts) {
                return 'M' + pts.join('L');
            };
        }

        revpathfn = function(pts) {
            // note: this is destructive (reverses pts in place) so can't use pts after this
            return 'L'+revpathbase(pts.reverse()).substr(1);
        };

        var segments = scatter.linePoints(d, xa, ya, trace.connectgaps, Math.max(line.width || 1, 1));
        if(segments.length) {
            var pt0 = segments[0][0],
                lastSegment = segments[segments.length - 1],
                pt1 = lastSegment[lastSegment.length - 1];

            for(var i = 0; i < segments.length; i++) {
                var pts = segments[i];
                thispath = pathfn(pts);
                fullpath += fullpath ? ('L'+thispath.substr(1)) : thispath;
                revpath = revpathfn(pts) + revpath;
                if(scatter.hasLines(trace) && pts.length > 1) {
                    tr.append('path').classed('js-line',true).attr('d', thispath);
                }
            }
            if(tozero) {
                if(pt0 && pt1) {
                    if(trace.fill.charAt(trace.fill.length-1)==='y') {
                        pt0[1]=pt1[1]=ya.c2p(0,true);
                    }
                    else pt0[0]=pt1[0]=xa.c2p(0,true);

                    // fill to zero: full trace path, plus extension of
                    // the endpoints to the appropriate axis
                    tozero.attr('d',fullpath+'L'+pt1+'L'+pt0+'Z');
                }
            }
            else if(trace.fill.substr(0,6)==='tonext' && fullpath && prevpath) {
                // fill to next: full trace path, plus the previous path reversed
                tonext.attr('d',fullpath+prevpath+'Z');
            }
            prevpath = revpath;
        }
    });

    // remove paths that didn't get used
    scattertraces.selectAll('path:not([d])').remove();

    function visFilter(d){
        return d.filter(function(v){ return v.vis; });
    }

    scattertraces.append('g')
        .attr('class','points')
        .each(function(d){
            var trace = d[0].trace,
                s = d3.select(this),
                showMarkers = scatter.hasMarkers(trace),
                showText = scatter.hasText(trace);

            if((!showMarkers && !showText) || trace.visible !== true) s.remove();
            else {
                if(showMarkers) {
                    s.selectAll('path.point')
                        .data(trace.marker.maxdisplayed ? visFilter : Plotly.Lib.identity)
                        .enter().append('path')
                            .classed('point', true)
                            .call(Plotly.Drawing.translatePoints, xa, ya);
                }
                if(showText) {
                    s.selectAll('g')
                        .data(trace.marker.maxdisplayed ? visFilter : Plotly.Lib.identity)
                        // each text needs to go in its own 'g' in case
                        // it gets converted to mathjax
                        .enter().append('g')
                            .append('text')
                            .call(Plotly.Drawing.translatePoints, xa, ya);
                }
            }
        });
};

scatter.linePoints = function(d, xa, ya, connectGaps, lineWidth) {
    var segments = [],
        pts = [],
        atLeastTwo,
        pt0 = null,
        pt1 = null,
        // for decimation: store pixel positions of things
        // we're working with as [x,y]
        lastEntered,
        tryHigh,
        tryLow,
        prevPt,
        pti,
        // lastEnd: high or low, which is most recent?
        // decimationMode: -1 (not decimating), 0 (x), 1 (y)
        // decimationTolerance: max pixels between points
        // to allow decimation
        lastEnd,
        decimationMode,
        decimationTolerance;

    // determine how close two points need to be to be grouped
    function getTolerance(x, y) {
        return (0.75 + 10*Math.max(0,
            Math.max(-x, x-xa._length)/xa._length,
            Math.max(-y, y-ya._length)/ya._length)) * lineWidth;
    }

    // add a single [x,y] to the pts array
    function addPt(pt) {
        atLeastTwo = true;
        add0(pt);
        pt1 = pt;
    }

    // simpler version where we don't need the extra assignments
    function add0(pt) {
        if(!$.isNumeric(pt[0]) || !$.isNumeric(pt[1])) return;
        pts.push(pt);
    }

    // finish one decimation step - now decide what to do with
    // tryHigh, tryLow, and prevPt
    // (prevPt is the last one before the decimation ended)
    function finishDecimation(pt) {
        if(pt) prevPt = pt;

        // ended this decimation on the high point, so add the low first
        // (unless there was only one point)
        if(prevPt===tryHigh) {
            if(tryHigh!==tryLow) add0(tryLow);
        }
        // ended on the low point (or high and low are same),
        // so add high first
        else if(prevPt===tryLow || tryLow===tryHigh) add0(tryHigh);
        // low, then high, then prev
        else if(lastEnd==='high') {
            add0(tryLow);
            add0(tryHigh);
        }
        // high, low, prev
        else {
            add0(tryHigh);
            add0(tryLow);
        }

        // lastly, add the endpoint of this decimation
        addPt(prevPt);

        // reset status vars
        lastEntered = prevPt;
        tryHigh = tryLow = null;
        decimationMode = -1;
    }

    var i = -1;
    while(i<d.length) {
        pts=[];
        atLeastTwo = false;
        lastEntered = null;
        decimationMode = -1;
        for(i++; i<d.length; i++) {
            pti = [xa.c2p(d[i].x), ya.c2p(d[i].y)];
            // TODO: smart lines going off the edge?
            if(!$.isNumeric(pti[0])||!$.isNumeric(pti[1])) {
                if(connectGaps) continue;
                else break;
            }

            // DECIMATION
            // first point: always add it, and prep the other variables
            if(!lastEntered) {
                lastEntered = pti;
                pts.push(lastEntered);
                if(!pt0) pt0 = lastEntered;
                continue;
            }

            // figure out the decimation tolerance - on-plot has one value,
            // then it increases as you get farther off-plot.
            // the value is in pixels, and is based on the line width, which
            // means we need to replot if we change the line width
            decimationTolerance = getTolerance(pti[0], pti[1]);

            // if the last move was too much for decimation, see if we're
            // starting a new decimation block
            if(decimationMode<0) {
                // first look for very near x values (decimationMode=0),
                // then near y values (decimationMode=1)
                if(Math.abs(pti[0]-lastEntered[0]) < decimationTolerance) {
                    decimationMode = 0;
                }
                else if(Math.abs(pti[1]-lastEntered[1]) < decimationTolerance) {
                    decimationMode = 1;
                }
                // no decimation here - add this point and move on
                else {
                    lastEntered = pti;
                    addPt(lastEntered);
                    continue;
                }
            }
            else if(Math.abs(pti[decimationMode] - lastEntered[decimationMode]) >=
                    decimationTolerance) {
                // we were decimating, now we're done
                if(Math.abs(pti[decimationMode] - prevPt[decimationMode]) >=
                    decimationTolerance) {
                    // a big jump after finishing decimation: end on prevPt
                    finishDecimation();
                    // then add the new point
                    lastEntered = pti;
                    addPt(lastEntered);
                }
                else {
                    // small change... probably going to start a new
                    // decimation block.
                    finishDecimation(pti);
                }
                continue;
            }

            // OK, we're collecting points for decimation, for realz now.
            prevPt = pti;
            if(!tryHigh || prevPt[1-decimationMode]>tryHigh[1-decimationMode]) {
                tryHigh = prevPt;
                lastEnd = 'high';
            }
            if(!tryLow || prevPt[1-decimationMode]<tryLow[1-decimationMode]) {
                tryLow = prevPt;
                lastEnd = 'low';
            }
        }
        // end of the data is mid-decimation - close it out.
        if(decimationMode>=0) finishDecimation(pti);

        if(pts.length) segments.push(pts);
    }

    return segments;
};

scatter.style = function(gp) {
    var s = gp.selectAll('g.trace.scatter');

    s.style('opacity',function(d){ return d[0].trace.opacity; });

    s.selectAll('g.points')
        .each(function(d){
            d3.select(this).selectAll('path.point')
                .call(Plotly.Drawing.pointStyle,d.trace||d[0].trace);
            d3.select(this).selectAll('text')
                .call(Plotly.Drawing.textPointStyle,d.trace||d[0].trace);
        });

    s.selectAll('g.trace path.js-line')
        .call(Plotly.Drawing.lineGroupStyle);

    s.selectAll('g.trace path.js-fill')
        .call(Plotly.Drawing.fillGroupStyle);
};

function traceColor(trace, di) {
    var lc, tc;
    // TODO: text modes
    if(trace.mode==='lines') {
        lc = trace.line.color;
        return (lc && Plotly.Color.opacity(lc)) ?
            lc : trace.fillcolor;
    }
    else if(trace.mode==='none') {
        return trace.fill ? trace.fillcolor : '';
    }

    else {
        var mc = di.mcc || (trace.marker||{}).color,
            mlc = di.mlcc || ((trace.marker||{}).line||{}).color;
        tc = (mc && Plotly.Color.opacity(mc)) ? mc :
            (mlc && Plotly.Color.opacity(mlc) &&
                (di.mlw || ((trace.marker||{}).line||{}).width)) ? mlc : '';
        if(tc) {
            // make sure the points aren't TOO transparent
            if(Plotly.Color.opacity(tc)<0.3) {
                return Plotly.Color.addOpacity(tc, 0.3);
            }
            else return tc;
        }
        else {
            lc = (trace.line||{}).color;
            return (lc && Plotly.Color.opacity(lc) &&
                Plotly.Scatter.hasLines(trace) && trace.line.width) ?
                    lc : trace.fillcolor;
        }
    }
}

scatter.hoverPoints = function(pointData, xval, yval, hovermode) {
    var cd = pointData.cd,
        trace = cd[0].trace,
        xa = pointData.xa,
        ya = pointData.ya,
        dx = function(di){
            // scatter points: d.mrc is the calculated marker radius
            // adjust the distance so if you're inside the marker it
            // always will show up regardless of point size, but
            // prioritize smaller points
            var rad = Math.max(3, di.mrc||0);
            return Math.max(Math.abs(xa.c2p(di.x)-xa.c2p(xval))-rad, 1-3/rad);
        },
        dy = function(di){
            var rad = Math.max(3, di.mrc||0);
            return Math.max(Math.abs(ya.c2p(di.y)-ya.c2p(yval))-rad, 1-3/rad);
        },
        dxy = function(di) {
            var rad = Math.max(3, di.mrc||0),
                dx = Math.abs(xa.c2p(di.x)-xa.c2p(xval)),
                dy = Math.abs(ya.c2p(di.y)-ya.c2p(yval));
            return Math.max(Math.sqrt(dx*dx + dy*dy)-rad, 1-3/rad);
        },
        distfn = Plotly.Fx.getDistanceFunction(hovermode, dx, dy, dxy);

    Plotly.Fx.getClosest(cd, distfn, pointData);

    // skip the rest (for this trace) if we didn't find a close point
    if(pointData.index===false) return;

    // the closest data point
    var di = cd[pointData.index],
        xc = xa.c2p(di.x, true),
        yc = ya.c2p(di.y, true),
        rad = di.mrc||1;

    pointData.color = traceColor(trace, di);

    pointData.x0 = xc - rad;
    pointData.x1 = xc + rad;
    pointData.xLabelVal = di.x;

    pointData.y0 = yc - rad;
    pointData.y1 = yc + rad;
    pointData.yLabelVal = di.y;

    if(di.tx) pointData.text = di.tx;

    Plotly.ErrorBars.hoverInfo(di, trace, pointData);

    return [pointData];
};
