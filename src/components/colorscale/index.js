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
var tinycolor = require('tinycolor2');
var isNumeric = require('fast-isnumeric');

var colorscale = module.exports = {};

colorscale.scales = require('./scales');
colorscale.defaultScale = colorscale.scales.RdBu;

colorscale.attributes = require('./attributes');

function isValidScaleArray(scl) {
    var isValid = true,
        highestVal = 0,
        si;

    if(!Array.isArray(scl)) return false;
    else {
        if(+scl[0][0]!==0 || +scl[scl.length-1][0]!==1) return false;
        for (var i = 0; i < scl.length; i++) {
            si = scl[i];
            if(si.length!==2 || +si[0]<highestVal || !tinycolor(si[1]).isValid()) {
                isValid = false;
                break;
            }
            highestVal = +si[0];
        }
        return isValid;
    }
}

colorscale.isValidScale = function(scl) {
    if(colorscale.scales[scl] !== undefined) return true;
    else return isValidScaleArray(scl);
};

colorscale.getScale = function(scl, dflt) {
    if(!dflt) dflt = colorscale.defaultScale;
    if(!scl) return dflt;

    function parseScale() {
        try {
            scl = colorscale.scales[scl] || JSON.parse(scl);
        }
        catch(e) {
            scl = dflt;
        }
    }

    if(typeof scl === 'string') {
        parseScale();
        // occasionally scl is double-JSON encoded...
        if(typeof scl === 'string') parseScale();
    }

    if(!isValidScaleArray(scl)) return dflt;
    return scl;
};

colorscale.flipScale = function(scl) {
    var N = scl.length,
        sclNew = new Array(N),
        si;

    for(var i = N-1, j = 0; i >= 0; i--, j++) {
        si = scl[i];
        sclNew[j] = [1 - si[0], si[1]];
    }

    return sclNew;
};

colorscale.hasColorscale = function(trace, containerStr) {
    var container = containerStr ?
            Plotly.Lib.nestedProperty(trace, containerStr).get() || {} :
            trace,
        color = container.color,
        isArrayWithOneNumber = false;

    if(Array.isArray(color)) {
        for(var i = 0; i < color.length; i++) {
            if(isNumeric(color[i])) {
                isArrayWithOneNumber = true;
                break;
            }
        }
    }

    return (
        (typeof container==='object' && container!==null) && (
            isArrayWithOneNumber ||
            container.showscale===true ||
            (isNumeric(container.cmin) && isNumeric(container.cmax)) ||
            colorscale.isValidScale(container.colorscale) ||
            (typeof container.colorbar==='object' && container.colorbar!==null)
        )
    );
};

colorscale.hasColorbar = function(container) {
    return typeof container.colorbar==='object' && container.colorbar!==null;
};

colorscale.handleDefaults = function(traceIn, traceOut, layout, coerce, opts) {
    var prefix = opts.prefix,
        cLetter = opts.cLetter,
        containerStr = prefix.slice(0, prefix.length-1),
        containerIn = prefix ?
            Plotly.Lib.nestedProperty(traceIn, containerStr).get() || {} :
            traceIn,
        containerOut = prefix ?
            Plotly.Lib.nestedProperty(traceOut, containerStr).get() || {} :
            traceOut,
        minIn = containerIn[cLetter + 'min'],
        maxIn = containerIn[cLetter + 'max'],
        sclIn = containerIn.colorscale;

    var validMinMax, autoColorscaleDftl, showScaleDftl, sclOut, reverseScale, showScale;

    validMinMax = isNumeric(minIn) && isNumeric(maxIn) && minIn < maxIn;
    coerce(prefix + cLetter + 'auto', !validMinMax);
    coerce(prefix + cLetter + 'min');
    coerce(prefix + cLetter + 'max');

    // handles both the trace case (autocolorscale is false by default) and
    // the marker and marker.line case (autocolorscale is true by default)
    if(sclIn!==undefined) autoColorscaleDftl = !colorscale.isValidScale(sclIn);
    coerce(prefix + 'autocolorscale', autoColorscaleDftl);
    sclOut = coerce(prefix + 'colorscale');

    // reversescale is handled at the containerOut level
    reverseScale = coerce(prefix + 'reversescale');
    if(reverseScale) containerOut.colorscale = colorscale.flipScale(sclOut);

    // ... until Scatter.colorbar can handle marker line colorbars
    if(prefix === 'marker.line.') return;

    // handle both the trace case where the dflt is listed in attributes and
    // the marker case where the dflt is determined by hasColorbar
    if(prefix) showScaleDftl = colorscale.hasColorbar(containerIn);
    showScale = coerce(prefix + 'showscale', showScaleDftl);

    if(showScale) Plotly.Colorbar.supplyDefaults(containerIn, containerOut, layout);
};

colorscale.calc = function(trace, vals, containerStr, cLetter) {
    var container, inputContainer;

    if(containerStr) {
        container = Plotly.Lib.nestedProperty(trace, containerStr).get();
        inputContainer = Plotly.Lib.nestedProperty(trace._input, containerStr).get();
    } else {
        container = trace;
        inputContainer = trace._input;
    }

    var auto = container[cLetter + 'auto'],
        min = container[cLetter + 'min'],
        max = container[cLetter + 'max'],
        scl = container.colorscale;

    if(auto!==false || min===undefined) {
        min = Plotly.Lib.aggNums(Math.min, null, vals);
    }

    if(auto!==false || max===undefined) {
        max = Plotly.Lib.aggNums(Math.max, null, vals);
    }

    if(min === max) {
        min -= 0.5;
        max += 0.5;
    }

    container[cLetter + 'min'] = min;
    container[cLetter + 'max'] = max;

    inputContainer[cLetter + 'min'] = min;
    inputContainer[cLetter + 'max'] = max;

    if(container.autocolorscale) {
        if(min * max < 0) scl = colorscale.scales.RdBu;
        else if(min >= 0) scl = colorscale.scales.Reds;
        else scl = colorscale.scales.Blues;

        // reversescale is handled at the containerOut level
        inputContainer.colorscale = scl;
        if(container.reversescale) scl = colorscale.flipScale(scl);
        container.colorscale = scl;
    }
};

colorscale.makeScaleFunction = function(scl, cmin, cmax) {
    var N = scl.length,
        domain = new Array(N),
        range = new Array(N),
        si;

    for(var i = 0; i < N; i++) {
        si = scl[i];
        domain[i] = cmin + si[0] * (cmax - cmin);
        range[i] = si[1];
    }

    var sclFunc = d3.scale.linear()
        .domain(domain)
        .interpolate(d3.interpolateRgb)
        .range(range);

    return function(v) {
        if(isNumeric(v)) return sclFunc(v);
        else if(tinycolor(v).isValid()) return v;
        else return Plotly.Color.defaultLine;
    };
};
