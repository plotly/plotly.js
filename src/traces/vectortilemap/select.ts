/**
 * Select the rendered tile features inside a box or lasso selection.
 *
 * Only features that the map renders now can be found: features outside the
 * view, outside `minzoom` and `maxzoom`, or dropped by the server at this zoom
 * are missing. The `plotly_selected` event also holds `range` or `lassoPoints`
 * in longitude and latitude, so a server can query the full answer.
 *
 * - A point is selected when it is inside the selection.
 * - A line is selected when one of its rendered vertices is inside.
 * - A polygon is selected when the center of its rendered extent is inside.
 *
 * Each feature counts once, also when the map renders it in many tiles.
 *
 * @returns one item for each selected feature, with `pointNumber` (the index
 *   in `locations`, or null), `id`, `location`, `z`, `properties`, `lon`, `lat`
 */
export default function selectPoints(searchInfo: any, selectionTester: any) {
    const cd = searchInfo.cd;
    const trace = cd[0].trace;
    const glTrace = trace._glTrace;
    const xa = searchInfo.xaxis;
    const ya = searchInfo.yaxis;
    const selection: any[] = [];

    if (!glTrace) return selection;

    if (selectionTester === false) {
        glTrace.selectedIds = null;
        return selection;
    }

    const subplot = xa._subplot;
    const hasLocations = trace._length > 0;
    const locToIndex: Map<string, number> = cd[0].t.locToIndex;
    const box = [
        [selectionTester.xmin, selectionTester.ymin],
        [selectionTester.xmax, selectionTester.ymax]
    ];
    const features = subplot.map.queryRenderedFeatures(box, { layers: [glTrace.mainLayerId] });

    // Gather the rendered pieces of each feature, by feature id
    const byId = new Map<string | number, any>();
    for (let i = 0; i < features.length; i++) {
        const f = features[i];
        if (f.id === undefined) continue;
        if (hasLocations && !locToIndex.has(String(f.id))) continue;
        const item = byId.get(f.id);
        if (item) item.pieces.push(f.geometry);
        else byId.set(f.id, { feature: f, pieces: [f.geometry] });
    }

    const contains = (lonlat: number[]) => selectionTester.contains([xa.c2p(lonlat), ya.c2p(lonlat)], null, null, searchInfo);
    const selectedIds = new Set<string | number>();

    for (const [id, { feature, pieces }] of byId) {
        let hit: number[] | undefined;
        if (trace.layertype === 'circle') {
            const c = feature.geometry.coordinates;
            if (contains(c)) hit = c;
        } else if (trace.layertype === 'line') {
            hit = findVertexInside(pieces, contains);
        } else {
            const c = extentCenter(pieces);
            if (c && contains(c)) hit = c;
        }
        if (!hit) continue;

        const index = hasLocations ? locToIndex.get(String(id))! : null;
        selectedIds.add(id);
        selection.push({
            pointNumber: index,
            id,
            location: hasLocations ? cd[index!].loc : id,
            z: hasLocations ? cd[index!].z : trace.zkey ? feature.properties[trace.zkey] : undefined,
            properties: feature.properties,
            lon: hit[0],
            lat: hit[1]
        });
    }

    glTrace.selectedIds = selectedIds;
    return selection;
}

const forEachCoordinate = (geometry: any, fn: (c: number[]) => boolean | void): boolean => {
    const walk = (coords: any, depth: number): boolean => {
        if (depth === 0) return fn(coords) === true;
        for (let i = 0; i < coords.length; i++) if (walk(coords[i], depth - 1)) return true;
        return false;
    };
    const depth = { Point: 0, MultiPoint: 1, LineString: 1, MultiLineString: 2, Polygon: 2, MultiPolygon: 3 }[
        geometry.type as string
    ];
    return depth === undefined ? false : walk(geometry.coordinates, depth);
};

function findVertexInside(pieces: any[], contains: (c: number[]) => boolean): number[] | undefined {
    let hit: number[] | undefined;
    for (const g of pieces) {
        if (
            forEachCoordinate(g, (c) => {
                if (contains(c)) {
                    hit = c;
                    return true;
                }
            })
        ) {
            break;
        }
    }
    return hit;
}

function extentCenter(pieces: any[]): number[] | undefined {
    let west = Infinity;
    let east = -Infinity;
    let south = Infinity;
    let north = -Infinity;
    for (const g of pieces) {
        forEachCoordinate(g, (c) => {
            if (c[0] < west) west = c[0];
            if (c[0] > east) east = c[0];
            if (c[1] < south) south = c[1];
            if (c[1] > north) north = c[1];
        });
    }
    return west <= east ? [(west + east) / 2, (south + north) / 2] : undefined;
}
