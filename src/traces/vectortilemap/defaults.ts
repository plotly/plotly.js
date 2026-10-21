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

export default function supplyDefaults(traceIn: any, traceOut: any, defaultColor: string, layout: any) {
    const coerce = (attr: string, dflt?: unknown) => Lib.coerce(traceIn, traceOut, attributes, attr, dflt);

    const source = coerce('source');
    const sourcelayer = coerce('sourcelayer');
    const locations = coerce('locations');
    const z = coerce('z');

    if (
        !isValidSource(source) ||
        !sourcelayer ||
        !Lib.isArrayOrTypedArray(locations) ||
        !locations.length ||
        !Lib.isArrayOrTypedArray(z) ||
        !z.length
    ) {
        traceOut.visible = false;
        return;
    }

    traceOut._length = Math.min(locations.length, z.length);

    coerce('sourceattribution');
    coerce('featureidkey');
    coerce('minzoom');
    coerce('maxzoom');
    coerce('below');

    coerce('text');
    coerce('hovertext');
    coerce('hovertemplate');
    coerce('hovertemplatefallback');

    const mlw = coerce('marker.line.width');
    if (mlw) coerce('marker.line.color');
    coerce('marker.opacity');

    colorscaleDefaults(traceIn, traceOut, layout, coerce, { prefix: '', cLetter: 'z' });
}
