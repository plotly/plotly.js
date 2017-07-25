/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');

var Lib = require('../../lib');
var Drawing = require('../../components/drawing');


// repeatable pseudorandom generator
var randSeed = 2000000000;

function seed() {
    randSeed = 2000000000;
}

function rand() {
    var lastVal = randSeed;
    randSeed = (69069 * randSeed + 1) % 4294967296;
    // don't let consecutive vals be too close together
    // gets away from really trying to be random, in favor of better local uniformity
    if(Math.abs(randSeed - lastVal) < 429496729) return rand();
    return randSeed / 4294967296;
}

// constants for dynamic jitter (ie less jitter for sparser points)
var JITTERCOUNT = 5, // points either side of this to include
    JITTERSPREAD = 0.01; // fraction of IQR to count as "dense"


module.exports = function plot(gd, plotinfo, cdbox) {
    var fullLayout = gd._fullLayout,
        xa = plotinfo.xaxis,
        ya = plotinfo.yaxis,
        posAxis, valAxis;

    var boxtraces = plotinfo.plot.select('.boxlayer')
        .selectAll('g.trace.boxes')
            .data(cdbox)
      .enter().append('g')
        .attr('class', 'trace boxes');

    boxtraces.each(function(d) {
        var t = d[0].t,
            trace = d[0].trace,
            group = (fullLayout.boxmode === 'group' && gd.numboxes > 1),
            // box half width
            bdPos = t.dPos * (1 - fullLayout.boxgap) * (1 - fullLayout.boxgroupgap) / (group ? gd.numboxes : 1),
            // box center offset
            bPos = group ? 2 * t.dPos * (-0.5 + (t.boxnum + 0.5) / gd.numboxes) * (1 - fullLayout.boxgap) : 0,
            // whisker width
            wdPos = bdPos * trace.whiskerwidth;
        if(trace.visible !== true || t.emptybox) {
            d3.select(this).remove();
            return;
        }

        // set axis via orientation
        if(trace.orientation === 'h') {
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
            .data(Lib.identity)
            .enter().append('path')
            .style('vector-effect', 'non-scaling-stroke')
            .attr('class', 'box')
            .each(function(d) {
                var posc = posAxis.c2p(d.pos + bPos, true),
                    pos0 = posAxis.c2p(d.pos + bPos - bdPos, true),
                    pos1 = posAxis.c2p(d.pos + bPos + bdPos, true),
                    posw0 = posAxis.c2p(d.pos + bPos - wdPos, true),
                    posw1 = posAxis.c2p(d.pos + bPos + wdPos, true),
                    q1 = valAxis.c2p(d.q1, true),
                    q3 = valAxis.c2p(d.q3, true),
                    // make sure median isn't identical to either of the
                    // quartiles, so we can see it
                    m = Lib.constrain(valAxis.c2p(d.med, true),
                        Math.min(q1, q3) + 1, Math.max(q1, q3) - 1),
                    lf = valAxis.c2p(trace.boxpoints === false ? d.min : d.lf, true),
                    uf = valAxis.c2p(trace.boxpoints === false ? d.max : d.uf, true);
                if(trace.orientation === 'h') {
                    d3.select(this).attr('d',
                        'M' + m + ',' + pos0 + 'V' + pos1 + // median line
                        'M' + q1 + ',' + pos0 + 'V' + pos1 + 'H' + q3 + 'V' + pos0 + 'Z' + // box
                        'M' + q1 + ',' + posc + 'H' + lf + 'M' + q3 + ',' + posc + 'H' + uf + // whiskers
                        ((trace.whiskerwidth === 0) ? '' : // whisker caps
                            'M' + lf + ',' + posw0 + 'V' + posw1 + 'M' + uf + ',' + posw0 + 'V' + posw1));
                } else {
                    d3.select(this).attr('d',
                        'M' + pos0 + ',' + m + 'H' + pos1 + // median line
                        'M' + pos0 + ',' + q1 + 'H' + pos1 + 'V' + q3 + 'H' + pos0 + 'Z' + // box
                        'M' + posc + ',' + q1 + 'V' + lf + 'M' + posc + ',' + q3 + 'V' + uf + // whiskers
                        ((trace.whiskerwidth === 0) ? '' : // whisker caps
                            'M' + posw0 + ',' + lf + 'H' + posw1 + 'M' + posw0 + ',' + uf + 'H' + posw1));
                }
            });

        // draw points, if desired
        if(trace.boxpoints) {
            d3.select(this).selectAll('g.points')
                // since box plot points get an extra level of nesting, each
                // box needs the trace styling info
                .data(function(d) {
                    d.forEach(function(v) {
                        v.t = t;
                        v.trace = trace;
                    });
                    return d;
                })
                .enter().append('g')
                .attr('class', 'points')
              .selectAll('path')
                .data(function(d) {
                    var pts = (trace.boxpoints === 'all') ? d.val :
                            d.val.filter(function(v) { return (v < d.lf || v > d.uf); }),
                        // normally use IQR, but if this is 0 or too small, use max-min
                        typicalSpread = Math.max((d.max - d.min) / 10, d.q3 - d.q1),
                        minSpread = typicalSpread * 1e-9,
                        spreadLimit = typicalSpread * JITTERSPREAD,
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
                        if(typicalSpread === 0) {
                            // edge case of no spread at all: fall back to max jitter
                            maxJitterFactor = 1;
                            jitterFactors = new Array(pts.length);
                            for(i = 0; i < pts.length; i++) {
                                jitterFactors[i] = 1;
                            }
                        }
                        else {
                            for(i = 0; i < pts.length; i++) {
                                i0 = Math.max(0, i - JITTERCOUNT);
                                pmin = pts[i0];
                                i1 = Math.min(pts.length - 1, i + JITTERCOUNT);
                                pmax = pts[i1];

                                if(trace.boxpoints !== 'all') {
                                    if(pts[i] < d.lf) pmax = Math.min(pmax, d.lf);
                                    else pmin = Math.max(pmin, d.uf);
                                }

                                jitterFactor = Math.sqrt(spreadLimit * (i1 - i0) / (pmax - pmin + minSpread)) || 0;
                                jitterFactor = Lib.constrain(Math.abs(jitterFactor), 0, 1);

                                jitterFactors.push(jitterFactor);
                                maxJitterFactor = Math.max(jitterFactor, maxJitterFactor);
                            }
                        }
                        newJitter = trace.jitter * 2 / maxJitterFactor;
                    }

                    return pts.map(function(v, i) {
                        var posOffset = trace.pointpos,
                            p;
                        if(trace.jitter) {
                            posOffset += newJitter * jitterFactors[i] * (rand() - 0.5);
                        }

                        if(trace.orientation === 'h') {
                            p = {
                                y: d.pos + posOffset * bdPos + bPos,
                                x: v
                            };
                        } else {
                            p = {
                                x: d.pos + posOffset * bdPos + bPos,
                                y: v
                            };
                        }

                        // tag suspected outliers
                        if(trace.boxpoints === 'suspectedoutliers' && v < d.uo && v > d.lo) {
                            p.so = true;
                        }
                        return p;
                    });
                })
                .enter().append('path')
                .classed('point', true)
                .call(Drawing.translatePoints, xa, ya);
        }
        // draw mean (and stdev diamond) if desired
        if(trace.boxmean) {
            d3.select(this).selectAll('path.mean')
                .data(Lib.identity)
                .enter().append('path')
                .attr('class', 'mean')
                .style({
                    fill: 'none',
                    'vector-effect': 'non-scaling-stroke'
                })
                .each(function(d) {
                    var posc = posAxis.c2p(d.pos + bPos, true),
                        pos0 = posAxis.c2p(d.pos + bPos - bdPos, true),
                        pos1 = posAxis.c2p(d.pos + bPos + bdPos, true),
                        m = valAxis.c2p(d.mean, true),
                        sl = valAxis.c2p(d.mean - d.sd, true),
                        sh = valAxis.c2p(d.mean + d.sd, true);
                    if(trace.orientation === 'h') {
                        d3.select(this).attr('d',
                            'M' + m + ',' + pos0 + 'V' + pos1 +
                            ((trace.boxmean !== 'sd') ? '' :
                                'm0,0L' + sl + ',' + posc + 'L' + m + ',' + pos0 + 'L' + sh + ',' + posc + 'Z'));
                    }
                    else {
                        d3.select(this).attr('d',
                            'M' + pos0 + ',' + m + 'H' + pos1 +
                            ((trace.boxmean !== 'sd') ? '' :
                                'm0,0L' + posc + ',' + sl + 'L' + pos0 + ',' + m + 'L' + posc + ',' + sh + 'Z'));
                    }
                });
        }
    });
};
