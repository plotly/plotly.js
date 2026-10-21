import { traceLayerPrefix } from '../../plots/map/constants';
import convert, { getSourceSpec } from './convert';

/**
 * Add the MapLibre source for `spec` to the map if no trace uses it yet, and
 * record `uid` as a user. Traces with the same tile URLs share one source.
 */
function acquireSource(subplot: any, spec: any, uid: string) {
    const registry: Map<string, any> = (subplot._vectorTileSources ||= new Map());
    let entry = registry.get(spec.key);
    if (!entry) {
        entry = { id: spec.id, users: new Set<string>() };
        registry.set(spec.key, entry);
    }
    // A new `map.style` removes every source, so add it again when it is gone
    if (!subplot.map.getSource(entry.id)) subplot.map.addSource(entry.id, spec.opts);
    entry.users.add(uid);
}

/**
 * Remove `uid` from the users of a source, and remove the source from the map
 * when no trace uses it. The caller must remove its layers first.
 */
function releaseSource(subplot: any, key: string, uid: string) {
    const registry: Map<string, any> | undefined = subplot._vectorTileSources;
    const entry = registry && registry.get(key);
    if (!entry) return;
    entry.users.delete(uid);
    if (entry.users.size) return;
    registry!.delete(key);
    if (subplot.map.getSource(entry.id)) subplot.map.removeSource(entry.id);
}

class VectorTileMap {
    type = 'vectortilemap';
    subplot: any;
    uid: string;
    sourceId = '';
    sourceKey: string | null = null;
    sourceLayer = '';
    // previous `below` value, to know when to move the layers
    below: string | null = null;
    // ids of the layers on the map, bottom first, and their layer type
    layers: { id: string; type: string }[] = [];
    layerSignature = '';
    // `z` feature state that the map holds now, by location
    zState = new Map<string, number>();
    // feature ids of the active selection, or null when no selection is active
    selectedIds: Set<string | number> | null = null;
    appliedSelection = new Set<string | number>();

    constructor(subplot: any, uid: string) {
        this.subplot = subplot;
        this.uid = uid;
    }

    get mainLayerId(): string {
        // the layer that hover and selection query: the top fill, line or circle layer
        const main = this.layers.find((l) => l.type !== 'line' || this.layers.length === 1);
        return main ? main.id : '';
    }

    update(calcTrace: any[]) {
        const trace = calcTrace[0].trace;
        const subplot = this.subplot;
        const map = subplot.map;
        const layers = convert(calcTrace, this.selectedIds !== null);
        const below = subplot.belowLookup[`trace-${this.uid}`];
        const spec = getSourceSpec(trace, subplot.gd._fullData);
        const layerSignature = layers.map((l) => `${l.role}:${l.type}`).join(',');

        if (spec.key !== this.sourceKey || trace.sourcelayer !== this.sourceLayer) {
            this.removeLayers();
            const oldKey = this.sourceKey;
            acquireSource(subplot, spec, this.uid);
            if (oldKey !== null && oldKey !== spec.key) releaseSource(subplot, oldKey, this.uid);
            this.sourceKey = spec.key;
            this.sourceId = spec.id;
            this.sourceLayer = trace.sourcelayer;
            this.zState = new Map();
            this.appliedSelection = new Set();
            this.addLayers(trace, layers, below);
        } else if (below !== this.below || layerSignature !== this.layerSignature) {
            this.removeLayers();
            this.addLayers(trace, layers, below);
        } else {
            for (let i = 0; i < layers.length; i++) {
                const id = this.layers[i].id;
                subplot.setOptions(id, 'setLayoutProperty', layers[i].layout);
                if (layers[i].layout.visibility === 'visible') {
                    subplot.setOptions(id, 'setPaintProperty', layers[i].paint);
                }
                map.setLayerZoomRange(id, trace.minzoom, trace.maxzoom);
            }
        }
        this.below = below;
        this.layerSignature = layerSignature;

        this.updateFeatureState(calcTrace);
        this.updateSelectionState();

        // link ref for hover and selection
        trace._glTrace = this;
    }

    /**
     * Send `z` to the map as feature state. Only the locations whose value
     * changed since the last call cost a `setFeatureState` call.
     */
    updateFeatureState(calcTrace: any[]) {
        const map = this.subplot.map;
        const prevState = this.zState;
        const nextState = new Map<string, number>();
        const target: any = { source: this.sourceId, sourceLayer: this.sourceLayer, id: null };
        const trace = calcTrace[0].trace;

        if (trace.visible === true && trace._length) {
            for (let i = 0; i < calcTrace.length; i++) {
                const loc = calcTrace[i].loc;
                if (loc === null) continue;

                const key = String(loc);
                const z = calcTrace[i].z;
                nextState.set(key, z);

                if (prevState.get(key) !== z) {
                    target.id = key;
                    map.setFeatureState(target, { z });
                }
            }
        }

        for (const key of prevState.keys()) {
            if (!nextState.has(key)) {
                target.id = key;
                map.removeFeatureState(target, 'z');
            }
        }

        this.zState = nextState;
    }

    /** Send the `selected` feature state for the ids in `selectedIds`. */
    updateSelectionState() {
        const map = this.subplot.map;
        const target: any = { source: this.sourceId, sourceLayer: this.sourceLayer, id: null };
        const next = this.selectedIds || new Set();

        for (const id of this.appliedSelection) {
            if (!next.has(id)) {
                target.id = id;
                map.removeFeatureState(target, 'selected');
            }
        }
        for (const id of next) {
            if (!this.appliedSelection.has(id)) {
                target.id = id;
                map.setFeatureState(target, { selected: true });
            }
        }
        this.appliedSelection = new Set(next);
    }

    /** Apply a new selection: the feature state, then the opacity expressions. */
    updateOnSelect(calcTrace: any[]) {
        const subplot = this.subplot;
        const layers = convert(calcTrace, this.selectedIds !== null);
        this.updateSelectionState();
        for (let i = 0; i < layers.length; i++) {
            if (layers[i].layout.visibility === 'visible') {
                subplot.setOptions(this.layers[i].id, 'setPaintProperty', layers[i].paint);
            }
        }
    }

    addLayers(trace: any, layers: any[], below: string) {
        this.layers = [];
        for (const layer of layers) {
            const id = `${traceLayerPrefix}${this.uid}-${layer.role}`;
            this.subplot.addLayer(
                {
                    type: layer.type,
                    id,
                    source: this.sourceId,
                    'source-layer': trace.sourcelayer,
                    minzoom: trace.minzoom,
                    maxzoom: trace.maxzoom,
                    layout: layer.layout,
                    paint: layer.paint
                },
                below
            );
            this.layers.push({ id, type: layer.type });
        }
    }

    removeLayers() {
        const map = this.subplot.map;
        for (let i = this.layers.length - 1; i >= 0; i--) {
            if (map.getLayer(this.layers[i].id)) map.removeLayer(this.layers[i].id);
        }
        this.layers = [];
    }

    dispose() {
        this.removeLayers();
        if (this.sourceKey !== null) releaseSource(this.subplot, this.sourceKey, this.uid);
        this.sourceKey = null;
    }
}

export default function createVectorTileMap(subplot: any, calcTrace: any[]) {
    const vectorTileMap = new VectorTileMap(subplot, calcTrace[0].trace.uid);
    vectorTileMap.update(calcTrace);
    return vectorTileMap;
}
