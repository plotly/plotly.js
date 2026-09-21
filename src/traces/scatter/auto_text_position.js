'use strict';

const d3 = require('@plotly/d3');
const Lib = require('../../lib');
const Drawing = require('../../components/drawing');
const svgTextUtils = require('../../lib/svg_text_utils');
const subTypes = require('./subtypes');

// candidate positions, in order of preference
const POSITIONS = [
    'top center',
    'bottom center',
    'middle right',
    'middle left',
    'top right',
    'top left',
    'bottom right',
    'bottom left'
];

// a label without a marker can also sit on its point
const POSITIONS_NO_MARKER = ['middle center', ...POSITIONS];

// ring 0 touches the point, every ring after it adds LEADER_STEP
// font sizes of distance and a leader line back to the point
const LEADER_RINGS = 6;
const LEADER_STEP = 1;

// a point with another marker or label within CLUSTER_GAP font sizes
// of its marker skips ring 0, so a leader line says which point is its own
const CLUSTER_GAP = 1.5;

// minimum px between a label and anything else
const PAD = 2;

// side of one cell of the spatial index, in px
const CELL_SIZE = 64;

/**
 * Resolve the *auto* text positions of all scatter traces on one subplot.
 *
 * Every label takes the first free candidate in a fixed order: the eight
 * positions next to the point first, then the same positions farther out
 * with a leader line. A point with a neighbor close by skips the positions
 * next to it, so the leader line shows which point the label belongs to.
 * A free candidate stays inside the plot area and hits no marker, no label
 * placed before it, and no leader line. A label with no free candidate is
 * hidden. Traces come in draw order and points in data order, so an earlier
 * point wins a contested spot.
 *
 * Sets `_tpAuto` and `_tpAutoGap` on every calcdata point with an *auto*
 * position and repositions its `<text>` node. Does nothing when no trace
 * of the subplot uses *auto*.
 *
 * @param plotinfo - the subplot, with `xaxis` and `yaxis`
 * @param traceGroups - d3 selection of the `g.trace` groups, bound to calcdata
 */
module.exports = function autoTextPosition(plotinfo, traceGroups) {
    let hasAuto = false;
    traceGroups.each((cd) => {
        const trace = cd[0].trace;
        if (trace.visible === true && hasAutoTextPosition(trace)) hasAuto = true;
    });
    if (!hasAuto) return;

    const xa = plotinfo.xaxis;
    const ya = plotinfo.yaxis;
    const index = makeIndex(xa._length, ya._length);
    const labels = [];

    traceGroups.each(function (cd) {
        const trace = cd[0].trace;
        if (trace.visible !== true) return;

        const hasMarkers = subTypes.hasMarkers(trace);
        const tr = d3.select(this);

        // every drawn marker blocks the labels of every trace
        if (hasMarkers) {
            tr.selectAll('path.point').each((d) => {
                const x = xa.c2p(d.x);
                const y = ya.c2p(d.y);
                const r = (d.mrc || 0) + PAD;
                insert(index, makeRect(x - r, y - r, x + r, y + r, d));
            });
        }

        if (!subTypes.hasText(trace)) return;

        const positions = hasMarkers ? POSITIONS : POSITIONS_NO_MARKER;

        tr.selectAll('g.textpoint').each(function (d) {
            const tx = d3.select(this).select('text');
            if (!tx.size()) return;

            const pos = d.tp || trace.textposition;
            const isAuto = pos === 'auto';
            if (isAuto) {
                // measure the label in its shown state
                d._tpAuto = undefined;
                d._tpAutoGap = 0;
                tx.style('display', null);
            }

            const label = {
                tx,
                d,
                trace,
                positions,
                x: xa.c2p(d.x),
                y: ya.c2p(d.y),
                fontSize: Drawing.textPointFontSize(d, trace),
                numLines: svgTextUtils.lineCount(tx),
                bb: Drawing.bBox(tx.node())
            };

            if (isAuto) labels.push(label);
            // a label with a fixed position blocks the *auto* labels
            else insert(index, labelRect(label, pos, 0));
        });
    });

    for (let i = 0; i < labels.length; i++) {
        place(index, labels[i]);
    }
};

function hasAutoTextPosition(trace) {
    const tp = trace.textposition;
    return tp === 'auto' || (Lib.isArrayOrTypedArray(tp) && tp.indexOf('auto') !== -1);
}

function place(index, label) {
    const d = label.d;
    const step = LEADER_STEP * label.fontSize;
    const rings = step ? LEADER_RINGS : 0;
    const firstRing = rings && isCrowded(index, label) ? 1 : 0;

    for (let ring = firstRing; ring <= rings; ring++) {
        const gap = ring * step;

        for (let k = 0; k < label.positions.length; k++) {
            const pos = label.positions[k];
            if (gap && pos === 'middle center') continue;

            const rect = labelRect(label, pos, gap);
            if (!rectIsFree(index, rect)) continue;
            if (rect.leader && !lineIsFree(index, rect.leader, label.x, label.y)) continue;

            insert(index, rect);
            if (rect.leader) insert(index, rect.leader);
            d._tpAuto = pos;
            d._tpAutoGap = gap;
            Drawing.textPointPosition(label.tx, d, label.trace, d.mrc);
            return;
        }
    }

    d._tpAuto = null;
    Drawing.textPointPosition(label.tx, d, label.trace, d.mrc);
}

// true when another marker or label sits close to the point of a label
function isCrowded(index, label) {
    const r = (label.d.mrc || 0) + CLUSTER_GAP * label.fontSize;
    const x0 = label.x - r;
    const y0 = label.y - r;
    const x1 = label.x + r;
    const y1 = label.y + r;

    const b = cellBounds(index, x0, y0, x1, y1);
    const cells = index.cells;

    for (let row = b[1]; row <= b[3]; row++) {
        for (let col = b[0]; col <= b[2]; col++) {
            const cell = cells[row * index.ncols + col];
            if (!cell) continue;

            for (let i = 0; i < cell.length; i++) {
                const ob = cell[i];
                if (ob.isLine || ob.owner === label.d) continue;
                if (ob.x0 < x1 && ob.x1 > x0 && ob.y0 < y1 && ob.y1 > y0) return true;
            }
        }
    }

    return false;
}

// the box of a label at a given position, plus its leader line if any
function labelRect(label, pos, gap) {
    const d = label.d;
    const bb = label.bb;
    const offset = Drawing.textPointOffset(pos, label.fontSize, d.mrc, label.numLines, gap);

    let x0 = label.x + offset.dx;
    if (offset.anchor === 'end') x0 -= bb.width;
    else if (offset.anchor === 'middle') x0 -= bb.width / 2;
    const y0 = label.y + offset.dy + bb.top;

    const rect = makeRect(x0, y0, x0 + bb.width, y0 + bb.height, d);

    const seg = offset.leader;
    if (seg) {
        rect.leader = makeLine(label.x + seg[0], label.y + seg[1], label.x + seg[2], label.y + seg[3], d);
    }

    return rect;
}

function makeRect(x0, y0, x1, y1, owner) {
    return { x0, y0, x1, y1, owner, isLine: false, leader: null };
}

function makeLine(x0, y0, x1, y1, owner) {
    return { x0, y0, x1, y1, owner, isLine: true, leader: null };
}

function makeIndex(width, height) {
    return {
        width,
        height,
        ncols: Math.max(1, Math.ceil(width / CELL_SIZE)),
        nrows: Math.max(1, Math.ceil(height / CELL_SIZE)),
        cells: []
    };
}

// the cells that cover a box, clamped to the grid, as [col0, row0, col1, row1]
function cellBounds(index, x0, y0, x1, y1) {
    const maxCol = index.ncols - 1;
    const maxRow = index.nrows - 1;
    return [
        Lib.constrain(Math.floor(Math.min(x0, x1) / CELL_SIZE), 0, maxCol),
        Lib.constrain(Math.floor(Math.min(y0, y1) / CELL_SIZE), 0, maxRow),
        Lib.constrain(Math.floor(Math.max(x0, x1) / CELL_SIZE), 0, maxCol),
        Lib.constrain(Math.floor(Math.max(y0, y1) / CELL_SIZE), 0, maxRow)
    ];
}

function insert(index, ob) {
    const b = cellBounds(index, ob.x0, ob.y0, ob.x1, ob.y1);
    const cells = index.cells;

    for (let row = b[1]; row <= b[3]; row++) {
        for (let col = b[0]; col <= b[2]; col++) {
            const id = row * index.ncols + col;
            if (!cells[id]) cells[id] = [];
            cells[id].push(ob);
        }
    }
}

// a label box is free when it stays inside the plot area
// and hits nothing but the marker of its own point
function rectIsFree(index, rect) {
    const x0 = rect.x0 - PAD;
    const y0 = rect.y0 - PAD;
    const x1 = rect.x1 + PAD;
    const y1 = rect.y1 + PAD;
    if (x0 < 0 || y0 < 0 || x1 > index.width || y1 > index.height) return false;

    const b = cellBounds(index, x0, y0, x1, y1);
    const cells = index.cells;

    for (let row = b[1]; row <= b[3]; row++) {
        for (let col = b[0]; col <= b[2]; col++) {
            const cell = cells[row * index.ncols + col];
            if (!cell) continue;

            for (let i = 0; i < cell.length; i++) {
                const ob = cell[i];
                if (ob.owner === rect.owner) continue;
                const hit = ob.isLine
                    ? lineHitsRect(ob, x0, y0, x1, y1)
                    : ob.x0 < x1 && ob.x1 > x0 && ob.y0 < y1 && ob.y1 > y0;
                if (hit) return false;
            }
        }
    }

    return true;
}

// a leader line is free when it crosses nothing but the marker of its own point
// and the obstacles that already cover the point (px, py), which no candidate can escape
function lineIsFree(index, line, px, py) {
    const b = cellBounds(index, line.x0, line.y0, line.x1, line.y1);
    const cells = index.cells;

    for (let row = b[1]; row <= b[3]; row++) {
        for (let col = b[0]; col <= b[2]; col++) {
            const cell = cells[row * index.ncols + col];
            if (!cell) continue;

            for (let i = 0; i < cell.length; i++) {
                const ob = cell[i];
                if (ob.owner === line.owner) continue;
                let hit;
                if (ob.isLine) {
                    hit = Lib.segmentsIntersect(line.x0, line.y0, line.x1, line.y1, ob.x0, ob.y0, ob.x1, ob.y1);
                } else if (!pointInRect(px, py, ob.x0, ob.y0, ob.x1, ob.y1)) {
                    hit = lineHitsRect(line, ob.x0, ob.y0, ob.x1, ob.y1);
                }
                if (hit) return false;
            }
        }
    }

    return true;
}

function lineHitsRect(line, x0, y0, x1, y1) {
    if (pointInRect(line.x0, line.y0, x0, y0, x1, y1)) return true;
    if (pointInRect(line.x1, line.y1, x0, y0, x1, y1)) return true;

    const { x0: ax, y0: ay, x1: bx, y1: by } = line;
    return !!(
        Lib.segmentsIntersect(ax, ay, bx, by, x0, y0, x1, y0) ||
        Lib.segmentsIntersect(ax, ay, bx, by, x1, y0, x1, y1) ||
        Lib.segmentsIntersect(ax, ay, bx, by, x1, y1, x0, y1) ||
        Lib.segmentsIntersect(ax, ay, bx, by, x0, y1, x0, y0)
    );
}

function pointInRect(x, y, x0, y0, x1, y1) {
    return x > x0 && x < x1 && y > y0 && y < y1;
}
