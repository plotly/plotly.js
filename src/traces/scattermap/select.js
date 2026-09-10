'use strict';

const Lib = require('../../lib');
const subtypes = require('../scatter/subtypes');
const { BADNUM } = require('../../constants/numerical');

// Longitude span of one copy of the world
const WORLD_LON_SPAN = 360;

// Two screen distances count as equal below this many pixels
const OFFSET_TOLERANCE = 1e-3;

// Project a longitude and latitude to a screen point. The map subplot's axes
// carry the map's own projection, so a longitude outside [-180, 180] lands on
// the matching repeated copy of the world instead of wrapping.
const projectPoint = (xa, ya, lon, lat) => [xa.c2p([lon, lat]), ya.c2p([lon, lat])];

/**
 * Measure the screen offset from one world copy of a point to the next.
 *
 * A bearing turns the offset into a diagonal. A pitch shrinks the offset with
 * distance from the camera, which makes the offset depend on the latitude and,
 * in combination with a bearing, differ between the two sides of a point.
 *
 * @param xa - X axis of the map subplot
 * @param ya - Y axis of the map subplot
 * @param lon - Longitude of the primary copy
 * @param lat - Latitude to measure at
 * @param base - Screen point of the primary copy
 * @returns Offset `{ dx, dy, uniform }` in pixels, where `uniform` reports
 * whether the same vector reaches the copy on either side
 */
function measureWorldCopyOffset(xa, ya, lon, lat, base) {
    const right = projectPoint(xa, ya, lon + WORLD_LON_SPAN, lat);
    const left = projectPoint(xa, ya, lon - WORLD_LON_SPAN, lat);

    const dx = right[0] - base[0];
    const dy = right[1] - base[1];

    const uniform =
        Math.abs(dx - (base[0] - left[0])) < OFFSET_TOLERANCE && Math.abs(dy - (base[1] - left[1])) < OFFSET_TOLERANCE;

    return { dx, dy, uniform };
}

/**
 * Find which world copies can put a point inside the tester's bounding box.
 *
 * An offset component below `OFFSET_TOLERANCE` constrains nothing, so it is
 * skipped. When that leaves both axes unconstrained, every copy lands on the
 * same pixel and the primary one stands for all of them.
 *
 * @param copyOffset - Offset from `measureWorldCopyOffset`
 * @param base - Screen point of the primary copy
 * @param tester - Selection tester, read for its bounding box
 * @returns `[kMin, kMax]` copy indices, or `null` when the offset constrains
 * neither axis
 */
function getWorldCopyRange(copyOffset, base, tester) {
    let kMin = -Infinity;
    let kMax = Infinity;

    const constrain = (delta, lo, hi) => {
        if (Math.abs(delta) < OFFSET_TOLERANCE) return;
        const a = lo / delta;
        const b = hi / delta;
        kMin = Math.max(kMin, Math.min(a, b));
        kMax = Math.min(kMax, Math.max(a, b));
    };

    constrain(copyOffset.dx, tester.xmin - base[0], tester.xmax - base[0]);
    constrain(copyOffset.dy, tester.ymin - base[1], tester.ymax - base[1]);

    if (!isFinite(kMin) || !isFinite(kMax) || kMin > kMax) return null;

    // Pad by one copy, because an uneven offset makes the straight-line bounds
    // slightly narrow.
    return [Math.floor(kMin) - 1, Math.ceil(kMax) + 1];
}

module.exports = function selectPoints(searchInfo, selectionTester) {
    const { cd, xaxis: xa, yaxis: ya } = searchInfo;
    const { trace } = cd[0];

    if (!subtypes.hasMarkers(trace)) return [];

    if (selectionTester === false) {
        for (const di of cd) {
            di.selected = 0;
        }
        return [];
    }

    // MapLibre renders repeated copies of the world when renderWorldCopies is
    // enabled, so a point can appear in the selection at any integer world
    // offset from its primary projection. Hit-test every visible copy. Skip
    // for degenerate testers (e.g. point-selection) where extent is zero.
    const map = xa._subplot?.map;
    const testWorldCopies = !!map?.getRenderWorldCopies() && selectionTester.xmax > selectionTester.xmin;

    const selection = [];

    for (let i = 0; i < cd.length; i++) {
        const di = cd[i];
        const [lon, lat] = di.lonlat;

        if (lon === BADNUM) continue;

        // Normalize lon to [-180, 180] so its projection lands on the primary world copy
        const normalizedLon = Lib.modHalf(lon, WORLD_LON_SPAN);
        const base = projectPoint(xa, ya, normalizedLon, lat);
        let matched = false;

        if (testWorldCopies) {
            const copyOffset = measureWorldCopyOffset(xa, ya, normalizedLon, lat, base);
            const range = getWorldCopyRange(copyOffset, base, selectionTester);

            for (let k = range ? range[0] : 0; range && k <= range[1] && !matched; k++) {
                // An even offset reaches every copy by arithmetic. An uneven one
                // comes from a pitch, so project the shifted longitude instead.
                const pt = copyOffset.uniform
                    ? [base[0] + k * copyOffset.dx, base[1] + k * copyOffset.dy]
                    : projectPoint(xa, ya, normalizedLon + k * WORLD_LON_SPAN, lat);

                matched = selectionTester.contains(pt, null, i, searchInfo);
            }
        } else {
            matched = selectionTester.contains(base, null, i, searchInfo);
        }

        if (matched) {
            selection.push({ pointNumber: i, lon, lat });
            di.selected = 1;
        } else {
            di.selected = 0;
        }
    }

    return selection;
};
