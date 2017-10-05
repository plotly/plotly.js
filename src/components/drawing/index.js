/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var isNumeric = require('fast-isnumeric');
var tinycolor = require('tinycolor2');

var Registry = require('../../registry');
var Color = require('../color');
var Colorscale = require('../colorscale');
var Lib = require('../../lib');
var svgTextUtils = require('../../lib/svg_text_utils');

var xmlnsNamespaces = require('../../constants/xmlns_namespaces');
var alignment = require('../../constants/alignment');
var LINE_SPACING = alignment.LINE_SPACING;

var subTypes = require('../../traces/scatter/subtypes');
var makeBubbleSizeFn = require('../../traces/scatter/make_bubble_size_func');

var drawing = module.exports = {};

// -----------------------------------------------------
// styling functions for plot elements
// -----------------------------------------------------

drawing.font = function(s, family, size, color) {
    // also allow the form font(s, {family, size, color})
    if(Lib.isPlainObject(family)) {
        color = family.color;
        size = family.size;
        family = family.family;
    }
    if(family) s.style('font-family', family);
    if(size + 1) s.style('font-size', size + 'px');
    if(color) s.call(Color.fill, color);
};

/*
 * Positioning helpers
 * Note: do not use `setPosition` with <text> nodes modified by
 * `svgTextUtils.convertToTspans`. Use `svgTextUtils.positionText`
 * instead, so that <tspan.line> elements get updated to match.
 */
drawing.setPosition = function(s, x, y) { s.attr('x', x).attr('y', y); };
drawing.setSize = function(s, w, h) { s.attr('width', w).attr('height', h); };
drawing.setRect = function(s, x, y, w, h) {
    s.call(drawing.setPosition, x, y).call(drawing.setSize, w, h);
};

/** Translate node
 *
 * @param {object} d : calcdata point item
 * @param {sel} sel : d3 selction of node to translate
 * @param {object} xa : corresponding full xaxis object
 * @param {object} ya : corresponding full yaxis object
 *
 * @return {boolean} :
 *  true if selection got translated
 *  false if selection could not get translated
 */
drawing.translatePoint = function(d, sel, xa, ya) {
    var x = xa.c2p(d.x);
    var y = ya.c2p(d.y);

    if(isNumeric(x) && isNumeric(y) && sel.node()) {
        // for multiline text this works better
        if(sel.node().nodeName === 'text') {
            sel.attr('x', x).attr('y', y);
        } else {
            sel.attr('transform', 'translate(' + x + ',' + y + ')');
        }
    } else {
        return false;
    }

    return true;
};

drawing.translatePoints = function(s, xa, ya) {
    s.each(function(d) {
        var sel = d3.select(this);
        drawing.translatePoint(d, sel, xa, ya);
    });
};

drawing.hideOutsideRangePoint = function(d, sel, xa, ya) {
    sel.attr(
        'display',
        xa.isPtWithinRange(d) && ya.isPtWithinRange(d) ? null : 'none'
    );
};

drawing.hideOutsideRangePoints = function(points, subplot) {
    if(!subplot._hasClipOnAxisFalse) return;

    var xa = subplot.xaxis;
    var ya = subplot.yaxis;

    points.each(function(d) {
        drawing.hideOutsideRangePoint(d, d3.select(this), xa, ya);
    });
};

drawing.crispRound = function(gd, lineWidth, dflt) {
    // for lines that disable antialiasing we want to
    // make sure the width is an integer, and at least 1 if it's nonzero

    if(!lineWidth || !isNumeric(lineWidth)) return dflt || 0;

    // but not for static plots - these don't get antialiased anyway.
    if(gd._context.staticPlot) return lineWidth;

    if(lineWidth < 1) return 1;
    return Math.round(lineWidth);
};

drawing.singleLineStyle = function(d, s, lw, lc, ld) {
    s.style('fill', 'none');
    var line = (((d || [])[0] || {}).trace || {}).line || {},
        lw1 = lw || line.width||0,
        dash = ld || line.dash || '';

    Color.stroke(s, lc || line.color);
    drawing.dashLine(s, dash, lw1);
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
    lineWidth = +lineWidth || 0;

    dash = drawing.dashStyle(dash, lineWidth);

    s.style({
        'stroke-dasharray': dash,
        'stroke-width': lineWidth + 'px'
    });
};

drawing.dashStyle = function(dash, lineWidth) {
    lineWidth = +lineWidth || 1;
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

    return dash;
};

// Same as fillGroupStyle, except in this case the selection may be a transition
drawing.singleFillStyle = function(sel) {
    var node = d3.select(sel.node());
    var data = node.data();
    var fillcolor = (((data[0] || [])[0] || {}).trace || {}).fillcolor;
    if(fillcolor) {
        sel.call(Color.fill, fillcolor);
    }
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

function singlePointStyle(d, sel, trace, markerScale, lineScale, marker, markerLine, gd) {
    // only scatter & box plots get marker path and opacity
    // bars, histograms don't
    if(Registry.traceIs(trace, 'symbols')) {
        var sizeFn = makeBubbleSizeFn(trace);

        sel.attr('d', function(d) {
            var r;

            // handle multi-trace graph edit case
            if(d.ms === 'various' || marker.size === 'various') r = 3;
            else {
                r = subTypes.isBubble(trace) ?
                        sizeFn(d.ms) : (marker.size || 6) / 2;
            }

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

    var perPointGradient = false;

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

        if(Array.isArray(marker.color)) {
            fillColor = Color.defaultLine;
            perPointGradient = true;
        }

        if('mc' in d) fillColor = d.mcc = markerScale(d.mc);
        else fillColor = marker.color || 'rgba(0,0,0,0)';
    }

    if(d.om) {
        // open markers can't have zero linewidth, default to 1px,
        // and use fill color as stroke color
        sel.call(Color.stroke, fillColor)
            .style({
                'stroke-width': (lineWidth || 1) + 'px',
                fill: 'none'
            });
    }
    else {
        sel.style('stroke-width', lineWidth + 'px');

        var markerGradient = marker.gradient;

        var gradientType = d.mgt;
        if(gradientType) perPointGradient = true;
        else gradientType = markerGradient && markerGradient.type;

        if(gradientType && gradientType !== 'none') {
            var gradientColor = d.mgc;
            if(gradientColor) perPointGradient = true;
            else gradientColor = markerGradient.color;

            var gradientID = 'g' + gd._fullLayout._uid + '-' + trace.uid;
            if(perPointGradient) gradientID += '-' + d.i;

            sel.call(drawing.gradient, gd, gradientID, gradientType, fillColor, gradientColor);
        }
        else {
            sel.call(Color.fill, fillColor);
        }

        if(lineWidth) {
            sel.call(Color.stroke, lineColor);
        }
    }
}

var HORZGRADIENT = {x1: 1, x2: 0, y1: 0, y2: 0};
var VERTGRADIENT = {x1: 0, x2: 0, y1: 1, y2: 0};

drawing.gradient = function(sel, gd, gradientID, type, color1, color2) {
    var gradient = gd._fullLayout._defs.select('.gradients')
        .selectAll('#' + gradientID)
        .data([type + color1 + color2], Lib.identity);

    gradient.exit().remove();

    gradient.enter()
        .append(type === 'radial' ? 'radialGradient' : 'linearGradient')
        .each(function() {
            var el = d3.select(this);
            if(type === 'horizontal') el.attr(HORZGRADIENT);
            else if(type === 'vertical') el.attr(VERTGRADIENT);

            el.attr('id', gradientID);

            var tc1 = tinycolor(color1);
            var tc2 = tinycolor(color2);

            el.append('stop').attr({
                offset: '0%',
                'stop-color': Color.tinyRGB(tc2),
                'stop-opacity': tc2.getAlpha()
            });

            el.append('stop').attr({
                offset: '100%',
                'stop-color': Color.tinyRGB(tc1),
                'stop-opacity': tc1.getAlpha()
            });
        });

    sel.style({
        fill: 'url(#' + gradientID + ')',
        'fill-opacity': null
    });
};

/*
 * Make the gradients container and clear out any previous gradients.
 * We never collect all the gradients we need in one place,
 * so we can't ever remove gradients that have stopped being useful,
 * except all at once before a full redraw.
 * The upside of this is arbitrary points can share gradient defs
 */
drawing.initGradients = function(gd) {
    var gradientsGroup = gd._fullLayout._defs.selectAll('.gradients').data([0]);
    gradientsGroup.enter().append('g').classed('gradients', true);

    gradientsGroup.selectAll('linearGradient,radialGradient').remove();
};

drawing.singlePointStyle = function(d, sel, trace, markerScale, lineScale, gd) {
    var marker = trace.marker;

    singlePointStyle(d, sel, trace, markerScale, lineScale, marker, marker.line, gd);

};

drawing.pointStyle = function(s, trace, gd) {
    if(!s.size()) return;

    // allow array marker and marker line colors to be
    // scaled by given max and min to colorscales
    var marker = trace.marker;
    var markerScale = drawing.tryColorscale(marker, '');
    var lineScale = drawing.tryColorscale(marker, 'line');

    s.each(function(d) {
        drawing.singlePointStyle(d, d3.select(this), trace, markerScale, lineScale, gd);
    });
};

drawing.tryColorscale = function(marker, prefix) {
    var cont = prefix ? Lib.nestedProperty(marker, prefix).get() : marker,
        scl = cont.colorscale,
        colorArray = cont.color;

    if(scl && Array.isArray(colorArray)) {
        return Colorscale.makeColorScaleFunc(
            Colorscale.extractScale(scl, cont.cmin, cont.cmax)
        );
    }
    else return Lib.identity;
};

// draw text at points
var TEXTOFFSETSIGN = {start: 1, end: -1, middle: 0, bottom: 1, top: -1};
drawing.textPointStyle = function(s, trace, gd) {
    s.each(function(d) {
        var p = d3.select(this);
        var text = Lib.extractOption(d, trace, 'tx', 'text');

        if(!text) {
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
            .call(svgTextUtils.convertToTspans, gd);

        var pgroup = d3.select(this.parentNode);
        var numLines = (svgTextUtils.lineCount(p) - 1) * LINE_SPACING + 1;
        var dx = TEXTOFFSETSIGN[h] * r;
        var dy = fontSize * 0.75 + TEXTOFFSETSIGN[v] * r +
                (TEXTOFFSETSIGN[v] - 1) * numLines * fontSize / 2;

        // fix the overall text group position
        pgroup.attr('transform', 'translate(' + dx + ',' + dy + ')');
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
// uses the id 'js-plotly-tester' and stores it in drawing.tester
drawing.makeTester = function() {
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

    drawing.tester = tester;
    drawing.testref = testref;
};

/*
 * use our offscreen tester to get a clientRect for an element,
 * in a reference frame where it isn't translated (or transformed) and
 * its anchor point is at (0,0)
 * always returns a copy of the bbox, so the caller can modify it safely
 *
 * @param {SVGElement} node: the element to measure. If possible this should be
 *   a <text> or MathJax <g> element that's already passed through
 *   `convertToTspans` because in that case we can cache the results, but it's
 *   possible to pass in any svg element.
 *
 * @param {boolean} inTester: is this element already in `drawing.tester`?
 *   If you are measuring a dummy element, rather than one you really intend
 *   to use on the plot, making it in `drawing.tester` in the first place
 *   allows us to test faster because it cuts out cloning and appending it.
 *
 * @param {string} hash: for internal use only, if we already know the cache key
 *   for this element beforehand.
 *
 * @return {object}: a plain object containing the width, height, left, right,
 *   top, and bottom of `node`
 */
drawing.savedBBoxes = {};
var savedBBoxesCount = 0;
var maxSavedBBoxes = 10000;

drawing.bBox = function(node, inTester, hash) {
    /*
     * Cache elements we've already measured so we don't have to
     * remeasure the same thing many times
     * We have a few bBox callers though who pass a node larger than
     * a <text> or a MathJax <g>, such as an axis group containing many labels.
     * These will not generate a hash (unless we figure out an appropriate
     * hash key for them) and thus we will not hash them.
     */
    if(!hash) hash = nodeHash(node);
    var out;
    if(hash) {
        out = drawing.savedBBoxes[hash];
        if(out) return Lib.extendFlat({}, out);
    }
    else if(node.childNodes.length === 1) {
        /*
         * If we have only one child element, which is itself hashable, make
         * a new hash from this element plus its x,y,transform
         * These bounding boxes *include* x,y,transform - mostly for use by
         * callers trying to avoid overlaps (ie titles)
         */
        var innerNode = node.childNodes[0];

        hash = nodeHash(innerNode);
        if(hash) {
            var x = +innerNode.getAttribute('x') || 0;
            var y = +innerNode.getAttribute('y') || 0;
            var transform = innerNode.getAttribute('transform');

            if(!transform) {
                // in this case, just varying x and y, don't bother caching
                // the final bBox because the alteration is quick.
                var innerBB = drawing.bBox(innerNode, false, hash);
                if(x) {
                    innerBB.left += x;
                    innerBB.right += x;
                }
                if(y) {
                    innerBB.top += y;
                    innerBB.bottom += y;
                }
                return innerBB;
            }
            /*
             * else we have a transform - rather than make a complicated
             * (and error-prone and probably slow) transform parser/calculator,
             * just continue on calculating the boundingClientRect of the group
             * and use the new composite hash to cache it.
             * That said, `innerNode.transform.baseVal` is an array of
             * `SVGTransform` objects, that *do* seem to have a nice matrix
             * multiplication interface that we could use to avoid making
             * another getBoundingClientRect call...
             */
            hash += '~' + x + '~' + y + '~' + transform;

            out = drawing.savedBBoxes[hash];
            if(out) return Lib.extendFlat({}, out);
        }
    }
    var testNode, tester;
    if(inTester) {
        testNode = node;
    }
    else {
        tester = drawing.tester.node();

        // copy the node to test into the tester
        testNode = node.cloneNode(true);
        tester.appendChild(testNode);
    }

    // standardize its position (and newline tspans if any)
    d3.select(testNode)
        .attr('transform', null)
        .call(svgTextUtils.positionText, 0, 0);

    var testRect = testNode.getBoundingClientRect();
    var refRect = drawing.testref
        .node()
        .getBoundingClientRect();

    if(!inTester) tester.removeChild(testNode);

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
    if(savedBBoxesCount >= maxSavedBBoxes) {
        drawing.savedBBoxes = {};
        savedBBoxesCount = 0;
    }

    // cache this bbox
    if(hash) drawing.savedBBoxes[hash] = bb;
    savedBBoxesCount++;

    return Lib.extendFlat({}, bb);
};

// capture everything about a node (at least in our usage) that
// impacts its bounding box, given that bBox clears x, y, and transform
function nodeHash(node) {
    var inputText = node.getAttribute('data-unformatted');
    if(inputText === null) return;
    return inputText +
        node.getAttribute('data-math') +
        node.getAttribute('text-anchor') +
        node.getAttribute('style');
}

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

    // add id to location href w/o hashes if any)
    if(base.size() && base.attr('href')) {
        url = window.location.href.split('#')[0] + url;
    }

    s.attr('clip-path', 'url(' + url + ')');
};

drawing.getTranslate = function(element) {
    // Note the separator [^\d] between x and y in this regex
    // We generally use ',' but IE will convert it to ' '
    var re = /.*\btranslate\((-?\d*\.?\d*)[^-\d]*(-?\d*\.?\d*)[^\d].*/,
        getter = element.attr ? 'attr' : 'getAttribute',
        transform = element[getter]('transform') || '';

    var translate = transform.replace(re, function(match, p1, p2) {
        return [p1, p2].join(' ');
    })
    .split(' ');

    return {
        x: +translate[0] || 0,
        y: +translate[1] || 0
    };
};

drawing.setTranslate = function(element, x, y) {

    var re = /(\btranslate\(.*?\);?)/,
        getter = element.attr ? 'attr' : 'getAttribute',
        setter = element.attr ? 'attr' : 'setAttribute',
        transform = element[getter]('transform') || '';

    x = x || 0;
    y = y || 0;

    transform = transform.replace(re, '').trim();
    transform += ' translate(' + x + ', ' + y + ')';
    transform = transform.trim();

    element[setter]('transform', transform);

    return transform;
};

drawing.getScale = function(element) {

    var re = /.*\bscale\((\d*\.?\d*)[^\d]*(\d*\.?\d*)[^\d].*/,
        getter = element.attr ? 'attr' : 'getAttribute',
        transform = element[getter]('transform') || '';

    var translate = transform.replace(re, function(match, p1, p2) {
        return [p1, p2].join(' ');
    })
    .split(' ');

    return {
        x: +translate[0] || 1,
        y: +translate[1] || 1
    };
};

drawing.setScale = function(element, x, y) {

    var re = /(\bscale\(.*?\);?)/,
        getter = element.attr ? 'attr' : 'getAttribute',
        setter = element.attr ? 'attr' : 'setAttribute',
        transform = element[getter]('transform') || '';

    x = x || 1;
    y = y || 1;

    transform = transform.replace(re, '').trim();
    transform += ' scale(' + x + ', ' + y + ')';
    transform = transform.trim();

    element[setter]('transform', transform);

    return transform;
};

drawing.setPointGroupScale = function(selection, x, y) {
    var t, scale, re;

    x = x || 1;
    y = y || 1;

    if(x === 1 && y === 1) {
        scale = '';
    } else {
        // The same scale transform for every point:
        scale = ' scale(' + x + ',' + y + ')';
    }

    // A regex to strip any existing scale:
    re = /\s*sc.*/;

    selection.each(function() {
        // Get the transform:
        t = (this.getAttribute('transform') || '').replace(re, '');
        t += scale;
        t = t.trim();

        // Append the scale transform
        this.setAttribute('transform', t);
    });

    return scale;
};

var TEXT_POINT_LAST_TRANSLATION_RE = /translate\([^)]*\)\s*$/;

drawing.setTextPointsScale = function(selection, xScale, yScale) {
    selection.each(function() {
        var transforms;
        var el = d3.select(this);
        var text = el.select('text');

        if(!text.node()) return;

        var x = parseFloat(text.attr('x') || 0);
        var y = parseFloat(text.attr('y') || 0);

        var existingTransform = (el.attr('transform') || '').match(TEXT_POINT_LAST_TRANSLATION_RE);

        if(xScale === 1 && yScale === 1) {
            transforms = [];
        } else {
            transforms = [
                'translate(' + x + ',' + y + ')',
                'scale(' + xScale + ',' + yScale + ')',
                'translate(' + (-x) + ',' + (-y) + ')',
            ];
        }

        if(existingTransform) {
            transforms.push(existingTransform);
        }

        el.attr('transform', transforms.join(' '));
    });
};
