'use strict';

/* global d3:false */

var colorscale = module.exports = {},
    Plotly = require('./plotly'),
    tinycolor = require('tinycolor2'),
    isNumeric = require('./isnumeric');

colorscale.scales = {
    'Greys':[[0,'rgb(0,0,0)'],[1,'rgb(255,255,255)']],

    'YIGnBu':[[0,'rgb(8, 29, 88)'],[0.125,'rgb(37, 52, 148)'],
        [0.25,'rgb(34, 94, 168)'],[0.375,'rgb(29, 145, 192)'],
        [0.5,'rgb(65, 182, 196)'],[0.625,'rgb(127, 205, 187)'],
        [0.75,'rgb(199, 233, 180)'],[0.875,'rgb(237, 248, 217)'],
        [1,'rgb(255, 255, 217)']],

    'Greens':[[0,'rgb(0, 68, 27)'],[0.125,'rgb(0, 109, 44)'],
        [0.25,'rgb(35, 139, 69)'],[0.375,'rgb(65, 171, 93)'],
        [0.5,'rgb(116, 196, 118)'],[0.625,'rgb(161, 217, 155)'],
        [0.75,'rgb(199, 233, 192)'],[0.875,'rgb(229, 245, 224)'],
        [1,'rgb(247, 252, 245)']],

    'YIOrRd':[[0,'rgb(128, 0, 38)'],[0.125,'rgb(189, 0, 38)'],
        [0.25,'rgb(227, 26, 28)'],[0.375,'rgb(252, 78, 42)'],
        [0.5,'rgb(253, 141, 60)'],[0.625,'rgb(254, 178, 76)'],
        [0.75,'rgb(254, 217, 118)'],[0.875,'rgb(255, 237, 160)'],
        [1,'rgb(255, 255, 204)']],

    'Bluered':[[0,'rgb(0,0,255)'],[1,'rgb(255,0,0)']],

    // modified RdBu based on
    // www.sandia.gov/~kmorel/documents/ColorMaps/ColorMapsExpanded.pdf
    'RdBu':[[0,'rgb(5, 10, 172)'],[0.35,'rgb(106, 137, 247)'],
        [0.5,'rgb(190,190,190)'],[0.6,'rgb(220, 170, 132)'],
        [0.7,'rgb(230, 145, 90)'],[1,'rgb(178, 10, 28)']],
    // Scale for non-negative numeric values
    'Reds': [[0, 'rgb(220, 220, 220)'], [0.2,'rgb(245, 195, 157)'],
        [0.4,'rgb(245, 160, 105)'], [1, 'rgb(178, 10, 28)']],
    // Scale for non-positive numeric values
    'Blues': [[0, 'rgb(5, 10, 172)'], [0.35, 'rgb(40, 60, 190)'],
        [0.5, 'rgb(70, 100, 245)'], [0.6, 'rgb(90, 120, 245)'],
        [0.7, 'rgb(106, 137, 247)'], [1, 'rgb(220, 220, 220)']],

    'Picnic':[[0,'rgb(0,0,255)'],[0.1,'rgb(51,153,255)'],
        [0.2,'rgb(102,204,255)'],[0.3,'rgb(153,204,255)'],
        [0.4,'rgb(204,204,255)'],[0.5,'rgb(255,255,255)'],
        [0.6,'rgb(255,204,255)'],[0.7,'rgb(255,153,255)'],
        [0.8,'rgb(255,102,204)'],[0.9,'rgb(255,102,102)'],
        [1,'rgb(255,0,0)']],

    'Rainbow':[[0,'rgb(150,0,90)'],[0.125,'rgb(0, 0, 200)'],
        [0.25,'rgb(0, 25, 255)'],[0.375,'rgb(0, 152, 255)'],
        [0.5,'rgb(44, 255, 150)'],[0.625,'rgb(151, 255, 0)'],
        [0.75,'rgb(255, 234, 0)'],[0.875,'rgb(255, 111, 0)'],
        [1,'rgb(255, 0, 0)']],

    'Portland':[[0,'rgb(12,51,131)'],[0.25,'rgb(10,136,186)'],
        [0.5,'rgb(242,211,56)'],[0.75,'rgb(242,143,56)'],
        [1,'rgb(217,30,30)']],

    'Jet':[[0,'rgb(0,0,131)'],[0.125,'rgb(0,60,170)'],
        [0.375,'rgb(5,255,255)'],[0.625,'rgb(255,255,0)'],
        [0.875,'rgb(250,0,0)'],[1,'rgb(128,0,0)']],

    'Hot':[[0,'rgb(0,0,0)'],[0.3,'rgb(230,0,0)'],
        [0.6,'rgb(255,210,0)'],[1,'rgb(255,255,255)']],

    'Blackbody':[[0,'rgb(0,0,0)'],[0.2,'rgb(230,0,0)'],
        [0.4,'rgb(230,210,0)'],[0.7,'rgb(255,255,255)'],
        [1,'rgb(160,200,255)']],

    'Earth':[[0,'rgb(0,0,130)'],[0.1,'rgb(0,180,180)'],
        [0.2,'rgb(40,210,40)'],[0.4,'rgb(230,230,50)'],
        [0.6,'rgb(120,70,20)'],[1,'rgb(255,255,255)']],

    'Electric':[[0,'rgb(0,0,0)'],[0.15,'rgb(30,0,100)'],
        [0.4,'rgb(120,0,100)'],[0.6,'rgb(160,90,0)'],
        [0.8,'rgb(230,200,0)'],[1,'rgb(255,250,220)']]
};

colorscale.defaultScale = colorscale.scales.RdBu;

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

    var validMinMax, autoColorscaleDftl, showScaleDftl, showScale;

    validMinMax = isNumeric(minIn) && isNumeric(maxIn) && minIn < maxIn;
    coerce(prefix + cLetter + 'auto', !validMinMax);
    coerce(prefix + cLetter + 'min');
    coerce(prefix + cLetter + 'max');

    // handles both the trace case (autocolorscale is false by default) and
    // the marker and marker.line case (autocolorscale is true by default)
    if(sclIn!==undefined) autoColorscaleDftl = !colorscale.isValidScale(sclIn);
    coerce(prefix + 'autocolorscale', autoColorscaleDftl);
    coerce(prefix + 'colorscale');
    coerce(prefix + 'reversescale');

    // until scatter.colorbar can handle marker line colorbars
    if(prefix === 'marker.line.') return;

    // handle both the trace case where the dftl is listed in attributes and
    // the marker case where the dftl is determined by hasColorbar
    if(prefix) showScaleDftl = colorscale.hasColorbar(containerIn);
    showScale = coerce(prefix + 'showscale', showScaleDftl);

    if(showScale) Plotly.Colorbar.supplyDefaults(containerIn, containerOut, layout);
};

function flipScale(si) { return [1 - si[0], si[1]]; }

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

    if(container.autocolorscale) {
        if(min * max < 0) scl = colorscale.scales.RdBu;
        else if(min >= 0) scl = colorscale.scales.Reds;
        else scl = colorscale.scales.Blues;
    }

    inputContainer[cLetter + 'min'] = min;
    inputContainer[cLetter + 'max'] = max;
    inputContainer.colorscale = scl;

    if(container.reversescale) scl = scl.map(flipScale).reverse();

    container[cLetter + 'min'] = min;
    container[cLetter + 'max'] = max;
    container.colorscale = scl;
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

    return function(v) { return isNumeric(v) ? sclFunc(v) : v; };
};
