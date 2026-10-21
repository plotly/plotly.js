import _Axes from '../../plots/cartesian/axes';
import _choroplethHover from '../choropleth/hover';

const Axes: any = _Axes;
const choroplethHover: any = _choroplethHover;

/**
 * Find the rendered tile feature under the hover position.
 *
 * The cost does not depend on the number of features: MapLibre looks up the
 * pixel in the index of the loaded tiles. A feature that is not rendered
 * (outside the view, or outside `minzoom` and `maxzoom`) cannot get hover.
 */
export default function hoverPoints(pointData: any, xval: number, yval: number) {
    const cd = pointData.cd;
    const trace = cd[0].trace;
    const glTrace = trace._glTrace;
    const subplot = pointData.subplot;
    const locToIndex: Map<string, number> | undefined = cd[0].t && cd[0].t.locToIndex;

    // A hover by point number gives no position, and a location has no position until a tile renders it
    if (!glTrace || !locToIndex || !Number.isFinite(xval) || !Number.isFinite(yval)) return;

    const lonlat = [xval, yval];
    const px = pointData.xa.c2p(lonlat);
    const py = pointData.ya.c2p(lonlat);

    const features = subplot.map.queryRenderedFeatures([px, py], { layers: [glTrace.layerIds.fill] });

    let index: number | undefined;
    let feature: any;
    for (let i = 0; i < features.length; i++) {
        index = locToIndex.get(String(features[i].id));
        if (index !== undefined) {
            feature = features[i];
            break;
        }
    }
    if (index === undefined) return;

    const pt = cd[index];

    pointData.x0 = pointData.x1 = px;
    pointData.y0 = pointData.y1 = py;

    pointData.index = index;
    pointData.location = pt.loc;
    pointData.z = pt.z;
    pointData.properties = feature.properties;
    pointData.zLabel = Axes.tickText(subplot.mockAxis, subplot.mockAxis.c2l(pt.z), 'hover').text;
    pointData.hovertemplate = pt.hovertemplate;

    choroplethHover.makeHoverInfo(pointData, trace, pt);

    return [pointData];
}
