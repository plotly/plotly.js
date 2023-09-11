'use strict';

var isNumeric = require('fast-isnumeric');

var Axes = require('../../plots/cartesian/axes');
var alignPeriod = require('../../plots/cartesian/align_period');
var Lib = require('../../lib');

var BADNUM = require('../../constants/numerical').BADNUM;
var _ = Lib._;

module.exports = function calc(gd, trace) {
    var fullLayout = gd._fullLayout;
    var xa = Axes.getFromId(gd, trace.xaxis || 'x');
    var ya = Axes.getFromId(gd, trace.yaxis || 'y');
    var cd = [];

    // N.B. violin reuses same Box.calc
    var numKey = trace.type === 'violin' ? '_numViolins' : '_numBoxes';

    var i, j;
    var valAxis, valLetter;
    var posAxis, posLetter;

    var hasPeriod;
    if(trace.orientation === 'h') {
        valAxis = xa;
        valLetter = 'x';
        posAxis = ya;
        posLetter = 'y';
        hasPeriod = !!trace.yperiodalignment;
    } else {
        valAxis = ya;
        valLetter = 'y';
        posAxis = xa;
        posLetter = 'x';
        hasPeriod = !!trace.xperiodalignment;
    }

    var allPosArrays = getPosArrays(trace, posLetter, posAxis, fullLayout[numKey]);
    var posArray = allPosArrays[0];
    var origPos = allPosArrays[1];
    var dv = Lib.distinctVals(posArray, posAxis);
    var posDistinct = dv.vals;
    var dPos = dv.minDiff / 2;

    // item in trace calcdata
    var cdi;
    // array of {v: v, i, i} sample pts
    var pts;
    // values of the `pts` array of objects
    var boxVals;
    // length of sample
    var N;
    // single sample point
    var pt;
    // single sample value
    var v;

    // filter function for outlier pts
    // outlier definition based on http://www.physics.csbsju.edu/stats/box2.html
    var ptFilterFn = (trace.boxpoints || trace.points) === 'all' ?
        Lib.identity :
        function(pt) { return (pt.v < cdi.lf || pt.v > cdi.uf); };

    if(trace._hasPreCompStats) {
        var valArrayRaw = trace[valLetter];
        var d2c = function(k) { return valAxis.d2c((trace[k] || [])[i]); };
        var minVal = Infinity;
        var maxVal = -Infinity;

        for(i = 0; i < trace._length; i++) {
            var posi = posArray[i];
            if(!isNumeric(posi)) continue;

            cdi = {};
            cdi.pos = cdi[posLetter] = posi;
            if(hasPeriod && origPos) {
                cdi.orig_p = origPos[i]; // used by hover
            }

            cdi.q1 = d2c('q1');
            cdi.med = d2c('median');
            cdi.q3 = d2c('q3');

            pts = [];
            if(valArrayRaw && Lib.isArrayOrTypedArray(valArrayRaw[i])) {
                for(j = 0; j < valArrayRaw[i].length; j++) {
                    v = valAxis.d2c(valArrayRaw[i][j]);
                    if(v !== BADNUM) {
                        pt = {v: v, i: [i, j]};
                        arraysToCalcdata(pt, trace, [i, j]);
                        pts.push(pt);
                    }
                }
            }
            cdi.pts = pts.sort(sortByVal);
            boxVals = cdi[valLetter] = pts.map(extractVal);
            N = boxVals.length;

            if(cdi.med !== BADNUM && cdi.q1 !== BADNUM && cdi.q3 !== BADNUM &&
                cdi.med >= cdi.q1 && cdi.q3 >= cdi.med
            ) {
                var lf = d2c('lowerfence');
                cdi.lf = (lf !== BADNUM && lf <= cdi.q1) ?
                    lf :
                    computeLowerFence(cdi, boxVals, N);

                var uf = d2c('upperfence');
                cdi.uf = (uf !== BADNUM && uf >= cdi.q3) ?
                    uf :
                    computeUpperFence(cdi, boxVals, N);

                var mean = d2c('mean');
                cdi.mean = (mean !== BADNUM) ?
                    mean :
                    (N ? Lib.mean(boxVals, N) : (cdi.q1 + cdi.q3) / 2);

                var sd = d2c('sd');
                cdi.sd = (mean !== BADNUM && sd >= 0) ?
                    sd :
                    (N ? Lib.stdev(boxVals, N, cdi.mean) : (cdi.q3 - cdi.q1));

                cdi.lo = computeLowerOutlierBound(cdi);
                cdi.uo = computeUpperOutlierBound(cdi);

                var ns = d2c('notchspan');
                ns = (ns !== BADNUM && ns > 0) ? ns : computeNotchSpan(cdi, N);
                cdi.ln = cdi.med - ns;
                cdi.un = cdi.med + ns;

                var imin = cdi.lf;
                var imax = cdi.uf;
                if(trace.boxpoints && boxVals.length) {
                    imin = Math.min(imin, boxVals[0]);
                    imax = Math.max(imax, boxVals[N - 1]);
                }
                if(trace.notched) {
                    imin = Math.min(imin, cdi.ln);
                    imax = Math.max(imax, cdi.un);
                }
                cdi.min = imin;
                cdi.max = imax;
            } else {
                Lib.warn([
                    'Invalid input - make sure that q1 <= median <= q3',
                    'q1 = ' + cdi.q1,
                    'median = ' + cdi.med,
                    'q3 = ' + cdi.q3
                ].join('\n'));

                var v0;
                if(cdi.med !== BADNUM) {
                    v0 = cdi.med;
                } else if(cdi.q1 !== BADNUM) {
                    if(cdi.q3 !== BADNUM) v0 = (cdi.q1 + cdi.q3) / 2;
                    else v0 = cdi.q1;
                } else if(cdi.q3 !== BADNUM) {
                    v0 = cdi.q3;
                } else {
                    v0 = 0;
                }

                // draw box as line segment
                cdi.med = v0;
                cdi.q1 = cdi.q3 = v0;
                cdi.lf = cdi.uf = v0;
                cdi.mean = cdi.sd = v0;
                cdi.ln = cdi.un = v0;
                cdi.min = cdi.max = v0;
            }

            minVal = Math.min(minVal, cdi.min);
            maxVal = Math.max(maxVal, cdi.max);

            cdi.pts2 = pts.filter(ptFilterFn);

            cd.push(cdi);
        }

        trace._extremes[valAxis._id] = Axes.findExtremes(valAxis,
            [minVal, maxVal],
            {padded: true}
        );
    } else {
        var valArray = valAxis.makeCalcdata(trace, valLetter);
        var posBins = makeBins(posDistinct, dPos);
        var pLen = posDistinct.length;
        var ptsPerBin = initNestedArray(pLen);

        // bin pts info per position bins
        for(i = 0; i < trace._length; i++) {
            v = valArray[i];
            if(!isNumeric(v)) continue;

            var n = Lib.findBin(posArray[i], posBins);
            if(n >= 0 && n < pLen) {
                pt = {v: v, i: i};
                arraysToCalcdata(pt, trace, i);
                ptsPerBin[n].push(pt);
            }
        }

        var minLowerNotch = Infinity;
        var maxUpperNotch = -Infinity;

        var quartilemethod = trace.quartilemethod;
        var usesExclusive = quartilemethod === 'exclusive';
        var usesInclusive = quartilemethod === 'inclusive';

        // build calcdata trace items, one item per distinct position
        for(i = 0; i < pLen; i++) {
            if(ptsPerBin[i].length > 0) {
                cdi = {};
                cdi.pos = cdi[posLetter] = posDistinct[i];

                pts = cdi.pts = ptsPerBin[i].sort(sortByVal);
                boxVals = cdi[valLetter] = pts.map(extractVal);
                N = boxVals.length;

                cdi.min = boxVals[0];
                cdi.max = boxVals[N - 1];
                cdi.mean = Lib.mean(boxVals, N);
                cdi.sd = Lib.stdev(boxVals, N, cdi.mean) * trace.sdmultiple;
                cdi.med = Lib.interp(boxVals, 0.5);

                if((N % 2) && (usesExclusive || usesInclusive)) {
                    var lower;
                    var upper;

                    if(usesExclusive) {
                        // do NOT include the median in either half
                        lower = boxVals.slice(0, N / 2);
                        upper = boxVals.slice(N / 2 + 1);
                    } else if(usesInclusive) {
                        // include the median in either half
                        lower = boxVals.slice(0, N / 2 + 1);
                        upper = boxVals.slice(N / 2);
                    }

                    cdi.q1 = Lib.interp(lower, 0.5);
                    cdi.q3 = Lib.interp(upper, 0.5);
                } else {
                    cdi.q1 = Lib.interp(boxVals, 0.25);
                    cdi.q3 = Lib.interp(boxVals, 0.75);
                }

                // lower and upper fences
                cdi.lf = computeLowerFence(cdi, boxVals, N);
                cdi.uf = computeUpperFence(cdi, boxVals, N);

                // lower and upper outliers bounds
                cdi.lo = computeLowerOutlierBound(cdi);
                cdi.uo = computeUpperOutlierBound(cdi);

                // lower and upper notches
                var mci = computeNotchSpan(cdi, N);
                cdi.ln = cdi.med - mci;
                cdi.un = cdi.med + mci;
                minLowerNotch = Math.min(minLowerNotch, cdi.ln);
                maxUpperNotch = Math.max(maxUpperNotch, cdi.un);

                cdi.pts2 = pts.filter(ptFilterFn);

                cd.push(cdi);
            }
        }

        if(trace.notched && Lib.isTypedArray(valArray)) valArray = Array.from(valArray);
        trace._extremes[valAxis._id] = Axes.findExtremes(valAxis,
            trace.notched ? valArray.concat([minLowerNotch, maxUpperNotch]) : valArray,
            {padded: true}
        );
    }

    calcSelection(cd, trace);

    if(cd.length > 0) {
        cd[0].t = {
            num: fullLayout[numKey],
            dPos: dPos,
            posLetter: posLetter,
            valLetter: valLetter,
            labels: {
                med: _(gd, 'median:'),
                min: _(gd, 'min:'),
                q1: _(gd, 'q1:'),
                q3: _(gd, 'q3:'),
                max: _(gd, 'max:'),
                mean: (trace.boxmean === 'sd') || (trace.sizemode === 'sd') ?
                    _(gd, 'mean ± σ:').replace('σ', trace.sdmultiple === 1 ? 'σ' : (trace.sdmultiple + 'σ')) : // displaying mean +- Nσ whilst supporting translations
                    _(gd, 'mean:'),
                lf: _(gd, 'lower fence:'),
                uf: _(gd, 'upper fence:')
            }
        };

        fullLayout[numKey]++;
        return cd;
    } else {
        return [{t: {empty: true}}];
    }
};

// In vertical (horizontal) box plots:
// if no x (y) data, use x0 (y0), or name
// so if you want one box
// per trace, set x0 (y0) to the x (y) value or category for this trace
// (or set x (y) to a constant array matching y (x))
function getPosArrays(trace, posLetter, posAxis, num) {
    var hasPosArray = posLetter in trace;
    var hasPos0 = posLetter + '0' in trace;
    var hasPosStep = 'd' + posLetter in trace;

    if(hasPosArray || (hasPos0 && hasPosStep)) {
        var origPos = posAxis.makeCalcdata(trace, posLetter);
        var pos = alignPeriod(trace, posAxis, posLetter, origPos).vals;
        return [pos, origPos];
    }

    var pos0;
    if(hasPos0) {
        pos0 = trace[posLetter + '0'];
    } else if('name' in trace && (
        posAxis.type === 'category' || (
            isNumeric(trace.name) &&
            ['linear', 'log'].indexOf(posAxis.type) !== -1
        ) || (
            Lib.isDateTime(trace.name) &&
            posAxis.type === 'date'
        )
    )) {
        pos0 = trace.name;
    } else {
        pos0 = num;
    }

    var pos0c = posAxis.type === 'multicategory' ?
        posAxis.r2c_just_indices(pos0) :
        posAxis.d2c(pos0, 0, trace[posLetter + 'calendar']);

    var len = trace._length;
    var out = new Array(len);
    for(var i = 0; i < len; i++) out[i] = pos0c;

    return [out];
}

function makeBins(x, dx) {
    var len = x.length;
    var bins = new Array(len + 1);

    for(var i = 0; i < len; i++) {
        bins[i] = x[i] - dx;
    }
    bins[len] = x[len - 1] + dx;

    return bins;
}

function initNestedArray(len) {
    var arr = new Array(len);
    for(var i = 0; i < len; i++) {
        arr[i] = [];
    }
    return arr;
}

var TRACE_TO_CALC = {
    text: 'tx',
    hovertext: 'htx'
};

function arraysToCalcdata(pt, trace, ptNumber) {
    for(var k in TRACE_TO_CALC) {
        if(Lib.isArrayOrTypedArray(trace[k])) {
            if(Array.isArray(ptNumber)) {
                if(Lib.isArrayOrTypedArray(trace[k][ptNumber[0]])) {
                    pt[TRACE_TO_CALC[k]] = trace[k][ptNumber[0]][ptNumber[1]];
                }
            } else {
                pt[TRACE_TO_CALC[k]] = trace[k][ptNumber];
            }
        }
    }
}

function calcSelection(cd, trace) {
    if(Lib.isArrayOrTypedArray(trace.selectedpoints)) {
        for(var i = 0; i < cd.length; i++) {
            var pts = cd[i].pts || [];
            var ptNumber2cdIndex = {};

            for(var j = 0; j < pts.length; j++) {
                ptNumber2cdIndex[pts[j].i] = j;
            }

            Lib.tagSelected(pts, trace, ptNumber2cdIndex);
        }
    }
}

function sortByVal(a, b) { return a.v - b.v; }

function extractVal(o) { return o.v; }

// last point below 1.5 * IQR
function computeLowerFence(cdi, boxVals, N) {
    if(N === 0) return cdi.q1;
    return Math.min(
        cdi.q1,
        boxVals[Math.min(
            Lib.findBin(2.5 * cdi.q1 - 1.5 * cdi.q3, boxVals, true) + 1,
            N - 1
        )]
    );
}

// last point above 1.5 * IQR
function computeUpperFence(cdi, boxVals, N) {
    if(N === 0) return cdi.q3;
    return Math.max(
        cdi.q3,
        boxVals[Math.max(
            Lib.findBin(2.5 * cdi.q3 - 1.5 * cdi.q1, boxVals),
            0
        )]
    );
}

// 3 IQR below (don't clip to max/min,
// this is only for discriminating suspected & far outliers)
function computeLowerOutlierBound(cdi) {
    return 4 * cdi.q1 - 3 * cdi.q3;
}

// 3 IQR above (don't clip to max/min,
// this is only for discriminating suspected & far outliers)
function computeUpperOutlierBound(cdi) {
    return 4 * cdi.q3 - 3 * cdi.q1;
}

// 95% confidence intervals for median
function computeNotchSpan(cdi, N) {
    if(N === 0) return 0;
    return 1.57 * (cdi.q3 - cdi.q1) / Math.sqrt(N);
}
