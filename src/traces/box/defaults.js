'use strict';

var Lib = require('../../lib');
var Registry = require('../../registry');
var Color = require('../../components/color');
var handlePeriodDefaults = require('../scatter/period_defaults');
var handleGroupingDefaults = require('../scatter/grouping_defaults');
var autoType = require('../../plots/cartesian/axis_autotype');
var attributes = require('./attributes');

function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    handleSampleDefaults(traceIn, traceOut, coerce, layout);
    if(traceOut.visible === false) return;

    handlePeriodDefaults(traceIn, traceOut, layout, coerce);
    coerce('xhoverformat');
    coerce('yhoverformat');

    var hasPreCompStats = traceOut._hasPreCompStats;

    if(hasPreCompStats) {
        coerce('lowerfence');
        coerce('upperfence');
    }

    coerce('line.color', (traceIn.marker || {}).color || defaultColor);
    coerce('line.width');
    coerce('fillcolor', Color.addOpacity(traceOut.line.color, 0.5));

    var boxmeanDflt = false;
    if(hasPreCompStats) {
        var mean = coerce('mean');
        var sd = coerce('sd');
        if(mean && mean.length) {
            boxmeanDflt = true;
            if(sd && sd.length) boxmeanDflt = 'sd';
        }
    }

    coerce('whiskerwidth');
    var sizemode = coerce('sizemode');
    var boxmean;
    if(sizemode === 'quartiles') {
        boxmean = coerce('boxmean', boxmeanDflt);
    }
    coerce('showwhiskers', sizemode === 'quartiles');
    if((sizemode === 'sd') || (boxmean === 'sd')) {
        coerce('sdmultiple');
    }
    coerce('width');
    coerce('quartilemethod');

    var notchedDflt = false;
    if(hasPreCompStats) {
        var notchspan = coerce('notchspan');
        if(notchspan && notchspan.length) {
            notchedDflt = true;
        }
    } else if(Lib.validate(traceIn.notchwidth, attributes.notchwidth)) {
        notchedDflt = true;
    }
    var notched = coerce('notched', notchedDflt);
    if(notched) coerce('notchwidth');

    handlePointsDefaults(traceIn, traceOut, coerce, {prefix: 'box'});
    coerce('zorder');
}

function handleSampleDefaults(traceIn, traceOut, coerce, layout) {
    function getDims(arr) {
        var dims = 0;
        if(arr && arr.length) {
            dims += 1;
            if(Lib.isArrayOrTypedArray(arr[0]) && arr[0].length) {
                dims += 1;
            }
        }
        return dims;
    }

    function valid(astr) {
        return Lib.validate(traceIn[astr], attributes[astr]);
    }

    var y = coerce('y');
    var x = coerce('x');

    var sLen;
    if(traceOut.type === 'box') {
        var q1 = coerce('q1');
        var median = coerce('median');
        var q3 = coerce('q3');

        traceOut._hasPreCompStats = (
            q1 && q1.length &&
            median && median.length &&
            q3 && q3.length
        );
        sLen = Math.min(
            Lib.minRowLength(q1),
            Lib.minRowLength(median),
            Lib.minRowLength(q3)
        );
    }

    var yDims = getDims(y);
    var xDims = getDims(x);
    var yLen = yDims && Lib.minRowLength(y);
    var xLen = xDims && Lib.minRowLength(x);

    var calendar = layout.calendar;
    var opts = {
        autotypenumbers: layout.autotypenumbers
    };

    var defaultOrientation, len;
    if(traceOut._hasPreCompStats) {
        switch(String(xDims) + String(yDims)) {
            // no x / no y
            case '00':
                var setInX = valid('x0') || valid('dx');
                var setInY = valid('y0') || valid('dy');

                if(setInY && !setInX) {
                    defaultOrientation = 'h';
                } else {
                    defaultOrientation = 'v';
                }

                len = sLen;
                break;
            // just x
            case '10':
                defaultOrientation = 'v';
                len = Math.min(sLen, xLen);
                break;
            case '20':
                defaultOrientation = 'h';
                len = Math.min(sLen, x.length);
                break;
            // just y
            case '01':
                defaultOrientation = 'h';
                len = Math.min(sLen, yLen);
                break;
            case '02':
                defaultOrientation = 'v';
                len = Math.min(sLen, y.length);
                break;
            // both
            case '12':
                defaultOrientation = 'v';
                len = Math.min(sLen, xLen, y.length);
                break;
            case '21':
                defaultOrientation = 'h';
                len = Math.min(sLen, x.length, yLen);
                break;
            case '11':
                // this one is ill-defined
                len = 0;
                break;
            case '22':
                var hasCategories = false;
                var i;
                for(i = 0; i < x.length; i++) {
                    if(autoType(x[i], calendar, opts) === 'category') {
                        hasCategories = true;
                        break;
                    }
                }

                if(hasCategories) {
                    defaultOrientation = 'v';
                    len = Math.min(sLen, xLen, y.length);
                } else {
                    for(i = 0; i < y.length; i++) {
                        if(autoType(y[i], calendar, opts) === 'category') {
                            hasCategories = true;
                            break;
                        }
                    }

                    if(hasCategories) {
                        defaultOrientation = 'h';
                        len = Math.min(sLen, x.length, yLen);
                    } else {
                        defaultOrientation = 'v';
                        len = Math.min(sLen, xLen, y.length);
                    }
                }
                break;
        }
    } else if(yDims > 0) {
        defaultOrientation = 'v';
        if(xDims > 0) {
            len = Math.min(xLen, yLen);
        } else {
            len = Math.min(yLen);
        }
    } else if(xDims > 0) {
        defaultOrientation = 'h';
        len = Math.min(xLen);
    } else {
        len = 0;
    }

    if(!len) {
        traceOut.visible = false;
        return;
    }
    traceOut._length = len;

    var orientation = coerce('orientation', defaultOrientation);

    // these are just used for positioning, they never define the sample
    if(traceOut._hasPreCompStats) {
        if(orientation === 'v' && xDims === 0) {
            coerce('x0', 0);
            coerce('dx', 1);
        } else if(orientation === 'h' && yDims === 0) {
            coerce('y0', 0);
            coerce('dy', 1);
        }
    } else {
        if(orientation === 'v' && xDims === 0) {
            coerce('x0');
        } else if(orientation === 'h' && yDims === 0) {
            coerce('y0');
        }
    }

    var handleCalendarDefaults = Registry.getComponentMethod('calendars', 'handleTraceDefaults');
    handleCalendarDefaults(traceIn, traceOut, ['x', 'y'], layout);
}

function handlePointsDefaults(traceIn, traceOut, coerce, opts) {
    var prefix = opts.prefix;

    var outlierColorDflt = Lib.coerce2(traceIn, traceOut, attributes, 'marker.outliercolor');
    var lineoutliercolor = coerce('marker.line.outliercolor');

    var modeDflt = 'outliers';
    if(traceOut._hasPreCompStats) {
        modeDflt = 'all';
    } else if(outlierColorDflt || lineoutliercolor) {
        modeDflt = 'suspectedoutliers';
    }

    var mode = coerce(prefix + 'points', modeDflt);

    if(mode) {
        coerce('jitter', mode === 'all' ? 0.3 : 0);
        coerce('pointpos', mode === 'all' ? -1.5 : 0);

        coerce('marker.symbol');
        coerce('marker.opacity');
        coerce('marker.size');
        coerce('marker.angle');

        coerce('marker.color', traceOut.line.color);
        coerce('marker.line.color');
        coerce('marker.line.width');

        if(mode === 'suspectedoutliers') {
            coerce('marker.line.outliercolor', traceOut.marker.color);
            coerce('marker.line.outlierwidth');
        }

        coerce('selected.marker.color');
        coerce('unselected.marker.color');
        coerce('selected.marker.size');
        coerce('unselected.marker.size');

        coerce('text');
        coerce('hovertext');
    } else {
        delete traceOut.marker;
    }

    var hoveron = coerce('hoveron');
    if(hoveron === 'all' || hoveron.indexOf('points') !== -1) {
        coerce('hovertemplate');
    }

    Lib.coerceSelectionMarkerOpacity(traceOut, coerce);
}

function crossTraceDefaults(fullData, fullLayout) {
    var traceIn, traceOut;

    function coerce(attr) {
        return Lib.coerce(traceOut._input, traceOut, attributes, attr);
    }

    for(var i = 0; i < fullData.length; i++) {
        traceOut = fullData[i];
        var traceType = traceOut.type;

        if(traceType === 'box' || traceType === 'violin') {
            traceIn = traceOut._input;
            if(fullLayout[traceType + 'mode'] === 'group') {
                handleGroupingDefaults(traceIn, traceOut, fullLayout, coerce);
            }
        }
    }
}

module.exports = {
    supplyDefaults: supplyDefaults,
    crossTraceDefaults: crossTraceDefaults,

    handleSampleDefaults: handleSampleDefaults,
    handlePointsDefaults: handlePointsDefaults
};
