'use strict';

var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var extractOpts = require('./helpers').extractOpts;

// mirrors Lib.aggNums's own recursion into nested (eg heatmap z) arrays, but
// masks out non-positive values first - matching how cartesian log axes
// exclude non-positive data from autorange (see findExtremes in
// plots/cartesian/autorange.js)
function maskNonPositive(vals) {
    if(Lib.isArrayOrTypedArray(vals[0])) return vals.map(maskNonPositive);

    var out = new Array(vals.length);
    for(var i = 0; i < vals.length; i++) {
        var v = vals[i];
        out[i] = (isNumeric(v) && v > 0) ? v : undefined;
    }
    return out;
}

module.exports = function calc(gd, trace, opts) {
    var fullLayout = gd._fullLayout;
    var rawVals = opts.vals;
    var containerStr = opts.containerStr;

    var container = containerStr ?
        Lib.nestedProperty(trace, containerStr).get() :
        trace;

    var cOpts = extractOpts(container);
    var auto = cOpts.auto !== false;
    var min = cOpts.min;
    var max = cOpts.max;
    var mid = cOpts.mid;

    var colorbar = cOpts.colorbar;
    var isLog = !!(colorbar && colorbar.type === 'log');

    if(isLog) {
        // a log colorbar needs a strictly positive domain: an explicit
        // non-positive cmin/cmax can never be logged, and if this trace's
        // data is going to be scanned for an auto min/max but has no
        // positive values at all, there's nothing to scale from. Either way,
        // fall back to a linear colorbar instead of an undefined/negative range.
        var fullyPinned = !auto && isNumeric(min) && isNumeric(max);
        var hasExplicitNonPositive = (isNumeric(min) && min <= 0) || (isNumeric(max) && max <= 0);
        var hasPositiveData = fullyPinned || isNumeric(Lib.aggNums(Math.max, null, maskNonPositive(rawVals)));

        if(hasExplicitNonPositive || !hasPositiveData) {
            isLog = false;
            colorbar.type = 'linear';
        }
    }

    var vals = isLog ? maskNonPositive(rawVals) : rawVals;

    var minVal = function() { return Lib.aggNums(Math.min, null, vals); };
    var maxVal = function() { return Lib.aggNums(Math.max, null, vals); };

    if(min === undefined) {
        min = minVal();
    } else if(auto) {
        if(container._colorAx && isNumeric(min)) {
            min = Math.min(min, minVal());
        } else {
            min = minVal();
        }
    }

    if(max === undefined) {
        max = maxVal();
    } else if(auto) {
        if(container._colorAx && isNumeric(max)) {
            max = Math.max(max, maxVal());
        } else {
            max = maxVal();
        }
    }

    // a symmetric-around-cmid range is a linear-domain concept - skip it for
    // log colorbars rather than risk pushing a positive min/max non-positive
    if(auto && mid !== undefined && !isLog) {
        if(max - mid > mid - min) {
            min = mid - (max - mid);
        } else if(max - mid < mid - min) {
            max = mid + (mid - min);
        }
    }

    if(min === max) {
        min -= 0.5;
        max += 0.5;
    }

    cOpts._sync('min', min);
    cOpts._sync('max', max);

    if(cOpts.autocolorscale) {
        var scl;
        if(min * max < 0) scl = fullLayout.colorscale.diverging;
        else if(min >= 0) scl = fullLayout.colorscale.sequential;
        else scl = fullLayout.colorscale.sequentialminus;
        cOpts._sync('colorscale', scl);
    }
};
