/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');
var tinycolor = require('tinycolor2');

var Color = require('../../components/color');
var helpers = require('./helpers');

module.exports = function calc(gd, trace) {
    var vals = trace.values,
        labels = trace.labels,
        cd = [],
        fullLayout = gd._fullLayout,
        colorMap = fullLayout._piecolormap,
        allThisTraceLabels = {},
        needDefaults = false,
        vTotal = 0,
        hiddenLabels = fullLayout.hiddenlabels || [],
        i,
        v,
        label,
        color,
        hidden,
        pt;

    if(trace.dlabel) {
        labels = new Array(vals.length);
        for(i = 0; i < vals.length; i++) {
            labels[i] = String(trace.label0 + i * trace.dlabel);
        }
    }

    for(i = 0; i < vals.length; i++) {
        v = vals[i];
        if(!isNumeric(v)) continue;
        v = +v;
        if(v < 0) continue;

        label = labels[i];
        if(label === undefined || label === '') label = i;
        label = String(label);
        // only take the first occurrence of any given label.
        // TODO: perhaps (optionally?) sum values for a repeated label?
        if(allThisTraceLabels[label] === undefined) allThisTraceLabels[label] = true;
        else continue;

        color = tinycolor(trace.marker.colors[i]);
        if(color.isValid()) {
            color = Color.addOpacity(color, color.getAlpha());
            if(!colorMap[label]) {
                colorMap[label] = color;
            }
        }
        // have we seen this label and assigned a color to it in a previous trace?
        else if(colorMap[label]) color = colorMap[label];
        // color needs a default - mark it false, come back after sorting
        else {
            color = false;
            needDefaults = true;
        }

        hidden = hiddenLabels.indexOf(label) !== -1;

        if(!hidden) vTotal += v;

        cd.push({
            v: v,
            label: label,
            color: color,
            i: i,
            hidden: hidden
        });
    }

    if(trace.sort) cd.sort(function(a, b) { return b.v - a.v; });

    /**
     * now go back and fill in colors we're still missing
     * this is done after sorting, so we pick defaults
     * in the order slices will be displayed
     */

    if(needDefaults) {
        for(i = 0; i < cd.length; i++) {
            pt = cd[i];
            if(pt.color === false) {
                colorMap[pt.label] = pt.color = nextDefaultColor(fullLayout._piedefaultcolorcount);
                fullLayout._piedefaultcolorcount++;
            }
        }
    }

    // include the sum of all values in the first point
    if(cd[0]) cd[0].vTotal = vTotal;

    // now insert text
    if(trace.textinfo && trace.textinfo !== 'none') {
        var hasLabel = trace.textinfo.indexOf('label') !== -1,
            hasText = trace.textinfo.indexOf('text') !== -1,
            hasValue = trace.textinfo.indexOf('value') !== -1,
            hasPercent = trace.textinfo.indexOf('percent') !== -1,
            separators = fullLayout.separators,
            thisText;

        for(i = 0; i < cd.length; i++) {
            pt = cd[i];
            thisText = hasLabel ? [pt.label] : [];
            if(hasText && trace.text[pt.i]) thisText.push(trace.text[pt.i]);
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

function nextDefaultColor(index) {
    if(!pieDefaultColors) {
        // generate this default set on demand (but then it gets saved in the module)
        var mainDefaults = Color.defaults;
        pieDefaultColors = mainDefaults.slice();

        var i;

        for(i = 0; i < mainDefaults.length; i++) {
            pieDefaultColors.push(tinycolor(mainDefaults[i]).lighten(20).toHexString());
        }

        for(i = 0; i < Color.defaults.length; i++) {
            pieDefaultColors.push(tinycolor(mainDefaults[i]).darken(20).toHexString());
        }
    }

    return pieDefaultColors[index % pieDefaultColors.length];
}
