'use strict';

var tinycolor = require('tinycolor2');
var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var Colorscale = require('../colorscale');

/**
 * Collect unique color values from all traces referencing this colorlegend
 *
 * @param {object} gd - graph div
 * @param {string} colorlegendId - e.g., 'colorlegend', 'colorlegend2'
 * @returns {Array} - array of {value, color, traces: [traceIndices], points: [{trace, i}]}
 */
module.exports = function getColorlegendData(gd, colorlegendId) {
    var fullData = gd._fullData;
    var fullLayout = gd._fullLayout;
    var colorlegendOpts = fullLayout[colorlegendId];

    var valueMap = {};  // value -> {color, traces, points}
    var values = [];    // ordered list of unique values

    for(var i = 0; i < fullData.length; i++) {
        var trace = fullData[i];
        if(!trace.visible || trace.visible === 'legendonly') continue;

        var marker = trace.marker;
        if(!marker || marker.colorlegend !== colorlegendId) continue;

        var colors = marker.color;
        if(!Array.isArray(colors)) {
            // Single color - treat as one category
            colors = [colors];
        }

        for(var j = 0; j < colors.length; j++) {
            var colorVal = colors[j];
            var key = String(colorVal);

            if(!valueMap[key]) {
                valueMap[key] = {
                    value: colorVal,
                    color: resolveColor(colorVal, trace, j),
                    traces: [],
                    points: []
                };
                values.push(key);
            }

            if(valueMap[key].traces.indexOf(i) === -1) {
                valueMap[key].traces.push(i);
            }
            valueMap[key].points.push({trace: i, i: j});
        }
    }

    // Handle binning for numeric data
    if(colorlegendOpts.binning === 'auto' && values.length > 0) {
        var isNumericData = values.every(function(v) {
            return isNumeric(valueMap[v].value);
        });

        if(isNumericData && values.length > colorlegendOpts.nbins) {
            return binNumericValues(valueMap, values, colorlegendOpts);
        }
    }

    // Return discrete values
    return values.map(function(key) {
        return valueMap[key];
    });
};

function resolveColor(colorVal, trace, pointIndex) {
    var marker = trace.marker;

    // If colorVal is already a valid color string, return it
    if(typeof colorVal === 'string') {
        var tc = tinycolor(colorVal);
        if(tc.isValid()) {
            return tc.toRgbString();
        }
    }

    // If using colorscale, compute color from scale
    if(marker.colorscale && isNumeric(colorVal)) {
        var scaleFunc = Colorscale.makeColorScaleFuncFromTrace({
            marker: marker,
            _module: trace._module
        });

        if(scaleFunc) {
            return scaleFunc(colorVal);
        }
    }

    // Fallback: use a default color palette based on the value
    // This handles cases like categorical strings that aren't valid colors
    var defaultColors = [
        '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
        '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
    ];

    // For non-color strings, assign from palette based on hash
    if(typeof colorVal === 'string') {
        var hash = 0;
        for(var i = 0; i < colorVal.length; i++) {
            hash = ((hash << 5) - hash) + colorVal.charCodeAt(i);
            hash = hash & hash; // Convert to 32-bit integer
        }
        return defaultColors[Math.abs(hash) % defaultColors.length];
    }

    // Final fallback
    return marker.color || (trace.line && trace.line.color) || '#1f77b4';
}

function binNumericValues(valueMap, values, opts) {
    var numericValues = values.map(function(v) {
        return parseFloat(valueMap[v].value);
    });

    var min = Math.min.apply(null, numericValues);
    var max = Math.max.apply(null, numericValues);

    // Handle edge case where all values are the same
    if(min === max) {
        return [{
            value: min,
            displayValue: String(min),
            color: valueMap[values[0]].color,
            traces: valueMap[values[0]].traces.slice(),
            points: valueMap[values[0]].points.slice()
        }];
    }

    var binSize = (max - min) / opts.nbins;

    var bins = [];
    for(var b = 0; b < opts.nbins; b++) {
        var binMin = min + b * binSize;
        var binMax = min + (b + 1) * binSize;

        bins.push({
            value: (binMin + binMax) / 2,
            displayValue: formatRange(binMin, binMax, b === opts.nbins - 1),
            binMin: binMin,
            binMax: binMax,
            color: null,  // Will be computed from first encountered value
            traces: [],
            points: []
        });
    }

    // Assign points to bins
    values.forEach(function(key) {
        var item = valueMap[key];
        var val = parseFloat(item.value);
        var binIndex = Math.min(Math.floor((val - min) / binSize), opts.nbins - 1);

        bins[binIndex].points = bins[binIndex].points.concat(item.points);

        // Add traces
        for(var t = 0; t < item.traces.length; t++) {
            if(bins[binIndex].traces.indexOf(item.traces[t]) === -1) {
                bins[binIndex].traces.push(item.traces[t]);
            }
        }

        // Use first encountered color for bin
        if(!bins[binIndex].color) {
            bins[binIndex].color = item.color;
        }
    });

    // Remove empty bins
    return bins.filter(function(bin) {
        return bin.points.length > 0;
    });
}

function formatRange(min, max, isLast) {
    // Format numbers nicely
    var precision = Math.max(
        countDecimals(min),
        countDecimals(max),
        0
    );

    // Limit precision to something reasonable
    precision = Math.min(precision, 2);

    var minStr = min.toFixed(precision);
    var maxStr = max.toFixed(precision);

    // Use different bracket for last bin (inclusive upper bound)
    return '[' + minStr + ', ' + maxStr + (isLast ? ']' : ')');
}

function countDecimals(num) {
    if(Math.floor(num) === num) return 0;
    var str = String(num);
    var parts = str.split('.');
    return parts[1] ? parts[1].length : 0;
}
