import _Axes from '../../plots/cartesian/axes';
import _choroplethHover from '../choropleth/hover';
import { makeFeatureColorFn } from './convert';

const Axes: any = _Axes;
const choroplethHover: any = _choroplethHover;

// Extra pixels around a circle or a line that still count as a hit
const HIT_SLOP = 3;

/**
 * Find the rendered tile feature under the hover position.
 *
 * The cost does not depend on the number of features: MapLibre looks up the
 * pixel in the index of the loaded tiles. A feature that is not rendered
 * (outside the view, or outside `minzoom` and `maxzoom`) cannot get hover.
 *
 * The event data gets `lon` and `lat`: the point of a circle, or the cursor
 * position on a line or a fill.
 *
 * A circle reports its pixel distance to the cursor, so the closest point wins
 * across traces. A fill keeps the default distance, so points and lines drawn
 * above it win.
 */
export default function hoverPoints(pointData: any, xval: number, yval: number) {
    const cd = pointData.cd;
    const trace = cd[0].trace;
    const glTrace = trace._glTrace;
    const subplot = pointData.subplot;
    const locToIndex: Map<string, number> = cd[0].t.locToIndex;
    const hasLocations = trace._length > 0;

    // A hover by point number gives no position, and a location has no position until a tile renders it
    if (!glTrace || !glTrace.mainLayerId || !Number.isFinite(xval) || !Number.isFinite(yval)) return;

    const lonlat = [xval, yval];
    const px = pointData.xa.c2p(lonlat);
    const py = pointData.ya.c2p(lonlat);
    const layertype = trace.layertype;

    let r = 0;
    if (layertype === 'circle') r = trace.marker.size / 2 + (trace.marker.line.width || 0) + HIT_SLOP;
    else if (layertype === 'line') r = trace.line.width / 2 + HIT_SLOP;
    const query = r
        ? [
              [px - r, py - r],
              [px + r, py + r]
          ]
        : [px, py];

    const features = subplot.map.queryRenderedFeatures(query, { layers: [glTrace.mainLayerId] });

    let best: any;
    let bestIndex: number | undefined;
    let bestDist = Infinity;
    let bestXY = [px, py];
    let bestLonLat = lonlat;
    for (let i = 0; i < features.length; i++) {
        const f = features[i];
        let index: number | undefined;
        if (hasLocations) {
            index = locToIndex.get(String(f.id));
            if (index === undefined) continue;
        } else if (trace.zkey && typeof f.properties[trace.zkey] !== 'number') {
            continue;
        }

        if (layertype !== 'circle') {
            best = f;
            bestIndex = index;
            break;
        }
        const c = f.geometry.coordinates;
        const p = subplot.project(c);
        const d = Math.hypot(p.x - px, p.y - py);
        if (d < bestDist) {
            best = f;
            bestIndex = index;
            bestDist = d;
            bestXY = [p.x, p.y];
            bestLonLat = c;
        }
    }
    if (!best) return;

    const pt = hasLocations
        ? cd[bestIndex!]
        : { loc: best.id, z: trace.zkey ? best.properties[trace.zkey] : undefined };
    const rad = layertype === 'circle' ? trace.marker.size / 2 : 0;

    pointData.x0 = bestXY[0] - rad;
    pointData.x1 = bestXY[0] + rad;
    pointData.y0 = bestXY[1] - rad;
    pointData.y1 = bestXY[1] + rad;
    if (layertype === 'circle') pointData.distance = Math.max(0, bestDist - rad);

    pointData.index = hasLocations ? bestIndex : null;
    pointData.id = best.id;
    pointData.location = pt.loc;
    pointData.properties = best.properties;
    // the point of a circle, or the cursor position on a line or a fill
    pointData.lon = bestLonLat[0];
    pointData.lat = bestLonLat[1];
    pointData.color = makeFeatureColorFn(trace)(pt.z);
    if (pt.z !== undefined) {
        pointData.z = pt.z;
        pointData.zLabel = Axes.tickText(subplot.mockAxis, subplot.mockAxis.c2l(pt.z), 'hover').text;
    }
    pointData.hovertemplate = hasLocations ? pt.hovertemplate : trace.hovertemplate;

    choroplethHover.makeHoverInfo(pointData, trace, pt);

    return [pointData];
}
