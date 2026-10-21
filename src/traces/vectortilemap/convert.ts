import Color from '../../components/color';
import Colorscale from '../../components/colorscale';
import { sanitizeHTML } from '../../lib/svg_text_utils';

const Z_STATE: any[] = ['feature-state', 'z'];
const SELECTED_STATE: any[] = ['boolean', ['feature-state', 'selected'], false];

/**
 * Return the tile property that MapLibre must promote to the feature id,
 * or undefined when the trace uses the feature id stored in the tile.
 */
export const getPromoteKey = (trace: any): string | undefined => {
    const key = trace.featureidkey.replace(/^properties\./, '');
    return key === 'id' ? undefined : key;
};

const getSourceUrlKey = (trace: any): string =>
    [Array.isArray(trace.source) ? trace.source.join('\n') : trace.source, trace.sourceattribution || ''].join('\n\n');

// djb2, to make a short MapLibre source id from a source key
const hash = (str: string): string => {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
};

/**
 * Decide which MapLibre source a trace draws from.
 *
 * Traces on one subplot with the same tile URLs share a source, so the
 * browser fetches each tile once. MapLibre takes one `promoteId` object for a
 * source, and a layer that the object does not list loses its native feature
 * ids. So a URL gets up to two shared sources: one for the traces that promote
 * a property (`featureidkey`), and one for the traces that use the native ids.
 *
 * A trace gets a source of its own when it would conflict with its shared one:
 * - it sends `z` as feature state, and an earlier trace already does so on
 *   the same source layer (feature state is per source layer)
 * - it promotes a different property on a source layer than an earlier trace
 *
 * Traces with `visible: 'legendonly'` count, so a legend click keeps the
 * source and its loaded tiles.
 *
 * @param trace - the full trace
 * @param fullData - all full traces of the figure
 * @returns `key`, which changes when the trace needs a new source, plus the
 *   source `id` and the MapLibre source options
 */
export function getSourceSpec(trace: any, fullData: any[]) {
    const urlKey = getSourceUrlKey(trace);
    const promoteId: Record<string, string> = {};
    const stateLayers = { native: new Set<string>(), promoted: new Set<string>() };
    const ownUids = new Set<string>();

    // One pass in fullData order, so every peer computes the same assignment
    for (const peer of fullData) {
        if (peer.type !== 'vectortilemap' || peer.visible === false || peer.subplot !== trace.subplot) continue;
        if (getSourceUrlKey(peer) !== urlKey) continue;

        const layer = peer.sourcelayer;
        const key = getPromoteKey(peer);
        const states = key ? stateLayers.promoted : stateLayers.native;
        if (
            (key && promoteId[layer] !== undefined && promoteId[layer] !== key) ||
            (peer._length && states.has(layer))
        ) {
            ownUids.add(peer.uid);
            continue;
        }
        if (peer._length) states.add(layer);
        if (key) promoteId[layer] = key;
    }

    const sourceOpts: any = { type: 'vector' };
    if (typeof trace.source === 'string') sourceOpts.url = trace.source;
    else sourceOpts.tiles = trace.source;
    if (trace.sourceattribution) sourceOpts.attribution = sanitizeHTML(trace.sourceattribution);

    const ownKey = getPromoteKey(trace);
    if (ownUids.has(trace.uid)) {
        if (ownKey) sourceOpts.promoteId = { [trace.sourcelayer]: ownKey };
        const key = `${urlKey}\n\nown:${trace.uid}:${trace.sourcelayer}:${ownKey || ''}`;
        return { key, id: `source-${trace.uid}`, opts: sourceOpts };
    }

    let key = `${urlKey}\n\nnative`;
    if (ownKey) {
        const layers = Object.keys(promoteId).sort();
        sourceOpts.promoteId = {};
        for (const layer of layers) sourceOpts.promoteId[layer] = promoteId[layer];
        key = `${urlKey}\n\n${layers.map((l) => `${l}=${promoteId[l]}`).join(',')}`;
    }
    return { key, id: `source-vt-${hash(key)}`, opts: sourceOpts };
}

/**
 * Return the MapLibre expression for the color value of a feature, and the
 * expression that tests that the feature has one. Return undefined for a
 * trace with one color.
 */
const getValueExpressions = (trace: any) => {
    let value: any[];
    if (trace._length) value = Z_STATE;
    else if (trace.zkey) value = ['get', trace.zkey];
    else return;

    return { value, hasValue: ['==', ['typeof', value], 'number'] };
};

/**
 * Convert the trace colorscale to a MapLibre `interpolate` expression. The
 * result matches `Colorscale.makeColorScaleFuncFromTrace`: linear RGBA
 * interpolation, clamped at `zmin` and `zmax`.
 */
const makeColorExpression = (trace: any, value: any[]): any[] => {
    const { domain, range } = (Colorscale as any).extractScale(trace);
    const expression: any[] = ['interpolate', ['linear'], value];
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

const getOpacityExpression = (trace: any, hasValue: any[] | undefined, isSelecting: boolean) => {
    const opacity = trace.marker.opacity;
    let out: any = opacity;
    if (isSelecting) {
        const selected = trace.selected.marker.opacity ?? opacity;
        const unselected = trace.unselected.marker.opacity ?? 0.2 * opacity;
        out = ['case', SELECTED_STATE, selected, unselected];
    }
    // Features with no color value stay hidden
    return hasValue ? ['case', hasValue, out, 0] : out;
};

/**
 * Return the layers that draw a trace, bottom first. Each item holds the
 * layer `role` (the suffix of the layer id), the MapLibre layer `type`, and
 * its `layout` and `paint` properties.
 *
 * @param calcTrace - the calcdata of the trace
 * @param isSelecting - true while a selection is active on the trace
 */
export default function convert(calcTrace: any[], isSelecting = false) {
    const trace = calcTrace[0].trace;
    const visibility = trace.visible === true ? 'visible' : 'none';
    const layertype = trace.layertype;
    const marker = trace.marker;
    const markerLine = marker.line || {};
    const expressions = getValueExpressions(trace);
    const hasValue = expressions && expressions.hasValue;
    const opacity = getOpacityExpression(trace, hasValue, isSelecting);

    let color: any;
    if (expressions) color = ['case', hasValue, makeColorExpression(trace, expressions.value), 'rgba(0, 0, 0, 0)'];
    else color = layertype === 'line' ? trace.line.color : marker.color;

    if (layertype === 'circle') {
        const paint: any = {
            'circle-color': color,
            'circle-radius': marker.size / 2,
            'circle-opacity': opacity
        };
        if (markerLine.width > 0) {
            Object.assign(paint, {
                'circle-stroke-color': markerLine.color,
                'circle-stroke-width': markerLine.width,
                'circle-stroke-opacity': opacity
            });
        }
        return [{ role: 'circle', type: 'circle', layout: { visibility }, paint }];
    }

    if (layertype === 'line') {
        return [
            {
                role: 'line',
                type: 'line',
                layout: { visibility, 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': color, 'line-width': trace.line.width, 'line-opacity': opacity }
            }
        ];
    }

    const outline: any = { role: 'outline', type: 'line', layout: { visibility }, paint: {} };
    // `marker.line.color` has no value when `marker.line.width` is 0
    if (markerLine.width > 0) {
        outline.paint = {
            'line-color': markerLine.color,
            'line-width': markerLine.width,
            'line-opacity': opacity
        };
    } else {
        outline.layout.visibility = 'none';
    }

    return [
        { role: 'fill', type: 'fill', layout: { visibility }, paint: { 'fill-color': color, 'fill-opacity': opacity } },
        outline
    ];
}

/**
 * Return a function that gives the color of a feature from its value, for
 * hover labels. A trace with one color returns that color.
 */
export const makeFeatureColorFn = (trace: any): ((v: number) => string) => {
    if (!trace._hasColorscale) {
        const c = trace.layertype === 'line' ? trace.line.color : trace.marker.color;
        return () => c;
    }
    return (Colorscale as any).makeColorScaleFuncFromTrace(trace);
};
