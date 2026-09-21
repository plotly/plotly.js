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

// a label without a leader line must keep CLUSTER_GAP font sizes
// from every other marker, or a reader cannot tell which point is its own
const CLUSTER_GAP = 1;

// minimum px between a label and anything else
const PAD = 2;

// markers within NEIGHBOR_RADIUS font sizes of a point push its label
// to the far side, so labels around a cluster point away from it
const NEIGHBOR_RADIUS = 3;

// side of one cell of the spatial index, in px
const CELL_SIZE = 64;

/**
 * Resolve the *auto* text positions of all scatter traces on one subplot.
 *
 * Every label takes the first free candidate: the eight positions next to
 * the point first, then the same positions farther out with a leader line.
 * The positions are tried in the order that points away from the markers
 * near the point, and in a fixed order when there are none.
 * A position next to the point is used only when no
 * other marker sits close to the label, so a leader line shows which point
 * the label belongs to whenever that is in doubt.
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
                const rect = makeRect(x - r, y - r, x + r, y + r, d);
                rect.isMarker = true;
                insert(index, rect);
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

    // a point outside the plot area gets no label, even when a candidate box would fit inside
    const inside = label.x >= 0 && label.x <= index.width && label.y >= 0 && label.y <= index.height;
    const positions = inside ? orderPositions(index, label) : [];

    for (let ring = 0; inside && ring <= rings; ring++) {
        const gap = ring * step;

        for (let k = 0; k < positions.length; k++) {
            const pos = positions[k];
            if (gap && pos === 'middle center') continue;

            const rect = labelRect(label, pos, gap);
            if (!rectIsFree(index, rect)) continue;
            if (!gap && rings && isAmbiguous(index, rect, CLUSTER_GAP * label.fontSize)) continue;
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

// the candidate positions of a label, sorted so that the ones that point
// away from the nearby markers come first; ties keep the default order
function orderPositions(index, label) {
    const r = ((label.d.mrc || 0) + NEIGHBOR_RADIUS * label.fontSize) ** 2;
    const b = cellBounds(
        index,
        label.x - Math.sqrt(r),
        label.y - Math.sqrt(r),
        label.x + Math.sqrt(r),
        label.y + Math.sqrt(r)
    );
    const cells = index.cells;
    let ax = 0;
    let ay = 0;

    for (let row = b[1]; row <= b[3]; row++) {
        for (let col = b[0]; col <= b[2]; col++) {
            const cell = cells[row * index.ncols + col];
            if (!cell) continue;

            for (let i = 0; i < cell.length; i++) {
                const ob = cell[i];
                if (!ob.isMarker || ob.owner === label.d) continue;
                const dx = label.x - (ob.x0 + ob.x1) / 2;
                const dy = label.y - (ob.y0 + ob.y1) / 2;
                const d2 = dx * dx + dy * dy;
                if (!d2 || d2 > r) continue;
                // nearer markers push harder
                ax += dx / d2;
                ay += dy / d2;
            }
        }
    }

    if (!ax && !ay) return label.positions;

    const scored = label.positions.map((pos, k) => {
        const sx = pos.indexOf('right') !== -1 ? 1 : pos.indexOf('left') !== -1 ? -1 : 0;
        const sy = pos.indexOf('bottom') !== -1 ? 1 : pos.indexOf('top') !== -1 ? -1 : 0;
        const norm = Math.sqrt(sx * sx + sy * sy) || 1;
        return { pos, k, score: (sx * ax + sy * ay) / norm };
    });
    scored.sort((a, b) => b.score - a.score || a.k - b.k);
    return scored.map((s) => s.pos);
}

// true when another marker sits within `margin` px of a label box,
// measured from the nearest edge or corner of the box
function isAmbiguous(index, rect, margin) {
    const b = cellBounds(index, rect.x0 - margin, rect.y0 - margin, rect.x1 + margin, rect.y1 + margin);
    const cells = index.cells;

    for (let row = b[1]; row <= b[3]; row++) {
        for (let col = b[0]; col <= b[2]; col++) {
            const cell = cells[row * index.ncols + col];
            if (!cell) continue;

            for (let i = 0; i < cell.length; i++) {
                const ob = cell[i];
                if (!ob.isMarker || ob.owner === rect.owner) continue;
                const dx = Math.max(0, ob.x0 - rect.x1, rect.x0 - ob.x1);
                const dy = Math.max(0, ob.y0 - rect.y1, rect.y0 - ob.y1);
                if (dx * dx + dy * dy < margin * margin) return true;
            }
        }
    }

    return false;
}

// the box of a label at a given position, plus its leader line if any
function labelRect(label, pos, gap) {
    const d = label.d;
    const bb = label.bb;
    const offset = Drawing.textPointBoxOffset(pos, d.mrc, d.mx || (label.trace.marker || {}).symbol, bb, gap);

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
    return { x0, y0, x1, y1, owner, isLine: false, isMarker: false, leader: null };
}

function makeLine(x0, y0, x1, y1, owner) {
    return { x0, y0, x1, y1, owner, isLine: true, isMarker: false, leader: null };
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
