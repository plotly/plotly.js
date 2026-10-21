import colorscaleDefaults from '../../components/colorscale/defaults';
import Lib from '../../lib';
import handleArrayContainerDefaults from '../../plots/array_container_defaults';
import attributes from './attributes';

const isValidSource = (source: unknown): boolean => {
    if (typeof source === 'string') return source !== '';
    if (!Array.isArray(source) || !source.length) return false;
    for (const url of source) {
        if (typeof url !== 'string' || url === '') return false;
    }
    return true;
};

const RANGE_OPERATIONS = ['[]', '()', '[)', '(]', '][', ')(', '](', ')['];
const SET_OPERATIONS = ['{}', '}{'];

const isScalar = (v: unknown) => typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean';

function filterDefaults(itemIn: any, itemOut: any) {
    const coerce = (attr: string, dflt?: unknown) =>
        Lib.coerce(itemIn, itemOut, (attributes as any).filters, attr, dflt);

    const enabled = coerce('enabled');
    const key = coerce('key');
    const operation = coerce('operation');
    const value = coerce('value');
    if (!enabled) return;

    let valid = Boolean(key);
    if (RANGE_OPERATIONS.includes(operation)) {
        valid = valid && Array.isArray(value) && value.length === 2 && isScalar(value[0]) && isScalar(value[1]);
    } else if (SET_OPERATIONS.includes(operation)) {
        valid = valid && Array.isArray(value) && value.every(isScalar);
    } else {
        valid = valid && isScalar(value);
    }
    if (!valid) itemOut.enabled = false;
}

/**
 * Return the valid [zoom, value] pairs of a stops attribute, sorted by zoom,
 * or undefined when none is valid.
 */
function cleanStops(stops: unknown): number[][] | undefined {
    if (!Array.isArray(stops)) return;
    const out = stops
        .filter((s) => Array.isArray(s) && Number.isFinite(s[0]) && Number.isFinite(s[1]))
        .sort((a, b) => a[0] - b[0]);
    return out.length ? out : undefined;
}

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
    handleArrayContainerDefaults(traceIn, traceOut, {
        name: 'filters',
        inclusionAttr: 'enabled',
        handleItemDefaults: filterDefaults
    });
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
        traceOut.line._widthstops = cleanStops(coerce('line.widthstops'));
    } else {
        if (layertype === 'circle') {
            coerce('marker.size');
            traceOut.marker._sizestops = cleanStops(coerce('marker.sizestops'));
        }
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
