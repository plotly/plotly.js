'use strict';

var d3 = require('@plotly/d3');

var Registry = require('../../registry');
var Lib = require('../../lib');
var strTranslate = Lib.strTranslate;
var Drawing = require('../drawing');
var Color = require('../color');
var extractOpts = require('../colorscale/helpers').extractOpts;

var subTypes = require('../../traces/scatter/subtypes');
var stylePie = require('../../traces/pie/style_one');
var pieCastOption = require('../../traces/pie/helpers').castOption;

var constants = require('./constants');

var CST_MARKER_SIZE = 12;
var CST_LINE_WIDTH = 5;
var CST_MARKER_LINE_WIDTH = 2;
var MAX_LINE_WIDTH = 10;
var MAX_MARKER_LINE_WIDTH = 5;

module.exports = function style(s, gd, legend) {
    var fullLayout = gd._fullLayout;
    if(!legend) legend = fullLayout.legend;
    var constantItemSizing = legend.itemsizing === 'constant';
    var itemWidth = legend.itemwidth;
    var centerPos = (itemWidth + constants.itemGap * 2) / 2;
    var centerTransform = strTranslate(centerPos, 0);

    var boundLineWidth = function(mlw, cont, max, cst) {
        var v;
        if(mlw + 1) {
            v = mlw;
        } else if(cont && cont.width > 0) {
            v = cont.width;
        } else {
            return 0;
        }
        return constantItemSizing ? cst : Math.min(v, max);
    };

    s.each(function(d) {
        var traceGroup = d3.select(this);

        var layers = Lib.ensureSingle(traceGroup, 'g', 'layers');
        layers.style('opacity', d[0].trace.opacity);

        var indentation = legend.indentation;
        var valign = legend.valign;
        var lineHeight = d[0].lineHeight;
        var height = d[0].height;
        if((valign === 'middle' && indentation === 0) || !lineHeight || !height) {
            layers.attr('transform', null);
        } else {
            var factor = {top: 1, bottom: -1}[valign];
            var markerOffsetY = (factor * (0.5 * (lineHeight - height + 3))) || 0;
            var markerOffsetX = legend.indentation;
            layers.attr('transform', strTranslate(markerOffsetX, markerOffsetY));
        }

        var fill = layers
            .selectAll('g.legendfill')
                .data([d]);
        fill.enter().append('g')
            .classed('legendfill', true);

        var line = layers
            .selectAll('g.legendlines')
                .data([d]);
        line.enter().append('g')
            .classed('legendlines', true);

        var symbol = layers
            .selectAll('g.legendsymbols')
                .data([d]);
        symbol.enter().append('g')
            .classed('legendsymbols', true);

        symbol.selectAll('g.legendpoints')
            .data([d])
          .enter().append('g')
            .classed('legendpoints', true);
    })
    .each(styleSpatial)
    .each(styleWaterfalls)
    .each(styleFunnels)
    .each(styleBars)
    .each(styleBoxes)
    .each(styleFunnelareas)
    .each(stylePies)
    .each(styleLines)
    .each(stylePoints)
    .each(styleCandles)
    .each(styleOHLC);

    function styleLines(d) {
        var styleGuide = getStyleGuide(d);
        var showFill = styleGuide.showFill;
        var showLine = styleGuide.showLine;
        var showGradientLine = styleGuide.showGradientLine;
        var showGradientFill = styleGuide.showGradientFill;
        var anyFill = styleGuide.anyFill;
        var anyLine = styleGuide.anyLine;

        var d0 = d[0];
        var trace = d0.trace;
        var dMod, tMod;

        var cOpts = extractOpts(trace);
        var colorscale = cOpts.colorscale;
        var reversescale = cOpts.reversescale;

        var fillStyle = function(s) {
            if(s.size()) {
                if(showFill) {
                    Drawing.fillGroupStyle(s, gd, true);
                } else {
                    var gradientID = 'legendfill-' + trace.uid;
                    Drawing.gradient(s, gd, gradientID,
                        getGradientDirection(reversescale),
                        colorscale, 'fill');
                }
            }
        };

        var lineGradient = function(s) {
            if(s.size()) {
                var gradientID = 'legendline-' + trace.uid;
                Drawing.lineGroupStyle(s);
                Drawing.gradient(s, gd, gradientID,
                    getGradientDirection(reversescale),
                    colorscale, 'stroke');
            }
        };

        // with fill and no markers or text, move the line and fill up a bit
        // so it's more centered

        var pathStart = (subTypes.hasMarkers(trace) || !anyFill) ? 'M5,0' :
            // with a line leave it slightly below center, to leave room for the
            // line thickness and because the line is usually more prominent
            anyLine ? 'M5,-2' : 'M5,-3';

        var this3 = d3.select(this);

        var fill = this3.select('.legendfill').selectAll('path')
            .data(showFill || showGradientFill ? [d] : []);
        fill.enter().append('path').classed('js-fill', true);
        fill.exit().remove();
        fill.attr('d', pathStart + 'h' + itemWidth + 'v6h-' + itemWidth + 'z')
            .call(fillStyle);

        if(showLine || showGradientLine) {
            var lw = boundLineWidth(undefined, trace.line, MAX_LINE_WIDTH, CST_LINE_WIDTH);
            tMod = Lib.minExtend(trace, {line: {width: lw}});
            dMod = [Lib.minExtend(d0, {trace: tMod})];
        }

        var line = this3.select('.legendlines').selectAll('path')
            .data(showLine || showGradientLine ? [dMod] : []);
        line.enter().append('path').classed('js-line', true);
        line.exit().remove();

        // this is ugly... but you can't apply a gradient to a perfectly
        // horizontal or vertical line. Presumably because then
        // the system doesn't know how to scale vertical variation, even
        // though there *is* no vertical variation in this case.
        // so add an invisibly small angle to the line
        // This issue (and workaround) exist across (Mac) Chrome, FF, and Safari
        line.attr('d', pathStart + (showGradientLine ? 'l' + itemWidth + ',0.0001' : 'h' + itemWidth))
            .call(showLine ? Drawing.lineGroupStyle : lineGradient);
    }

    function stylePoints(d) {
        var styleGuide = getStyleGuide(d);
        var anyFill = styleGuide.anyFill;
        var anyLine = styleGuide.anyLine;
        var showLine = styleGuide.showLine;
        var showMarker = styleGuide.showMarker;

        var d0 = d[0];
        var trace = d0.trace;
        var showText = !showMarker && !anyLine && !anyFill && subTypes.hasText(trace);
        var dMod, tMod;

        // 'scatter3d' don't use gd.calcdata,
        // use d0.trace to infer arrayOk attributes

        function boundVal(attrIn, arrayToValFn, bounds, cst) {
            var valIn = Lib.nestedProperty(trace, attrIn).get();
            var valToBound = (Lib.isArrayOrTypedArray(valIn) && arrayToValFn) ?
                arrayToValFn(valIn) :
                valIn;

            if(constantItemSizing && valToBound && cst !== undefined) {
                valToBound = cst;
            }

            if(bounds) {
                if(valToBound < bounds[0]) return bounds[0];
                else if(valToBound > bounds[1]) return bounds[1];
            }
            return valToBound;
        }

        function pickFirst(array) {
            if(d0._distinct && d0.index && array[d0.index]) return array[d0.index];
            return array[0];
        }

        // constrain text, markers, etc so they'll fit on the legend
        if(showMarker || showText || showLine) {
            var dEdit = {};
            var tEdit = {};

            if(showMarker) {
                dEdit.mc = boundVal('marker.color', pickFirst);
                dEdit.mx = boundVal('marker.symbol', pickFirst);
                dEdit.mo = boundVal('marker.opacity', Lib.mean, [0.2, 1]);
                dEdit.mlc = boundVal('marker.line.color', pickFirst);
                dEdit.mlw = boundVal('marker.line.width', Lib.mean, [0, 5], CST_MARKER_LINE_WIDTH);
                tEdit.marker = {
                    sizeref: 1,
                    sizemin: 1,
                    sizemode: 'diameter'
                };

                var ms = boundVal('marker.size', Lib.mean, [2, 16], CST_MARKER_SIZE);
                dEdit.ms = ms;
                tEdit.marker.size = ms;
            }

            if(showLine) {
                tEdit.line = {
                    width: boundVal('line.width', pickFirst, [0, 10], CST_LINE_WIDTH)
                };
            }

            if(showText) {
                dEdit.tx = 'Aa';
                dEdit.tp = boundVal('textposition', pickFirst);
                dEdit.ts = 10;
                dEdit.tc = boundVal('textfont.color', pickFirst);
                dEdit.tf = boundVal('textfont.family', pickFirst);
                dEdit.tw = boundVal('textfont.weight', pickFirst);
                dEdit.ty = boundVal('textfont.style', pickFirst);
                dEdit.tv = boundVal('textfont.variant', pickFirst);
                dEdit.tC = boundVal('textfont.textcase', pickFirst);
                dEdit.tE = boundVal('textfont.lineposition', pickFirst);
                dEdit.tS = boundVal('textfont.shadow', pickFirst);
            }

            dMod = [Lib.minExtend(d0, dEdit)];
            tMod = Lib.minExtend(trace, tEdit);

            // always show legend items in base state
            tMod.selectedpoints = null;

            // never show texttemplate
            tMod.texttemplate = null;
        }

        var ptgroup = d3.select(this).select('g.legendpoints');

        var pts = ptgroup.selectAll('path.scatterpts')
            .data(showMarker ? dMod : []);
        // make sure marker is on the bottom, in case it enters after text
        pts.enter().insert('path', ':first-child')
            .classed('scatterpts', true)
            .attr('transform', centerTransform);
        pts.exit().remove();
        pts.call(Drawing.pointStyle, tMod, gd);

        // 'mrc' is set in pointStyle and used in textPointStyle:
        // constrain it here
        if(showMarker) dMod[0].mrc = 3;

        var txt = ptgroup.selectAll('g.pointtext')
            .data(showText ? dMod : []);
        txt.enter()
            .append('g').classed('pointtext', true)
                .append('text').attr('transform', centerTransform);
        txt.exit().remove();
        txt.selectAll('text').call(Drawing.textPointStyle, tMod, gd);
    }

    function styleWaterfalls(d) {
        var trace = d[0].trace;
        var isWaterfall = trace.type === 'waterfall';

        if(d[0]._distinct && isWaterfall) {
            var cont = d[0].trace[d[0].dir].marker;
            d[0].mc = cont.color;
            d[0].mlw = cont.line.width;
            d[0].mlc = cont.line.color;
            return styleBarLike(d, this, 'waterfall');
        }

        var ptsData = [];
        if(trace.visible && isWaterfall) {
            ptsData = d[0].hasTotals ?
                [['increasing', 'M-6,-6V6H0Z'], ['totals', 'M6,6H0L-6,-6H-0Z'], ['decreasing', 'M6,6V-6H0Z']] :
                [['increasing', 'M-6,-6V6H6Z'], ['decreasing', 'M6,6V-6H-6Z']];
        }

        var pts = d3.select(this).select('g.legendpoints')
            .selectAll('path.legendwaterfall')
            .data(ptsData);
        pts.enter().append('path').classed('legendwaterfall', true)
            .attr('transform', centerTransform)
            .style('stroke-miterlimit', 1);
        pts.exit().remove();

        pts.each(function(dd) {
            var pt = d3.select(this);
            var cont = trace[dd[0]].marker;
            var lw = boundLineWidth(undefined, cont.line, MAX_MARKER_LINE_WIDTH, CST_MARKER_LINE_WIDTH);

            pt.attr('d', dd[1])
                .style('stroke-width', lw + 'px')
                .call(Color.fill, cont.color);

            if(lw) {
                pt.call(Color.stroke, cont.line.color);
            }
        });
    }

    function styleBars(d) {
        styleBarLike(d, this);
    }

    function styleFunnels(d) {
        styleBarLike(d, this, 'funnel');
    }

    function styleBarLike(d, lThis, desiredType) {
        var trace = d[0].trace;
        var marker = trace.marker || {};
        var markerLine = marker.line || {};

        // If bar has rounded corners, round corners of legend icon
        var pathStr = marker.cornerradius ?
            'M6,3a3,3,0,0,1-3,3H-3a3,3,0,0,1-3-3V-3a3,3,0,0,1,3-3H3a3,3,0,0,1,3,3Z' : // Square with rounded corners
            'M6,6H-6V-6H6Z'; // Normal square

        var isVisible = (!desiredType) ? Registry.traceIs(trace, 'bar') :
            (trace.visible && trace.type === desiredType);

        var barpath = d3.select(lThis).select('g.legendpoints')
            .selectAll('path.legend' + desiredType)
            .data(isVisible ? [d] : []);
        barpath.enter().append('path').classed('legend' + desiredType, true)
            .attr('d', pathStr)
            .attr('transform', centerTransform);
        barpath.exit().remove();

        barpath.each(function(d) {
            var p = d3.select(this);
            var d0 = d[0];
            var w = boundLineWidth(d0.mlw, marker.line, MAX_MARKER_LINE_WIDTH, CST_MARKER_LINE_WIDTH);

            p.style('stroke-width', w + 'px');

            var mcc = d0.mcc;
            if(!legend._inHover && 'mc' in d0) {
                // not in unified hover but
                // for legend use the color in the middle of scale
                var cOpts = extractOpts(marker);
                var mid = cOpts.mid;
                if(mid === undefined) mid = (cOpts.max + cOpts.min) / 2;
                mcc = Drawing.tryColorscale(marker, '')(mid);
            }
            var fillColor = mcc || d0.mc || marker.color;

            var markerPattern = marker.pattern;
            var patternShape = markerPattern && Drawing.getPatternAttr(markerPattern.shape, 0, '');

            if(patternShape) {
                var patternBGColor = Drawing.getPatternAttr(markerPattern.bgcolor, 0, null);
                var patternFGColor = Drawing.getPatternAttr(markerPattern.fgcolor, 0, null);
                var patternFGOpacity = markerPattern.fgopacity;
                var patternSize = dimAttr(markerPattern.size, 8, 10);
                var patternSolidity = dimAttr(markerPattern.solidity, 0.5, 1);
                var patternID = 'legend-' + trace.uid;
                p.call(
                    Drawing.pattern, 'legend', gd, patternID,
                    patternShape, patternSize, patternSolidity,
                    mcc, markerPattern.fillmode,
                    patternBGColor, patternFGColor, patternFGOpacity
                );
            } else {
                p.call(Color.fill, fillColor);
            }

            if(w) Color.stroke(p, d0.mlc || markerLine.color);
        });
    }

    function styleBoxes(d) {
        var trace = d[0].trace;

        var pts = d3.select(this).select('g.legendpoints')
            .selectAll('path.legendbox')
            .data(trace.visible && Registry.traceIs(trace, 'box-violin') ? [d] : []);
        pts.enter().append('path').classed('legendbox', true)
            // if we want the median bar, prepend M6,0H-6
            .attr('d', 'M6,6H-6V-6H6Z')
            .attr('transform', centerTransform);
        pts.exit().remove();

        pts.each(function() {
            var p = d3.select(this);

            if((trace.boxpoints === 'all' || trace.points === 'all') &&
                Color.opacity(trace.fillcolor) === 0 && Color.opacity((trace.line || {}).color) === 0
            ) {
                var tMod = Lib.minExtend(trace, {
                    marker: {
                        size: constantItemSizing ? CST_MARKER_SIZE : Lib.constrain(trace.marker.size, 2, 16),
                        sizeref: 1,
                        sizemin: 1,
                        sizemode: 'diameter'
                    }
                });
                pts.call(Drawing.pointStyle, tMod, gd);
            } else {
                var w = boundLineWidth(undefined, trace.line, MAX_MARKER_LINE_WIDTH, CST_MARKER_LINE_WIDTH);

                p.style('stroke-width', w + 'px')
                    .call(Color.fill, trace.fillcolor);

                if(w) Color.stroke(p, trace.line.color);
            }
        });
    }

    function styleCandles(d) {
        var trace = d[0].trace;

        var pts = d3.select(this).select('g.legendpoints')
            .selectAll('path.legendcandle')
            .data(trace.visible && trace.type === 'candlestick' ? [d, d] : []);
        pts.enter().append('path').classed('legendcandle', true)
            .attr('d', function(_, i) {
                if(i) return 'M-15,0H-8M-8,6V-6H8Z'; // increasing
                return 'M15,0H8M8,-6V6H-8Z'; // decreasing
            })
            .attr('transform', centerTransform)
            .style('stroke-miterlimit', 1);
        pts.exit().remove();

        pts.each(function(_, i) {
            var p = d3.select(this);
            var cont = trace[i ? 'increasing' : 'decreasing'];
            var w = boundLineWidth(undefined, cont.line, MAX_MARKER_LINE_WIDTH, CST_MARKER_LINE_WIDTH);

            p.style('stroke-width', w + 'px')
                .call(Color.fill, cont.fillcolor);

            if(w) Color.stroke(p, cont.line.color);
        });
    }

    function styleOHLC(d) {
        var trace = d[0].trace;

        var pts = d3.select(this).select('g.legendpoints')
            .selectAll('path.legendohlc')
            .data(trace.visible && trace.type === 'ohlc' ? [d, d] : []);
        pts.enter().append('path').classed('legendohlc', true)
            .attr('d', function(_, i) {
                if(i) return 'M-15,0H0M-8,-6V0'; // increasing
                return 'M15,0H0M8,6V0'; // decreasing
            })
            .attr('transform', centerTransform)
            .style('stroke-miterlimit', 1);
        pts.exit().remove();

        pts.each(function(_, i) {
            var p = d3.select(this);
            var cont = trace[i ? 'increasing' : 'decreasing'];
            var w = boundLineWidth(undefined, cont.line, MAX_MARKER_LINE_WIDTH, CST_MARKER_LINE_WIDTH);

            p.style('fill', 'none')
                .call(Drawing.dashLine, cont.line.dash, w);

            if(w) Color.stroke(p, cont.line.color);
        });
    }

    function stylePies(d) {
        stylePieLike(d, this, 'pie');
    }

    function styleFunnelareas(d) {
        stylePieLike(d, this, 'funnelarea');
    }

    function stylePieLike(d, lThis, desiredType) {
        var d0 = d[0];
        var trace = d0.trace;

        var isVisible = (!desiredType) ? Registry.traceIs(trace, desiredType) :
            (trace.visible && trace.type === desiredType);

        var pts = d3.select(lThis).select('g.legendpoints')
            .selectAll('path.legend' + desiredType)
            .data(isVisible ? [d] : []);
        pts.enter().append('path').classed('legend' + desiredType, true)
            .attr('d', 'M6,6H-6V-6H6Z')
            .attr('transform', centerTransform);
        pts.exit().remove();

        if(pts.size()) {
            var cont = trace.marker || {};
            var lw = boundLineWidth(pieCastOption(cont.line.width, d0.pts), cont.line, MAX_MARKER_LINE_WIDTH, CST_MARKER_LINE_WIDTH);

            var opt = 'pieLike';
            var tMod = Lib.minExtend(trace, {marker: {line: {width: lw}}}, opt);
            var d0Mod = Lib.minExtend(d0, {trace: tMod}, opt);

            stylePie(pts, d0Mod, tMod, gd);
        }
    }

    function styleSpatial(d) { // i.e. maninly traces having z and colorscale
        var trace = d[0].trace;

        var useGradient;
        var ptsData = [];
        if(trace.visible) {
            switch(trace.type) {
                case 'histogram2d' :
                case 'heatmap' :
                    ptsData = [
                        ['M-15,-2V4H15V-2Z'] // similar to contour
                    ];
                    useGradient = true;
                    break;
                case 'choropleth' :
                case 'choroplethmapbox' :
                case 'choroplethmap' :
                    ptsData = [
                        ['M-6,-6V6H6V-6Z']
                    ];
                    useGradient = true;
                    break;
                case 'densitymapbox' :
                case 'densitymap' :
                    ptsData = [
                        ['M-6,0 a6,6 0 1,0 12,0 a 6,6 0 1,0 -12,0']
                    ];
                    useGradient = 'radial';
                    break;
                case 'cone' :
                    ptsData = [
                        ['M-6,2 A2,2 0 0,0 -6,6 V6L6,4Z'],
                        ['M-6,-6 A2,2 0 0,0 -6,-2 L6,-4Z'],
                        ['M-6,-2 A2,2 0 0,0 -6,2 L6,0Z']
                    ];
                    useGradient = false;
                    break;
                case 'streamtube' :
                    ptsData = [
                        ['M-6,2 A2,2 0 0,0 -6,6 H6 A2,2 0 0,1 6,2 Z'],
                        ['M-6,-6 A2,2 0 0,0 -6,-2 H6 A2,2 0 0,1 6,-6 Z'],
                        ['M-6,-2 A2,2 0 0,0 -6,2 H6 A2,2 0 0,1 6,-2 Z']
                    ];
                    useGradient = false;
                    break;
                case 'surface' :
                    ptsData = [
                        ['M-6,-6 A2,3 0 0,0 -6,0 H6 A2,3 0 0,1 6,-6 Z'],
                        ['M-6,1 A2,3 0 0,1 -6,6 H6 A2,3 0 0,0 6,0 Z']
                    ];
                    useGradient = true;
                    break;
                case 'mesh3d' :
                    ptsData = [
                        ['M-6,6H0L-6,-6Z'],
                        ['M6,6H0L6,-6Z'],
                        ['M-6,-6H6L0,6Z']
                    ];
                    useGradient = false;
                    break;
                case 'volume' :
                    ptsData = [
                        ['M-6,6H0L-6,-6Z'],
                        ['M6,6H0L6,-6Z'],
                        ['M-6,-6H6L0,6Z']
                    ];
                    useGradient = true;
                    break;
                case 'isosurface':
                    ptsData = [
                        ['M-6,6H0L-6,-6Z'],
                        ['M6,6H0L6,-6Z'],
                        ['M-6,-6 A12,24 0 0,0 6,-6 L0,6Z']
                    ];
                    useGradient = false;
                    break;
            }
        }

        var pts = d3.select(this).select('g.legendpoints')
            .selectAll('path.legend3dandfriends')
            .data(ptsData);
        pts.enter().append('path').classed('legend3dandfriends', true)
            .attr('transform', centerTransform)
            .style('stroke-miterlimit', 1);
        pts.exit().remove();

        pts.each(function(dd, i) {
            var pt = d3.select(this);

            var cOpts = extractOpts(trace);
            var colorscale = cOpts.colorscale;
            var reversescale = cOpts.reversescale;
            var fillGradient = function(s) {
                if(s.size()) {
                    var gradientID = 'legendfill-' + trace.uid;
                    Drawing.gradient(s, gd, gradientID,
                        getGradientDirection(reversescale, useGradient === 'radial'),
                        colorscale, 'fill');
                }
            };

            var fillColor;
            if(!colorscale) {
                var color = trace.vertexcolor || trace.facecolor || trace.color;
                fillColor = Lib.isArrayOrTypedArray(color) ? (color[i] || color[0]) : color;
            } else {
                if(!useGradient) {
                    var len = colorscale.length;
                    fillColor =
                        i === 0 ? colorscale[reversescale ? len - 1 : 0][1] : // minimum
                        i === 1 ? colorscale[reversescale ? 0 : len - 1][1] : // maximum
                            colorscale[Math.floor((len - 1) / 2)][1]; // middle
                }
            }

            pt.attr('d', dd[0]);
            if(fillColor) {
                pt.call(Color.fill, fillColor);
            } else {
                pt.call(fillGradient);
            }
        });
    }
};

function getGradientDirection(reversescale, isRadial) {
    var str = isRadial ? 'radial' : 'horizontal';
    return str + (reversescale ? '' : 'reversed');
}

function getStyleGuide(d) {
    var trace = d[0].trace;
    var contours = trace.contours;
    var showLine = subTypes.hasLines(trace);
    var showMarker = subTypes.hasMarkers(trace);

    var showFill = trace.visible && trace.fill && trace.fill !== 'none';
    var showGradientLine = false;
    var showGradientFill = false;

    if(contours) {
        var coloring = contours.coloring;

        if(coloring === 'lines') {
            showGradientLine = true;
        } else {
            showLine = coloring === 'none' || coloring === 'heatmap' || contours.showlines;
        }

        if(contours.type === 'constraint') {
            showFill = contours._operation !== '=';
        } else if(coloring === 'fill' || coloring === 'heatmap') {
            showGradientFill = true;
        }
    }
    return {
        showMarker: showMarker,
        showLine: showLine,
        showFill: showFill,
        showGradientLine: showGradientLine,
        showGradientFill: showGradientFill,
        anyLine: showLine || showGradientLine,
        anyFill: showFill || showGradientFill,
    };
}

function dimAttr(v, dflt, max) {
    if(v && Lib.isArrayOrTypedArray(v)) return dflt;
    if(v > max) return max;
    return v;
}
