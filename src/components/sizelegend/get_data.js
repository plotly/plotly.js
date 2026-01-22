'use strict';

var isNumeric = require('fast-isnumeric');

/**
 * Collect size data from all traces referencing this sizelegend
 * and return representative size samples for the legend
 *
 * @param {object} gd - graph div
 * @param {string} sizelegendId - e.g., 'sizelegend', 'sizelegend2'
 * @returns {Array} - array of {value, displaySize, traces, points}
 */
module.exports = function getSizelegendData(gd, sizelegendId) {
    var fullData = gd._fullData;
    var fullLayout = gd._fullLayout;
    var sizelegendOpts = fullLayout[sizelegendId];

    var allSizes = [];
    var traceInfo = [];

    // Collect all sizes from traces referencing this sizelegend
    for(var i = 0; i < fullData.length; i++) {
        var trace = fullData[i];
        if(!trace.visible || trace.visible === 'legendonly') continue;

        var marker = trace.marker;
        if(!marker || marker.sizelegend !== sizelegendId) continue;

        var sizes = marker.size;
        if(!Array.isArray(sizes)) {
            // Single size value
            sizes = [sizes];
        }

        for(var j = 0; j < sizes.length; j++) {
            var sizeVal = sizes[j];
            if(isNumeric(sizeVal)) {
                allSizes.push(parseFloat(sizeVal));
                traceInfo.push({trace: i, i: j, size: parseFloat(sizeVal)});
            }
        }
    }

    if(allSizes.length === 0) {
        return [];
    }

    // Calculate min and max sizes
    var minSize = Math.min.apply(null, allSizes);
    var maxSize = Math.max.apply(null, allSizes);

    // Handle case where all sizes are the same
    if(minSize === maxSize) {
        return [{
            value: minSize,
            displayValue: formatSize(minSize),
            displaySize: computeDisplaySize(minSize, minSize, maxSize),
            traces: getTracesWithSize(traceInfo, minSize, minSize),
            points: getPointsWithSize(traceInfo, minSize, minSize)
        }];
    }

    // Generate size samples
    var nsamples = sizelegendOpts.nsamples;
    var samples = [];

    for(var s = 0; s < nsamples; s++) {
        // Sample from min to max, inclusive
        var fraction = s / (nsamples - 1);
        var sampleSize = minSize + fraction * (maxSize - minSize);

        // Determine the range of sizes this sample represents
        var rangeMin, rangeMax;
        if(s === 0) {
            rangeMin = minSize;
            rangeMax = minSize + (maxSize - minSize) / (nsamples * 2);
        } else if(s === nsamples - 1) {
            rangeMin = maxSize - (maxSize - minSize) / (nsamples * 2);
            rangeMax = maxSize;
        } else {
            var halfStep = (maxSize - minSize) / (nsamples - 1) / 2;
            rangeMin = sampleSize - halfStep;
            rangeMax = sampleSize + halfStep;
        }

        samples.push({
            value: sampleSize,
            displayValue: formatSize(sampleSize),
            displaySize: computeDisplaySize(sampleSize, minSize, maxSize),
            rangeMin: rangeMin,
            rangeMax: rangeMax,
            traces: getTracesWithSize(traceInfo, rangeMin, rangeMax),
            points: getPointsWithSize(traceInfo, rangeMin, rangeMax)
        });
    }

    return samples;
};

/**
 * Compute display size for legend (pixels)
 * Map the value proportionally between min/max legend display sizes
 */
function computeDisplaySize(value, minVal, maxVal) {
    var minDisplay = 6;   // minimum circle diameter in legend
    var maxDisplay = 30;  // maximum circle diameter in legend

    if(minVal === maxVal) {
        return (minDisplay + maxDisplay) / 2;
    }

    var fraction = (value - minVal) / (maxVal - minVal);
    return minDisplay + fraction * (maxDisplay - minDisplay);
}

/**
 * Get trace indices that have sizes in the given range
 */
function getTracesWithSize(traceInfo, rangeMin, rangeMax) {
    var traces = [];
    for(var i = 0; i < traceInfo.length; i++) {
        var info = traceInfo[i];
        if(info.size >= rangeMin && info.size <= rangeMax) {
            if(traces.indexOf(info.trace) === -1) {
                traces.push(info.trace);
            }
        }
    }
    return traces;
}

/**
 * Get points that have sizes in the given range
 */
function getPointsWithSize(traceInfo, rangeMin, rangeMax) {
    var points = [];
    for(var i = 0; i < traceInfo.length; i++) {
        var info = traceInfo[i];
        if(info.size >= rangeMin && info.size <= rangeMax) {
            points.push({trace: info.trace, i: info.i});
        }
    }
    return points;
}

/**
 * Format size value for display
 */
function formatSize(value) {
    // Format nicely - remove unnecessary decimals
    if(Math.floor(value) === value) {
        return String(value);
    }
    // Limit to 1 decimal place
    return value.toFixed(1);
}
