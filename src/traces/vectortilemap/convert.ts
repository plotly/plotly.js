import Color from '../../components/color';
import Colorscale from '../../components/colorscale';
import { sanitizeHTML } from '../../lib/svg_text_utils';

const Z_STATE: any[] = ['feature-state', 'z'];
const HAS_Z: any[] = ['==', ['typeof', Z_STATE], 'number'];

/**
 * Return the tile property that MapLibre must promote to the feature id,
 * or undefined when the trace matches `locations` to the feature id in the tile.
 */
const getPromoteKey = (trace: any): string | undefined => {
    const key = trace.featureidkey.replace(/^properties\./, '');
    return key === 'id' ? undefined : key;
};

/**
 * Return a string that changes when the trace needs a new MapLibre source.
 * A change to any other attribute keeps the loaded tiles and the feature state.
 */
export const getSourceKey = (trace: any): string =>
    [
        Array.isArray(trace.source) ? trace.source.join('\n') : trace.source,
        trace.sourcelayer,
        getPromoteKey(trace) || '',
        trace.sourceattribution || ''
    ].join('\n\n');

export const getSourceOpts = (trace: any) => {
    const source = trace.source;
    const sourceOpts: any = { type: 'vector' };

    if (typeof source === 'string') sourceOpts.url = source;
    else sourceOpts.tiles = source;

    const promoteKey = getPromoteKey(trace);
    if (promoteKey) sourceOpts.promoteId = { [trace.sourcelayer]: promoteKey };

    if (trace.sourceattribution) sourceOpts.attribution = sanitizeHTML(trace.sourceattribution);

    return sourceOpts;
};

/**
 * Convert the trace colorscale to a MapLibre `interpolate` expression on the
 * `z` feature state. The result matches `Colorscale.makeColorScaleFuncFromTrace`:
 * linear RGBA interpolation, clamped at `zmin` and `zmax`.
 */
const makeColorExpression = (trace: any): any[] => {
    const { domain, range } = (Colorscale as any).extractScale(trace);
    const expression: any[] = ['interpolate', ['linear'], Z_STATE];
    const eps = (domain[domain.length - 1] - domain[0]) * 1e-9 || 1e-9;
    let previous = -Infinity;

    for (let i = 0; i < domain.length; i++) {
        // MapLibre needs strictly ascending stops, but a discrete colorscale repeats them
        const stop = Math.max(domain[i], previous + eps);
        expression.push(stop, Color.rgbaArrayToString(Color.rgbaArray(range[i])));
        previous = stop;
    }

    return expression;
};

export default function convert(calcTrace: any[]) {
    const trace = calcTrace[0].trace;
    const isVisible = trace.visible === true && trace._length !== 0;
    const visibility = isVisible ? 'visible' : 'none';
    const fill: any = { layout: { visibility }, paint: {} };
    const line: any = { layout: { visibility }, paint: {} };

    if (!isVisible) return { fill, line };

    const marker = trace.marker;
    const markerLine = marker.line || {};

    // Features that are not in `locations` carry no `z` state, and stay hidden
    const opacity = ['case', HAS_Z, marker.opacity, 0];

    fill.paint = {
        'fill-color': ['case', HAS_Z, makeColorExpression(trace), 'rgba(0, 0, 0, 0)'],
        'fill-opacity': opacity
    };

    // `marker.line.color` has no value when `marker.line.width` is 0
    if (markerLine.width > 0) {
        line.paint = {
            'line-color': markerLine.color,
            'line-width': markerLine.width,
            'line-opacity': opacity
        };
    } else {
        line.layout.visibility = 'none';
    }

    return { fill, line };
}
