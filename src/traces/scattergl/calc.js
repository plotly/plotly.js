'use strict';

var cluster = require('@plotly/point-cluster');

var Lib = require('../../lib');
var AxisIDs = require('../../plots/cartesian/axis_ids');
var findExtremes = require('../../plots/cartesian/autorange').findExtremes;
var alignPeriod = require('../../plots/cartesian/align_period');

var scatterCalc = require('../scatter/calc');
var calcMarkerSize = scatterCalc.calcMarkerSize;
var calcAxisExpansion = scatterCalc.calcAxisExpansion;
var setFirstScatter = scatterCalc.setFirstScatter;
var calcColorscale = require('../scatter/colorscale_calc');
var convert = require('./convert');
var sceneUpdate = require('./scene_update');

var BADNUM = require('../../constants/numerical').BADNUM;
var TOO_MANY_POINTS = require('./constants').TOO_MANY_POINTS;

module.exports = function calc(gd, trace) {
    var fullLayout = gd._fullLayout;
    var xa = trace._xA = AxisIDs.getFromId(gd, trace.xaxis, 'x');
    var ya = trace._yA = AxisIDs.getFromId(gd, trace.yaxis, 'y');

    var subplot = fullLayout._plots[trace.xaxis + trace.yaxis];
    var len = trace._length;
    var hasTooManyPoints = len >= TOO_MANY_POINTS;
    var len2 = len * 2;
    var stash = {};
    var i;

    var origX = xa.makeCalcdata(trace, 'x');
    var origY = ya.makeCalcdata(trace, 'y');
    var xObj = alignPeriod(trace, xa, 'x', origX);
    var yObj = alignPeriod(trace, ya, 'y', origY);
    var x = xObj.vals;
    var y = yObj.vals;
    trace._x = x;
    trace._y = y;

    if(trace.xperiodalignment) {
        trace._origX = origX;
        trace._xStarts = xObj.starts;
        trace._xEnds = xObj.ends;
    }
    if(trace.yperiodalignment) {
        trace._origY = origY;
        trace._yStarts = yObj.starts;
        trace._yEnds = yObj.ends;
    }

    // we need hi-precision for scatter2d,
    // regl-scatter2d uses NaNs for bad/missing values
    var positions = new Array(len2);
    var _ids = new Array(len);
    for(i = 0; i < len; i++) {
        positions[i * 2] = x[i] === BADNUM ? NaN : x[i];
        positions[i * 2 + 1] = y[i] === BADNUM ? NaN : y[i];
        // Pre-compute ids.
        _ids[i] = i;
    }

    if(xa.type === 'log') {
        for(i = 0; i < len2; i += 2) {
            positions[i] = xa.c2l(positions[i]);
        }
    }
    if(ya.type === 'log') {
        for(i = 1; i < len2; i += 2) {
            positions[i] = ya.c2l(positions[i]);
        }
    }

    // we don't build a tree for log axes since it takes long to convert log2px
    // and it is also
    if(hasTooManyPoints && (xa.type !== 'log' && ya.type !== 'log')) {
        // FIXME: delegate this to webworker
        stash.tree = cluster(positions);
    } else {
        stash.ids = _ids;
    }

    // create scene options and scene
    calcColorscale(gd, trace);
    var opts = sceneOptions(gd, subplot, trace, positions, x, y);
    var scene = sceneUpdate(gd, subplot);

    // Reuse SVG scatter axis expansion routine.
    // For graphs with very large number of points and array marker.size,
    // use average marker size instead to speed things up.
    setFirstScatter(fullLayout, trace);
    var ppad;
    if(!hasTooManyPoints) {
        ppad = calcMarkerSize(trace, len);
    } else if(opts.marker) {
        ppad = opts.marker.sizeAvg || Math.max(opts.marker.size, 3);
    }
    calcAxisExpansion(gd, trace, xa, ya, x, y, ppad);
    if(opts.errorX) expandForErrorBars(trace, xa, opts.errorX);
    if(opts.errorY) expandForErrorBars(trace, ya, opts.errorY);

    // set flags to create scene renderers
    if(opts.fill && !scene.fill2d) scene.fill2d = true;
    if(opts.marker && !scene.scatter2d) scene.scatter2d = true;
    if(opts.line && !scene.line2d) scene.line2d = true;
    if((opts.errorX || opts.errorY) && !scene.error2d) scene.error2d = true;
    if(opts.text && !scene.glText) scene.glText = true;
    if(opts.marker) opts.marker.snap = len;

    scene.lineOptions.push(opts.line);
    scene.errorXOptions.push(opts.errorX);
    scene.errorYOptions.push(opts.errorY);
    scene.fillOptions.push(opts.fill);
    scene.markerOptions.push(opts.marker);
    scene.markerSelectedOptions.push(opts.markerSel);
    scene.markerUnselectedOptions.push(opts.markerUnsel);
    scene.textOptions.push(opts.text);
    scene.textSelectedOptions.push(opts.textSel);
    scene.textUnselectedOptions.push(opts.textUnsel);
    scene.selectBatch.push([]);
    scene.unselectBatch.push([]);

    stash._scene = scene;
    stash.index = scene.count;
    stash.x = x;
    stash.y = y;
    stash.positions = positions;
    scene.count++;

    return [{x: false, y: false, t: stash, trace: trace}];
};

function expandForErrorBars(trace, ax, opts) {
    var extremes = trace._extremes[ax._id];
    var errExt = findExtremes(ax, opts._bnds, {padded: true});
    extremes.min = extremes.min.concat(errExt.min);
    extremes.max = extremes.max.concat(errExt.max);
}

function sceneOptions(gd, subplot, trace, positions, x, y) {
    var opts = convert.style(gd, trace);

    if(opts.marker) {
        opts.marker.positions = positions;
    }

    if(opts.line && positions.length > 1) {
        Lib.extendFlat(
            opts.line,
            convert.linePositions(gd, trace, positions)
        );
    }

    if(opts.errorX || opts.errorY) {
        var errors = convert.errorBarPositions(gd, trace, positions, x, y);

        if(opts.errorX) {
            Lib.extendFlat(opts.errorX, errors.x);
        }
        if(opts.errorY) {
            Lib.extendFlat(opts.errorY, errors.y);
        }
    }

    if(opts.text) {
        Lib.extendFlat(
            opts.text,
            {positions: positions},
            convert.textPosition(gd, trace, opts.text, opts.marker)
        );
        Lib.extendFlat(
            opts.textSel,
            {positions: positions},
            convert.textPosition(gd, trace, opts.text, opts.markerSel)
        );
        Lib.extendFlat(
            opts.textUnsel,
            {positions: positions},
            convert.textPosition(gd, trace, opts.text, opts.markerUnsel)
        );
    }

    return opts;
}
