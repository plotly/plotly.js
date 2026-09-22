'use strict';

var mod = require('./mod').mod;

/*
 * look for intersection of two line segments
 *   (1->2 and 3->4) - returns array [x,y] if they do, null if not
 */
exports.segmentsIntersect = segmentsIntersect;
function segmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    var a = x2 - x1;
    var b = x3 - x1;
    var c = x4 - x3;
    var d = y2 - y1;
    var e = y3 - y1;
    var f = y4 - y3;
    var det = a * f - c * d;
    // parallel lines? intersection is undefined
    // ignore the case where they are colinear
    if(det === 0) return null;
    var t = (b * f - c * e) / det;
    var u = (b * d - a * e) / det;
    // segments do not intersect?
    if(u < 0 || u > 1 || t < 0 || t > 1) return null;

    return {x: x1 + a * t, y: y1 + d * t};
}

/*
 * find the minimum distance between two line segments (1->2 and 3->4)
 */
exports.segmentDistance = function segmentDistance(x1, y1, x2, y2, x3, y3, x4, y4) {
    if(segmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4)) return 0;

    // the two segments and their lengths squared
    var x12 = x2 - x1;
    var y12 = y2 - y1;
    var x34 = x4 - x3;
    var y34 = y4 - y3;
    var ll12 = x12 * x12 + y12 * y12;
    var ll34 = x34 * x34 + y34 * y34;

    // calculate distance squared, then take the sqrt at the very end
    var dist2 = Math.min(
        perpDistance2(x12, y12, ll12, x3 - x1, y3 - y1),
        perpDistance2(x12, y12, ll12, x4 - x1, y4 - y1),
        perpDistance2(x34, y34, ll34, x1 - x3, y1 - y3),
        perpDistance2(x34, y34, ll34, x2 - x3, y2 - y3)
    );

    return Math.sqrt(dist2);
};

/*
 * distance squared from segment ab to point c
 * [xab, yab] is the vector b-a
 * [xac, yac] is the vector c-a
 * llab is the length squared of (b-a), just to simplify calculation
 */
function perpDistance2(xab, yab, llab, xac, yac) {
    var fcAB = (xac * xab + yac * yab);
    if(fcAB < 0) {
        // point c is closer to point a
        return xac * xac + yac * yac;
    } else if(fcAB > llab) {
        // point c is closer to point b
        var xbc = xac - xab;
        var ybc = yac - yab;
        return xbc * xbc + ybc * ybc;
    } else {
        // perpendicular distance is the shortest
        var crossProduct = xac * yab - yac * xab;
        return crossProduct * crossProduct / llab;
    }
}

// a very short-term cache for getTextLocation, just because
// we're often looping over the same locations multiple times
// invalidated as soon as we look at a different path
var locationCache, workingPath, workingTextWidth;

// turn a path and position along it into x, y, and angle for the given text
exports.getTextLocation = function getTextLocation(path, totalPathLen, positionOnPath, textWidth) {
    if(path !== workingPath || textWidth !== workingTextWidth) {
        locationCache = {};
        workingPath = path;
        workingTextWidth = textWidth;
    }
    if(locationCache[positionOnPath]) {
        return locationCache[positionOnPath];
    }

    // for the angle, use points on the path separated by the text width
    // even though due to curvature, the text will cover a bit more than that
    var p0 = path.getPointAtLength(mod(positionOnPath - textWidth / 2, totalPathLen));
    var p1 = path.getPointAtLength(mod(positionOnPath + textWidth / 2, totalPathLen));
    // note: atan handles 1/0 nicely
    var theta = Math.atan((p1.y - p0.y) / (p1.x - p0.x));
    // center the text at 2/3 of the center position plus 1/3 the p0/p1 midpoint
    // that's the average position of this segment, assuming it's roughly quadratic
    var pCenter = path.getPointAtLength(mod(positionOnPath, totalPathLen));
    var x = (pCenter.x * 4 + p0.x + p1.x) / 6;
    var y = (pCenter.y * 4 + p0.y + p1.y) / 6;

    var out = {x: x, y: y, theta: theta};
    locationCache[positionOnPath] = out;
    return out;
};

exports.clearLocationCache = function() {
    workingPath = null;
};

/*
 * Find the segment of `path` that's within the visible area
 * given by `bounds` {left, right, top, bottom}, to within a
 * precision of `buffer` px
 *
 * returns: undefined if nothing is visible, else object:
 * {
 *   min: position where the path first enters bounds, or 0 if it
 *        starts within bounds
 *   max: position where the path last exits bounds, or the path length
 *        if it finishes within bounds
 *   len: max - min, ie the length of visible path
 *   total: the total path length - just included so the caller doesn't
 *        need to call path.getTotalLength() again
 *   isClosed: true iff the start and end points of the path are both visible
 *        and are at the same point
 * }
 *
 * Works by starting from either end and repeatedly finding the distance from
 * that point to the plot area, and if it's outside the plot, moving along the
 * path by that distance (because the plot must be at least that far away on
 * the path). Note that if a path enters, exits, and re-enters the plot, we
 * will not capture this behavior.
 */
exports.getVisibleSegment = function getVisibleSegment(path, bounds, buffer) {
    var left = bounds.left;
    var right = bounds.right;
    var top = bounds.top;
    var bottom = bounds.bottom;

    var pMin = 0;
    var pTotal = path.getTotalLength();
    var pMax = pTotal;

    var pt0, ptTotal;

    function getDistToPlot(len) {
        var pt = path.getPointAtLength(len);

        // hold on to the start and end points for `closed`
        if(len === 0) pt0 = pt;
        else if(len === pTotal) ptTotal = pt;

        var dx = (pt.x < left) ? left - pt.x : (pt.x > right ? pt.x - right : 0);
        var dy = (pt.y < top) ? top - pt.y : (pt.y > bottom ? pt.y - bottom : 0);
        return Math.sqrt(dx * dx + dy * dy);
    }

    var distToPlot = getDistToPlot(pMin);
    while(distToPlot) {
        pMin += distToPlot + buffer;
        if(pMin > pMax) return;
        distToPlot = getDistToPlot(pMin);
    }

    distToPlot = getDistToPlot(pMax);
    while(distToPlot) {
        pMax -= distToPlot + buffer;
        if(pMin > pMax) return;
        distToPlot = getDistToPlot(pMax);
    }

    return {
        min: pMin,
        max: pMax,
        len: pMax - pMin,
        total: pTotal,
        isClosed: pMin === 0 && pMax === pTotal &&
            Math.abs(pt0.x - ptTotal.x) < 0.1 &&
            Math.abs(pt0.y - ptTotal.y) < 0.1
    };
};

/**
 * Find point on SVG path corresponding to a given constraint coordinate
 *
 * @param {SVGPathElement} path
 * @param {Number} val : constraint coordinate value
 * @param {String} coord : 'x' or 'y' the constraint coordinate
 * @param {Object} opts :
 *  - {Number} pathLength : supply total path length before hand
 *  - {Number} tolerance
 *  - {Number} iterationLimit
 * @return {SVGPoint}
 */
exports.findPointOnPath = function findPointOnPath(path, val, coord, opts) {
    opts = opts || {};

    var pathLength = opts.pathLength || path.getTotalLength();
    var tolerance = opts.tolerance || 1e-3;
    var iterationLimit = opts.iterationLimit || 30;

    // if path starts at a val greater than the path tail (like on vertical violins),
    // we must flip the sign of the computed diff.
    var mul = path.getPointAtLength(0)[coord] > path.getPointAtLength(pathLength)[coord] ? -1 : 1;

    var i = 0;
    var b0 = 0;
    var b1 = pathLength;
    var mid;
    var pt;
    var diff;

    while(i < iterationLimit) {
        mid = (b0 + b1) / 2;
        pt = path.getPointAtLength(mid);
        diff = pt[coord] - val;

        if(Math.abs(diff) < tolerance) {
            return pt;
        } else {
            if(mul * diff > 0) {
                b1 = mid;
            } else {
                b0 = mid;
            }
            i++;
        }
    }
    return pt;
};

// candidate positions of a label, in order of preference
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

// a label that may sit on its point tries that first
const POSITIONS_ON_POINT = ['middle center', ...POSITIONS];

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
 * Place labels around their points, so that no label covers a marker,
 * another label, or a leader line, and every label stays inside the area.
 *
 * Labels are placed in order of decreasing `priority`, then in the given
 * order, so an earlier label wins a contested spot. Every label takes the
 * first free candidate: the eight positions next to the point first, then
 * the same positions farther out with a leader line back to the point.
 * The positions are tried in the order that points away from the markers
 * near the point, and in a fixed order when there are none. A position
 * next to the point is used only when no other marker sits close to the
 * label, so a leader line shows which point the label belongs to whenever
 * that is in doubt. A label with no free candidate, or with its point
 * outside the area, is hidden.
 *
 * @param opts.width - the width of the area in px
 * @param opts.height - the height of the area in px
 * @param opts.markers - the marker boxes, as `{x0, y0, x1, y1, owner}`;
 *   a label may cover the marker with its own `owner`
 * @param opts.fixed - the other boxes that labels stay clear of, as `{x0, y0, x1, y1}`
 * @param opts.labels - the labels to place, each with:
 *   `x`, `y` - the point in px;
 *   `owner` - the value that links the label to its marker, the label itself when absent;
 *   `radius` - the marker radius in px, or 0;
 *   `fontSize` - the font size in px, which scales the leader step and the clearance from other markers;
 *   `priority` - a number, higher first, 0 when absent;
 *   `onPoint` - true when the label may also sit on its point;
 *   `rect(position, gap)` - the box of the label at a `textposition` value, `gap` px farther
 *     from the point, as `{x0, y0, x1, y1, leader}`, with `leader` as `[x0, y0, x1, y1]`
 *     from the marker edge to the box when `gap` is above 0, else null
 * @returns one entry per label, in the given order: `{position, gap, leader}`,
 *   or null when the label is hidden
 */
exports.placeLabels = function placeLabels(opts) {
    const index = makeIndex(opts.width, opts.height);
    const markers = opts.markers || [];
    const fixed = opts.fixed || [];
    const labels = opts.labels;

    for (let i = 0; i < markers.length; i++) {
        const m = markers[i];
        const rect = makeRect(m.x0 - PAD, m.y0 - PAD, m.x1 + PAD, m.y1 + PAD, m.owner);
        rect.isMarker = true;
        insert(index, rect);
    }
    for (let i = 0; i < fixed.length; i++) {
        const f = fixed[i];
        insert(index, makeRect(f.x0, f.y0, f.x1, f.y1, f.owner));
    }

    const results = new Array(labels.length);
    const order = sortLabels(labels);
    for (let i = 0; i < order.length; i++) {
        results[order[i]] = placeOne(index, labels[order[i]]);
    }
    return results;
};

// the order in which the labels are placed: by priority, high to low, then as given
function sortLabels(labels) {
    const order = labels.map((label, i) => i);
    order.sort((a, b) => (labels[b].priority || 0) - (labels[a].priority || 0) || a - b);
    return order;
}

function placeOne(index, label) {
    const owner = label.owner === undefined ? label : label.owner;
    const step = LEADER_STEP * label.fontSize;
    const rings = step ? LEADER_RINGS : 0;

    // a point outside the area gets no label, even when a candidate box would fit inside
    if (label.x < 0 || label.x > index.width || label.y < 0 || label.y > index.height) return null;

    const positions = orderPositions(index, label, owner);

    for (let ring = 0; ring <= rings; ring++) {
        const gap = ring * step;

        for (let k = 0; k < positions.length; k++) {
            const pos = positions[k];
            if (gap && pos === 'middle center') continue;

            const box = label.rect(pos, gap);
            const rect = makeRect(box.x0, box.y0, box.x1, box.y1, owner);
            if (!rectIsFree(index, rect)) continue;
            if (!gap && rings && isAmbiguous(index, rect, CLUSTER_GAP * label.fontSize)) continue;

            const seg = box.leader;
            const line = seg ? makeLine(seg[0], seg[1], seg[2], seg[3], owner) : null;
            if (line && !lineIsFree(index, line, label.x, label.y)) continue;

            insert(index, rect);
            if (line) insert(index, line);
            return { position: pos, gap, leader: seg || null };
        }
    }

    return null;
}

// the candidate positions of a label, sorted so that the ones that point
// away from the nearby markers come first; ties keep the default order
function orderPositions(index, label, owner) {
    const positions = label.onPoint ? POSITIONS_ON_POINT : POSITIONS;
    const r = ((label.radius || 0) + NEIGHBOR_RADIUS * label.fontSize) ** 2;
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
                if (!ob.isMarker || ob.owner === owner) continue;
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

    if (!ax && !ay) return positions;

    const scored = positions.map((pos, k) => {
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

function makeRect(x0, y0, x1, y1, owner) {
    return { x0, y0, x1, y1, owner, isLine: false, isMarker: false };
}

function makeLine(x0, y0, x1, y1, owner) {
    return { x0, y0, x1, y1, owner, isLine: true, isMarker: false };
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
        constrain(Math.floor(Math.min(x0, x1) / CELL_SIZE), 0, maxCol),
        constrain(Math.floor(Math.min(y0, y1) / CELL_SIZE), 0, maxRow),
        constrain(Math.floor(Math.max(x0, x1) / CELL_SIZE), 0, maxCol),
        constrain(Math.floor(Math.max(y0, y1) / CELL_SIZE), 0, maxRow)
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

// a label box is free when it stays inside the area
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
                    hit = segmentsIntersect(line.x0, line.y0, line.x1, line.y1, ob.x0, ob.y0, ob.x1, ob.y1);
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
        segmentsIntersect(ax, ay, bx, by, x0, y0, x1, y0) ||
        segmentsIntersect(ax, ay, bx, by, x1, y0, x1, y1) ||
        segmentsIntersect(ax, ay, bx, by, x1, y1, x0, y1) ||
        segmentsIntersect(ax, ay, bx, by, x0, y1, x0, y0)
    );
}

function pointInRect(x, y, x0, y0, x1, y1) {
    return x > x0 && x < x1 && y > y0 && y < y1;
}

function constrain(v, v0, v1) {
    return Math.max(v0, Math.min(v1, v));
}
