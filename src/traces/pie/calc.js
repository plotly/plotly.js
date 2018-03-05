/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');
var isArrayOrTypedArray = require('../../lib').isArrayOrTypedArray;
var tinycolor = require('tinycolor2');

var Color = require('../../components/color');
var helpers = require('./helpers');

module.exports = function calc(gd, trace) {
    var vals = trace.values;
    var hasVals = isArrayOrTypedArray(vals) && vals.length;
    var labels = trace.labels;
    var colors = trace.marker.colors || [];
    var cd = [];
    var fullLayout = gd._fullLayout;
    var colorWay = fullLayout.colorway;
    var colorMap = fullLayout._piecolormap;
    var allThisTraceLabels = {};
    var vTotal = 0;
    var hiddenLabels = fullLayout.hiddenlabels || [];

    var i, v, label, hidden, pt;

    if(!fullLayout._piecolorway && colorWay !== Color.defaults) {
        fullLayout._piecolorway = generateDefaultColors(colorWay);
    }

    if(trace.dlabel) {
        labels = new Array(vals.length);
        for(i = 0; i < vals.length; i++) {
            labels[i] = String(trace.label0 + i * trace.dlabel);
        }
    }

    function pullColor(color, label) {
        if(!color) return false;

        color = tinycolor(color);
        if(!color.isValid()) return false;

        color = Color.addOpacity(color, color.getAlpha());
        if(!colorMap[label]) colorMap[label] = color;

        return color;
    }

    var seriesLen = (hasVals ? vals : labels).length;

    for(i = 0; i < seriesLen; i++) {
        if(hasVals) {
            v = vals[i];
            if(!isNumeric(v)) continue;
            v = +v;
            if(v < 0) continue;
        }
        else v = 1;

        label = labels[i];
        if(label === undefined || label === '') label = i;
        label = String(label);

        var thisLabelIndex = allThisTraceLabels[label];
        if(thisLabelIndex === undefined) {
            allThisTraceLabels[label] = cd.length;

            hidden = hiddenLabels.indexOf(label) !== -1;

            if(!hidden) vTotal += v;

            cd.push({
                v: v,
                label: label,
                color: pullColor(colors[i]),
                i: i,
                pts: [i],
                hidden: hidden
            });
        }
        else {
            pt = cd[thisLabelIndex];
            pt.v += v;
            pt.pts.push(i);
            if(!pt.hidden) vTotal += v;

            if(pt.color === false && colors[i]) {
                pt.color = pullColor(colors[i], label);
            }
        }
    }

    if(trace.sort) cd.sort(function(a, b) { return b.v - a.v; });

    /**
     * now go back and fill in colors we're still missing
     * this is done after sorting, so we pick defaults
     * in the order slices will be displayed
     */

    for(i = 0; i < cd.length; i++) {
        pt = cd[i];
        if(pt.color === false) {
            // have we seen this label and assigned a color to it in a previous trace?
            if(colorMap[pt.label]) {
                pt.color = colorMap[pt.label];
            }
            else {
                colorMap[pt.label] = pt.color = nextDefaultColor(
                    fullLayout._piedefaultcolorcount,
                    fullLayout._piecolorway
                );
                fullLayout._piedefaultcolorcount++;
            }
        }
    }

    // include the sum of all values in the first point
    if(cd[0]) cd[0].vTotal = vTotal;

    // now insert text
    if(trace.textinfo && trace.textinfo !== 'none') {
        var hasLabel = trace.textinfo.indexOf('label') !== -1;
        var hasText = trace.textinfo.indexOf('text') !== -1;
        var hasValue = trace.textinfo.indexOf('value') !== -1;
        var hasPercent = trace.textinfo.indexOf('percent') !== -1;
        var separators = fullLayout.separators;

        var thisText;

        for(i = 0; i < cd.length; i++) {
            pt = cd[i];
            thisText = hasLabel ? [pt.label] : [];
            if(hasText) {
                var texti = helpers.getFirstFilled(trace.text, pt.pts);
                if(texti) thisText.push(texti);
            }
            if(hasValue) thisText.push(helpers.formatPieValue(pt.v, separators));
            if(hasPercent) thisText.push(helpers.formatPiePercent(pt.v / vTotal, separators));
            pt.text = thisText.join('<br>');
        }
    }

    return cd;
};

/**
 * pick a default color from the main default set, augmented by
 * itself lighter then darker before repeating
 */
var pieDefaultColors;

function nextDefaultColor(index, pieColorWay) {
    if(!pieDefaultColors) {
        // generate this default set on demand (but then it gets saved in the module)
        var mainDefaults = Color.defaults;
        pieDefaultColors = generateDefaultColors(mainDefaults);
    }

    var pieColors = pieColorWay || pieDefaultColors;
    return pieColors[index % pieColors.length];
}

function generateDefaultColors(colorList) {
    var i;

    var pieColors = colorList.slice();

    for(i = 0; i < colorList.length; i++) {
        pieColors.push(tinycolor(colorList[i]).lighten(20).toHexString());
    }

    for(i = 0; i < colorList.length; i++) {
        pieColors.push(tinycolor(colorList[i]).darken(20).toHexString());
    }

    return pieColors;
}
