'use strict';

const d3 = require('@plotly/d3');
const Lib = require('../../lib');
const Drawing = require('../../components/drawing');
const Axes = require('../../plots/cartesian/axes');
const subTypes = require('./subtypes');
const isNumeric = require('fast-isnumeric');
const { textrank } = require('./attributes');

/**
 * Resolve the *auto* text positions of all scatter traces on one subplot.
 *
 * Every drawn marker and every label with a fixed position blocks the *auto*
 * labels, which `Lib.placeLabels` then places by `textrank`, trace order,
 * and data order. The text in `plotinfo.axisLayers` blocks them too.
 *
 * A cartesian `plot` call draws one zorder group, one carpet, or one overlaid subplot.
 * So the pass covers every scatter trace in the plot area of `plotinfo`,
 * with the axes of its own subplot. The pass of the last group sees all traces,
 * and `_tpAuto` keeps the labels of the earlier passes in place where it can.
 *
 * Sets `_tpAuto`, `_tpAutoGap`, `_tpAutoLeader`, and `_tpAutoRadius` on every calcdata point
 * with an *auto* position and repositions its `<text>` node. Does nothing
 * when no trace of the plot area uses *auto*, or in the plot of a range slider,
 * where labels are never placed.
 *
 * A label that MathJax has not rendered yet has no box, so it is skipped,
 * and the whole pass runs again once every pending render is done.
 *
 * @param gd - the graph div
 * @param plotinfo - the subplot, with `xaxis` and `yaxis`, and optional `axisLayers`, the d3 selections
 *   of the layers with text inside the plot area. A cartesian pass adds the tick labels of its axes.
 * @param traceGroups - d3 selection of the `g.trace` groups, bound to calcdata
 */
module.exports = function autoTextPosition(gd, plotinfo, traceGroups) {
    // The slider shares the calcdata with the main plot, so a pass here would replace the main plot's results
    if (plotinfo.isRangePlot) return;

    const area = plotArea(gd, plotinfo, traceGroups);
    const hasAuto = area.traces.some(({ cd }) => cd[0].trace.visible === true && hasAutoTextPosition(cd[0].trace));
    if (!hasAuto) return;

    const xa = plotinfo.xaxis;
    const ya = plotinfo.yaxis;
    const markers = [];
    // Read the axis text before the label measurements, which write to the tester and force a layout each
    const fixed = axisTextBoxes(area.axisLayers, traceGroups.node());
    const labels = [];
    let pending = false;

    area.traces.forEach(({ cd, node, xaxis, yaxis }) => {
        const trace = cd[0].trace;
        if (trace.visible !== true) return;

        const hasMarkers = subTypes.hasMarkers(trace);
        const tr = d3.select(node);

        if (hasMarkers) {
            tr.selectAll('path.point').each((d) => {
                const x = xaxis.c2p(d.x);
                const y = yaxis.c2p(d.y);
                const r = d.mrc || 0;
                markers.push({ x0: x - r, y0: y - r, x1: x + r, y1: y + r, owner: d });
            });
        }

        if (!subTypes.hasText(trace)) return;

        // a label without a marker or a line can also sit on its point
        const onPoint = !hasMarkers && !subTypes.hasLines(trace);

        tr.selectAll('g.textpoint').each(function (d) {
            const g = d3.select(this);
            const tx = g.select('text');
            if (!tx.size()) return;

            // `convertToTspans` hides the tex source until MathJax replaces it
            if (tx.node().style.display === 'none' && !g.select('g.text-math-group').size()) {
                pending = true;
                return;
            }

            const pos = d.tp || trace.textposition;
            const rank = Lib.extractOption(d, trace, 'tR', 'textrank');
            const x = xaxis.c2p(d.x);
            const y = yaxis.c2p(d.y);
            const bb = Drawing.textPointBBox(tx);
            const label = {
                tx,
                trace,
                x,
                y,
                owner: d,
                radius: d.mrc || 0,
                fontSize: Drawing.textPointFontSize(d, trace),
                // `Lib.placeLabels` places the largest priority first and `textrank` puts the smallest rank first,
                // so the priority is the rank with its sign reversed.
                // A value that is not a number, or a point past the end of a short array, gets the default rank.
                priority: -(isNumeric(rank) ? +rank : textrank.dflt),
                onPoint,
                // `_tpAuto` survives a relayout, so a pan or zoom keeps the labels in place where it can
                prefer: d._tpAuto || undefined,
                preferGap: d._tpAutoGap,
                rect: labelRect(d, trace, x, y, bb)
            };

            if (pos === 'auto') {
                labels.push(label);
            } else {
                // `textPointPosition` stored the geometry that draws the fixed label
                const box = boxAt(x, y, bb, d._tpOffset);
                box.owner = d;
                fixed.push(box);
            }
        });
    });

    const results = Lib.placeLabels({ width: xa._length, height: ya._length, markers, fixed, labels });

    for (let i = 0; i < labels.length; i++) {
        const label = labels[i];
        const d = label.owner;
        const out = results[i];
        d._tpAuto = out ? out.position : null;
        d._tpAutoGap = out ? out.gap : 0;
        // in the plot frame, so the leader does not depend on the `<text>` node in mid-transition
        d._tpAutoLeader = out ? out.leader : null;
        // The marker radius of the leader, which a later draw can change with another marker size
        d._tpAutoRadius = label.radius;
        Drawing.textPointPosition(label.tx, d, label.trace, d.mrc);
    }

    if (pending) {
        gd._promises.push(Promise.all(gd._promises).then(() => autoTextPosition(gd, plotinfo, traceGroups)));
    }
};

/**
 * Collect the scatter traces that share the plot area of a subplot.
 *
 * A cartesian subplot shares its plot area with every trace on the same main axes.
 * These are the traces of the other zorder groups, of the overlaid axes, and of the carpets.
 * Any other subplot, such as polar or ternary, has only its own trace groups.
 *
 * @param gd - the graph div
 * @param plotinfo - the subplot, or the stand-in that a carpet trace passes
 * @param traceGroups - d3 selection of the `g.trace` groups of the calling `plot` call
 * @returns `traces`, the calcdata, `<g>` node, `xaxis` and `yaxis` of each trace,
 *   and `axisLayers`, the d3 selections of the axis text inside the plot area
 */
function plotArea(gd, plotinfo, traceGroups) {
    const isFigureAxis = (ax) => ax && ax._id && Axes.getFromId(gd, ax._id) === ax;

    // The axes of polar, ternary, and smith subplots are not axes of the figure
    if (!isFigureAxis(plotinfo.xaxis) || !isFigureAxis(plotinfo.yaxis)) {
        const traces = [];
        traceGroups.each(function (cd) {
            traces.push({ cd, node: this, xaxis: plotinfo.xaxis, yaxis: plotinfo.yaxis });
        });
        return { traces, axisLayers: plotinfo.axisLayers };
    }

    const fullLayout = gd._fullLayout;
    const mainAxis = (ax) => (ax.overlaying && Axes.getFromId(gd, ax.overlaying)) || ax;
    const mainX = mainAxis(plotinfo.xaxis);
    const mainY = mainAxis(plotinfo.yaxis);
    const traces = [];
    const axes = new Set([plotinfo.xaxis, plotinfo.yaxis]);

    fullLayout._cartesianlayer.selectAll('g.trace.scatter').each(function (cd) {
        // A group that the next draw removes belongs to an older calculation
        const trace = cd?.[0]?.trace;
        if (!trace || !gd._fullData.includes(trace)) return;

        // The axis objects of `trace._xA` and `trace._yA` can be older than the last relayout
        const axisOf = (letter) => {
            const id = cd[0].carpet ? cd[0].carpet[letter + 'axis'] || letter : trace[letter + 'axis'];
            return Axes.getFromId(gd, id);
        };
        const xaxis = axisOf('x');
        const yaxis = axisOf('y');
        if (!xaxis || !yaxis || mainAxis(xaxis) !== mainX || mainAxis(yaxis) !== mainY) return;

        traces.push({ cd, node: this, xaxis, yaxis });
        axes.add(xaxis);
        axes.add(yaxis);
    });

    // The tick labels that sit inside the plot area, and any other text that the caller passes
    const layers = new Set(plotinfo.axisLayers);
    axes.forEach((ax) => {
        if ((ax.ticklabelposition || '').includes('inside')) {
            layers.add(fullLayout._plots[ax._mainSubplot][ax._id.charAt(0) + 'axislayer']);
        }
    });
    return { traces, axisLayers: [...layers] };
}

/**
 * Measure the text in some axis layers, in the frame of the trace groups.
 *
 * Reads the rendered boxes, so the call forces a layout when the page has changes to lay out.
 *
 * @param layers - d3 selections of the axis layers, or undefined; an entry can be undefined or empty
 * @param frame - a `g.trace` node, whose user space holds the point positions
 * @returns the boxes as `{x0, y0, x1, y1}`, or none when the frame is not rendered
 */
function axisTextBoxes(layers, frame) {
    const boxes = [];
    // Skip the matrix without layers, because reading it forces a layout
    const ctm = layers?.length && frame?.getScreenCTM();
    if (!ctm || !ctm.a || !ctm.d) return boxes;

    for (const layer of layers) {
        if (!layer || layer.empty()) continue;
        // A MathJax render replaces its hidden `<text>` node
        layer.selectAll('text, g[class*="-math-group"]').each(function () {
            const r = this.getBoundingClientRect();
            if (!r.width || !r.height) return;
            boxes.push({
                x0: (r.left - ctm.e) / ctm.a,
                y0: (r.top - ctm.f) / ctm.d,
                x1: (r.right - ctm.e) / ctm.a,
                y1: (r.bottom - ctm.f) / ctm.d
            });
        });
    }
    return boxes;
}

function hasAutoTextPosition(trace) {
    const tp = trace.textposition;
    return tp === 'auto' || (Lib.isArrayOrTypedArray(tp) && tp.includes('auto'));
}

// The box of a label at a given offset, plus its leader line, in the plot frame
function boxAt(x, y, bb, offset) {
    let x0 = x + offset.dx;
    if (offset.anchor === 'end') x0 -= bb.width;
    else if (offset.anchor === 'middle') x0 -= bb.width / 2;
    const y0 = y + offset.dy + bb.top;

    const seg = offset.leader;
    return {
        x0,
        y0,
        x1: x0 + bb.width,
        y1: y0 + bb.height,
        leader: seg ? [x + seg[0], y + seg[1], x + seg[2], y + seg[3]] : null
    };
}

// The box of an *auto* label at a given position and gap
function labelRect(d, trace, x, y, bb) {
    const symbol = d.mx || (trace.marker || {}).symbol;
    return (pos, gap) => boxAt(x, y, bb, Drawing.textPointBoxOffset(pos, d.mrc, symbol, bb, gap));
}
