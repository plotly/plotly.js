'use strict';

var d3 = require('@plotly/d3');
var Lib = require('../../lib');
var numberFormat = Lib.numberFormat;
var isNumeric = require('fast-isnumeric');
var tinycolor = require('tinycolor2');

var Registry = require('../../registry');
var Color = require('../color');
var Colorscale = require('../colorscale');
var strTranslate = Lib.strTranslate;
var svgTextUtils = require('../../lib/svg_text_utils');

var xmlnsNamespaces = require('../../constants/xmlns_namespaces');
var alignment = require('../../constants/alignment');
var LINE_SPACING = alignment.LINE_SPACING;
var DESELECTDIM = require('../../constants/interactions').DESELECTDIM;

var subTypes = require('../../traces/scatter/subtypes');
var makeBubbleSizeFn = require('../../traces/scatter/make_bubble_size_func');
var appendArrayPointValue = require('../../components/fx/helpers').appendArrayPointValue;

var drawing = module.exports = {};

// -----------------------------------------------------
// styling functions for plot elements
// -----------------------------------------------------

drawing.font = function(s, font) {
    var variant = font.variant;
    var style = font.style;
    var weight = font.weight;
    var color = font.color;
    var size = font.size;
    var family = font.family;
    var shadow = font.shadow;
    var lineposition = font.lineposition;
    var textcase = font.textcase;

    if(family) s.style('font-family', family);
    if(size + 1) s.style('font-size', size + 'px');
    if(color) s.call(Color.fill, color);

    if(weight) s.style('font-weight', weight);
    if(style) s.style('font-style', style);
    if(variant) s.style('font-variant', variant);

    if(textcase) s.style('text-transform', dropNone(textcase2transform(textcase)));
    if(shadow) s.style('text-shadow', shadow === 'auto' ? svgTextUtils.makeTextShadow(Color.contrast(color)) : dropNone(shadow));
    if(lineposition) s.style('text-decoration-line', dropNone(lineposition2decorationLine(lineposition)));
};

function dropNone(a) {
    return a === 'none' ? undefined : a;
}

var textcase2transformOptions = {
    normal: 'none',
    lower: 'lowercase',
    upper: 'uppercase',
    'word caps': 'capitalize'
};

function textcase2transform(textcase) {
    return textcase2transformOptions[textcase];
}

function lineposition2decorationLine(lineposition) {
    return (
        lineposition
            .replace('under', 'underline')
            .replace('over', 'overline')
            .replace('through', 'line-through')
            .split('+')
            .join(' ')
    );
}

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
            sel.attr('transform', strTranslate(x, y));
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

drawing.hideOutsideRangePoint = function(d, sel, xa, ya, xcalendar, ycalendar) {
    sel.attr(
        'display',
        (xa.isPtWithinRange(d, xcalendar) && ya.isPtWithinRange(d, ycalendar)) ? null : 'none'
    );
};

drawing.hideOutsideRangePoints = function(traceGroups, subplot) {
    if(!subplot._hasClipOnAxisFalse) return;

    var xa = subplot.xaxis;
    var ya = subplot.yaxis;

    traceGroups.each(function(d) {
        var trace = d[0].trace;
        var xcalendar = trace.xcalendar;
        var ycalendar = trace.ycalendar;
        var selector = Registry.traceIs(trace, 'bar-like') ? '.bartext' : '.point,.textpoint';

        traceGroups.selectAll(selector).each(function(d) {
            drawing.hideOutsideRangePoint(d, d3.select(this), xa, ya, xcalendar, ycalendar);
        });
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
    var line = (((d || [])[0] || {}).trace || {}).line || {};
    var lw1 = lw || line.width || 0;
    var dash = ld || line.dash || '';

    Color.stroke(s, lc || line.color);
    drawing.dashLine(s, dash, lw1);
};

drawing.lineGroupStyle = function(s, lw, lc, ld) {
    s.style('fill', 'none')
    .each(function(d) {
        var line = (((d || [])[0] || {}).trace || {}).line || {};
        var lw1 = lw || line.width || 0;
        var dash = ld || line.dash || '';

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
    } else if(dash === 'longdashdot') {
        dash = (5 * dlw) + 'px,' + (2 * dlw) + 'px,' + dlw + 'px,' + (2 * dlw) + 'px';
    }
    // otherwise user wrote the dasharray themselves - leave it be

    return dash;
};

function setFillStyle(sel, trace, gd, forLegend) {
    var markerPattern = trace.fillpattern;
    var fillgradient = trace.fillgradient;
    var pAttr = drawing.getPatternAttr;
    var patternShape = markerPattern && (pAttr(markerPattern.shape, 0, '') || pAttr(markerPattern.path, 0, ''));
    if(patternShape) {
        var patternBGColor = pAttr(markerPattern.bgcolor, 0, null);
        var patternFGColor = pAttr(markerPattern.fgcolor, 0, null);
        var patternFGOpacity = markerPattern.fgopacity;
        var patternSize = pAttr(markerPattern.size, 0, 8);
        var patternSolidity = pAttr(markerPattern.solidity, 0, 0.3);
        var patternID = trace.uid;
        drawing.pattern(sel, 'point', gd, patternID,
            patternShape, patternSize, patternSolidity,
            undefined, markerPattern.fillmode,
            patternBGColor, patternFGColor, patternFGOpacity
        );
    } else if(fillgradient && fillgradient.type !== 'none') {
        var direction = fillgradient.type;
        var gradientID = 'scatterfill-' + trace.uid;
        if(forLegend) {
            gradientID = 'legendfill-' + trace.uid;
        }

        if(!forLegend && (fillgradient.start !== undefined || fillgradient.stop !== undefined)) {
            var start, stop;
            if(direction === 'horizontal') {
                start = {
                    x: fillgradient.start,
                    y: 0,
                };
                stop = {
                    x: fillgradient.stop,
                    y: 0,
                };
            } else if(direction === 'vertical') {
                start = {
                    x: 0,
                    y: fillgradient.start,
                };
                stop = {
                    x: 0,
                    y: fillgradient.stop,
                };
            }

            start.x = trace._xA.c2p(
                (start.x === undefined) ? trace._extremes.x.min[0].val : start.x, true
            );
            start.y = trace._yA.c2p(
                (start.y === undefined) ? trace._extremes.y.min[0].val : start.y, true
            );

            stop.x = trace._xA.c2p(
                (stop.x === undefined) ? trace._extremes.x.max[0].val : stop.x, true
            );
            stop.y = trace._yA.c2p(
                (stop.y === undefined) ? trace._extremes.y.max[0].val : stop.y, true
            );
            sel.call(gradientWithBounds, gd, gradientID, 'linear', fillgradient.colorscale, 'fill', start, stop, true, false);
        } else {
            if(direction === 'horizontal') {
                direction = direction + 'reversed';
            }
            sel.call(drawing.gradient, gd, gradientID, direction, fillgradient.colorscale, 'fill');
        }
    } else if(trace.fillcolor) {
        sel.call(Color.fill, trace.fillcolor);
    }
}

// Same as fillGroupStyle, except in this case the selection may be a transition
drawing.singleFillStyle = function(sel, gd) {
    var node = d3.select(sel.node());
    var data = node.data();
    var trace = ((data[0] || [])[0] || {}).trace || {};
    setFillStyle(sel, trace, gd, false);
};

drawing.fillGroupStyle = function(s, gd, forLegend) {
    s.style('stroke-width', 0)
    .each(function(d) {
        var shape = d3.select(this);
        // N.B. 'd' won't be a calcdata item when
        // fill !== 'none' on a segment-less and marker-less trace
        if(d[0].trace) {
            setFillStyle(shape, d[0].trace, gd, forLegend);
        }
    });
};

var SYMBOLDEFS = require('./symbol_defs');

drawing.symbolNames = [];
drawing.symbolFuncs = [];
drawing.symbolBackOffs = [];
drawing.symbolNeedLines = {};
drawing.symbolNoDot = {};
drawing.symbolNoFill = {};
drawing.symbolList = [];

Object.keys(SYMBOLDEFS).forEach(function(k) {
    var symDef = SYMBOLDEFS[k];
    var n = symDef.n;
    drawing.symbolList.push(
        n,
        String(n),
        k,

        n + 100,
        String(n + 100),
        k + '-open'
    );
    drawing.symbolNames[n] = k;
    drawing.symbolFuncs[n] = symDef.f;
    drawing.symbolBackOffs[n] = symDef.backoff || 0;

    if(symDef.needLine) {
        drawing.symbolNeedLines[n] = true;
    }
    if(symDef.noDot) {
        drawing.symbolNoDot[n] = true;
    } else {
        drawing.symbolList.push(
            n + 200,
            String(n + 200),
            k + '-dot',

            n + 300,
            String(n + 300),
            k + '-open-dot'
        );
    }
    if(symDef.noFill) {
        drawing.symbolNoFill[n] = true;
    }
});

var MAXSYMBOL = drawing.symbolNames.length;
// add a dot in the middle of the symbol
var DOTPATH = 'M0,0.5L0.5,0L0,-0.5L-0.5,0Z';

drawing.symbolNumber = function(v) {
    if(isNumeric(v)) {
        v = +v;
    } else if(typeof v === 'string') {
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

    return (v % 100 >= MAXSYMBOL || v >= 400) ?
        0 : Math.floor(Math.max(v, 0));
};

function makePointPath(symbolNumber, r, t, s) {
    var base = symbolNumber % 100;
    return drawing.symbolFuncs[base](r, t, s) + (symbolNumber >= 200 ? DOTPATH : '');
}

var stopFormatter = numberFormat('~f');
var gradientInfo = {
    radial: {type: 'radial'},
    radialreversed: {type: 'radial', reversed: true},
    horizontal: {type: 'linear', start: {x: 1, y: 0}, stop: {x: 0, y: 0}},
    horizontalreversed: {type: 'linear', start: {x: 1, y: 0}, stop: {x: 0, y: 0}, reversed: true},
    vertical: {type: 'linear', start: {x: 0, y: 1}, stop: {x: 0, y: 0}},
    verticalreversed: {type: 'linear', start: {x: 0, y: 1}, stop: {x: 0, y: 0}, reversed: true}
};

/**
 * gradient: create and apply a gradient fill
 *
 * @param {object} sel: d3 selection to apply this gradient to
 *     You can use `selection.call(Drawing.gradient, ...)`
 * @param {DOM element} gd: the graph div `sel` is part of
 * @param {string} gradientID: a unique (within this plot) identifier
 *     for this gradient, so that we don't create unnecessary definitions
 * @param {string} type: 'radial', 'horizontal', or 'vertical', optionally with
 *     'reversed' at the end. Normally radial goes center to edge,
 *     horizontal goes right to left, and vertical goes bottom to top
 * @param {array} colorscale: as in attribute values, [[fraction, color], ...]
 * @param {string} prop: the property to apply to, 'fill' or 'stroke'
 */
drawing.gradient = function(sel, gd, gradientID, type, colorscale, prop) {
    var info = gradientInfo[type];
    return gradientWithBounds(
        sel, gd, gradientID, info.type, colorscale, prop, info.start, info.stop, false, info.reversed
    );
};

/**
 * gradient_with_bounds: create and apply a gradient fill for defined start and stop positions
 *
 * @param {object} sel: d3 selection to apply this gradient to
 *     You can use `selection.call(Drawing.gradient, ...)`
 * @param {DOM element} gd: the graph div `sel` is part of
 * @param {string} gradientID: a unique (within this plot) identifier
 *     for this gradient, so that we don't create unnecessary definitions
 * @param {string} type: 'radial' or 'linear'. Radial goes center to edge,
 *     horizontal goes as defined by start and stop
 * @param {array} colorscale: as in attribute values, [[fraction, color], ...]
 * @param {string} prop: the property to apply to, 'fill' or 'stroke'
 * @param {object} start: start point for linear gradients, { x: number, y: number }.
 *     Ignored if type is 'radial'.
 * @param {object} stop: stop point for linear gradients, { x: number, y: number }.
 *     Ignored if type is 'radial'.
 * @param {boolean} inUserSpace: If true, start and stop give absolute values in the plot.
 *     If false, start and stop are fractions of the traces extent along each axis.
 * @param {boolean} reversed: If true, the gradient is reversed between normal start and stop,
 *     i.e., the colorscale is applied in order from stop to start for linear, from edge
 *     to center for radial gradients.
 */
function gradientWithBounds(sel, gd, gradientID, type, colorscale, prop, start, stop, inUserSpace, reversed) {
    var len = colorscale.length;

    var info;
    if(type === 'linear') {
        info = {
            node: 'linearGradient',
            attrs: {
                x1: start.x,
                y1: start.y,
                x2: stop.x,
                y2: stop.y,
                gradientUnits: inUserSpace ? 'userSpaceOnUse' : 'objectBoundingBox',
            },
            reversed: reversed,
        };
    } else if(type === 'radial') {
        info = {
            node: 'radialGradient',
            reversed: reversed,
        };
    }

    var colorStops = new Array(len);
    for(var i = 0; i < len; i++) {
        if(info.reversed) {
            colorStops[len - 1 - i] = [stopFormatter((1 - colorscale[i][0]) * 100), colorscale[i][1]];
        } else {
            colorStops[i] = [stopFormatter(colorscale[i][0] * 100), colorscale[i][1]];
        }
    }

    var fullLayout = gd._fullLayout;
    var fullID = 'g' + fullLayout._uid + '-' + gradientID;

    var gradient = fullLayout._defs.select('.gradients')
        .selectAll('#' + fullID)
        .data([type + colorStops.join(';')], Lib.identity);

    gradient.exit().remove();

    gradient.enter()
        .append(info.node)
        .each(function() {
            var el = d3.select(this);
            if(info.attrs) el.attr(info.attrs);

            el.attr('id', fullID);

            var stops = el.selectAll('stop')
                .data(colorStops);
            stops.exit().remove();
            stops.enter().append('stop');

            stops.each(function(d) {
                var tc = tinycolor(d[1]);
                d3.select(this).attr({
                    offset: d[0] + '%',
                    'stop-color': Color.tinyRGB(tc),
                    'stop-opacity': tc.getAlpha()
                });
            });
        });

    sel.style(prop, getFullUrl(fullID, gd))
        .style(prop + '-opacity', null);

    sel.classed('gradient_filled', true);
}

/**
 * pattern: create and apply a pattern fill
 *
 * @param {object} sel: d3 selection to apply this pattern to
 *     You can use `selection.call(Drawing.pattern, ...)`
 * @param {string} calledBy: option to know the caller component
 * @param {DOM element} gd: the graph div `sel` is part of
 * @param {string} patternID: a unique (within this plot) identifier
 *     for this pattern, so that we don't create unnecessary definitions
 * @param {number} size: size of unit squares for repetition of this pattern
 * @param {number} solidity: how solid lines of this pattern are
 * @param {string} mcc: color when painted with colorscale
 * @param {string} fillmode: fillmode for this pattern
 * @param {string} bgcolor: background color for this pattern
 * @param {string} fgcolor: foreground color for this pattern
 * @param {number} fgopacity: foreground opacity for this pattern
 */
drawing.pattern = function(sel, calledBy, gd, patternID, shape, size, solidity, mcc, fillmode, bgcolor, fgcolor, fgopacity) {
    var isLegend = calledBy === 'legend';

    if(mcc) {
        if(fillmode === 'overlay') {
            bgcolor = mcc;
            fgcolor = Color.contrast(bgcolor);
        } else {
            bgcolor = undefined;
            fgcolor = mcc;
        }
    }

    var fullLayout = gd._fullLayout;
    var fullID = 'p' + fullLayout._uid + '-' + patternID;
    var width, height;

    // linear interpolation
    var linearFn = function(x, x0, x1, y0, y1) {
        return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
    };

    var path, linewidth, radius;
    var patternTag;
    var patternAttrs = {};

    var fgC = tinycolor(fgcolor);
    var fgRGB = Color.tinyRGB(fgC);
    var fgAlpha = fgC.getAlpha();
    var opacity = fgopacity * fgAlpha;

    switch(shape) {
        case '/':
            width = size * Math.sqrt(2);
            height = size * Math.sqrt(2);
            path = 'M-' + (width / 4) + ',' + (height / 4) + 'l' + (width / 2) + ',-' + (height / 2) +
                   'M0,' + height + 'L' + width + ',0' +
                   'M' + (width / 4 * 3) + ',' + (height / 4 * 5) + 'l' + (width / 2) + ',-' + (height / 2);
            linewidth = solidity * size;
            patternTag = 'path';
            patternAttrs = {
                d: path,
                opacity: opacity,
                stroke: fgRGB,
                'stroke-width': linewidth + 'px'
            };
            break;
        case '\\':
            width = size * Math.sqrt(2);
            height = size * Math.sqrt(2);
            path = 'M' + (width / 4 * 3) + ',-' + (height / 4) + 'l' + (width / 2) + ',' + (height / 2) +
                   'M0,0L' + width + ',' + height +
                   'M-' + (width / 4) + ',' + (height / 4 * 3) + 'l' + (width / 2) + ',' + (height / 2);
            linewidth = solidity * size;
            patternTag = 'path';
            patternAttrs = {
                d: path,
                opacity: opacity,
                stroke: fgRGB,
                'stroke-width': linewidth + 'px'
            };
            break;
        case 'x':
            width = size * Math.sqrt(2);
            height = size * Math.sqrt(2);
            path = 'M-' + (width / 4) + ',' + (height / 4) + 'l' + (width / 2) + ',-' + (height / 2) +
                   'M0,' + height + 'L' + width + ',0' +
                   'M' + (width / 4 * 3) + ',' + (height / 4 * 5) + 'l' + (width / 2) + ',-' + (height / 2) +
                   'M' + (width / 4 * 3) + ',-' + (height / 4) + 'l' + (width / 2) + ',' + (height / 2) +
                   'M0,0L' + width + ',' + height +
                   'M-' + (width / 4) + ',' + (height / 4 * 3) + 'l' + (width / 2) + ',' + (height / 2);
            linewidth = size - size * Math.sqrt(1.0 - solidity);
            patternTag = 'path';
            patternAttrs = {
                d: path,
                opacity: opacity,
                stroke: fgRGB,
                'stroke-width': linewidth + 'px'
            };
            break;
        case '|':
            width = size;
            height = size;
            patternTag = 'path';
            path = 'M' + (width / 2) + ',0L' + (width / 2) + ',' + height;
            linewidth = solidity * size;
            patternTag = 'path';
            patternAttrs = {
                d: path,
                opacity: opacity,
                stroke: fgRGB,
                'stroke-width': linewidth + 'px'
            };
            break;
        case '-':
            width = size;
            height = size;
            patternTag = 'path';
            path = 'M0,' + (height / 2) + 'L' + width + ',' + (height / 2);
            linewidth = solidity * size;
            patternTag = 'path';
            patternAttrs = {
                d: path,
                opacity: opacity,
                stroke: fgRGB,
                'stroke-width': linewidth + 'px'
            };
            break;
        case '+':
            width = size;
            height = size;
            patternTag = 'path';
            path = 'M' + (width / 2) + ',0L' + (width / 2) + ',' + height +
                   'M0,' + (height / 2) + 'L' + width + ',' + (height / 2);
            linewidth = size - size * Math.sqrt(1.0 - solidity);
            patternTag = 'path';
            patternAttrs = {
                d: path,
                opacity: opacity,
                stroke: fgRGB,
                'stroke-width': linewidth + 'px'
            };
            break;
        case '.':
            width = size;
            height = size;
            if(solidity < Math.PI / 4) {
                radius = Math.sqrt(solidity * size * size / Math.PI);
            } else {
                radius = linearFn(solidity, Math.PI / 4, 1.0, size / 2, size / Math.sqrt(2));
            }
            patternTag = 'circle';
            patternAttrs = {
                cx: width / 2,
                cy: height / 2,
                r: radius,
                opacity: opacity,
                fill: fgRGB
            };
            break;
        default:
            width = size;
            height = size;
            patternTag = 'path';
            patternAttrs = {
                d: shape,
                opacity: opacity,
                fill: fgRGB
            };
            break;
    }

    var str = [
        shape || 'noSh',
        bgcolor || 'noBg',
        fgcolor || 'noFg',
        size,
        solidity
    ].join(';');

    var pattern = fullLayout._defs.select('.patterns')
        .selectAll('#' + fullID)
        .data([str], Lib.identity);

    pattern.exit().remove();

    pattern.enter()
        .append('pattern')
        .each(function() {
            var el = d3.select(this);

            el.attr({
                id: fullID,
                width: width + 'px',
                height: height + 'px',
                patternUnits: 'userSpaceOnUse',
                // for legends scale down patterns just a bit so that default size (i.e 8) nicely fit in small icons
                patternTransform: isLegend ? 'scale(0.8)' : ''
            });

            if(bgcolor) {
                var bgC = tinycolor(bgcolor);
                var bgRGB = Color.tinyRGB(bgC);
                var bgAlpha = bgC.getAlpha();

                var rects = el.selectAll('rect').data([0]);
                rects.exit().remove();
                rects.enter()
                    .append('rect')
                    .attr({
                        width: width + 'px',
                        height: height + 'px',
                        fill: bgRGB,
                        'fill-opacity': bgAlpha,
                    });
            }

            var patterns = el.selectAll(patternTag).data([0]);
            patterns.exit().remove();
            patterns.enter()
                .append(patternTag)
                .attr(patternAttrs);
        });

    sel.style('fill', getFullUrl(fullID, gd))
        .style('fill-opacity', null);

    sel.classed('pattern_filled', true);
};

/*
 * Make the gradients container and clear out any previous gradients.
 * We never collect all the gradients we need in one place,
 * so we can't ever remove gradients that have stopped being useful,
 * except all at once before a full redraw.
 * The upside of this is arbitrary points can share gradient defs
 */
drawing.initGradients = function(gd) {
    var fullLayout = gd._fullLayout;

    var gradientsGroup = Lib.ensureSingle(fullLayout._defs, 'g', 'gradients');
    gradientsGroup.selectAll('linearGradient,radialGradient').remove();

    d3.select(gd).selectAll('.gradient_filled').classed('gradient_filled', false);
};

drawing.initPatterns = function(gd) {
    var fullLayout = gd._fullLayout;

    var patternsGroup = Lib.ensureSingle(fullLayout._defs, 'g', 'patterns');
    patternsGroup.selectAll('pattern').remove();

    d3.select(gd).selectAll('.pattern_filled').classed('pattern_filled', false);
};

drawing.getPatternAttr = function(mp, i, dflt) {
    if(mp && Lib.isArrayOrTypedArray(mp)) {
        return i < mp.length ? mp[i] : dflt;
    }
    return mp;
};

drawing.pointStyle = function(s, trace, gd, pt) {
    if(!s.size()) return;

    var fns = drawing.makePointStyleFns(trace);

    s.each(function(d) {
        drawing.singlePointStyle(d, d3.select(this), trace, fns, gd, pt);
    });
};

drawing.singlePointStyle = function(d, sel, trace, fns, gd, pt) {
    var marker = trace.marker;
    var markerLine = marker.line;

    if(pt && pt.i >= 0 && d.i === undefined) d.i = pt.i;

    sel.style('opacity',
        fns.selectedOpacityFn ? fns.selectedOpacityFn(d) :
            (d.mo === undefined ? marker.opacity : d.mo)
    );

    if(fns.ms2mrc) {
        var r;

        // handle multi-trace graph edit case
        if(d.ms === 'various' || marker.size === 'various') {
            r = 3;
        } else {
            r = fns.ms2mrc(d.ms);
        }

        // store the calculated size so hover can use it
        d.mrc = r;

        if(fns.selectedSizeFn) {
            r = d.mrc = fns.selectedSizeFn(d);
        }

        // turn the symbol into a sanitized number
        var x = drawing.symbolNumber(d.mx || marker.symbol) || 0;

        // save if this marker is open
        // because that impacts how to handle colors
        d.om = x % 200 >= 100;

        var angle = getMarkerAngle(d, trace);
        var standoff = getMarkerStandoff(d, trace);

        sel.attr('d', makePointPath(x, r, angle, standoff));
    }

    var perPointGradient = false;
    var fillColor, lineColor, lineWidth;

    // 'so' is suspected outliers, for box plots
    if(d.so) {
        lineWidth = markerLine.outlierwidth;
        lineColor = markerLine.outliercolor;
        fillColor = marker.outliercolor;
    } else {
        var markerLineWidth = (markerLine || {}).width;

        lineWidth = (
            d.mlw + 1 ||
            markerLineWidth + 1 ||
            // TODO: we need the latter for legends... can we get rid of it?
            (d.trace ? (d.trace.marker.line || {}).width : 0) + 1
        ) - 1 || 0;

        if('mlc' in d) lineColor = d.mlcc = fns.lineScale(d.mlc);
        // weird case: array wasn't long enough to apply to every point
        else if(Lib.isArrayOrTypedArray(markerLine.color)) lineColor = Color.defaultLine;
        else lineColor = markerLine.color;

        if(Lib.isArrayOrTypedArray(marker.color)) {
            fillColor = Color.defaultLine;
            perPointGradient = true;
        }

        if('mc' in d) {
            fillColor = d.mcc = fns.markerScale(d.mc);
        } else {
            fillColor = marker.color || marker.colors || 'rgba(0,0,0,0)';
        }

        if(fns.selectedColorFn) {
            fillColor = fns.selectedColorFn(d);
        }
    }

    if(d.om) {
        // open markers can't have zero linewidth, default to 1px,
        // and use fill color as stroke color
        sel.call(Color.stroke, fillColor)
            .style({
                'stroke-width': (lineWidth || 1) + 'px',
                fill: 'none'
            });
    } else {
        sel.style('stroke-width', (d.isBlank ? 0 : lineWidth) + 'px');

        var markerGradient = marker.gradient;

        var gradientType = d.mgt;
        if(gradientType) perPointGradient = true;
        else gradientType = markerGradient && markerGradient.type;

        // for legend - arrays will propagate through here, but we don't need
        // to treat it as per-point.
        if(Lib.isArrayOrTypedArray(gradientType)) {
            gradientType = gradientType[0];
            if(!gradientInfo[gradientType]) gradientType = 0;
        }

        var markerPattern = marker.pattern;
        var pAttr = drawing.getPatternAttr;
        var patternShape = markerPattern && (
            pAttr(markerPattern.shape, d.i, '') || pAttr(markerPattern.path, d.i, '')
        );

        if(gradientType && gradientType !== 'none') {
            var gradientColor = d.mgc;
            if(gradientColor) perPointGradient = true;
            else gradientColor = markerGradient.color;

            var gradientID = trace.uid;
            if(perPointGradient) gradientID += '-' + d.i;

            drawing.gradient(sel, gd, gradientID, gradientType,
                [[0, gradientColor], [1, fillColor]], 'fill');
        } else if(patternShape) {
            var perPointPattern = false;
            var fgcolor = markerPattern.fgcolor;
            if(!fgcolor && pt && pt.color) {
                fgcolor = pt.color;
                perPointPattern = true;
            }
            var patternFGColor = pAttr(fgcolor, d.i, (pt && pt.color) || null);

            var patternBGColor = pAttr(markerPattern.bgcolor, d.i, null);
            var patternFGOpacity = markerPattern.fgopacity;
            var patternSize = pAttr(markerPattern.size, d.i, 8);
            var patternSolidity = pAttr(markerPattern.solidity, d.i, 0.3);
            perPointPattern = perPointPattern || d.mcc ||
                Lib.isArrayOrTypedArray(markerPattern.shape) ||
                Lib.isArrayOrTypedArray(markerPattern.path) ||
                Lib.isArrayOrTypedArray(markerPattern.bgcolor) ||
                Lib.isArrayOrTypedArray(markerPattern.fgcolor) ||
                Lib.isArrayOrTypedArray(markerPattern.size) ||
                Lib.isArrayOrTypedArray(markerPattern.solidity);

            var patternID = trace.uid;
            if(perPointPattern) patternID += '-' + d.i;

            drawing.pattern(
                sel, 'point', gd, patternID,
                patternShape, patternSize, patternSolidity,
                d.mcc, markerPattern.fillmode,
                patternBGColor, patternFGColor, patternFGOpacity
            );
        } else {
            Lib.isArrayOrTypedArray(fillColor) ? Color.fill(sel, fillColor[d.i]) : Color.fill(sel, fillColor);
        }

        if(lineWidth) {
            Color.stroke(sel, lineColor);
        }
    }
};

drawing.makePointStyleFns = function(trace) {
    var out = {};
    var marker = trace.marker;

    // allow array marker and marker line colors to be
    // scaled by given max and min to colorscales
    out.markerScale = drawing.tryColorscale(marker, '');
    out.lineScale = drawing.tryColorscale(marker, 'line');

    if(Registry.traceIs(trace, 'symbols')) {
        out.ms2mrc = subTypes.isBubble(trace) ?
            makeBubbleSizeFn(trace) :
            function() { return (marker.size || 6) / 2; };
    }

    if(trace.selectedpoints) {
        Lib.extendFlat(out, drawing.makeSelectedPointStyleFns(trace));
    }

    return out;
};

drawing.makeSelectedPointStyleFns = function(trace) {
    var out = {};

    var selectedAttrs = trace.selected || {};
    var unselectedAttrs = trace.unselected || {};

    var marker = trace.marker || {};
    var selectedMarker = selectedAttrs.marker || {};
    var unselectedMarker = unselectedAttrs.marker || {};

    var mo = marker.opacity;
    var smo = selectedMarker.opacity;
    var usmo = unselectedMarker.opacity;
    var smoIsDefined = smo !== undefined;
    var usmoIsDefined = usmo !== undefined;

    if(Lib.isArrayOrTypedArray(mo) || smoIsDefined || usmoIsDefined) {
        out.selectedOpacityFn = function(d) {
            var base = d.mo === undefined ? marker.opacity : d.mo;

            if(d.selected) {
                return smoIsDefined ? smo : base;
            } else {
                return usmoIsDefined ? usmo : DESELECTDIM * base;
            }
        };
    }

    var mc = marker.color;
    var smc = selectedMarker.color;
    var usmc = unselectedMarker.color;

    if(smc || usmc) {
        out.selectedColorFn = function(d) {
            var base = d.mcc || mc;

            if(d.selected) {
                return smc || base;
            } else {
                return usmc || base;
            }
        };
    }

    var ms = marker.size;
    var sms = selectedMarker.size;
    var usms = unselectedMarker.size;
    var smsIsDefined = sms !== undefined;
    var usmsIsDefined = usms !== undefined;

    if(Registry.traceIs(trace, 'symbols') && (smsIsDefined || usmsIsDefined)) {
        out.selectedSizeFn = function(d) {
            var base = d.mrc || ms / 2;

            if(d.selected) {
                return smsIsDefined ? sms / 2 : base;
            } else {
                return usmsIsDefined ? usms / 2 : base;
            }
        };
    }

    return out;
};

drawing.makeSelectedTextStyleFns = function(trace) {
    var out = {};

    var selectedAttrs = trace.selected || {};
    var unselectedAttrs = trace.unselected || {};

    var textFont = trace.textfont || {};
    var selectedTextFont = selectedAttrs.textfont || {};
    var unselectedTextFont = unselectedAttrs.textfont || {};

    var tc = textFont.color;
    var stc = selectedTextFont.color;
    var utc = unselectedTextFont.color;

    out.selectedTextColorFn = function(d) {
        var base = d.tc || tc;

        if(d.selected) {
            return stc || base;
        } else {
            if(utc) return utc;
            else return stc ? base : Color.addOpacity(base, DESELECTDIM);
        }
    };

    return out;
};

drawing.selectedPointStyle = function(s, trace) {
    if(!s.size() || !trace.selectedpoints) return;

    var fns = drawing.makeSelectedPointStyleFns(trace);
    var marker = trace.marker || {};
    var seq = [];

    if(fns.selectedOpacityFn) {
        seq.push(function(pt, d) {
            pt.style('opacity', fns.selectedOpacityFn(d));
        });
    }

    if(fns.selectedColorFn) {
        seq.push(function(pt, d) {
            Color.fill(pt, fns.selectedColorFn(d));
        });
    }

    if(fns.selectedSizeFn) {
        seq.push(function(pt, d) {
            var mx = d.mx || marker.symbol || 0;
            var mrc2 = fns.selectedSizeFn(d);

            pt.attr('d', makePointPath(drawing.symbolNumber(mx), mrc2, getMarkerAngle(d, trace), getMarkerStandoff(d, trace)));

            // save for Drawing.selectedTextStyle
            d.mrc2 = mrc2;
        });
    }

    if(seq.length) {
        s.each(function(d) {
            var pt = d3.select(this);
            for(var i = 0; i < seq.length; i++) {
                seq[i](pt, d);
            }
        });
    }
};

drawing.tryColorscale = function(marker, prefix) {
    var cont = prefix ? Lib.nestedProperty(marker, prefix).get() : marker;

    if(cont) {
        var colorArray = cont.color;
        if((cont.colorscale || cont._colorAx) && Lib.isArrayOrTypedArray(colorArray)) {
            return Colorscale.makeColorScaleFuncFromTrace(cont);
        }
    }
    return Lib.identity;
};

var TEXTOFFSETSIGN = {
    start: 1, end: -1, middle: 0, bottom: 1, top: -1
};

function textPointPosition(s, textPosition, fontSize, markerRadius, dontTouchParent) {
    var group = d3.select(s.node().parentNode);

    var v = textPosition.indexOf('top') !== -1 ?
        'top' :
        textPosition.indexOf('bottom') !== -1 ? 'bottom' : 'middle';
    var h = textPosition.indexOf('left') !== -1 ?
        'end' :
        textPosition.indexOf('right') !== -1 ? 'start' : 'middle';

    // if markers are shown, offset a little more than
    // the nominal marker size
    // ie 2/1.6 * nominal, bcs some markers are a bit bigger
    var r = markerRadius ? markerRadius / 0.8 + 1 : 0;

    var numLines = (svgTextUtils.lineCount(s) - 1) * LINE_SPACING + 1;
    var dx = TEXTOFFSETSIGN[h] * r;
    var dy = fontSize * 0.75 + TEXTOFFSETSIGN[v] * r +
        (TEXTOFFSETSIGN[v] - 1) * numLines * fontSize / 2;

    // fix the overall text group position
    s.attr('text-anchor', h);
    if(!dontTouchParent) {
        group.attr('transform', strTranslate(dx, dy));
    }
}

function extracTextFontSize(d, trace) {
    var fontSize = d.ts || trace.textfont.size;
    return (isNumeric(fontSize) && fontSize > 0) ? fontSize : 0;
}

// draw text at points
drawing.textPointStyle = function(s, trace, gd) {
    if(!s.size()) return;

    var selectedTextColorFn;
    if(trace.selectedpoints) {
        var fns = drawing.makeSelectedTextStyleFns(trace);
        selectedTextColorFn = fns.selectedTextColorFn;
    }

    var texttemplate = trace.texttemplate;
    var fullLayout = gd._fullLayout;

    s.each(function(d) {
        var p = d3.select(this);

        var text = texttemplate ?
            Lib.extractOption(d, trace, 'txt', 'texttemplate') :
            Lib.extractOption(d, trace, 'tx', 'text');

        if(!text && text !== 0) {
            p.remove();
            return;
        }

        if(texttemplate) {
            var fn = trace._module.formatLabels;
            var labels = fn ? fn(d, trace, fullLayout) : {};
            var pointValues = {};
            appendArrayPointValue(pointValues, trace, d.i);
            var meta = trace._meta || {};
            text = Lib.texttemplateString(text, labels, fullLayout._d3locale, pointValues, d, meta);
        }

        var pos = d.tp || trace.textposition;
        var fontSize = extracTextFontSize(d, trace);
        var fontColor = selectedTextColorFn ?
            selectedTextColorFn(d) :
            (d.tc || trace.textfont.color);

        p.call(drawing.font, {
            family: d.tf || trace.textfont.family,
            weight: d.tw || trace.textfont.weight,
            style: d.ty || trace.textfont.style,
            variant: d.tv || trace.textfont.variant,
            textcase: d.tC || trace.textfont.textcase,
            lineposition: d.tE || trace.textfont.lineposition,
            shadow: d.tS || trace.textfont.shadow,
            size: fontSize,
            color: fontColor
        })
            .text(text)
            .call(svgTextUtils.convertToTspans, gd)
            .call(textPointPosition, pos, fontSize, d.mrc);
    });
};

drawing.selectedTextStyle = function(s, trace) {
    if(!s.size() || !trace.selectedpoints) return;

    var fns = drawing.makeSelectedTextStyleFns(trace);

    s.each(function(d) {
        var tx = d3.select(this);
        var tc = fns.selectedTextColorFn(d);
        var tp = d.tp || trace.textposition;
        var fontSize = extracTextFontSize(d, trace);

        Color.fill(tx, tc);
        var dontTouchParent = Registry.traceIs(trace, 'bar-like');
        textPointPosition(tx, tp, fontSize, d.mrc2 || d.mrc, dontTouchParent);
    });
};

// generalized Catmull-Rom splines, per
// http://www.cemyuksel.com/research/catmullrom_param/catmullrom.pdf
var CatmullRomExp = 0.5;
drawing.smoothopen = function(pts, smoothness) {
    if(pts.length < 3) { return 'M' + pts.join('L');}
    var path = 'M' + pts[0];
    var tangents = [];
    var i;
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
    var path = 'M' + pts[0];
    var pLast = pts.length - 1;
    var tangents = [makeTangent(pts[pLast], pts[0], pts[1], smoothness)];
    var i;
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

var lastDrawnX, lastDrawnY;

function roundEnd(pt, isY, isLastPoint) {
    if(isLastPoint) pt = applyBackoff(pt);

    return isY ? roundY(pt[1]) : roundX(pt[0]);
}

function roundX(p) {
    var v = d3.round(p, 2);
    lastDrawnX = v;
    return v;
}

function roundY(p) {
    var v = d3.round(p, 2);
    lastDrawnY = v;
    return v;
}

function makeTangent(prevpt, thispt, nextpt, smoothness) {
    var d1x = prevpt[0] - thispt[0];
    var d1y = prevpt[1] - thispt[1];
    var d2x = nextpt[0] - thispt[0];
    var d2y = nextpt[1] - thispt[1];
    var d1a = Math.pow(d1x * d1x + d1y * d1y, CatmullRomExp / 2);
    var d2a = Math.pow(d2x * d2x + d2y * d2y, CatmullRomExp / 2);
    var numx = (d2a * d2a * d1x - d1a * d1a * d2x) * smoothness;
    var numy = (d2a * d2a * d1y - d1a * d1a * d2y) * smoothness;
    var denom1 = 3 * d2a * (d1a + d2a);
    var denom2 = 3 * d1a * (d1a + d2a);
    return [
        [
            roundX(thispt[0] + (denom1 && numx / denom1)),
            roundY(thispt[1] + (denom1 && numy / denom1))
        ], [
            roundX(thispt[0] - (denom2 && numx / denom2)),
            roundY(thispt[1] - (denom2 && numy / denom2))
        ]
    ];
}

// step paths - returns a generator function for paths
// with the given step shape
var STEPPATH = {
    hv: function(p0, p1, isLastPoint) {
        return 'H' +
            roundX(p1[0]) + 'V' +
            roundEnd(p1, 1, isLastPoint);
    },
    vh: function(p0, p1, isLastPoint) {
        return 'V' +
            roundY(p1[1]) + 'H' +
            roundEnd(p1, 0, isLastPoint);
    },
    hvh: function(p0, p1, isLastPoint) {
        return 'H' +
            roundX((p0[0] + p1[0]) / 2) + 'V' +
            roundY(p1[1]) + 'H' +
            roundEnd(p1, 0, isLastPoint);
    },
    vhv: function(p0, p1, isLastPoint) {
        return 'V' +
            roundY((p0[1] + p1[1]) / 2) + 'H' +
            roundX(p1[0]) + 'V' +
            roundEnd(p1, 1, isLastPoint);
    }
};
var STEPLINEAR = function(p0, p1, isLastPoint) {
    return 'L' +
        roundEnd(p1, 0, isLastPoint) + ',' +
        roundEnd(p1, 1, isLastPoint);
};
drawing.steps = function(shape) {
    var onestep = STEPPATH[shape] || STEPLINEAR;
    return function(pts) {
        var path = 'M' + roundX(pts[0][0]) + ',' + roundY(pts[0][1]);
        var len = pts.length;
        for(var i = 1; i < len; i++) {
            path += onestep(pts[i - 1], pts[i], i === len - 1);
        }
        return path;
    };
};

function applyBackoff(pt, start) {
    var backoff = pt.backoff;
    var trace = pt.trace;
    var d = pt.d;
    var i = pt.i;

    if(backoff && trace &&
        trace.marker &&
        trace.marker.angle % 360 === 0 &&
        trace.line &&
        trace.line.shape !== 'spline'
    ) {
        var arrayBackoff = Lib.isArrayOrTypedArray(backoff);
        var end = pt;

        var x1 = start ? start[0] : lastDrawnX || 0;
        var y1 = start ? start[1] : lastDrawnY || 0;

        var x2 = end[0];
        var y2 = end[1];

        var dx = x2 - x1;
        var dy = y2 - y1;

        var t = Math.atan2(dy, dx);

        var b = arrayBackoff ? backoff[i] : backoff;

        if(b === 'auto') {
            var endI = end.i;
            if(trace.type === 'scatter') endI--; // Why we need this hack?

            var endMarker = end.marker;
            var endMarkerSymbol = endMarker.symbol;
            if(Lib.isArrayOrTypedArray(endMarkerSymbol)) endMarkerSymbol = endMarkerSymbol[endI];

            var endMarkerSize = endMarker.size;
            if(Lib.isArrayOrTypedArray(endMarkerSize)) endMarkerSize = endMarkerSize[endI];

            b = endMarker ? drawing.symbolBackOffs[drawing.symbolNumber(endMarkerSymbol)] * endMarkerSize : 0;
            b += drawing.getMarkerStandoff(d[endI], trace) || 0;
        }

        var x = x2 - b * Math.cos(t);
        var y = y2 - b * Math.sin(t);

        if(
            ((x <= x2 && x >= x1) || (x >= x2 && x <= x1)) &&
            ((y <= y2 && y >= y1) || (y >= y2 && y <= y1))
        ) {
            pt = [x, y];
        }
    }

    return pt;
}

drawing.applyBackoff = applyBackoff;

// off-screen svg render testing element, shared by the whole page
// uses the id 'js-plotly-tester' and stores it in drawing.tester
drawing.makeTester = function() {
    var tester = Lib.ensureSingleById(d3.select('body'), 'svg', 'js-plotly-tester', function(s) {
        s.attr(xmlnsNamespaces.svgAttrs)
            .style({
                position: 'absolute',
                left: '-10000px',
                top: '-10000px',
                width: '9000px',
                height: '9000px',
                'z-index': '1'
            });
    });

    // browsers differ on how they describe the bounding rect of
    // the svg if its contents spill over... so make a 1x1px
    // reference point we can measure off of.
    var testref = Lib.ensureSingle(tester, 'path', 'js-reference-point', function(s) {
        s.attr('d', 'M0,0H1V1H0Z')
            .style({
                'stroke-width': 0,
                fill: 'black'
            });
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
    } else if(node.childNodes.length === 1) {
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
    } else {
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

/**
 * Set clipPath URL in a way that work for all situations.
 *
 * In details, graphs on pages with <base> HTML tags need to prepend
 * the clip path ids with the page's base url EXCEPT during toImage exports.
 *
 * @param {d3 selection} s : node to add clip-path attribute
 * @param {string} localId : local clip-path (w/o base url) id
 * @param {DOM element || object} gd
 * - context._baseUrl {string}
 * - context._exportedPlot {boolean}
 */
drawing.setClipUrl = function(s, localId, gd) {
    s.attr('clip-path', getFullUrl(localId, gd));
};

function getFullUrl(localId, gd) {
    if(!localId) return null;

    var context = gd._context;
    var baseUrl = context._exportedPlot ? '' : (context._baseUrl || '');
    return baseUrl ?
        'url(\'' + baseUrl + '#' + localId + '\')' :
        'url(#' + localId + ')';
}

drawing.getTranslate = function(element) {
    // Note the separator [^\d] between x and y in this regex
    // We generally use ',' but IE will convert it to ' '
    var re = /.*\btranslate\((-?\d*\.?\d*)[^-\d]*(-?\d*\.?\d*)[^\d].*/;
    var getter = element.attr ? 'attr' : 'getAttribute';
    var transform = element[getter]('transform') || '';

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
    var re = /(\btranslate\(.*?\);?)/;
    var getter = element.attr ? 'attr' : 'getAttribute';
    var setter = element.attr ? 'attr' : 'setAttribute';
    var transform = element[getter]('transform') || '';

    x = x || 0;
    y = y || 0;

    transform = transform.replace(re, '').trim();
    transform += strTranslate(x, y);
    transform = transform.trim();

    element[setter]('transform', transform);

    return transform;
};

drawing.getScale = function(element) {
    var re = /.*\bscale\((\d*\.?\d*)[^\d]*(\d*\.?\d*)[^\d].*/;
    var getter = element.attr ? 'attr' : 'getAttribute';
    var transform = element[getter]('transform') || '';

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
    var re = /(\bscale\(.*?\);?)/;
    var getter = element.attr ? 'attr' : 'getAttribute';
    var setter = element.attr ? 'attr' : 'setAttribute';
    var transform = element[getter]('transform') || '';

    x = x || 1;
    y = y || 1;

    transform = transform.replace(re, '').trim();
    transform += 'scale(' + x + ',' + y + ')';
    transform = transform.trim();

    element[setter]('transform', transform);

    return transform;
};

var SCALE_RE = /\s*sc.*/;

drawing.setPointGroupScale = function(selection, xScale, yScale) {
    xScale = xScale || 1;
    yScale = yScale || 1;

    if(!selection) return;

    // The same scale transform for every point:
    var scale = (xScale === 1 && yScale === 1) ?
        '' :
        'scale(' + xScale + ',' + yScale + ')';

    selection.each(function() {
        var t = (this.getAttribute('transform') || '').replace(SCALE_RE, '');
        t += scale;
        t = t.trim();
        this.setAttribute('transform', t);
    });
};

var TEXT_POINT_LAST_TRANSLATION_RE = /translate\([^)]*\)\s*$/;

drawing.setTextPointsScale = function(selection, xScale, yScale) {
    if(!selection) return;

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
                strTranslate(x, y),
                'scale(' + xScale + ',' + yScale + ')',
                strTranslate(-x, -y),
            ];
        }

        if(existingTransform) {
            transforms.push(existingTransform);
        }

        el.attr('transform', transforms.join(''));
    });
};

function getMarkerStandoff(d, trace) {
    var standoff;

    if(d) standoff = d.mf;

    if(standoff === undefined) {
        standoff = trace.marker ? trace.marker.standoff || 0 : 0;
    }

    if(!trace._geo && !trace._xA) {
        // case of legends
        return -standoff;
    }

    return standoff;
}

drawing.getMarkerStandoff = getMarkerStandoff;

var atan2 = Math.atan2;
var cos = Math.cos;
var sin = Math.sin;

function rotate(t, xy) {
    var x = xy[0];
    var y = xy[1];
    return [
        x * cos(t) - y * sin(t),
        x * sin(t) + y * cos(t)
    ];
}

var previousLon;
var previousLat;
var previousX;
var previousY;
var previousI;
var previousTraceUid;

function getMarkerAngle(d, trace) {
    var angle = d.ma;

    if(angle === undefined) {
        angle = trace.marker.angle;
        if(!angle || Lib.isArrayOrTypedArray(angle)) {
            angle = 0;
        }
    }

    var x, y;
    var ref = trace.marker.angleref;
    if(ref === 'previous' || ref === 'north') {
        if(trace._geo) {
            var p = trace._geo.project(d.lonlat);
            x = p[0];
            y = p[1];
        } else {
            var xa = trace._xA;
            var ya = trace._yA;
            if(xa && ya) {
                x = xa.c2p(d.x);
                y = ya.c2p(d.y);
            } else {
                // case of legends
                return 90;
            }
        }

        if(trace._geo) {
            var lon = d.lonlat[0];
            var lat = d.lonlat[1];

            var north = trace._geo.project([
                lon,
                lat + 1e-5 // epsilon
            ]);

            var east = trace._geo.project([
                lon + 1e-5, // epsilon
                lat
            ]);

            var u = atan2(
                east[1] - y,
                east[0] - x
            );

            var v = atan2(
                north[1] - y,
                north[0] - x
            );

            var t;
            if(ref === 'north') {
                t = angle / 180 * Math.PI;
                // To use counter-clockwise angles i.e.
                // East: 90, West: -90
                // to facilitate wind visualisations
                // in future we should use t = -t here.
            } else if(ref === 'previous') {
                var lon1 = lon / 180 * Math.PI;
                var lat1 = lat / 180 * Math.PI;
                var lon2 = previousLon / 180 * Math.PI;
                var lat2 = previousLat / 180 * Math.PI;

                var dLon = lon2 - lon1;

                var deltaY = cos(lat2) * sin(dLon);
                var deltaX = sin(lat2) * cos(lat1) - cos(lat2) * sin(lat1) * cos(dLon);

                t = -atan2(
                    deltaY,
                    deltaX
                ) - Math.PI;

                previousLon = lon;
                previousLat = lat;
            }

            var A = rotate(u, [cos(t), 0]);
            var B = rotate(v, [sin(t), 0]);

            angle = atan2(
                A[1] + B[1],
                A[0] + B[0]
            ) / Math.PI * 180;

            if(ref === 'previous' && !(
                previousTraceUid === trace.uid &&
                d.i === previousI + 1
            )) {
                angle = null;
            }
        }

        if(ref === 'previous' && !trace._geo) {
            if(
                previousTraceUid === trace.uid &&
                d.i === previousI + 1 &&
                isNumeric(x) &&
                isNumeric(y)
            ) {
                var dX = x - previousX;
                var dY = y - previousY;

                var shape = trace.line ? trace.line.shape || '' : '';

                var lastShapeChar = shape.slice(shape.length - 1);
                if(lastShapeChar === 'h') dY = 0;
                if(lastShapeChar === 'v') dX = 0;

                angle += atan2(dY, dX) / Math.PI * 180 + 90;
            } else {
                angle = null;
            }
        }
    }

    previousX = x;
    previousY = y;
    previousI = d.i;
    previousTraceUid = trace.uid;

    return angle;
}

drawing.getMarkerAngle = getMarkerAngle;
