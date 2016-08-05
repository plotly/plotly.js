/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var isNumeric = require('fast-isnumeric');

var Plots = require('../../plots/plots');
var Color = require('../color');
var Colorscale = require('../colorscale');
var Lib = require('../../lib');
var svgTextUtils = require('../../lib/svg_text_utils');

var xmlnsNamespaces = require('../../constants/xmlns_namespaces');
var subTypes = require('../../traces/scatter/subtypes');
var makeBubbleSizeFn = require('../../traces/scatter/make_bubble_size_func');

var drawing = module.exports = {};

// -----------------------------------------------------
// styling functions for plot elements
// -----------------------------------------------------

drawing.font = function(s, family, size, color) {
    // also allow the form font(s, {family, size, color})
    if(family && family.family) {
        color = family.color;
        size = family.size;
        family = family.family;
    }
    if(family) s.style('font-family', family);
    if(size + 1) s.style('font-size', size + 'px');
    if(color) s.call(Color.fill, color);
};

drawing.setPosition = function(s, x, y) { s.attr('x', x).attr('y', y); };
drawing.setSize = function(s, w, h) { s.attr('width', w).attr('height', h); };
drawing.setRect = function(s, x, y, w, h) {
    s.call(drawing.setPosition, x, y).call(drawing.setSize, w, h);
};

drawing.translatePoints = function(s, xa, ya, trace, transitionConfig, joinDirection) {
    var size;

    var hasTransition = transitionConfig && (transitionConfig || {}).duration > 0;

    if(hasTransition) {
        size = s.size();
    }

    s.each(function(d, i) {
        // put xp and yp into d if pixel scaling is already done
        var x = d.xp || xa.c2p(d.x),
            y = d.yp || ya.c2p(d.y),
            p = d3.select(this);
        if(isNumeric(x) && isNumeric(y)) {
            // for multiline text this works better
            if(this.nodeName === 'text') {
                p.attr('x', x).attr('y', y);
            } else {
                if(hasTransition) {
                    var trans;
                    if(!joinDirection) {
                        trans = p.transition()
                        .delay(transitionConfig.delay + transitionConfig.cascade / size * i)
                        .duration(transitionConfig.duration)
                        .ease(transitionConfig.ease)
                        .attr('transform', 'translate(' + x + ',' + y + ')');

                        if(trace) {
                            trans.call(drawing.pointStyle, trace);
                        }
                    } else if(joinDirection === -1) {
                        trans = p.style('opacity', 1)
                        .transition()
                            .duration(transitionConfig.duration)
                            .ease(transitionConfig.ease)
                            .style('opacity', 0)
                            .remove();
                    } else if(joinDirection === 1) {
                        trans = p.attr('transform', 'translate(' + x + ',' + y + ')');

                        if(trace) {
                            trans.call(drawing.pointStyle, trace);
                        }

                        trans.style('opacity', 0)
                        .transition()
                            .duration(transitionConfig.duration)
                            .ease(transitionConfig.ease)
                            .style('opacity', 1);
                    }

                } else {
                    p.attr('transform', 'translate(' + x + ',' + y + ')');
                }
            }
        }
        else p.remove();
    });
};

drawing.getPx = function(s, styleAttr) {
    // helper to pull out a px value from a style that may contain px units
    // s is a d3 selection (will pull from the first one)
    return Number(s.style(styleAttr).replace(/px$/, ''));
};

drawing.crispRound = function(td, lineWidth, dflt) {
    // for lines that disable antialiasing we want to
    // make sure the width is an integer, and at least 1 if it's nonzero

    if(!lineWidth || !isNumeric(lineWidth)) return dflt || 0;

    // but not for static plots - these don't get antialiased anyway.
    if(td._context.staticPlot) return lineWidth;

    if(lineWidth < 1) return 1;
    return Math.round(lineWidth);
};

drawing.lineGroupStyle = function(s, lw, lc, ld) {
    s.style('fill', 'none')
    .each(function(d) {
        var line = (((d || [])[0] || {}).trace || {}).line || {},
            lw1 = lw || line.width||0,
            dash = ld || line.dash || '';

        d3.select(this)
            .call(Color.stroke, lc || line.color)
            .call(drawing.dashLine, dash, lw1);
    });
};

drawing.dashLine = function(s, dash, lineWidth) {
    var dlw = Math.max(lineWidth, 3);

    if(dash === 'solid') dash = '';
    else if(dash === 'dot') dash = dlw + 'px,' + dlw + 'px';
    else if(dash === 'dash') dash = (3 * dlw) + 'px,' + (3 * dlw) + 'px';
    else if(dash === 'longdash') dash = (5 * dlw) + 'px,' + (5 * dlw) + 'px';
    else if(dash === 'dashdot') {
        dash = (3 * dlw) + 'px,' + dlw + 'px,' + dlw + 'px,' + dlw + 'px';
    }
    else if(dash === 'longdashdot') {
        dash = (5 * dlw) + 'px,' + (2 * dlw) + 'px,' + dlw + 'px,' + (2 * dlw) + 'px';
    }
    // otherwise user wrote the dasharray themselves - leave it be

    s.style({
        'stroke-dasharray': dash,
        'stroke-width': lineWidth + 'px'
    });
};

drawing.fillGroupStyle = function(s) {
    s.style('stroke-width', 0)
    .each(function(d) {
        var shape = d3.select(this);
        try {
            shape.call(Color.fill, d[0].trace.fillcolor);
        }
        catch(e) {
            Lib.error(e, s);
            shape.remove();
        }
    });
};

var SYMBOLDEFS = require('./symbol_defs');

drawing.symbolNames = [];
drawing.symbolFuncs = [];
drawing.symbolNeedLines = {};
drawing.symbolNoDot = {};
drawing.symbolList = [];

Object.keys(SYMBOLDEFS).forEach(function(k) {
    var symDef = SYMBOLDEFS[k];
    drawing.symbolList = drawing.symbolList.concat(
        [symDef.n, k, symDef.n + 100, k + '-open']);
    drawing.symbolNames[symDef.n] = k;
    drawing.symbolFuncs[symDef.n] = symDef.f;
    if(symDef.needLine) {
        drawing.symbolNeedLines[symDef.n] = true;
    }
    if(symDef.noDot) {
        drawing.symbolNoDot[symDef.n] = true;
    }
    else {
        drawing.symbolList = drawing.symbolList.concat(
            [symDef.n + 200, k + '-dot', symDef.n + 300, k + '-open-dot']);
    }
});
var MAXSYMBOL = drawing.symbolNames.length,
    // add a dot in the middle of the symbol
    DOTPATH = 'M0,0.5L0.5,0L0,-0.5L-0.5,0Z';

drawing.symbolNumber = function(v) {
    if(typeof v === 'string') {
        var vbase = 0;
        if(v.indexOf('-open') > 0) {
            vbase = 100;
            v = v.replace('-open', '');
        }
        if(v.indexOf('-dot') > 0) {
            vbase += 200;
            v = v.replace('-dot', '');
        }
        v = drawing.symbolNames.indexOf(v);
        if(v >= 0) { v += vbase; }
    }
    if((v % 100 >= MAXSYMBOL) || v >= 400) { return 0; }
    return Math.floor(Math.max(v, 0));
};

drawing.pointStyle = function(s, trace) {
    if(!s.size()) return;

    var marker = trace.marker,
        markerLine = marker.line;

    // only scatter & box plots get marker path and opacity
    // bars, histograms don't
    if(Plots.traceIs(trace, 'symbols')) {
        var sizeFn = makeBubbleSizeFn(trace);

        s.attr('d', function(d) {
            var r;

            // handle multi-trace graph edit case
            if(d.ms === 'various' || marker.size === 'various') r = 3;
            else r = subTypes.isBubble(trace) ?
                        sizeFn(d.ms) : (marker.size || 6) / 2;

            // store the calculated size so hover can use it
            d.mrc = r;

            // turn the symbol into a sanitized number
            var x = drawing.symbolNumber(d.mx || marker.symbol) || 0,
                xBase = x % 100;

            // save if this marker is open
            // because that impacts how to handle colors
            d.om = x % 200 >= 100;

            return drawing.symbolFuncs[xBase](r) +
                (x >= 200 ? DOTPATH : '');
        })
        .style('opacity', function(d) {
            return (d.mo + 1 || marker.opacity + 1) - 1;
        });
    }
    // allow array marker and marker line colors to be
    // scaled by given max and min to colorscales
    var markerIn = (trace._input || {}).marker || {},
        markerScale = drawing.tryColorscale(marker, markerIn, ''),
        lineScale = drawing.tryColorscale(marker, markerIn, 'line.');

    s.each(function(d) {
        // 'so' is suspected outliers, for box plots
        var fillColor,
            lineColor,
            lineWidth;
        if(d.so) {
            lineWidth = markerLine.outlierwidth;
            lineColor = markerLine.outliercolor;
            fillColor = marker.outliercolor;
        }
        else {
            lineWidth = (d.mlw + 1 || markerLine.width + 1 ||
                // TODO: we need the latter for legends... can we get rid of it?
                (d.trace ? d.trace.marker.line.width : 0) + 1) - 1;

            if('mlc' in d) lineColor = d.mlcc = lineScale(d.mlc);
            // weird case: array wasn't long enough to apply to every point
            else if(Array.isArray(markerLine.color)) lineColor = Color.defaultLine;
            else lineColor = markerLine.color;

            if('mc' in d) fillColor = d.mcc = markerScale(d.mc);
            else if(Array.isArray(marker.color)) fillColor = Color.defaultLine;
            else fillColor = marker.color || 'rgba(0,0,0,0)';
        }

        var p = d3.select(this);
        if(d.om) {
            // open markers can't have zero linewidth, default to 1px,
            // and use fill color as stroke color
            p.call(Color.stroke, fillColor)
                .style({
                    'stroke-width': (lineWidth || 1) + 'px',
                    fill: 'none'
                });
        }
        else {
            p.style('stroke-width', lineWidth + 'px')
                .call(Color.fill, fillColor);
            if(lineWidth) {
                p.call(Color.stroke, lineColor);
            }
        }
    });
};

// for a given color attribute (ie m -> mc = marker.color) look to see if we
// have a colorscale for it (ie mscl, mcmin, mcmax) - if we do, translate
// all numeric color values according to that scale
drawing.tryColorscale = function(cont, contIn, prefix) {
    var colorArray = Lib.nestedProperty(cont, prefix + 'color').get(),
        scl = Lib.nestedProperty(cont, prefix + 'colorscale').get(),
        auto = Lib.nestedProperty(cont, prefix + 'cauto').get(),
        minProp = Lib.nestedProperty(cont, prefix + 'cmin'),
        maxProp = Lib.nestedProperty(cont, prefix + 'cmax'),
        min = minProp.get(),
        max = maxProp.get();

    // TODO handle this in Colorscale.calc
    if(scl && Array.isArray(colorArray)) {
        if(auto || !isNumeric(min) || !isNumeric(max)) {
            min = Infinity;
            max = -Infinity;
            colorArray.forEach(function(color) {
                if(isNumeric(color)) {
                    if(min > color) min = +color;
                    if(max < color) max = +color;
                }
            });
            if(min > max) {
                min = 0;
                max = 1;
            }
            minProp.set(min);
            maxProp.set(max);
            Lib.nestedProperty(contIn, prefix + 'cmin').set(min);
            Lib.nestedProperty(contIn, prefix + 'cmax').set(max);
        }
        return Colorscale.makeScaleFunction(scl, min, max);
    }
    else return Lib.identity;
};

// draw text at points
var TEXTOFFSETSIGN = {start: 1, end: -1, middle: 0, bottom: 1, top: -1},
    LINEEXPAND = 1.3;
drawing.textPointStyle = function(s, trace) {
    s.each(function(d) {
        var p = d3.select(this),
            text = d.tx || trace.text;
        if(!text || Array.isArray(text)) {
            // isArray test handles the case of (intentionally) missing
            // or empty text within a text array
            p.remove();
            return;
        }

        var pos = d.tp || trace.textposition,
            v = pos.indexOf('top') !== -1 ? 'top' :
                pos.indexOf('bottom') !== -1 ? 'bottom' : 'middle',
            h = pos.indexOf('left') !== -1 ? 'end' :
                pos.indexOf('right') !== -1 ? 'start' : 'middle',
            fontSize = d.ts || trace.textfont.size,
            // if markers are shown, offset a little more than
            // the nominal marker size
            // ie 2/1.6 * nominal, bcs some markers are a bit bigger
            r = d.mrc ? (d.mrc / 0.8 + 1) : 0;

        fontSize = (isNumeric(fontSize) && fontSize > 0) ? fontSize : 0;

        p.call(drawing.font,
                d.tf || trace.textfont.family,
                fontSize,
                d.tc || trace.textfont.color)
            .attr('text-anchor', h)
            .text(text)
            .call(svgTextUtils.convertToTspans);
        var pgroup = d3.select(this.parentNode),
            tspans = p.selectAll('tspan.line'),
            numLines = ((tspans[0].length || 1) - 1) * LINEEXPAND + 1,
            dx = TEXTOFFSETSIGN[h] * r,
            dy = fontSize * 0.75 + TEXTOFFSETSIGN[v] * r +
                (TEXTOFFSETSIGN[v] - 1) * numLines * fontSize / 2;

        // fix the overall text group position
        pgroup.attr('transform', 'translate(' + dx + ',' + dy + ')');

        // then fix multiline text
        if(numLines > 1) {
            tspans.attr({ x: p.attr('x'), y: p.attr('y') });
        }
    });
};

// generalized Catmull-Rom splines, per
// http://www.cemyuksel.com/research/catmullrom_param/catmullrom.pdf
var CatmullRomExp = 0.5;
drawing.smoothopen = function(pts, smoothness) {
    if(pts.length < 3) { return 'M' + pts.join('L');}
    var path = 'M' + pts[0],
        tangents = [], i;
    for(i = 1; i < pts.length - 1; i++) {
        tangents.push(makeTangent(pts[i - 1], pts[i], pts[i + 1], smoothness));
    }
    path += 'Q' + tangents[0][0] + ' ' + pts[1];
    for(i = 2; i < pts.length - 1; i++) {
        path += 'C' + tangents[i - 2][1] + ' ' + tangents[i - 1][0] + ' ' + pts[i];
    }
    path += 'Q' + tangents[pts.length - 3][1] + ' ' + pts[pts.length - 1];
    return path;
};

drawing.smoothclosed = function(pts, smoothness) {
    if(pts.length < 3) { return 'M' + pts.join('L') + 'Z'; }
    var path = 'M' + pts[0],
        pLast = pts.length - 1,
        tangents = [makeTangent(pts[pLast],
                        pts[0], pts[1], smoothness)],
        i;
    for(i = 1; i < pLast; i++) {
        tangents.push(makeTangent(pts[i - 1], pts[i], pts[i + 1], smoothness));
    }
    tangents.push(
        makeTangent(pts[pLast - 1], pts[pLast], pts[0], smoothness)
    );

    for(i = 1; i <= pLast; i++) {
        path += 'C' + tangents[i - 1][1] + ' ' + tangents[i][0] + ' ' + pts[i];
    }
    path += 'C' + tangents[pLast][1] + ' ' + tangents[0][0] + ' ' + pts[0] + 'Z';
    return path;
};

function makeTangent(prevpt, thispt, nextpt, smoothness) {
    var d1x = prevpt[0] - thispt[0],
        d1y = prevpt[1] - thispt[1],
        d2x = nextpt[0] - thispt[0],
        d2y = nextpt[1] - thispt[1],
        d1a = Math.pow(d1x * d1x + d1y * d1y, CatmullRomExp / 2),
        d2a = Math.pow(d2x * d2x + d2y * d2y, CatmullRomExp / 2),
        numx = (d2a * d2a * d1x - d1a * d1a * d2x) * smoothness,
        numy = (d2a * d2a * d1y - d1a * d1a * d2y) * smoothness,
        denom1 = 3 * d2a * (d1a + d2a),
        denom2 = 3 * d1a * (d1a + d2a);
    return [
        [
            d3.round(thispt[0] + (denom1 && numx / denom1), 2),
            d3.round(thispt[1] + (denom1 && numy / denom1), 2)
        ], [
            d3.round(thispt[0] - (denom2 && numx / denom2), 2),
            d3.round(thispt[1] - (denom2 && numy / denom2), 2)
        ]
    ];
}

// step paths - returns a generator function for paths
// with the given step shape
var STEPPATH = {
    hv: function(p0, p1) {
        return 'H' + d3.round(p1[0], 2) + 'V' + d3.round(p1[1], 2);
    },
    vh: function(p0, p1) {
        return 'V' + d3.round(p1[1], 2) + 'H' + d3.round(p1[0], 2);
    },
    hvh: function(p0, p1) {
        return 'H' + d3.round((p0[0] + p1[0]) / 2, 2) + 'V' +
            d3.round(p1[1], 2) + 'H' + d3.round(p1[0], 2);
    },
    vhv: function(p0, p1) {
        return 'V' + d3.round((p0[1] + p1[1]) / 2, 2) + 'H' +
            d3.round(p1[0], 2) + 'V' + d3.round(p1[1], 2);
    }
};
var STEPLINEAR = function(p0, p1) {
    return 'L' + d3.round(p1[0], 2) + ',' + d3.round(p1[1], 2);
};
drawing.steps = function(shape) {
    var onestep = STEPPATH[shape] || STEPLINEAR;
    return function(pts) {
        var path = 'M' + d3.round(pts[0][0], 2) + ',' + d3.round(pts[0][1], 2);
        for(var i = 1; i < pts.length; i++) {
            path += onestep(pts[i - 1], pts[i]);
        }
        return path;
    };
};

// off-screen svg render testing element, shared by the whole page
// uses the id 'js-plotly-tester' and stores it in gd._tester
// makes a hash of cached text items in tester.node()._cache
// so we can add references to rendered text (including all info
// needed to fully determine its bounding rect)
drawing.makeTester = function(gd) {
    var tester = d3.select('body')
        .selectAll('#js-plotly-tester')
        .data([0]);

    tester.enter().append('svg')
        .attr('id', 'js-plotly-tester')
        .attr(xmlnsNamespaces.svgAttrs)
        .style({
            position: 'absolute',
            left: '-10000px',
            top: '-10000px',
            width: '9000px',
            height: '9000px',
            'z-index': '1'
        });

    // browsers differ on how they describe the bounding rect of
    // the svg if its contents spill over... so make a 1x1px
    // reference point we can measure off of.
    var testref = tester.selectAll('.js-reference-point').data([0]);
    testref.enter().append('path')
        .classed('js-reference-point', true)
        .attr('d', 'M0,0H1V1H0Z')
        .style({
            'stroke-width': 0,
            fill: 'black'
        });

    if(!tester.node()._cache) {
        tester.node()._cache = {};
    }

    gd._tester = tester;
    gd._testref = testref;
};

// use our offscreen tester to get a clientRect for an element,
// in a reference frame where it isn't translated and its anchor
// point is at (0,0)
// always returns a copy of the bbox, so the caller can modify it safely
var savedBBoxes = [],
    maxSavedBBoxes = 10000;
drawing.bBox = function(node) {
    // cache elements we've already measured so we don't have to
    // remeasure the same thing many times
    var saveNum = node.attributes['data-bb'];
    if(saveNum && saveNum.value) {
        return Lib.extendFlat({}, savedBBoxes[saveNum.value]);
    }

    var test3 = d3.select('#js-plotly-tester'),
        tester = test3.node();

    // copy the node to test into the tester
    var testNode = node.cloneNode(true);
    tester.appendChild(testNode);
    // standardize its position... do we really want to do this?
    d3.select(testNode).attr({
        x: 0,
        y: 0,
        transform: ''
    });

    var testRect = testNode.getBoundingClientRect(),
        refRect = test3.select('.js-reference-point')
            .node().getBoundingClientRect();

    tester.removeChild(testNode);

    var bb = {
        height: testRect.height,
        width: testRect.width,
        left: testRect.left - refRect.left,
        top: testRect.top - refRect.top,
        right: testRect.right - refRect.left,
        bottom: testRect.bottom - refRect.top
    };

    // make sure we don't have too many saved boxes,
    // or a long session could overload on memory
    // by saving boxes for long-gone elements
    if(savedBBoxes.length >= maxSavedBBoxes) {
        d3.selectAll('[data-bb]').attr('data-bb', null);
        savedBBoxes = [];
    }

    // cache this bbox
    node.setAttribute('data-bb', savedBBoxes.length);
    savedBBoxes.push(bb);

    return Lib.extendFlat({}, bb);
};

/*
 * make a robust clipPath url from a local id
 * note! We'd better not be exporting from a page
 * with a <base> or the svg will not be portable!
 */
drawing.setClipUrl = function(s, localId) {
    if(!localId) {
        s.attr('clip-path', null);
        return;
    }

    var url = '#' + localId,
        base = d3.select('base');

    if(base.size() && base.attr('href')) url = window.location.href + url;
    s.attr('clip-path', 'url(' + url + ')');
};
