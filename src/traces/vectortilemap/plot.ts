import { traceLayerPrefix } from '../../plots/map/constants';
import convert, { getSourceKey, getSourceOpts } from './convert';

const LAYER_TYPES = ['fill', 'line'] as const;

class VectorTileMap {
    type = 'vectortilemap';
    subplot: any;
    uid: string;
    sourceId: string;
    layerIds: Record<(typeof LAYER_TYPES)[number], string>;
    // previous `below` value, to know when to move the layers
    below: string | null = null;
    sourceKey: string | null = null;
    sourceLayer = '';
    // `z` feature state that the map holds now, by location
    zState = new Map<string, number>();

    constructor(subplot: any, uid: string) {
        this.subplot = subplot;
        this.uid = uid;
        this.sourceId = `source-${uid}`;
        this.layerIds = {
            fill: `${traceLayerPrefix}${uid}-fill`,
            line: `${traceLayerPrefix}${uid}-line`
        };
    }

    update(calcTrace: any[]) {
        const trace = calcTrace[0].trace;
        const subplot = this.subplot;
        const map = subplot.map;
        const optsAll: any = convert(calcTrace);
        const below = subplot.belowLookup[`trace-${this.uid}`];
        const sourceKey = getSourceKey(trace);

        if (sourceKey !== this.sourceKey) {
            this.removeLayers();
            if (map.getSource(this.sourceId)) map.removeSource(this.sourceId);
            map.addSource(this.sourceId, getSourceOpts(trace));
            this.sourceKey = sourceKey;
            this.sourceLayer = trace.sourcelayer;
            this.zState = new Map();
            this.addLayers(trace, optsAll, below);
        } else if (below !== this.below) {
            this.removeLayers();
            this.addLayers(trace, optsAll, below);
        } else {
            for (const k of LAYER_TYPES) {
                const id = this.layerIds[k];
                const opts = optsAll[k];
                subplot.setOptions(id, 'setLayoutProperty', opts.layout);
                if (opts.layout.visibility === 'visible') {
                    subplot.setOptions(id, 'setPaintProperty', opts.paint);
                }
                map.setLayerZoomRange(id, trace.minzoom, trace.maxzoom);
            }
        }
        this.below = below;

        this.updateFeatureState(calcTrace);

        // link ref for hover
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
        const isVisible = calcTrace[0].trace.visible === true;

        if (isVisible) {
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

    addLayers(trace: any, optsAll: any, below: string) {
        for (const k of LAYER_TYPES) {
            const opts = optsAll[k];
            this.subplot.addLayer(
                {
                    type: k,
                    id: this.layerIds[k],
                    source: this.sourceId,
                    'source-layer': trace.sourcelayer,
                    minzoom: trace.minzoom,
                    maxzoom: trace.maxzoom,
                    layout: opts.layout,
                    paint: opts.paint
                },
                below
            );
        }
    }

    removeLayers() {
        const map = this.subplot.map;
        for (let i = LAYER_TYPES.length - 1; i >= 0; i--) {
            const id = this.layerIds[LAYER_TYPES[i]];
            if (map.getLayer(id)) map.removeLayer(id);
        }
    }

    dispose() {
        const map = this.subplot.map;
        this.removeLayers();
        if (map.getSource(this.sourceId)) map.removeSource(this.sourceId);
    }
}

export default function createVectorTileMap(subplot: any, calcTrace: any[]) {
    const vectorTileMap = new VectorTileMap(subplot, calcTrace[0].trace.uid);
    vectorTileMap.update(calcTrace);
    return vectorTileMap;
}
