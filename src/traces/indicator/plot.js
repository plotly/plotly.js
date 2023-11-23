'use strict';

var d3 = require('@plotly/d3');
var interpolate = require('d3-interpolate').interpolate;
var interpolateNumber = require('d3-interpolate').interpolateNumber;

var Lib = require('../../lib');
var strScale = Lib.strScale;
var strTranslate = Lib.strTranslate;
var rad2deg = Lib.rad2deg;
var MID_SHIFT = require('../../constants/alignment').MID_SHIFT;
var Drawing = require('../../components/drawing');
var cn = require('./constants');
var svgTextUtils = require('../../lib/svg_text_utils');

var Axes = require('../../plots/cartesian/axes');
var handleAxisDefaults = require('../../plots/cartesian/axis_defaults');
var handleAxisPositionDefaults = require('../../plots/cartesian/position_defaults');
var axisLayoutAttrs = require('../../plots/cartesian/layout_attributes');

var Color = require('../../components/color');
var anchor = {
    left: 'start',
    center: 'middle',
    right: 'end'
};
var position = {
    left: 0,
    center: 0.5,
    right: 1
};

var SI_PREFIX = /[yzafpnµmkMGTPEZY]/;

function hasTransition(transitionOpts) {
    // If transition config is provided, then it is only a partial replot and traces not
    // updated are removed.
    return transitionOpts && transitionOpts.duration > 0;
}

module.exports = function plot(gd, cdModule, transitionOpts, makeOnCompleteCallback) {
    var fullLayout = gd._fullLayout;
    var onComplete;

    if(hasTransition(transitionOpts)) {
        if(makeOnCompleteCallback) {
            // If it was passed a callback to register completion, make a callback. If
            // this is created, then it must be executed on completion, otherwise the
            // pos-transition redraw will not execute:
            onComplete = makeOnCompleteCallback();
        }
    }

    Lib.makeTraceGroups(fullLayout._indicatorlayer, cdModule, 'trace').each(function(cd) {
        var cd0 = cd[0];
        var trace = cd0.trace;

        var plotGroup = d3.select(this);

        // Elements in trace
        var hasGauge = trace._hasGauge;
        var isAngular = trace._isAngular;
        var isBullet = trace._isBullet;

        // Domain size
        var domain = trace.domain;
        var size = {
            w: fullLayout._size.w * (domain.x[1] - domain.x[0]),
            h: fullLayout._size.h * (domain.y[1] - domain.y[0]),
            l: fullLayout._size.l + fullLayout._size.w * domain.x[0],
            r: fullLayout._size.r + fullLayout._size.w * (1 - domain.x[1]),
            t: fullLayout._size.t + fullLayout._size.h * (1 - domain.y[1]),
            b: fullLayout._size.b + fullLayout._size.h * (domain.y[0])
        };
        var centerX = size.l + size.w / 2;
        var centerY = size.t + size.h / 2;

        // Angular gauge size
        var radius = Math.min(size.w / 2, size.h); // fill domain
        var innerRadius = cn.innerRadius * radius;

        // Position numbers based on mode and set the scaling logic
        var numbersX, numbersY, numbersScaler;
        var numbersAlign = trace.align || 'center';

        numbersY = centerY;
        if(!hasGauge) {
            numbersX = size.l + position[numbersAlign] * size.w;
            numbersScaler = function(el) {
                return fitTextInsideBox(el, size.w, size.h);
            };
        } else {
            if(isAngular) {
                numbersX = centerX;
                numbersY = centerY + radius / 2;
                numbersScaler = function(el) {
                    return fitTextInsideCircle(el, 0.9 * innerRadius);
                };
            }
            if(isBullet) {
                var padding = cn.bulletPadding;
                var p = (1 - cn.bulletNumberDomainSize) + padding;
                numbersX = size.l + (p + (1 - p) * position[numbersAlign]) * size.w;
                numbersScaler = function(el) {
                    return fitTextInsideBox(el, (cn.bulletNumberDomainSize - padding) * size.w, size.h);
                };
            }
        }

        // Draw numbers
        drawNumbers(gd, plotGroup, cd, {
            numbersX: numbersX,
            numbersY: numbersY,
            numbersScaler: numbersScaler,
            transitionOpts: transitionOpts,
            onComplete: onComplete
        });

        // Reexpress our gauge background attributes for drawing
        var gaugeBg, gaugeOutline;
        if(hasGauge) {
            gaugeBg = {
                range: trace.gauge.axis.range,
                color: trace.gauge.bgcolor,
                line: {
                    color: trace.gauge.bordercolor,
                    width: 0
                },
                thickness: 1
            };

            gaugeOutline = {
                range: trace.gauge.axis.range,
                color: 'rgba(0, 0, 0, 0)',
                line: {
                    color: trace.gauge.bordercolor,
                    width: trace.gauge.borderwidth
                },
                thickness: 1
            };
        }

        // Prepare angular gauge layers
        var angularGauge = plotGroup.selectAll('g.angular').data(isAngular ? cd : []);
        angularGauge.exit().remove();
        var angularaxisLayer = plotGroup.selectAll('g.angularaxis').data(isAngular ? cd : []);
        angularaxisLayer.exit().remove();

        if(isAngular) {
            drawAngularGauge(gd, plotGroup, cd, {
                radius: radius,
                innerRadius: innerRadius,

                gauge: angularGauge,
                layer: angularaxisLayer,
                size: size,
                gaugeBg: gaugeBg,
                gaugeOutline: gaugeOutline,
                transitionOpts: transitionOpts,
                onComplete: onComplete
            });
        }

        // Prepare bullet layers
        var bulletGauge = plotGroup.selectAll('g.bullet').data(isBullet ? cd : []);
        bulletGauge.exit().remove();
        var bulletaxisLayer = plotGroup.selectAll('g.bulletaxis').data(isBullet ? cd : []);
        bulletaxisLayer.exit().remove();

        if(isBullet) {
            drawBulletGauge(gd, plotGroup, cd, {
                gauge: bulletGauge,
                layer: bulletaxisLayer,
                size: size,
                gaugeBg: gaugeBg,
                gaugeOutline: gaugeOutline,
                transitionOpts: transitionOpts,
                onComplete: onComplete
            });
        }

        // title
        var title = plotGroup.selectAll('text.title').data(cd);
        title.exit().remove();
        title.enter().append('text').classed('title', true);
        title
            .attr('text-anchor', function() {
                return isBullet ? anchor.right : anchor[trace.title.align];
            })
            .text(trace.title.text)
            .call(Drawing.font, trace.title.font)
            .call(svgTextUtils.convertToTspans, gd);

        // Position title
        title.attr('transform', function() {
            var titleX = size.l + size.w * position[trace.title.align];
            var titleY;
            var titlePadding = cn.titlePadding;
            var titlebBox = Drawing.bBox(title.node());
            if(hasGauge) {
                if(isAngular) {
                    // position above axis ticks/labels
                    if(trace.gauge.axis.visible) {
                        var bBox = Drawing.bBox(angularaxisLayer.node());
                        titleY = (bBox.top - titlePadding) - titlebBox.bottom;
                    } else {
                        titleY = size.t + size.h / 2 - radius / 2 - titlebBox.bottom - titlePadding;
                    }
                }
                if(isBullet) {
                    // position outside domain
                    titleY = numbersY - (titlebBox.top + titlebBox.bottom) / 2;
                    titleX = size.l - cn.bulletPadding * size.w; // Outside domain, on the left
                }
            } else {
                // position above numbers
                titleY = (trace._numbersTop - titlePadding) - titlebBox.bottom;
            }
            return strTranslate(titleX, titleY);
        });
    });
};

function drawBulletGauge(gd, plotGroup, cd, opts) {
    var trace = cd[0].trace;

    var bullet = opts.gauge;
    var axisLayer = opts.layer;
    var gaugeBg = opts.gaugeBg;
    var gaugeOutline = opts.gaugeOutline;
    var size = opts.size;
    var domain = trace.domain;

    var transitionOpts = opts.transitionOpts;
    var onComplete = opts.onComplete;

    // preparing axis
    var ax, vals, transFn, tickSign, shift;

    // Enter bullet, axis
    bullet.enter().append('g').classed('bullet', true);
    bullet.attr('transform', strTranslate(size.l, size.t));

    axisLayer.enter().append('g')
        .classed('bulletaxis', true)
        .classed('crisp', true);
    axisLayer.selectAll('g.' + 'xbulletaxis' + 'tick,path,text').remove();

    // Draw bullet
    var bulletHeight = size.h; // use all vertical domain
    var innerBulletHeight = trace.gauge.bar.thickness * bulletHeight;
    var bulletLeft = domain.x[0];
    var bulletRight = domain.x[0] + (domain.x[1] - domain.x[0]) * ((trace._hasNumber || trace._hasDelta) ? (1 - cn.bulletNumberDomainSize) : 1);

    ax = mockAxis(gd, trace.gauge.axis);
    ax._id = 'xbulletaxis';
    ax.domain = [bulletLeft, bulletRight];
    ax.setScale();

    vals = Axes.calcTicks(ax);
    transFn = Axes.makeTransTickFn(ax);
    tickSign = Axes.getTickSigns(ax)[2];

    shift = size.t + size.h;
    if(ax.visible) {
        Axes.drawTicks(gd, ax, {
            vals: ax.ticks === 'inside' ? Axes.clipEnds(ax, vals) : vals,
            layer: axisLayer,
            path: Axes.makeTickPath(ax, shift, tickSign),
            transFn: transFn
        });

        Axes.drawLabels(gd, ax, {
            vals: vals,
            layer: axisLayer,
            transFn: transFn,
            labelFns: Axes.makeLabelFns(ax, shift)
        });
    }

    function drawRect(s) {
        s
            .attr('width', function(d) { return Math.max(0, ax.c2p(d.range[1]) - ax.c2p(d.range[0]));})
            .attr('x', function(d) { return ax.c2p(d.range[0]);})
            .attr('y', function(d) { return 0.5 * (1 - d.thickness) * bulletHeight;})
            .attr('height', function(d) { return d.thickness * bulletHeight; });
    }

    // Draw bullet background, steps
    var boxes = [gaugeBg].concat(trace.gauge.steps);
    var bgBullet = bullet.selectAll('g.bg-bullet').data(boxes);
    bgBullet.enter().append('g').classed('bg-bullet', true).append('rect');
    bgBullet.select('rect')
        .call(drawRect)
        .call(styleShape);
    bgBullet.exit().remove();

    // Draw value bar with transitions
    var fgBullet = bullet.selectAll('g.value-bullet').data([trace.gauge.bar]);
    fgBullet.enter().append('g').classed('value-bullet', true).append('rect');
    fgBullet.select('rect')
        .attr('height', innerBulletHeight)
        .attr('y', (bulletHeight - innerBulletHeight) / 2)
        .call(styleShape);
    if(hasTransition(transitionOpts)) {
        fgBullet.select('rect')
            .transition()
            .duration(transitionOpts.duration)
            .ease(transitionOpts.easing)
            .each('end', function() { onComplete && onComplete(); })
            .each('interrupt', function() { onComplete && onComplete(); })
            .attr('width', Math.max(0, ax.c2p(Math.min(trace.gauge.axis.range[1], cd[0].y))));
    } else {
        fgBullet.select('rect')
            .attr('width', typeof cd[0].y === 'number' ?
                Math.max(0, ax.c2p(Math.min(trace.gauge.axis.range[1], cd[0].y))) :
                0);
    }
    fgBullet.exit().remove();

    var data = cd.filter(function() {return trace.gauge.threshold.value || trace.gauge.threshold.value === 0;});
    var threshold = bullet.selectAll('g.threshold-bullet').data(data);
    threshold.enter().append('g').classed('threshold-bullet', true).append('line');
    threshold.select('line')
        .attr('x1', ax.c2p(trace.gauge.threshold.value))
        .attr('x2', ax.c2p(trace.gauge.threshold.value))
        .attr('y1', (1 - trace.gauge.threshold.thickness) / 2 * bulletHeight)
        .attr('y2', (1 - (1 - trace.gauge.threshold.thickness) / 2) * bulletHeight)
        .call(Color.stroke, trace.gauge.threshold.line.color)
        .style('stroke-width', trace.gauge.threshold.line.width);
    threshold.exit().remove();

    var bulletOutline = bullet.selectAll('g.gauge-outline').data([gaugeOutline]);
    bulletOutline.enter().append('g').classed('gauge-outline', true).append('rect');
    bulletOutline.select('rect')
        .call(drawRect)
        .call(styleShape);
    bulletOutline.exit().remove();
}

function drawAngularGauge(gd, plotGroup, cd, opts) {
    var trace = cd[0].trace;

    var size = opts.size;
    var radius = opts.radius;
    var innerRadius = opts.innerRadius;
    var gaugeBg = opts.gaugeBg;
    var gaugeOutline = opts.gaugeOutline;
    var gaugePosition = [size.l + size.w / 2, size.t + size.h / 2 + radius / 2];
    var gauge = opts.gauge;
    var axisLayer = opts.layer;

    var transitionOpts = opts.transitionOpts;
    var onComplete = opts.onComplete;

    // circular gauge
    var theta = Math.PI / 2;
    function valueToAngle(v) {
        var min = trace.gauge.axis.range[0];
        var max = trace.gauge.axis.range[1];
        var angle = (v - min) / (max - min) * Math.PI - theta;
        if(angle < -theta) return -theta;
        if(angle > theta) return theta;
        return angle;
    }

    function arcPathGenerator(size) {
        return d3.svg.arc()
                  .innerRadius((innerRadius + radius) / 2 - size / 2 * (radius - innerRadius))
                  .outerRadius((innerRadius + radius) / 2 + size / 2 * (radius - innerRadius))
                  .startAngle(-theta);
    }

    function drawArc(p) {
        p
            .attr('d', function(d) {
                return arcPathGenerator(d.thickness)
                  .startAngle(valueToAngle(d.range[0]))
                  .endAngle(valueToAngle(d.range[1]))();
            });
    }

    // preparing axis
    var ax, vals, transFn, tickSign;

    // Enter gauge and axis
    gauge.enter().append('g').classed('angular', true);
    gauge.attr('transform', strTranslate(gaugePosition[0], gaugePosition[1]));

    axisLayer.enter().append('g')
        .classed('angularaxis', true)
        .classed('crisp', true);
    axisLayer.selectAll('g.' + 'xangularaxis' + 'tick,path,text').remove();

    ax = mockAxis(gd, trace.gauge.axis);
    ax.type = 'linear';
    ax.range = trace.gauge.axis.range;
    ax._id = 'xangularaxis'; // or 'y', but I don't think this makes a difference here
    ax.ticklabeloverflow = 'allow';
    ax.setScale();

    // 't'ick to 'g'eometric radians is used all over the place here
    var t2g = function(d) {
        return (ax.range[0] - d.x) / (ax.range[1] - ax.range[0]) * Math.PI + Math.PI;
    };

    var labelFns = {};
    var out = Axes.makeLabelFns(ax, 0);
    var labelStandoff = out.labelStandoff;
    labelFns.xFn = function(d) {
        var rad = t2g(d);
        return Math.cos(rad) * labelStandoff;
    };
    labelFns.yFn = function(d) {
        var rad = t2g(d);
        var ff = Math.sin(rad) > 0 ? 0.2 : 1;
        return -Math.sin(rad) * (labelStandoff + d.fontSize * ff) +
                Math.abs(Math.cos(rad)) * (d.fontSize * MID_SHIFT);
    };
    labelFns.anchorFn = function(d) {
        var rad = t2g(d);
        var cos = Math.cos(rad);
        return Math.abs(cos) < 0.1 ?
                'middle' :
                (cos > 0 ? 'start' : 'end');
    };
    labelFns.heightFn = function(d, a, h) {
        var rad = t2g(d);
        return -0.5 * (1 + Math.sin(rad)) * h;
    };
    var _transFn = function(rad) {
        return strTranslate(
            gaugePosition[0] + radius * Math.cos(rad),
            gaugePosition[1] - radius * Math.sin(rad)
        );
    };
    transFn = function(d) {
        return _transFn(t2g(d));
    };
    var transFn2 = function(d) {
        var rad = t2g(d);
        return _transFn(rad) + 'rotate(' + -rad2deg(rad) + ')';
    };
    vals = Axes.calcTicks(ax);
    tickSign = Axes.getTickSigns(ax)[2];
    if(ax.visible) {
        tickSign = ax.ticks === 'inside' ? -1 : 1;
        var pad = (ax.linewidth || 1) / 2;
        Axes.drawTicks(gd, ax, {
            vals: vals,
            layer: axisLayer,
            path: 'M' + (tickSign * pad) + ',0h' + (tickSign * ax.ticklen),
            transFn: transFn2
        });
        Axes.drawLabels(gd, ax, {
            vals: vals,
            layer: axisLayer,
            transFn: transFn,
            labelFns: labelFns
        });
    }

    // Draw background + steps
    var arcs = [gaugeBg].concat(trace.gauge.steps);
    var bgArc = gauge.selectAll('g.bg-arc').data(arcs);
    bgArc.enter().append('g').classed('bg-arc', true).append('path');
    bgArc.select('path').call(drawArc).call(styleShape);
    bgArc.exit().remove();

    // Draw foreground with transition
    var valueArcPathGenerator = arcPathGenerator(trace.gauge.bar.thickness);
    var valueArc = gauge.selectAll('g.value-arc').data([trace.gauge.bar]);
    valueArc.enter().append('g').classed('value-arc', true).append('path');
    var valueArcPath = valueArc.select('path');
    if(hasTransition(transitionOpts)) {
        valueArcPath
            .transition()
            .duration(transitionOpts.duration)
            .ease(transitionOpts.easing)
            .each('end', function() { onComplete && onComplete(); })
            .each('interrupt', function() { onComplete && onComplete(); })
            .attrTween('d', arcTween(valueArcPathGenerator, valueToAngle(cd[0].lastY), valueToAngle(cd[0].y)));
        trace._lastValue = cd[0].y;
    } else {
        valueArcPath.attr('d', typeof cd[0].y === 'number' ?
            valueArcPathGenerator.endAngle(valueToAngle(cd[0].y)) :
            'M0,0Z');
    }
    valueArcPath.call(styleShape);
    valueArc.exit().remove();

    // Draw threshold
    arcs = [];
    var v = trace.gauge.threshold.value;
    if(v || v === 0) {
        arcs.push({
            range: [v, v],
            color: trace.gauge.threshold.color,
            line: {
                color: trace.gauge.threshold.line.color,
                width: trace.gauge.threshold.line.width
            },
            thickness: trace.gauge.threshold.thickness
        });
    }
    var thresholdArc = gauge.selectAll('g.threshold-arc').data(arcs);
    thresholdArc.enter().append('g').classed('threshold-arc', true).append('path');
    thresholdArc.select('path').call(drawArc).call(styleShape);
    thresholdArc.exit().remove();

    // Draw border last
    var gaugeBorder = gauge.selectAll('g.gauge-outline').data([gaugeOutline]);
    gaugeBorder.enter().append('g').classed('gauge-outline', true).append('path');
    gaugeBorder.select('path').call(drawArc).call(styleShape);
    gaugeBorder.exit().remove();
}

function drawNumbers(gd, plotGroup, cd, opts) {
    var trace = cd[0].trace;

    var numbersX = opts.numbersX;
    var numbersY = opts.numbersY;
    var numbersAlign = trace.align || 'center';
    var numbersAnchor = anchor[numbersAlign];

    var transitionOpts = opts.transitionOpts;
    var onComplete = opts.onComplete;

    var numbers = Lib.ensureSingle(plotGroup, 'g', 'numbers');
    var bignumberbBox, deltabBox;
    var numbersbBox;

    var data = [];
    if(trace._hasNumber) data.push('number');
    if(trace._hasDelta) {
        data.push('delta');
        if(trace.delta.position === 'left') data.reverse();
    }
    var sel = numbers.selectAll('text').data(data);
    sel.enter().append('text');
    sel
        .attr('text-anchor', function() {return numbersAnchor;})
        .attr('class', function(d) { return d;})
        .attr('x', null)
        .attr('y', null)
        .attr('dx', null)
        .attr('dy', null);
    sel.exit().remove();

    // Function to override the number formatting used during transitions
    function transitionFormat(valueformat, fmt, from, to) {
        // For now, do not display SI prefix if start and end value do not have any
        if(valueformat.match('s') && // If using SI prefix
            (from >= 0 !== to >= 0) && // If sign change
            (!fmt(from).slice(-1).match(SI_PREFIX) && !fmt(to).slice(-1).match(SI_PREFIX)) // Has no SI prefix
        ) {
            var transitionValueFormat = valueformat.slice().replace('s', 'f').replace(/\d+/, function(m) { return parseInt(m) - 1;});
            var transitionAx = mockAxis(gd, {tickformat: transitionValueFormat});
            return function(v) {
                // Switch to fixed precision if number is smaller than one
                if(Math.abs(v) < 1) return Axes.tickText(transitionAx, v).text;
                return fmt(v);
            };
        } else {
            return fmt;
        }
    }

    function drawBignumber() {
        var bignumberAx = mockAxis(gd, {tickformat: trace.number.valueformat}, trace._range);
        bignumberAx.setScale();
        Axes.prepTicks(bignumberAx);

        var bignumberFmt = function(v) { return Axes.tickText(bignumberAx, v).text;};
        var bignumberSuffix = trace.number.suffix;
        var bignumberPrefix = trace.number.prefix;

        var number = numbers.select('text.number');

        function writeNumber() {
            var txt = typeof cd[0].y === 'number' ?
                bignumberPrefix + bignumberFmt(cd[0].y) + bignumberSuffix :
                '-';
            number.text(txt)
                .call(Drawing.font, trace.number.font)
                .call(svgTextUtils.convertToTspans, gd);
        }

        if(hasTransition(transitionOpts)) {
            number
                .transition()
                .duration(transitionOpts.duration)
                .ease(transitionOpts.easing)
                .each('end', function() { writeNumber(); onComplete && onComplete(); })
                .each('interrupt', function() { writeNumber(); onComplete && onComplete(); })
                .attrTween('text', function() {
                    var that = d3.select(this);
                    var interpolator = interpolateNumber(cd[0].lastY, cd[0].y);
                    trace._lastValue = cd[0].y;

                    var transitionFmt = transitionFormat(trace.number.valueformat, bignumberFmt, cd[0].lastY, cd[0].y);
                    return function(t) {
                        that.text(bignumberPrefix + transitionFmt(interpolator(t)) + bignumberSuffix);
                    };
                });
        } else {
            writeNumber();
        }

        bignumberbBox = measureText(bignumberPrefix + bignumberFmt(cd[0].y) + bignumberSuffix, trace.number.font, numbersAnchor, gd);
        return number;
    }

    function drawDelta() {
        var deltaAx = mockAxis(gd, {tickformat: trace.delta.valueformat}, trace._range);
        deltaAx.setScale();
        Axes.prepTicks(deltaAx);

        var deltaFmt = function(v) { return Axes.tickText(deltaAx, v).text;};
        var deltaSuffix = trace.delta.suffix;
        var deltaPrefix = trace.delta.prefix;

        var deltaValue = function(d) {
            var value = trace.delta.relative ? d.relativeDelta : d.delta;
            return value;
        };
        var deltaFormatText = function(value, numberFmt) {
            if(value === 0 || typeof value !== 'number' || isNaN(value)) return '-';
            return (value > 0 ? trace.delta.increasing.symbol : trace.delta.decreasing.symbol) + deltaPrefix + numberFmt(value) + deltaSuffix;
        };
        var deltaFill = function(d) {
            return d.delta >= 0 ? trace.delta.increasing.color : trace.delta.decreasing.color;
        };
        if(trace._deltaLastValue === undefined) {
            trace._deltaLastValue = deltaValue(cd[0]);
        }
        var delta = numbers.select('text.delta');
        delta
            .call(Drawing.font, trace.delta.font)
            .call(Color.fill, deltaFill({delta: trace._deltaLastValue}));

        function writeDelta() {
            delta.text(deltaFormatText(deltaValue(cd[0]), deltaFmt))
                .call(Color.fill, deltaFill(cd[0]))
                .call(svgTextUtils.convertToTspans, gd);
        }

        if(hasTransition(transitionOpts)) {
            delta
                .transition()
                .duration(transitionOpts.duration)
                .ease(transitionOpts.easing)
                .tween('text', function() {
                    var that = d3.select(this);
                    var to = deltaValue(cd[0]);
                    var from = trace._deltaLastValue;
                    var transitionFmt = transitionFormat(trace.delta.valueformat, deltaFmt, from, to);
                    var interpolator = interpolateNumber(from, to);
                    trace._deltaLastValue = to;
                    return function(t) {
                        that.text(deltaFormatText(interpolator(t), transitionFmt));
                        that.call(Color.fill, deltaFill({delta: interpolator(t)}));
                    };
                })
                .each('end', function() { writeDelta(); onComplete && onComplete(); })
                .each('interrupt', function() { writeDelta(); onComplete && onComplete(); });
        } else {
            writeDelta();
        }

        deltabBox = measureText(deltaFormatText(deltaValue(cd[0]), deltaFmt), trace.delta.font, numbersAnchor, gd);
        return delta;
    }

    var key = trace.mode + trace.align;
    var delta;
    if(trace._hasDelta) {
        delta = drawDelta();
        key += trace.delta.position + trace.delta.font.size + trace.delta.font.family + trace.delta.valueformat;
        key += trace.delta.increasing.symbol + trace.delta.decreasing.symbol;
        numbersbBox = deltabBox;
    }
    if(trace._hasNumber) {
        drawBignumber();
        key += trace.number.font.size + trace.number.font.family + trace.number.valueformat + trace.number.suffix + trace.number.prefix;
        numbersbBox = bignumberbBox;
    }

    // Position delta relative to bignumber
    if(trace._hasDelta && trace._hasNumber) {
        var bignumberCenter = [
            (bignumberbBox.left + bignumberbBox.right) / 2,
            (bignumberbBox.top + bignumberbBox.bottom) / 2
        ];
        var deltaCenter = [
            (deltabBox.left + deltabBox.right) / 2,
            (deltabBox.top + deltabBox.bottom) / 2
        ];

        var dx, dy;
        var padding = 0.75 * trace.delta.font.size;
        if(trace.delta.position === 'left') {
            dx = cache(trace, 'deltaPos', 0, -1 * (bignumberbBox.width * (position[trace.align]) + deltabBox.width * (1 - position[trace.align]) + padding), key, Math.min);
            dy = bignumberCenter[1] - deltaCenter[1];

            numbersbBox = {
                width: bignumberbBox.width + deltabBox.width + padding,
                height: Math.max(bignumberbBox.height, deltabBox.height),
                left: deltabBox.left + dx,
                right: bignumberbBox.right,
                top: Math.min(bignumberbBox.top, deltabBox.top + dy),
                bottom: Math.max(bignumberbBox.bottom, deltabBox.bottom + dy)
            };
        }
        if(trace.delta.position === 'right') {
            dx = cache(trace, 'deltaPos', 0, bignumberbBox.width * (1 - position[trace.align]) + deltabBox.width * position[trace.align] + padding, key, Math.max);
            dy = bignumberCenter[1] - deltaCenter[1];

            numbersbBox = {
                width: bignumberbBox.width + deltabBox.width + padding,
                height: Math.max(bignumberbBox.height, deltabBox.height),
                left: bignumberbBox.left,
                right: deltabBox.right + dx,
                top: Math.min(bignumberbBox.top, deltabBox.top + dy),
                bottom: Math.max(bignumberbBox.bottom, deltabBox.bottom + dy)
            };
        }
        if(trace.delta.position === 'bottom') {
            dx = null;
            dy = deltabBox.height;

            numbersbBox = {
                width: Math.max(bignumberbBox.width, deltabBox.width),
                height: bignumberbBox.height + deltabBox.height,
                left: Math.min(bignumberbBox.left, deltabBox.left),
                right: Math.max(bignumberbBox.right, deltabBox.right),
                top: bignumberbBox.bottom - bignumberbBox.height,
                bottom: bignumberbBox.bottom + deltabBox.height
            };
        }
        if(trace.delta.position === 'top') {
            dx = null;
            dy = bignumberbBox.top;

            numbersbBox = {
                width: Math.max(bignumberbBox.width, deltabBox.width),
                height: bignumberbBox.height + deltabBox.height,
                left: Math.min(bignumberbBox.left, deltabBox.left),
                right: Math.max(bignumberbBox.right, deltabBox.right),
                top: bignumberbBox.bottom - bignumberbBox.height - deltabBox.height,
                bottom: bignumberbBox.bottom
            };
        }

        delta.attr({dx: dx, dy: dy});
    }

    // Resize numbers to fit within space and position
    if(trace._hasNumber || trace._hasDelta) {
        numbers.attr('transform', function() {
            var m = opts.numbersScaler(numbersbBox);
            key += m[2];
            var scaleRatio = cache(trace, 'numbersScale', 1, m[0], key, Math.min);
            var translateY;
            if(!trace._scaleNumbers) scaleRatio = 1;
            if(trace._isAngular) {
                // align vertically to bottom
                translateY = numbersY - scaleRatio * numbersbBox.bottom;
            } else {
                // align vertically to center
                translateY = numbersY - scaleRatio * (numbersbBox.top + numbersbBox.bottom) / 2;
            }

            // Stash the top position of numbersbBox for title positioning
            trace._numbersTop = scaleRatio * (numbersbBox.top) + translateY;

            var ref = numbersbBox[numbersAlign];
            if(numbersAlign === 'center') ref = (numbersbBox.left + numbersbBox.right) / 2;
            var translateX = numbersX - scaleRatio * ref;

            // Stash translateX
            translateX = cache(trace, 'numbersTranslate', 0, translateX, key, Math.max);
            return strTranslate(translateX, translateY) + strScale(scaleRatio);
        });
    }
}

// Apply fill, stroke, stroke-width to SVG shape
function styleShape(p) {
    p
        .each(function(d) { Color.stroke(d3.select(this), d.line.color);})
        .each(function(d) { Color.fill(d3.select(this), d.color);})
        .style('stroke-width', function(d) { return d.line.width;});
}

// Returns a tween for a transition’s "d" attribute, transitioning any selected
// arcs from their current angle to the specified new angle.
function arcTween(arc, endAngle, newAngle) {
    return function() {
        var interp = interpolate(endAngle, newAngle);
        return function(t) {
            return arc.endAngle(interp(t))();
        };
    };
}

// mocks our axis
function mockAxis(gd, opts, zrange) {
    var fullLayout = gd._fullLayout;

    var axisIn = Lib.extendFlat({
        type: 'linear',
        ticks: 'outside',
        range: zrange,
        showline: true
    }, opts);

    var axisOut = {
        type: 'linear',
        _id: 'x' + opts._id
    };

    var axisOptions = {
        letter: 'x',
        font: fullLayout.font,
        noAutotickangles: true,
        noHover: true,
        noTickson: true
    };

    function coerce(attr, dflt) {
        return Lib.coerce(axisIn, axisOut, axisLayoutAttrs, attr, dflt);
    }

    handleAxisDefaults(axisIn, axisOut, coerce, axisOptions, fullLayout);
    handleAxisPositionDefaults(axisIn, axisOut, coerce, axisOptions);

    return axisOut;
}

function fitTextInsideBox(textBB, width, height) {
    // compute scaling ratio to have text fit within specified width and height
    var ratio = Math.min(width / textBB.width, height / textBB.height);
    return [ratio, textBB, width + 'x' + height];
}

function fitTextInsideCircle(textBB, radius) {
    // compute scaling ratio to have text fit within specified radius
    var elRadius = Math.sqrt((textBB.width / 2) * (textBB.width / 2) + textBB.height * textBB.height);
    var ratio = radius / elRadius;
    return [ratio, textBB, radius];
}

function measureText(txt, font, textAnchor, gd) {
    var element = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    var sel = d3.select(element);
    sel.text(txt)
      .attr('x', 0)
      .attr('y', 0)
      .attr('text-anchor', textAnchor)
      .attr('data-unformatted', txt)
      .call(svgTextUtils.convertToTspans, gd)
      .call(Drawing.font, font);
    return Drawing.bBox(sel.node());
}

function cache(trace, name, initialValue, value, key, fn) {
    var objName = '_cache' + name;
    if(!(trace[objName] && trace[objName].key === key)) {
        trace[objName] = {key: key, value: initialValue};
    }
    var v = Lib.aggNums(fn, null, [trace[objName].value, value], 2);
    trace[objName].value = v;

    return v;
}
