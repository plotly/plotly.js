'use strict';

var d3 = require('@plotly/d3');
var Lib = require('../../lib');
var isArrayOrTypedArray = Lib.isArrayOrTypedArray;
var numberFormat = Lib.numberFormat;
var rgba = require('color-rgba').default;

var Axes = require('../../plots/cartesian/axes');
var strRotate = Lib.strRotate;
var strTranslate = Lib.strTranslate;
var svgTextUtils = require('../../lib/svg_text_utils');
var Drawing = require('../../components/drawing');
var Colorscale = require('../../components/colorscale');

var gup = require('../../lib/gup');
var keyFun = gup.keyFun;
var repeat = gup.repeat;
var unwrap = gup.unwrap;

var helpers = require('./helpers');
var c = require('./constants');
var brush = require('./axisbrush');
var lineLayerMaker = require('./lines');

function findExtreme(fn, values, len) {
    return Lib.aggNums(fn, null, values, len);
}

function findExtremes(values, len) {
    return fixExtremes(
        findExtreme(Math.min, values, len),
        findExtreme(Math.max, values, len)
    );
}

function dimensionExtent(dimension) {
    var range = dimension.range;
    return range ?
        fixExtremes(range[0], range[1]) :
        findExtremes(dimension.values, dimension._length);
}

function fixExtremes(lo, hi) {
    if(isNaN(lo) || !isFinite(lo)) {
        lo = 0;
    }

    if(isNaN(hi) || !isFinite(hi)) {
        hi = 0;
    }

    // avoid a degenerate (zero-width) domain
    if(lo === hi) {
        if(lo === 0) {
            // no use to multiplying zero, so add/subtract in this case
            lo -= 1;
            hi += 1;
        } else {
            // this keeps the range in the order of magnitude of the data
            lo *= 0.9;
            hi *= 1.1;
        }
    }

    return [lo, hi];
}

function toText(formatter, texts) {
    if(texts) {
        return function(v, i) {
            var text = texts[i];
            if(text === null || text === undefined) return formatter(v);
            return text;
        };
    }
    return formatter;
}

function domainScale(height, padding, dimension, tickvals, ticktext) {
    var extent = dimensionExtent(dimension);
    if(tickvals) {
        return d3.scale.ordinal()
            .domain(tickvals.map(toText(numberFormat(dimension.tickformat), ticktext)))
            .range(tickvals
                .map(function(d) {
                    var unitVal = (d - extent[0]) / (extent[1] - extent[0]);
                    return (height - padding + unitVal * (2 * padding - height));
                })
            );
    }
    return d3.scale.linear()
        .domain(extent)
        .range([height - padding, padding]);
}

function unitToPaddedPx(height, padding) {
    return d3.scale.linear().range([padding, height - padding]);
}

function domainToPaddedUnitScale(dimension, padFraction) {
    return d3.scale.linear()
        .domain(dimensionExtent(dimension))
        .range([padFraction, 1 - padFraction]);
}

function ordinalScale(dimension) {
    if(!dimension.tickvals) return;

    var extent = dimensionExtent(dimension);
    return d3.scale.ordinal()
        .domain(dimension.tickvals)
        .range(dimension.tickvals.map(function(d) {
            return (d - extent[0]) / (extent[1] - extent[0]);
        }));
}

function unitToColorScale(cscale) {
    var colorStops = cscale.map(function(d) { return d[0]; });
    var colorTuples = cscale.map(function(d) {
        var RGBA = rgba(d[1]);
        return d3.rgb('rgb(' + RGBA[0] + ',' + RGBA[1] + ',' + RGBA[2] + ')');
    });
    var prop = function(n) { return function(o) { return o[n]; }; };

    // We can't use d3 color interpolation as we may have non-uniform color palette raster
    // (various color stop distances).
    var polylinearUnitScales = 'rgb'.split('').map(function(key) {
        return d3.scale.linear()
            .clamp(true)
            .domain(colorStops)
            .range(colorTuples.map(prop(key)));
    });

    return function(d) {
        return polylinearUnitScales.map(function(s) {
            return s(d);
        });
    };
}

function someFiltersActive(view) {
    return view.dimensions.some(function(p) {
        return p.brush.filterSpecified;
    });
}

function model(layout, d, i) {
    var cd0 = unwrap(d);
    var trace = cd0.trace;
    var lineColor = helpers.convertTypedArray(cd0.lineColor);
    var line = trace.line;
    var deselectedLines = {
        color: rgba(trace.unselected.line.color),
        opacity: trace.unselected.line.opacity
    };
    var cOpts = Colorscale.extractOpts(line);
    var cscale = cOpts.reversescale ? Colorscale.flipScale(cd0.cscale) : cd0.cscale;
    var domain = trace.domain;
    var dimensions = trace.dimensions;
    var width = layout.width;
    var labelAngle = trace.labelangle;
    var labelSide = trace.labelside;
    var labelFont = trace.labelfont;
    var tickFont = trace.tickfont;
    var rangeFont = trace.rangefont;

    var lines = Lib.extendDeepNoArrays({}, line, {
        color: lineColor.map(d3.scale.linear().domain(
            dimensionExtent({
                values: lineColor,
                range: [cOpts.min, cOpts.max],
                _length: trace._length
            })
        )),
        blockLineCount: c.blockLineCount,
        canvasOverdrag: c.overdrag * c.canvasPixelRatio
    });

    var groupWidth = Math.floor(width * (domain.x[1] - domain.x[0]));
    var groupHeight = Math.floor(layout.height * (domain.y[1] - domain.y[0]));

    var pad = layout.margin || {l: 80, r: 80, t: 100, b: 80};
    var rowContentWidth = groupWidth;
    var rowHeight = groupHeight;

    return {
        key: i,
        colCount: dimensions.filter(helpers.isVisible).length,
        dimensions: dimensions,
        tickDistance: c.tickDistance,
        unitToColor: unitToColorScale(cscale),
        lines: lines,
        deselectedLines: deselectedLines,
        labelAngle: labelAngle,
        labelSide: labelSide,
        labelFont: labelFont,
        tickFont: tickFont,
        rangeFont: rangeFont,
        layoutWidth: width,
        layoutHeight: layout.height,
        domain: domain,
        translateX: domain.x[0] * width,
        translateY: layout.height - domain.y[1] * layout.height,
        pad: pad,
        canvasWidth: rowContentWidth * c.canvasPixelRatio + 2 * lines.canvasOverdrag,
        canvasHeight: rowHeight * c.canvasPixelRatio,
        width: rowContentWidth,
        height: rowHeight,
        canvasPixelRatio: c.canvasPixelRatio
    };
}

function viewModel(state, callbacks, model) {
    var width = model.width;
    var height = model.height;
    var dimensions = model.dimensions;
    var canvasPixelRatio = model.canvasPixelRatio;

    var xScale = function(d) {return width * d / Math.max(1, model.colCount - 1);};

    var unitPad = c.verticalPadding / height;
    var _unitToPaddedPx = unitToPaddedPx(height, c.verticalPadding);

    var vm = {
        key: model.key,
        xScale: xScale,
        model: model,
        inBrushDrag: false // consider factoring it out and putting it in a centralized global-ish gesture state object
    };

    var uniqueKeys = {};

    vm.dimensions = dimensions.filter(helpers.isVisible).map(function(dimension, i) {
        var domainToPaddedUnit = domainToPaddedUnitScale(dimension, unitPad);
        var foundKey = uniqueKeys[dimension.label];
        uniqueKeys[dimension.label] = (foundKey || 0) + 1;
        var key = dimension.label + (foundKey ? '__' + foundKey : '');
        var specifiedConstraint = dimension.constraintrange;
        var filterRangeSpecified = specifiedConstraint && specifiedConstraint.length;
        if(filterRangeSpecified && !isArrayOrTypedArray(specifiedConstraint[0])) {
            specifiedConstraint = [specifiedConstraint];
        }
        var filterRange = filterRangeSpecified ?
            specifiedConstraint.map(function(d) { return d.map(domainToPaddedUnit); }) :
            [[-Infinity, Infinity]];
        var brushMove = function() {
            var p = vm;
            p.focusLayer && p.focusLayer.render(p.panels, true);
            var filtersActive = someFiltersActive(p);
            if(!state.contextShown() && filtersActive) {
                p.contextLayer && p.contextLayer.render(p.panels, true);
                state.contextShown(true);
            } else if(state.contextShown() && !filtersActive) {
                p.contextLayer && p.contextLayer.render(p.panels, true, true);
                state.contextShown(false);
            }
        };

        var truncatedValues = dimension.values;
        if(truncatedValues.length > dimension._length) {
            truncatedValues = truncatedValues.slice(0, dimension._length);
        }

        var tickvals = dimension.tickvals;
        var ticktext;
        function makeTickItem(v, i) { return {val: v, text: ticktext[i]}; }
        function sortTickItem(a, b) { return a.val - b.val; }
        if(isArrayOrTypedArray(tickvals) && tickvals.length) {
            if(Lib.isTypedArray(tickvals)) tickvals = Array.from(tickvals);

            ticktext = dimension.ticktext;

            // ensure ticktext and tickvals have same length
            if(!isArrayOrTypedArray(ticktext) || !ticktext.length) {
                ticktext = tickvals.map(numberFormat(dimension.tickformat));
            } else if(ticktext.length > tickvals.length) {
                ticktext = ticktext.slice(0, tickvals.length);
            } else if(tickvals.length > ticktext.length) {
                tickvals = tickvals.slice(0, ticktext.length);
            }

            // check if we need to sort tickvals/ticktext
            for(var j = 1; j < tickvals.length; j++) {
                if(tickvals[j] < tickvals[j - 1]) {
                    var tickItems = tickvals.map(makeTickItem).sort(sortTickItem);
                    for(var k = 0; k < tickvals.length; k++) {
                        tickvals[k] = tickItems[k].val;
                        ticktext[k] = tickItems[k].text;
                    }
                    break;
                }
            }
        } else tickvals = undefined;

        truncatedValues = helpers.convertTypedArray(truncatedValues);

        return {
            key: key,
            label: dimension.label,
            tickFormat: dimension.tickformat,
            tickvals: tickvals,
            ticktext: ticktext,
            ordinal: helpers.isOrdinal(dimension),
            multiselect: dimension.multiselect,
            xIndex: i,
            crossfilterDimensionIndex: i,
            visibleIndex: dimension._index,
            height: height,
            values: truncatedValues,
            paddedUnitValues: truncatedValues.map(domainToPaddedUnit),
            unitTickvals: tickvals && tickvals.map(domainToPaddedUnit),
            xScale: xScale,
            x: xScale(i),
            canvasX: xScale(i) * canvasPixelRatio,
            unitToPaddedPx: _unitToPaddedPx,
            domainScale: domainScale(height, c.verticalPadding, dimension, tickvals, ticktext),
            ordinalScale: ordinalScale(dimension),
            parent: vm,
            model: model,
            brush: brush.makeBrush(
                state,
                filterRangeSpecified,
                filterRange,
                function() {
                    state.linePickActive(false);
                },
                brushMove,
                function(f) {
                    vm.focusLayer.render(vm.panels, true);
                    vm.pickLayer && vm.pickLayer.render(vm.panels, true);
                    state.linePickActive(true);
                    if(callbacks && callbacks.filterChanged) {
                        var invScale = domainToPaddedUnit.invert;

                        // update gd.data as if a Plotly.restyle were fired
                        var newRanges = f.map(function(r) {
                            return r.map(invScale).sort(Lib.sorterAsc);
                        }).sort(function(a, b) { return a[0] - b[0]; });
                        callbacks.filterChanged(vm.key, dimension._index, newRanges);
                    }
                }
            )
        };
    });

    return vm;
}

function styleExtentTexts(selection) {
    selection
        .classed(c.cn.axisExtentText, true)
        .attr('text-anchor', 'middle')
        .style('cursor', 'default');
}

function parcoordsInteractionState() {
    var linePickActive = true;
    var contextShown = false;
    return {
        linePickActive: function(val) {return arguments.length ? linePickActive = !!val : linePickActive;},
        contextShown: function(val) {return arguments.length ? contextShown = !!val : contextShown;}
    };
}

function calcTilt(angle, position) {
    var dir = (position === 'top') ? 1 : -1;
    var radians = angle * Math.PI / 180;
    var dx = Math.sin(radians);
    var dy = Math.cos(radians);
    return {
        dir: dir,
        dx: dx,
        dy: dy,
        degrees: angle
    };
}

function updatePanelLayout(yAxis, vm, plotGlPixelRatio) {
    var panels = vm.panels || (vm.panels = []);
    var data = yAxis.data();
    for(var i = 0; i < data.length - 1; i++) {
        var p = panels[i] || (panels[i] = {});
        var dim0 = data[i];
        var dim1 = data[i + 1];
        p.dim0 = dim0;
        p.dim1 = dim1;
        p.canvasX = dim0.canvasX;
        p.panelSizeX = dim1.canvasX - dim0.canvasX;
        p.panelSizeY = vm.model.canvasHeight;
        p.y = 0;
        p.canvasY = 0;
        p.plotGlPixelRatio = plotGlPixelRatio;
    }
}

function calcAllTicks(cd) {
    for(var i = 0; i < cd.length; i++) {
        for(var j = 0; j < cd[i].length; j++) {
            var trace = cd[i][j].trace;
            var dimensions = trace.dimensions;

            for(var k = 0; k < dimensions.length; k++) {
                var values = dimensions[k].values;
                var dim = dimensions[k]._ax;

                if(dim) {
                    if(!dim.range) {
                        dim.range = findExtremes(values, trace._length);
                    } else {
                        dim.range = fixExtremes(dim.range[0], dim.range[1]);
                    }

                    if(!dim.dtick) {
                        dim.dtick = 0.01 * (Math.abs(dim.range[1] - dim.range[0]) || 1);
                    }

                    dim.tickformat = dimensions[k].tickformat;
                    Axes.calcTicks(dim);
                    dim.cleanRange();
                }
            }
        }
    }
}

function linearFormat(dim, v) {
    return Axes.tickText(dim._ax, v, false).text;
}

function extremeText(d, isTop) {
    if(d.ordinal) return '';
    var domain = d.domainScale.domain();
    var v = (domain[isTop ? domain.length - 1 : 0]);

    return linearFormat(d.model.dimensions[d.visibleIndex], v);
}


module.exports = function parcoords(gd, cdModule, layout, callbacks) {
    var isStatic = gd._context.staticPlot;

    var fullLayout = gd._fullLayout;
    var svg = fullLayout._toppaper;
    var glContainer = fullLayout._glcontainer;
    var plotGlPixelRatio = gd._context.plotGlPixelRatio;
    var paperColor = gd._fullLayout.paper_bgcolor;

    calcAllTicks(cdModule);

    var state = parcoordsInteractionState();

    var vm = cdModule
        .filter(function(d) { return unwrap(d).trace.visible; })
        .map(model.bind(0, layout))
        .map(viewModel.bind(0, state, callbacks));

    glContainer.each(function(d, i) {
        return Lib.extendFlat(d, vm[i]);
    });

    var glLayers = glContainer.selectAll('.gl-canvas')
        .each(function(d) {
            // FIXME: figure out how to handle multiple instances
            d.viewModel = vm[0];
            d.viewModel.plotGlPixelRatio = plotGlPixelRatio;
            d.viewModel.paperColor = paperColor;
            d.model = d.viewModel ? d.viewModel.model : null;
        });

    var lastHovered = null;

    var pickLayer = glLayers.filter(function(d) {return d.pick;});

    // emit hover / unhover event
    pickLayer
        .style('pointer-events', isStatic ? 'none' : 'auto')
        .on('mousemove', function(d) {
            if(state.linePickActive() && d.lineLayer && callbacks && callbacks.hover) {
                var event = d3.event;
                var cw = this.width;
                var ch = this.height;
                var pointer = d3.mouse(this);
                var x = pointer[0];
                var y = pointer[1];

                if(x < 0 || y < 0 || x >= cw || y >= ch) {
                    return;
                }
                var pixel = d.lineLayer.readPixel(x, ch - 1 - y);
                var found = pixel[3] !== 0;
                // inverse of the calcPickColor in `lines.js`; detailed comment there
                var curveNumber = found ? pixel[2] + 256 * (pixel[1] + 256 * pixel[0]) : null;
                var eventData = {
                    x: x,
                    y: y,
                    clientX: event.clientX,
                    clientY: event.clientY,
                    dataIndex: d.model.key,
                    curveNumber: curveNumber
                };
                if(curveNumber !== lastHovered) { // don't unnecessarily repeat the same hit (or miss)
                    if(found) {
                        callbacks.hover(eventData);
                    } else if(callbacks.unhover) {
                        callbacks.unhover(eventData);
                    }
                    lastHovered = curveNumber;
                }
            }
        });

    glLayers
        .style('opacity', function(d) {return d.pick ? 0 : 1;});

    svg.style('background', 'rgba(255, 255, 255, 0)');
    var controlOverlay = svg.selectAll('.' + c.cn.parcoords)
        .data(vm, keyFun);

    controlOverlay.exit().remove();

    controlOverlay.enter()
        .append('g')
        .classed(c.cn.parcoords, true)
        .style('shape-rendering', 'crispEdges')
        .style('pointer-events', 'none');

    controlOverlay.attr('transform', function(d) {
        return strTranslate(d.model.translateX, d.model.translateY);
    });

    var parcoordsControlView = controlOverlay.selectAll('.' + c.cn.parcoordsControlView)
        .data(repeat, keyFun);

    parcoordsControlView.enter()
        .append('g')
        .classed(c.cn.parcoordsControlView, true);

    parcoordsControlView.attr('transform', function(d) {
        return strTranslate(d.model.pad.l, d.model.pad.t);
    });

    var yAxis = parcoordsControlView.selectAll('.' + c.cn.yAxis)
        .data(function(p) { return p.dimensions; }, keyFun);

    yAxis.enter()
        .append('g')
        .classed(c.cn.yAxis, true);

    parcoordsControlView.each(function(p) {
        updatePanelLayout(yAxis, p, plotGlPixelRatio);
    });

    glLayers
        .each(function(d) {
            if(d.viewModel) {
                if(!d.lineLayer || callbacks) { // recreate in case of having callbacks e.g. restyle. Should we test for callback to be a restyle?
                    d.lineLayer = lineLayerMaker(this, d);
                } else d.lineLayer.update(d);

                if(d.key || d.key === 0) d.viewModel[d.key] = d.lineLayer;

                var setChanged = (!d.context || // don't update background
                                  callbacks);   // unless there is a callback on the context layer. Should we test the callback?

                d.lineLayer.render(d.viewModel.panels, setChanged);
            }
        });

    yAxis.attr('transform', function(d) {
        return strTranslate(d.xScale(d.xIndex), 0);
    });

    // drag column for reordering columns
    yAxis.call(d3.behavior.drag()
        .origin(function(d) { return d; })
        .on('drag', function(d) {
            var p = d.parent;
            state.linePickActive(false);
            d.x = Math.max(-c.overdrag, Math.min(d.model.width + c.overdrag, d3.event.x));
            d.canvasX = d.x * d.model.canvasPixelRatio;
            yAxis
                .sort(function(a, b) { return a.x - b.x; })
                .each(function(e, i) {
                    e.xIndex = i;
                    e.x = d === e ? e.x : e.xScale(e.xIndex);
                    e.canvasX = e.x * e.model.canvasPixelRatio;
                });

            updatePanelLayout(yAxis, p, plotGlPixelRatio);

            yAxis.filter(function(e) { return Math.abs(d.xIndex - e.xIndex) !== 0; })
                .attr('transform', function(d) { return strTranslate(d.xScale(d.xIndex), 0); });
            d3.select(this).attr('transform', strTranslate(d.x, 0));
            yAxis.each(function(e, i0, i1) { if(i1 === d.parent.key) p.dimensions[i0] = e; });
            p.contextLayer && p.contextLayer.render(p.panels, false, !someFiltersActive(p));
            p.focusLayer.render && p.focusLayer.render(p.panels);
        })
        .on('dragend', function(d) {
            var p = d.parent;
            d.x = d.xScale(d.xIndex);
            d.canvasX = d.x * d.model.canvasPixelRatio;
            updatePanelLayout(yAxis, p, plotGlPixelRatio);
            d3.select(this)
                .attr('transform', function(d) { return strTranslate(d.x, 0); });
            p.contextLayer && p.contextLayer.render(p.panels, false, !someFiltersActive(p));
            p.focusLayer && p.focusLayer.render(p.panels);
            p.pickLayer && p.pickLayer.render(p.panels, true);
            state.linePickActive(true);

            if(callbacks && callbacks.axesMoved) {
                callbacks.axesMoved(p.key, p.dimensions.map(function(e) {return e.crossfilterDimensionIndex;}));
            }
        })
    );

    yAxis.exit()
        .remove();

    var axisOverlays = yAxis.selectAll('.' + c.cn.axisOverlays)
        .data(repeat, keyFun);

    axisOverlays.enter()
        .append('g')
        .classed(c.cn.axisOverlays, true);

    axisOverlays.selectAll('.' + c.cn.axis).remove();

    var axis = axisOverlays.selectAll('.' + c.cn.axis)
        .data(repeat, keyFun);

    axis.enter()
        .append('g')
        .classed(c.cn.axis, true);

    axis
        .each(function(d) {
            var wantedTickCount = d.model.height / d.model.tickDistance;
            var scale = d.domainScale;
            var sdom = scale.domain();
            d3.select(this)
                .call(d3.svg.axis()
                    .orient('left')
                    .tickSize(4)
                    .outerTickSize(2)
                    .ticks(wantedTickCount, d.tickFormat) // works for continuous scales only...
                    .tickValues(d.ordinal ? // and this works for ordinal scales
                        sdom :
                        null)
                    .tickFormat(function(v) {
                        return helpers.isOrdinal(d) ? v : linearFormat(d.model.dimensions[d.visibleIndex], v);
                    })
                    .scale(scale));
            Drawing.font(axis.selectAll('text'), d.model.tickFont);
        });

    axis.selectAll('.domain, .tick>line')
        .attr('fill', 'none')
        .attr('stroke', 'black')
        .attr('stroke-opacity', 0.25)
        .attr('stroke-width', '1px');

    axis.selectAll('text')
        .style('cursor', 'default');

    var axisHeading = axisOverlays.selectAll('.' + c.cn.axisHeading)
        .data(repeat, keyFun);

    axisHeading.enter()
        .append('g')
        .classed(c.cn.axisHeading, true);

    var axisTitle = axisHeading.selectAll('.' + c.cn.axisTitle)
        .data(repeat, keyFun);

    axisTitle.enter()
        .append('text')
        .classed(c.cn.axisTitle, true)
        .attr('text-anchor', 'middle')
        .style('cursor', 'ew-resize')
        .style('pointer-events', isStatic ? 'none' : 'auto');

    axisTitle
        .text(function(d) { return d.label; })
        .each(function(d) {
            var e = d3.select(this);
            Drawing.font(e, d.model.labelFont);
            svgTextUtils.convertToTspans(e, gd);
        })
        .attr('transform', function(d) {
            var tilt = calcTilt(d.model.labelAngle, d.model.labelSide);
            var r = c.axisTitleOffset;
            return (
                (tilt.dir > 0 ? '' : strTranslate(0, 2 * r + d.model.height)) +
                strRotate(tilt.degrees) +
                strTranslate(-r * tilt.dx, -r * tilt.dy)
            );
        })
        .attr('text-anchor', function(d) {
            var tilt = calcTilt(d.model.labelAngle, d.model.labelSide);
            var adx = Math.abs(tilt.dx);
            var ady = Math.abs(tilt.dy);

            if(2 * adx > ady) {
                return (tilt.dir * tilt.dx < 0) ? 'start' : 'end';
            } else {
                return 'middle';
            }
        });

    var axisExtent = axisOverlays.selectAll('.' + c.cn.axisExtent)
        .data(repeat, keyFun);

    axisExtent.enter()
        .append('g')
        .classed(c.cn.axisExtent, true);

    var axisExtentTop = axisExtent.selectAll('.' + c.cn.axisExtentTop)
        .data(repeat, keyFun);

    axisExtentTop.enter()
        .append('g')
        .classed(c.cn.axisExtentTop, true);

    axisExtentTop
        .attr('transform', strTranslate(0, -c.axisExtentOffset));

    var axisExtentTopText = axisExtentTop.selectAll('.' + c.cn.axisExtentTopText)
        .data(repeat, keyFun);

    axisExtentTopText.enter()
        .append('text')
        .classed(c.cn.axisExtentTopText, true)
        .call(styleExtentTexts);

    axisExtentTopText
        .text(function(d) { return extremeText(d, true); })
        .each(function(d) { Drawing.font(d3.select(this), d.model.rangeFont); });

    var axisExtentBottom = axisExtent.selectAll('.' + c.cn.axisExtentBottom)
        .data(repeat, keyFun);

    axisExtentBottom.enter()
        .append('g')
        .classed(c.cn.axisExtentBottom, true);

    axisExtentBottom
        .attr('transform', function(d) {
            return strTranslate(0, d.model.height + c.axisExtentOffset);
        });

    var axisExtentBottomText = axisExtentBottom.selectAll('.' + c.cn.axisExtentBottomText)
        .data(repeat, keyFun);

    axisExtentBottomText.enter()
        .append('text')
        .classed(c.cn.axisExtentBottomText, true)
        .attr('dy', '0.75em')
        .call(styleExtentTexts);

    axisExtentBottomText
        .text(function(d) { return extremeText(d, false); })
        .each(function(d) { Drawing.font(d3.select(this), d.model.rangeFont); });

    brush.ensureAxisBrush(axisOverlays, paperColor, gd);
};
