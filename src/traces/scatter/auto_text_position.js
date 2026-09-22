'use strict';

const d3 = require('@plotly/d3');
const Lib = require('../../lib');
const Drawing = require('../../components/drawing');
const subTypes = require('./subtypes');

/**
 * Resolve the *auto* text positions of all scatter traces on one subplot.
 *
 * Every drawn marker and every label with a fixed position blocks the *auto*
 * labels, which `Lib.placeLabels` then places by `textpriority`, trace order,
 * and data order.
 *
 * Sets `_tpAuto`, `_tpAutoGap`, and `_tpAutoLeader` on every calcdata point
 * with an *auto* position and repositions its `<text>` node. Does nothing
 * when no trace of the subplot uses *auto*.
 *
 * A label that MathJax has not rendered yet has no box, so it is skipped,
 * and the whole pass runs again once every pending render is done.
 *
 * @param gd - the graph div
 * @param plotinfo - the subplot, with `xaxis` and `yaxis`
 * @param traceGroups - d3 selection of the `g.trace` groups, bound to calcdata
 */
module.exports = function autoTextPosition(gd, plotinfo, traceGroups) {
    let hasAuto = false;
    traceGroups.each((cd) => {
        const trace = cd[0].trace;
        if (trace.visible === true && hasAutoTextPosition(trace)) hasAuto = true;
    });
    if (!hasAuto) return;

    const xa = plotinfo.xaxis;
    const ya = plotinfo.yaxis;
    const markers = [];
    const fixed = [];
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
                priority: Lib.extractOption(d, trace, 'tP', 'textpriority'),
                onPoint,
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
