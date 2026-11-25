'use strict';

var Registry = require('../../registry');
var Lib = require('../../lib');
var getTraceColor = require('../scatter/get_trace_color');
const Drawing = require('../../components/drawing');
const TOO_MANY_POINTS = require('./constants').TOO_MANY_POINTS;

function hoverPoints(pointData, xval, yval, hovermode) {
    var cd = pointData.cd;
    var stash = cd[0].t;
    var trace = cd[0].trace;
    var xa = pointData.xa;
    var ya = pointData.ya;
    var x = stash.x;
    var y = stash.y;
    var xpx = xa.c2p(xval);
    var ypx = ya.c2p(yval);
    var maxDistance = pointData.distance;
    var ids;
    let scanTree = false;
    let minX, maxX, minY, maxY;

    // A range query can return most of a large trace before the hover loop finds one point.
    // A balanced index lets the search discard whole groups that cannot contain the winner.
    // Keep bounds in data coordinates so pan and zoom do not require a rebuild.
    // Periods and range breaks use the existing search because their pixel mapping needs
    // different bounds than the monotonic axis conversions used by this index.
    if(x.length >= TOO_MANY_POINTS &&
        !trace.xperiodalignment && !trace.yperiodalignment &&
        !xa.rangebreaks && !ya.rangebreaks) {
        let index = stash._hoverIndex;
        // The stash owns the index. New coordinate arrays or axis types need a new index.
        if(!index || index.x !== x || index.y !== y ||
            index.xType !== xa.type || index.yType !== ya.type) {
            const count = x.length;
            // Store point IDs instead of copies of the coordinate arrays.
            const order = new Uint32Array(count);
            let valid = 0;
            for(let j = 0; j < count; j++) {
                // Log axes cannot map zero or negative values to finite pixels.
                if(Number.isFinite(x[j]) && Number.isFinite(y[j]) &&
                    (xa.type !== 'log' || x[j] > 0) && (ya.type !== 'log' || y[j] > 0)) {
                    order[valid++] = j;
                }
            }

            // Each node owns a contiguous slice of order and bounds every point in that slice.
            function build(start, end) {
                if(start === end) return null;
                let minX = Infinity;
                let maxX = -Infinity;
                let minY = Infinity;
                let maxY = -Infinity;
                let maxId = 0;
                for(let j = start; j < end; j++) {
                    const id = order[j];
                    minX = Math.min(minX, x[id]);
                    maxX = Math.max(maxX, x[id]);
                    minY = Math.min(minY, y[id]);
                    maxY = Math.max(maxY, y[id]);
                    maxId = Math.max(maxId, id);
                }
                // maxId supports the rule that the last point wins a distance tie.
                const node = {start, end, minX, maxX, minY, maxY, maxId};
                // A coincident group can represent any number of points in one leaf.
                if(end - start <= 32 || (minX === maxX && minY === maxY)) return node;

                // Partition around the median on the widest data axis.
                // Point IDs break coordinate ties so that the two children stay balanced.
                const values = maxX - minX >= maxY - minY ? x : y;
                const middle = (start + end) >>> 1;
                let left = start;
                let right = end - 1;
                while(left < right) {
                    const pivot = order[(left + right) >>> 1];
                    const pivotValue = values[pivot];
                    let lo = left;
                    let hi = right;
                    while(lo <= hi) {
                        while(values[order[lo]] < pivotValue ||
                            (values[order[lo]] === pivotValue && order[lo] < pivot)) lo++;
                        while(values[order[hi]] > pivotValue ||
                            (values[order[hi]] === pivotValue && order[hi] > pivot)) hi--;
                        if(lo <= hi) {
                            const tmp = order[lo];
                            order[lo++] = order[hi];
                            order[hi--] = tmp;
                        }
                    }
                    if(middle <= hi) right = hi;
                    else if(middle >= lo) left = lo;
                    else break;
                }
                // The partition moves IDs only. The original trace order stays unchanged.
                node.left = build(start, middle);
                node.right = build(middle, end);
                return node;
            }

            index = stash._hoverIndex = {
                x, y, xType: xa.type, yType: ya.type, order, root: build(0, valid)
            };
        }

        // Tree-backed x hover considers only points in the visible y range.
        // The existing array path does not apply that restriction.
        const xMode = hovermode === 'x';
        const filterY = xMode && !!stash.tree;
        const minY = filterY ? Math.min(ya._rl[0], ya._rl[1]) : -Infinity;
        const maxY = filterY ? Math.max(ya._rl[0], ya._rl[1]) : Infinity;
        // Start at the hover cutoff. Infinity permits an unrestricted nearest-point search.
        let bestDistance = maxDistance;
        let bestId;
        const stack = index.root ? [index.root] : [];
        while(stack.length) {
            const node = stack.pop();
            if(filterY && (node.maxY < minY || node.minY > maxY)) continue;
            // Convert node bounds to pixels for the current zoom and axis direction.
            // Without range breaks, the axis mapping is monotonic between these endpoints.
            const px0 = xa.c2p(node.minX);
            const px1 = xa.c2p(node.maxX);
            const py0 = xMode ? 0 : ya.c2p(node.minY);
            const py1 = xMode ? 0 : ya.c2p(node.maxY);
            const dx = Math.max(Math.min(px0, px1) - xpx, 0, xpx - Math.max(px0, px1));
            const dy = xMode ? 0 : Math.max(Math.min(py0, py1) - ypx, 0, ypx - Math.max(py0, py1));
            // The distance to the bounding box is a lower bound for every point in the node.
            const lowerBound = Math.sqrt(dx * dx + dy * dy);
            if(!Number.isFinite(lowerBound)) continue;
            // A node can be skipped only when it cannot improve distance or the tie.
            if(lowerBound > bestDistance ||
                (lowerBound === bestDistance && bestId !== undefined && node.maxId <= bestId)) continue;
            // Equal coordinates share a distance, so the last point wins without a scan.
            if(node.minX === node.maxX && (xMode || node.minY === node.maxY) &&
                (!filterY || (node.minY >= minY && node.maxY <= maxY))) {
                bestDistance = lowerBound;
                bestId = node.maxId;
                continue;
            }
            if(node.left) {
                const left = node.left;
                const right = node.right;
                // Visit the nearer center first. An early winner improves later pruning.
                // The center only affects traversal order, not the distance bound.
                const leftX = xa.c2p((left.minX + left.maxX) / 2);
                const rightX = xa.c2p((right.minX + right.maxX) / 2);
                const leftY = xMode ? ypx : ya.c2p((left.minY + left.maxY) / 2);
                const rightY = xMode ? ypx : ya.c2p((right.minY + right.maxY) / 2);
                if((leftX - xpx) ** 2 + (leftY - ypx) ** 2 <
                    (rightX - xpx) ** 2 + (rightY - ypx) ** 2) {
                    stack.push(right, left);
                } else {
                    stack.push(left, right);
                }
            } else {
                // Small or partially visible leaves need exact point distances.
                for(let j = node.start; j < node.end; j++) {
                    const id = index.order[j];
                    if(filterY && !(y[id] >= minY && y[id] <= maxY)) continue;
                    const pointDx = xa.c2p(x[id]) - xpx;
                    const pointDy = xMode ? 0 : ya.c2p(y[id]) - ypx;
                    const distance = Math.sqrt(pointDx * pointDx + pointDy * pointDy);
                    if(Number.isFinite(distance) && (distance < bestDistance ||
                        (distance === bestDistance && (bestId === undefined || id > bestId)))) {
                        bestDistance = distance;
                        bestId = id;
                    }
                }
            }
        }
        // Reuse the existing hover metadata and spike-distance calculation below.
        ids = bestId === undefined ? [] : [bestId];
    }

    if(!ids) {
        // FIXME: make sure this is a proper way to calc search radius
        if(stash.tree) {
            const xl = maxDistance === Infinity ? -Infinity : xa.p2c(xpx - maxDistance);
            const xr = maxDistance === Infinity ? Infinity : xa.p2c(xpx + maxDistance);
            const yl = hovermode === 'x' ? ya._rl[0] :
                maxDistance === Infinity ? -Infinity : ya.p2c(ypx - maxDistance);
            const yr = hovermode === 'x' ? ya._rl[1] :
                maxDistance === Infinity ? Infinity : ya.p2c(ypx + maxDistance);
            minX = Math.min(xl, xr);
            maxX = Math.max(xl, xr);
            minY = Math.min(yl, yr);
            maxY = Math.max(yl, yr);
            // point-cluster's rectangle parser cannot represent infinite endpoints.
            // Scan its IDs and apply the same bounds in the existing hover loops.
            scanTree = !Number.isFinite(maxX - minX) || !Number.isFinite(maxY - minY);
            ids = scanTree ? stash.tree : stash.tree.range(minX, minY, maxX, maxY);
        } else {
            ids = stash.ids;
        }
    }

    // pick the id closest to the point
    // note that point possibly may not be found
    var k, closestId, ptx, pty, i, dx, dy, dist, dxy;

    var minDist = maxDistance;
    if(hovermode === 'x') {
        var xPeriod = !!trace.xperiodalignment;
        var yPeriod = !!trace.yperiodalignment;

        for(i = 0; i < ids.length; i++) {
            k = ids[i];
            if(scanTree && !(x[k] >= minX && x[k] <= maxX && y[k] >= minY && y[k] <= maxY)) continue;
            ptx = x[k];

            dx = Math.abs(xa.c2p(ptx) - xpx);
            if(xPeriod) {
                var x0 = xa.c2p(trace._xStarts[k]);
                var x1 = xa.c2p(trace._xEnds[k]);

                dx = (
                    xpx >= Math.min(x0, x1) &&
                    xpx <= Math.max(x0, x1)
                ) ? 0 : Infinity;
            }

            // Accept a tie so that the point drawn last wins, as in `Fx.getClosest`
            if(Number.isFinite(dx) && dx <= minDist) {
                minDist = dx;
                pty = y[k];
                dy = ya.c2p(pty) - ypx;

                if(yPeriod) {
                    var y0 = ya.c2p(trace._yStarts[k]);
                    var y1 = ya.c2p(trace._yEnds[k]);

                    dy = (
                        ypx >= Math.min(y0, y1) &&
                        ypx <= Math.max(y0, y1)
                    ) ? 0 : Infinity;
                }

                dxy = Math.sqrt(dx * dx + dy * dy);
                closestId = ids[i];
            }
        }
    } else {
        for(i = 0; i < ids.length; i++) {
            k = ids[i];
            if(scanTree && !(x[k] >= minX && x[k] <= maxX && y[k] >= minY && y[k] <= maxY)) continue;
            ptx = x[k];
            pty = y[k];
            dx = xa.c2p(ptx) - xpx;
            dy = ya.c2p(pty) - ypx;

            dist = Math.sqrt(dx * dx + dy * dy);
            // Accept a tie so that the trace drawn last wins, as in `Fx.getClosest`
            if(dist <= minDist) {
                minDist = dxy = dist;
                closestId = k;
            }
        }
    }

    pointData.index = closestId;
    pointData.distance = minDist;
    pointData.dxy = dxy;

    if(closestId === undefined) return [pointData];

    return [calcHover(pointData, x, y, trace)];
}

function calcHover(pointData, x, y, trace) {
    var xa = pointData.xa;
    var ya = pointData.ya;
    var minDist = pointData.distance;
    var dxy = pointData.dxy;
    var id = pointData.index;

    // the closest data point
    var di = {
        pointNumber: id,
        x: x[id],
        y: y[id]
    };

    // that is single-item arrays_to_calcdata excerpt, since we are doing it for a single point and we don't have to do it beforehead for 1e6 points
    di.tx = Lib.isArrayOrTypedArray(trace.text) ? trace.text[id] : trace.text;
    di.htx = Array.isArray(trace.hovertext) ? trace.hovertext[id] : trace.hovertext;
    di.data = Array.isArray(trace.customdata) ? trace.customdata[id] : trace.customdata;
    di.tp = Array.isArray(trace.textposition) ? trace.textposition[id] : trace.textposition;

    var font = trace.textfont;
    if(font) {
        di.ts = Lib.isArrayOrTypedArray(font.size) ? font.size[id] : font.size;
        di.tc = Lib.isArrayOrTypedArray(font.color) ? font.color[id] : font.color;
        di.tf = Array.isArray(font.family) ? font.family[id] : font.family;
        di.tw = Array.isArray(font.weight) ? font.weight[id] : font.weight;
        di.ty = Array.isArray(font.style) ? font.style[id] : font.style;
        di.tv = Array.isArray(font.variant) ? font.variant[id] : font.variant;
    }

    var marker = trace.marker;
    if(marker) {
        di.ms = Lib.isArrayOrTypedArray(marker.size) ? marker.size[id] : marker.size;
        di.mo = Lib.isArrayOrTypedArray(marker.opacity) ? marker.opacity[id] : marker.opacity;
        di.mx = Lib.isArrayOrTypedArray(marker.symbol) ? marker.symbol[id] : marker.symbol;
        di.ma = Lib.isArrayOrTypedArray(marker.angle) ? marker.angle[id] : marker.angle;
        di.mc = Lib.isArrayOrTypedArray(marker.color) ? marker.color[id] : marker.color;

        // scattergl has no render step that sets `mcc`, so map the per-point color here
        di.mcc = Drawing.tryColorscale(marker, '')(di.mc);
    }

    var line = marker && marker.line;
    if(line) {
        di.mlc = Array.isArray(line.color) ? line.color[id] : line.color;
        di.mlw = Lib.isArrayOrTypedArray(line.width) ? line.width[id] : line.width;
    }

    var grad = marker && marker.gradient;
    if(grad && grad.type !== 'none') {
        di.mgt = Array.isArray(grad.type) ? grad.type[id] : grad.type;
        di.mgc = Array.isArray(grad.color) ? grad.color[id] : grad.color;
    }

    var xp = xa.c2p(di.x, true);
    var yp = ya.c2p(di.y, true);
    var rad = di.mrc || 1;

    var hoverlabel = trace.hoverlabel;

    if(hoverlabel) {
        di.hbg = Array.isArray(hoverlabel.bgcolor) ? hoverlabel.bgcolor[id] : hoverlabel.bgcolor;
        di.hbc = Array.isArray(hoverlabel.bordercolor) ? hoverlabel.bordercolor[id] : hoverlabel.bordercolor;
        di.hts = Lib.isArrayOrTypedArray(hoverlabel.font.size) ? hoverlabel.font.size[id] : hoverlabel.font.size;
        di.htc = Array.isArray(hoverlabel.font.color) ? hoverlabel.font.color[id] : hoverlabel.font.color;
        di.htf = Array.isArray(hoverlabel.font.family) ? hoverlabel.font.family[id] : hoverlabel.font.family;
        di.hnl = Lib.isArrayOrTypedArray(hoverlabel.namelength) ? hoverlabel.namelength[id] : hoverlabel.namelength;
    }
    var hoverinfo = trace.hoverinfo;
    if(hoverinfo) {
        di.hi = Array.isArray(hoverinfo) ? hoverinfo[id] : hoverinfo;
    }

    var hovertemplate = trace.hovertemplate;
    if(hovertemplate) {
        di.ht = Array.isArray(hovertemplate) ? hovertemplate[id] : hovertemplate;
    }

    var fakeCd = {};
    fakeCd[pointData.index] = di;

    var origX = trace._origX;
    var origY = trace._origY;

    var pointData2 = Lib.extendFlat({}, pointData, {
        color: getTraceColor(trace, di),

        x0: xp - rad,
        x1: xp + rad,
        xLabelVal: origX ? origX[id] : di.x,

        y0: yp - rad,
        y1: yp + rad,
        yLabelVal: origY ? origY[id] : di.y,

        cd: fakeCd,
        distance: minDist,
        spikeDistance: dxy,

        hovertemplate: di.ht
    });

    if(di.htx) pointData2.text = di.htx;
    else if(di.tx) pointData2.text = di.tx;
    else if(trace.text) pointData2.text = trace.text;

    Lib.fillText(di, trace, pointData2);
    Registry.getComponentMethod('errorbars', 'hoverInfo')(di, trace, pointData2);

    return pointData2;
}

module.exports = {
    hoverPoints: hoverPoints,
    calcHover: calcHover
};
