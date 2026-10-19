'use strict';

const d3 = require('@plotly/d3');
const Lib = require('../../lib');
const Drawing = require('../../components/drawing');
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
 * Sets `_tpAuto`, `_tpAutoGap`, and `_tpAutoLeader` on every calcdata point
 * with an *auto* position and repositions its `<text>` node. Does nothing
 * when no trace of the subplot uses *auto*, or in the plot of a range slider,
 * where labels are never placed.
 *
 * A label that MathJax has not rendered yet has no box, so it is skipped,
 * and the whole pass runs again once every pending render is done.
 *
 * @param gd - the graph div
 * @param plotinfo - the subplot, with `xaxis` and `yaxis`, and optional `axisLayers`, the d3 selections
 *   of the axis layers that sit inside the plot area
 * @param traceGroups - d3 selection of the `g.trace` groups, bound to calcdata
 */
module.exports = function autoTextPosition(gd, plotinfo, traceGroups) {
    // The slider shares the calcdata with the main plot, so a pass here would replace the main plot's results
    if (plotinfo.isRangePlot) return;

    let hasAuto = false;
    traceGroups.each((cd) => {
        const trace = cd[0].trace;
        if (trace.visible === true && hasAutoTextPosition(trace)) hasAuto = true;
    });
    if (!hasAuto) return;

    const xa = plotinfo.xaxis;
    const ya = plotinfo.yaxis;
    const markers = [];
    // Read the axis text before the label measurements, which write to the tester and force a layout each
    const fixed = axisTextBoxes(plotinfo.axisLayers, traceGroups.node());
    const labels = [];
    let pending = false;

    traceGroups.each(function (cd) {
        const trace = cd[0].trace;
        if (trace.visible !== true) return;

        const hasMarkers = subTypes.hasMarkers(trace);
        const tr = d3.select(this);

        if (hasMarkers) {
            tr.selectAll('path.point').each((d) => {
                const x = xa.c2p(d.x);
                const y = ya.c2p(d.y);
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
            const x = xa.c2p(d.x);
            const y = ya.c2p(d.y);
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
                rect: labelRect(d, trace, x, y, Drawing.textPointBBox(tx))
            };

            if (pos === 'auto') {
                labels.push(label);
            } else {
                const box = label.rect(pos, 0);
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
        Drawing.textPointPosition(label.tx, d, label.trace, d.mrc);
    }

    if (pending) {
        gd._promises.push(Promise.all(gd._promises).then(() => autoTextPosition(gd, plotinfo, traceGroups)));
    }
};

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
    return tp === 'auto' || (Lib.isArrayOrTypedArray(tp) && tp.indexOf('auto') !== -1);
}

// the box of a label at a given position and gap, plus its leader line, in the plot frame
function labelRect(d, trace, x, y, bb) {
    const symbol = d.mx || (trace.marker || {}).symbol;

    return (pos, gap) => {
        const offset = Drawing.textPointBoxOffset(pos, d.mrc, symbol, bb, gap);

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
    };
}
