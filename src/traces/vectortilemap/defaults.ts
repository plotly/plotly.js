import colorscaleDefaults from '../../components/colorscale/defaults';
import Lib from '../../lib';
import attributes from './attributes';

const isValidSource = (source: unknown): boolean => {
    if (typeof source === 'string') return source !== '';
    if (!Array.isArray(source) || !source.length) return false;
    for (const url of source) {
        if (typeof url !== 'string' || url === '') return false;
    }
    return true;
};

/**
 * Coerce the trace attributes.
 *
 * A trace colors its features in one of three ways:
 * - `locations` and `z`, sent to the map as feature state
 * - `zkey`, a numeric tile property, with `zmin` and `zmax` set
 * - one color, `marker.color` or `line.color`, which defaults to the trace color
 */
export default function supplyDefaults(traceIn: any, traceOut: any, defaultColor: string, layout: any) {
    const coerce = (attr: string, dflt?: unknown) => Lib.coerce(traceIn, traceOut, attributes, attr, dflt);

    const source = coerce('source');
    const sourcelayer = coerce('sourcelayer');
    if (!isValidSource(source) || !sourcelayer) {
        traceOut.visible = false;
        return;
    }

    const layertype = coerce('layertype');
    const locations = coerce('locations');
    const z = coerce('z');
    const hasZ = Lib.isArrayOrTypedArray(locations) && locations.length && Lib.isArrayOrTypedArray(z) && z.length;

    if (hasZ) {
        traceOut._length = Math.min(locations.length, z.length);
    } else {
        delete traceOut.locations;
        delete traceOut.z;
        traceOut._length = null;

        const zkey = coerce('zkey');
        if (zkey && (traceIn.zmin === undefined || traceIn.zmax === undefined)) {
            Lib.warn(`vectortilemap trace with zkey *${zkey}* needs zmin and zmax, and draws nothing without them.`);
            traceOut.visible = false;
            return;
        }
    }

    coerce('sourceattribution');
    coerce('featureidkey');
    coerce('minzoom');
    coerce('maxzoom');
    coerce('below');

    coerce('text');
    coerce('hovertext');
    coerce('hovertemplate');
    coerce('hovertemplatefallback');

    coerce('marker.opacity');
    if (layertype === 'line') {
        coerce('line.width');
    } else {
        if (layertype === 'circle') coerce('marker.size');
        const mlw = coerce('marker.line.width', layertype === 'circle' ? 0 : undefined);
        if (mlw) coerce('marker.line.color');
    }

    Lib.coerceSelectionMarkerOpacity(traceOut, coerce);

    traceOut._hasColorscale = Boolean(hasZ || traceOut.zkey);
    if (traceOut._hasColorscale) {
        colorscaleDefaults(traceIn, traceOut, layout, coerce, { prefix: '', cLetter: 'z' });
    } else {
        coerce(layertype === 'line' ? 'line.color' : 'marker.color', defaultColor);
    }
}
