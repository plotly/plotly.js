'use strict';

const Lib = require('../../lib');
const subtypes = require('../scatter/subtypes');
const { BADNUM } = require('../../constants/numerical');

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
    // offset from its primary projection. Iterate offsets that fall within
    // the selection tester's x-extent to hit-test every visible copy. Skip
    // for degenerate testers (e.g. point-selection) where extent is zero.
    const map = xa._subplot?.map;
    const worldWidth =
        map?.getRenderWorldCopies() && selectionTester.xmax > selectionTester.xmin ? map.transform.worldSize : 0;

    const selection = [];

    for (let i = 0; i < cd.length; i++) {
        const di = cd[i];
        const [lon, lat] = di.lonlat;

        if (lon === BADNUM) continue;

        // Normalize lon to [-180, 180] so its projection lands on the primary world copy
        const normalizedLonlat = [Lib.modHalf(lon, 360), lat];
        const baseX = xa.c2p(normalizedLonlat);
        const baseY = ya.c2p(normalizedLonlat);
        let matched = false;

        if (worldWidth) {
            const kMin = Math.floor((selectionTester.xmin - baseX) / worldWidth);
            const kMax = Math.ceil((selectionTester.xmax - baseX) / worldWidth);
            for (let k = kMin; k <= kMax; k++) {
                if (selectionTester.contains([baseX + k * worldWidth, baseY], null, i, searchInfo)) {
                    matched = true;
                    break;
                }
            }
        } else {
            matched = selectionTester.contains([baseX, baseY], null, i, searchInfo);
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
