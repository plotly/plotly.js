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

var boxes = module.exports = {};

Plotly.Plots.register(boxes, 'box',
    ['cartesian', 'symbols', 'oriented', 'box', 'showLegend'], {
    description: [
        'In vertical (horizontal) box plots,',
        'statistics are computed using `y` (`x`) values.',
        'By supplying an `x` (`y`) array, one box per distinct x (y) value',
        'is drawn',
        'If no `x` (`y`) {array} is provided, a single box is drawn.',
        'That box position is then positioned with',
        'with `name` or with `x0` (`y0`) if provided.',
        'Each box spans from quartile 1 (Q1) to quartile 3 (Q3).',
        'The second quartile (Q2) is marked by a line inside the box.',
        'By default, the whiskers correspond to the box\' edges',
        '+/- 1.5 times the interquartile range (IQR = Q3-Q1),',
        'see *boxpoints* for other options.'
    ].join(' ')
});

boxes.attributes = require('./attributes');

boxes.layoutAttributes = require('./layout_attributes');

boxes.supplyDefaults = function(traceIn, traceOut, defaultColor) {
    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut, boxes.attributes, attr, dflt);
    }

    var y = coerce('y'),
        x = coerce('x'),
        defaultOrientation;

    if (y && y.length) {
        defaultOrientation = 'v';
        if (!x) coerce('x0');
    } else if (x && x.length) {
        defaultOrientation = 'h';
        coerce('y0');
    } else {
        traceOut.visible = false;
        return;
    }

    coerce('orientation', defaultOrientation);

    coerce('line.color', (traceIn.marker||{}).color || defaultColor);
    coerce('line.width', 2);
    coerce('fillcolor', Plotly.Color.addOpacity(traceOut.line.color, 0.5));

    coerce('whiskerwidth');
    coerce('boxmean');

    var outlierColorDflt = Plotly.Lib.coerce2(traceIn, traceOut, boxes.attributes, 'marker.outliercolor'),
        lineoutliercolor = coerce('marker.line.outliercolor'),
        boxpoints = outlierColorDflt || 
                    lineoutliercolor ? coerce('boxpoints', 'suspectedoutliers') : 
                    coerce('boxpoints');
                    
    if(boxpoints) {
        coerce('jitter', boxpoints==='all' ? 0.3 : 0);
        coerce('pointpos', boxpoints==='all' ? -1.5 : 0);

        coerce('marker.symbol');
        coerce('marker.opacity');
        coerce('marker.size');
        coerce('marker.color', traceOut.line.color);
        coerce('marker.line.color');
        coerce('marker.line.width');

        if(boxpoints==='suspectedoutliers') {
            coerce('marker.line.outliercolor', traceOut.marker.color);
            coerce('marker.line.outlierwidth');
        }
    }
};

boxes.supplyLayoutDefaults = function(layoutIn, layoutOut, fullData) {
    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(layoutIn, layoutOut, boxes.layoutAttributes, attr, dflt);
    }

    var hasBoxes;
    for(var i = 0; i < fullData.length; i++) {
        if(Plotly.Plots.traceIs(fullData[i], 'box')) {
            hasBoxes = true;
            break;
        }
    }
    if(!hasBoxes) return;

    coerce('boxmode');
    coerce('boxgap');
    coerce('boxgroupgap');
};

boxes.calc = function(gd, trace) {
    // outlier definition based on http://www.physics.csbsju.edu/stats/box2.html
    var xa = Plotly.Axes.getFromId(gd, trace.xaxis||'x'),
        ya = Plotly.Axes.getFromId(gd, trace.yaxis||'y'),
        orientation = trace.orientation,
        cd = [],
        valAxis, valLetter, val, valBinned,
        posAxis, posLetter, pos, posDistinct, dPos;

    // Set value (val) and position (pos) keys via orientation
    if (orientation==='h') {
        valAxis = xa;
        valLetter = 'x';
        posAxis = ya;
        posLetter = 'y';
    } else {
        valAxis = ya;
        valLetter = 'y';
        posAxis = xa;
        posLetter = 'x';
    }

    val = valAxis.makeCalcdata(trace, valLetter);  // get val

    // size autorange based on all source points
    // position happens afterward when we know all the pos
    Plotly.Axes.expand(valAxis, val, {padded: true});

    // In vertical (horizontal) box plots:
    // if no x (y) data, use x0 (y0), or name
    // so if you want one box
    // per trace, set x0 (y0) to the x (y) value or category for this trace
    // (or set x (y) to a constant array matching y (x))
    function getPos (gd, trace, posLetter, posAxis, val) {
        var pos0;
        if (posLetter in trace) pos = posAxis.makeCalcdata(trace, posLetter);
        else {
            if (posLetter+'0' in trace) pos0 = trace[posLetter+'0'];
            else if ('name' in trace && (
                        posAxis.type==='category' ||
                        (isNumeric(trace.name) &&
                            ['linear','log'].indexOf(posAxis.type)!==-1) ||
                        (Plotly.Lib.isDateTime(trace.name) &&
                         posAxis.type==='date')
                    )) {
                pos0 = trace.name;
            }
            else pos0 = gd.numboxes;
            pos0 = posAxis.d2c(pos0);
            pos = val.map(function(){ return pos0; });
        }
        return pos;
    }

    pos = getPos(gd, trace, posLetter, posAxis, val);

    // get distinct positions and min difference
    var dv = Plotly.Lib.distinctVals(pos);
    posDistinct = dv.vals;
    dPos = dv.minDiff/2;

    function binVal (cd, val, pos, posDistinct, dPos) {
        var posDistinctLength = posDistinct.length,
            valLength = val.length,
            valBinned = [],
            bins = [],
            i, p, n, v;

        // store distinct pos in cd, find bins, init. valBinned
        for (i = 0; i < posDistinctLength; ++i) {
            p = posDistinct[i];
            cd[i] = {pos: p};
            bins[i] = p - dPos;
            valBinned[i] = [];
        }
        bins.push(posDistinct[posDistinctLength-1] + dPos);

        // bin the values
        for (i = 0; i < valLength; ++i) {
            v = val[i];
            if(!isNumeric(v)) continue;
            n = Plotly.Lib.findBin(pos[i], bins);
            if(n>=0 && n<valLength) valBinned[n].push(v);
        }

        return valBinned;
    }

    valBinned = binVal(cd, val, pos, posDistinct, dPos);

    // sort the bins and calculate the stats
    function calculateStats (cd, valBinned) {
        var v, l, cdi, i;

        for (i = 0; i < valBinned.length; ++i) {
            v = valBinned[i].sort(Plotly.Lib.sorterAsc);
            l = v.length;
            cdi = cd[i];

            cdi.val = v;  // put all values into calcdata
            cdi.min = v[0];
            cdi.max = v[l-1];
            cdi.mean = Plotly.Lib.mean(v,l);
            cdi.sd = Plotly.Lib.stdev(v,l,cdi.mean);
            cdi.q1 = Plotly.Lib.interp(v, 0.25);  // first quartile
            cdi.med = Plotly.Lib.interp(v, 0.5);  // median
            cdi.q3 = Plotly.Lib.interp(v, 0.75);  // third quartile
            // lower and upper fences - last point inside
            // 1.5 interquartile ranges from quartiles
            cdi.lf = Math.min(cdi.q1, v[
                Math.min(Plotly.Lib.findBin(2.5*cdi.q1-1.5*cdi.q3,v,true)+1, l-1)]);
            cdi.uf = Math.max(cdi.q3,v[
                Math.max(Plotly.Lib.findBin(2.5*cdi.q3-1.5*cdi.q1,v), 0)]);
            // lower and upper outliers - 3 IQR out (don't clip to max/min,
            // this is only for discriminating suspected & far outliers)
            cdi.lo = 4*cdi.q1-3*cdi.q3;
            cdi.uo = 4*cdi.q3-3*cdi.q1;
        }
    }

    calculateStats(cd, valBinned);

    // remove empty bins
    cd = cd.filter(function(cdi){ return cdi.val && cdi.val.length; });
    if(!cd.length) return [{t: {emptybox: true}}];

    // add numboxes and dPos to cd
    cd[0].t = {boxnum: gd.numboxes, dPos: dPos};
    gd.numboxes++;
    return cd;
};

boxes.setPositions = function(gd, plotinfo) {
    var fullLayout = gd._fullLayout,
        xa = plotinfo.x(),
        ya = plotinfo.y(),
        orientations = ['v', 'h'],
        posAxis, i, j, k;

    for (i=0; i < orientations.length; ++i) {
        var orientation = orientations[i],
            boxlist = [],
            boxpointlist = [],
            minPad = 0,
            maxPad = 0,
            cd,
            t,
            trace;

        // set axis via orientation
        if (orientation==='h') posAxis = ya;
        else posAxis = xa;

        // make list of boxes
        for (j=0; j < gd.calcdata.length; ++j) {
            cd = gd.calcdata[j];
            t = cd[0].t;
            trace = cd[0].trace;

            if (trace.visible === true && Plotly.Plots.traceIs(trace, 'box') &&
                    !t.emptybox &&
                    trace.orientation === orientation &&
                    trace.xaxis === xa._id &&
                    trace.yaxis === ya._id) {
                boxlist.push(j);
                if (trace.boxpoints !== false) {
                    minPad = Math.max(minPad, trace.jitter-trace.pointpos-1);
                    maxPad = Math.max(maxPad, trace.jitter+trace.pointpos-1);
                }
            }
        }

        // make list of box points
        for (j = 0; j < boxlist.length; j++) {
            cd = gd.calcdata[boxlist[j]];
            for (k = 0; k < cd.length; k++) boxpointlist.push(cd[k].pos);
        }
        if (!boxpointlist.length) continue;

        // box plots - update dPos based on multiple traces
        // and then use for posAxis autorange

        var boxdv = Plotly.Lib.distinctVals(boxpointlist),
            dPos = boxdv.minDiff/2;

        // if there's no duplication of x points,
        // disable 'group' mode by setting numboxes=1
        if(boxpointlist.length===boxdv.vals.length) gd.numboxes = 1;

        // check for forced minimum dtick
        Plotly.Axes.minDtick(posAxis, boxdv.minDiff, boxdv.vals[0], true);

        // set the width of all boxes
        for (i=0; i < boxlist.length; ++i) {
            gd.calcdata[i][0].t.dPos = dPos;
        }

        // autoscale the x axis - including space for points if they're off the side
        // TODO: this will overdo it if the outermost boxes don't have
        // their points as far out as the other boxes
        var padfactor = (1-fullLayout.boxgap) * (1-fullLayout.boxgroupgap) *
                dPos / gd.numboxes;
        Plotly.Axes.expand(posAxis, boxdv.vals, {
            vpadminus: dPos+minPad*padfactor,
            vpadplus: dPos+maxPad*padfactor
        });
    }
};

// repeatable pseudorandom generator
var randSeed = 2000000000;

function seed() {
    randSeed = 2000000000;
}

function rand() {
    var lastVal = randSeed;
    randSeed = (69069*randSeed + 1)%4294967296;
    // don't let consecutive vals be too close together
    // gets away from really trying to be random, in favor of better local uniformity
    if(Math.abs(randSeed - lastVal) < 429496729) return rand();
    return randSeed/4294967296;
}

// constants for dynamic jitter (ie less jitter for sparser points)
var JITTERCOUNT = 5, // points either side of this to include
    JITTERSPREAD = 0.01; // fraction of IQR to count as "dense"

boxes.plot = function(gd, plotinfo, cdbox) {
    var fullLayout = gd._fullLayout,
        xa = plotinfo.x(),
        ya = plotinfo.y(),
        posAxis, valAxis;

    var boxtraces = plotinfo.plot.select('.boxlayer')
        .selectAll('g.trace.boxes')
            .data(cdbox)
      .enter().append('g')
        .attr('class','trace boxes');

    boxtraces.each(function(d){
        var t = d[0].t,
            trace = d[0].trace,
            group = (fullLayout.boxmode==='group' && gd.numboxes>1),
            // box half width
            bdPos = t.dPos*(1-fullLayout.boxgap)*(1-fullLayout.boxgroupgap)/(group ? gd.numboxes : 1),
            // box center offset
            bPos = group ? 2*t.dPos*(-0.5+(t.boxnum+0.5)/gd.numboxes)*(1-fullLayout.boxgap) : 0,
            // whisker width
            wdPos = bdPos*trace.whiskerwidth;
        if(trace.visible !== true || t.emptybox) {
            d3.select(this).remove();
            return;
        }

        // set axis via orientation
        if (trace.orientation==='h') {
            posAxis = ya;
            valAxis = xa;
        } else {
            posAxis = xa;
            valAxis = ya;
        }

        // save the box size and box position for use by hover
        t.bPos = bPos;
        t.bdPos = bdPos;

        // repeatable pseudorandom number generator
        seed();

        // boxes and whiskers
        d3.select(this).selectAll('path.box')
            .data(Plotly.Lib.identity)
            .enter().append('path')
            .attr('class','box')
            .each(function(d){
                var posc = posAxis.c2p(d.pos + bPos, true),
                    pos0 = posAxis.c2p(d.pos + bPos - bdPos, true),
                    pos1 = posAxis.c2p(d.pos + bPos + bdPos, true),
                    posw0 = posAxis.c2p(d.pos + bPos - wdPos, true),
                    posw1 = posAxis.c2p(d.pos + bPos + wdPos, true),
                    q1 = valAxis.c2p(d.q1, true),
                    q3 = valAxis.c2p(d.q3, true),
                    // make sure median isn't identical to either of the
                    // quartiles, so we can see it
                    m = Plotly.Lib.constrain(valAxis.c2p(d.med, true),
                        Math.min(q1, q3)+1, Math.max(q1, q3)-1),
                    lf = valAxis.c2p(trace.boxpoints===false ? d.min : d.lf, true),
                    uf = valAxis.c2p(trace.boxpoints===false ? d.max : d.uf, true);
                if (trace.orientation==='h') {
                    d3.select(this).attr('d',
                        'M'+m+','+pos0+'V'+pos1+ // median line
                        'M'+q1+','+pos0+'V'+pos1+'H'+q3+'V'+pos0+'Z'+ // box
                        'M'+q1+','+posc+'H'+lf+'M'+q3+','+posc+'H'+uf+ // whiskers
                        ((trace.whiskerwidth===0) ? '' : // whisker caps
                            'M'+lf+','+posw0+'V'+posw1+'M'+uf+','+posw0+'V'+posw1));
                } else {
                    d3.select(this).attr('d',
                        'M'+pos0+','+m+'H'+pos1+ // median line
                        'M'+pos0+','+q1+'H'+pos1+'V'+q3+'H'+pos0+'Z'+ // box
                        'M'+posc+','+q1+'V'+lf+'M'+posc+','+q3+'V'+uf+ // whiskers
                        ((trace.whiskerwidth===0) ? '' : // whisker caps
                            'M'+posw0+','+lf+'H'+posw1+'M'+posw0+','+uf+'H'+posw1));
                }
            });

        // draw points, if desired
        if(trace.boxpoints) {
            d3.select(this).selectAll('g.points')
                // since box plot points get an extra level of nesting, each
                // box needs the trace styling info
                .data(function(d){
                    d.forEach(function(v){
                        v.t = t;
                        v.trace = trace;
                    });
                    return d;
                })
                .enter().append('g')
                .attr('class','points')
              .selectAll('path')
                .data(function(d){
                    var pts = (trace.boxpoints==='all') ? d.val :
                            d.val.filter(function(v){ return (v<d.lf || v>d.uf); }),
                        spreadLimit = (d.q3 - d.q1) * JITTERSPREAD,
                        jitterFactors = [],
                        maxJitterFactor = 0,
                        i,
                        i0, i1,
                        pmin,
                        pmax,
                        jitterFactor,
                        newJitter;

                    // dynamic jitter
                    if(trace.jitter) {
                        for(i=0; i<pts.length; i++) {
                            i0 = Math.max(0, i-JITTERCOUNT);
                            pmin = pts[i0];
                            i1 = Math.min(pts.length-1, i+JITTERCOUNT);
                            pmax = pts[i1];

                            if(trace.boxpoints!=='all') {
                                if(pts[i]<d.lf) pmax = Math.min(pmax, d.lf);
                                else pmin = Math.max(pmin, d.uf);
                            }

                            jitterFactor = Math.sqrt(spreadLimit * (i1-i0) / (pmax-pmin)) || 0;
                            jitterFactor = Plotly.Lib.constrain(Math.abs(jitterFactor), 0, 1);

                            jitterFactors.push(jitterFactor);
                            maxJitterFactor = Math.max(jitterFactor, maxJitterFactor);
                        }
                        newJitter = trace.jitter * 2 / maxJitterFactor;
                    }

                    return pts.map(function(v, i){
                        var posOffset = trace.pointpos,
                            p;
                        if(trace.jitter) {
                            posOffset += newJitter * jitterFactors[i] * (rand()-0.5);
                        }

                        if (trace.orientation==='h') {
                            p = {
                                y: d.pos + posOffset*bdPos + bPos,
                                x: v
                            };
                        } else {
                            p = {
                                x: d.pos + posOffset*bdPos + bPos,
                                y: v
                            };
                        }

                        // tag suspected outliers
                        if(trace.boxpoints==='suspectedoutliers' && v<d.uo && v>d.lo) {
                            p.so=true;
                        }
                        return p;
                    });
                })
                .enter().append('path')
                .call(Plotly.Drawing.translatePoints, xa, ya);
        }
        // draw mean (and stdev diamond) if desired
        if(trace.boxmean) {
            d3.select(this).selectAll('path.mean')
                .data(Plotly.Lib.identity)
                .enter().append('path')
                .attr('class','mean')
                .style('fill','none')
                .each(function(d){
                    var posc = posAxis.c2p(d.pos + bPos, true),
                        pos0 = posAxis.c2p(d.pos + bPos - bdPos, true),
                        pos1 = posAxis.c2p(d.pos + bPos + bdPos, true),
                        m = valAxis.c2p(d.mean, true),
                        sl = valAxis.c2p(d.mean-d.sd, true),
                        sh = valAxis.c2p(d.mean+d.sd, true);
                    if (trace.orientation==='h') {
                    d3.select(this).attr('d',
                        'M'+m+','+pos0+'V'+pos1+
                        ((trace.boxmean!=='sd') ? '' :
                            'm0,0L'+sl+','+posc+'L'+m+','+pos0+'L'+sh+','+posc+'Z'));
                    } else {
                    d3.select(this).attr('d',
                        'M'+pos0+','+m+'H'+pos1+
                        ((trace.boxmean!=='sd') ? '' :
                            'm0,0L'+posc+','+sl+'L'+pos0+','+m+'L'+posc+','+sh+'Z'));
                    }
                });
        }
    });
};

boxes.style = function(gd) {
    var s = d3.select(gd).selectAll('g.trace.boxes');

    s.style('opacity', function(d){ return d[0].trace.opacity; })
        .each(function(d){
            var trace = d[0].trace,
                lineWidth = trace.line.width;
            d3.select(this).selectAll('path.box')
                .style('stroke-width',lineWidth+'px')
                .call(Plotly.Color.stroke, trace.line.color)
                .call(Plotly.Color.fill, trace.fillcolor);
            d3.select(this).selectAll('path.mean')
                .style({
                    'stroke-width': lineWidth,
                    'stroke-dasharray': (2*lineWidth)+'px,'+lineWidth+'px'
                })
                .call(Plotly.Color.stroke, trace.line.color);
            d3.select(this).selectAll('g.points path')
                .call(Plotly.Drawing.pointStyle, trace);
        });
};

boxes.hoverPoints = function(pointData, xval, yval, hovermode) {
    // closest mode: handicap box plots a little relative to others
    var cd = pointData.cd,
        trace = cd[0].trace,
        t = cd[0].t,
        xa = pointData.xa,
        ya = pointData.ya,
        closeData = [],
        dx, dy, distfn, boxDelta,
        posLetter, posAxis, posText,
        val, valLetter, valAxis;

    // adjust inbox w.r.t. to calculate box size
    boxDelta = (hovermode==='closest') ? 2.5*t.bdPos : t.bdPos;

    if (trace.orientation==='h') {
        dx = function(di){
            return Plotly.Fx.inbox(di.min - xval, di.max - xval);
        };
        dy = function(di){
            var pos = di.pos + t.bPos - yval;
            return Plotly.Fx.inbox(pos - boxDelta, pos + boxDelta);
        };
        posLetter = 'y';
        posAxis = ya;
        valLetter = 'x';
        valAxis = xa;
    } else {
        dx = function(di){
            var pos = di.pos + t.bPos - xval;
            return Plotly.Fx.inbox(pos - boxDelta, pos + boxDelta);
        };
        dy = function(di){
            return Plotly.Fx.inbox(di.min - yval, di.max - yval);
        };
        posLetter = 'x';
        posAxis = xa;
        valLetter = 'y';
        valAxis = ya;
    }

    distfn = Plotly.Fx.getDistanceFunction(hovermode, dx, dy);
    Plotly.Fx.getClosest(cd, distfn, pointData);

    // skip the rest (for this trace) if we didn't find a close point
    if(pointData.index===false) return;

    // create the item(s) in closedata for this point

    // the closest data point
    var di = cd[pointData.index],
        lc = trace.line.color,
        mc = (trace.marker||{}).color;
    if(Plotly.Color.opacity(lc) && trace.line.width) pointData.color = lc;
    else if(Plotly.Color.opacity(mc) && trace.boxpoints) pointData.color = mc;
    else pointData.color = trace.fillcolor;

    pointData[posLetter+'0'] = posAxis.c2p(di.pos + t.bPos - t.bdPos, true);
    pointData[posLetter+'1'] = posAxis.c2p(di.pos + t.bPos + t.bdPos, true);

    posText = Plotly.Axes.tickText(posAxis, posAxis.c2l(di.pos), 'hover').text;
    pointData[posLetter+'LabelVal'] = di.pos;

    // box plots: each "point" gets many labels
    var usedVals = {},
        attrs = ['med','min','q1','q3','max'],
        attr,
        pointData2;
    if(trace.boxmean) attrs.push('mean');
    if(trace.boxpoints) [].push.apply(attrs,['lf', 'uf']);

    for (var i=0; i<attrs.length; i++) {
        attr = attrs[i];

        if(!(attr in di) || (di[attr] in usedVals)) continue;
        usedVals[di[attr]] = true;

        // copy out to a new object for each value to label
        val = valAxis.c2p(di[attr], true);
        pointData2 = Plotly.Lib.extendFlat({}, pointData);
        pointData2[valLetter+'0'] = pointData2[valLetter+'1'] = val;
        pointData2[valLetter+'LabelVal'] = di[attr];
        pointData2.attr = attr;

        if(attr==='mean' && ('sd' in di) && trace.boxmean==='sd') {
            pointData2[valLetter+'err'] = di.sd;
        }
        pointData.name = ''; // only keep name on the first item (median)
        closeData.push(pointData2);
    }
    return closeData;
};
