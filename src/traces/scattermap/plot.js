'use strict';

var Lib = require('../../lib');
var convert = require('./convert');
var LAYER_PREFIX = require('../../plots/map/constants').traceLayerPrefix;
var ORDER = {
    cluster: ['cluster', 'clusterCount', 'circle'],
    nonCluster: ['fill', 'line', 'circle', 'symbol'],
};

function ScatterMap(subplot, uid, clusterEnabled, isHidden) {
    this.type = 'scattermap';
    this.subplot = subplot;
    this.uid = uid;
    this.clusterEnabled = clusterEnabled;
    this.isHidden = isHidden;

    this.sourceIds = {
        fill: 'source-' + uid + '-fill',
        line: 'source-' + uid + '-line',
        circle: 'source-' + uid + '-circle',
        symbol: 'source-' + uid + '-symbol',
        cluster: 'source-' + uid + '-circle',
        clusterCount: 'source-' + uid + '-circle',
    };

    this.layerIds = {
        fill: LAYER_PREFIX + uid + '-fill',
        line: LAYER_PREFIX + uid + '-line',
        circle: LAYER_PREFIX + uid + '-circle',
        symbol: LAYER_PREFIX + uid + '-symbol',
        cluster: LAYER_PREFIX + uid + '-cluster',
        clusterCount: LAYER_PREFIX + uid + '-cluster-count',
    };

    // We could merge the 'fill' source with the 'line' source and
    // the 'circle' source with the 'symbol' source if ever having
    // for up-to 4 sources per 'scattermap' traces becomes a problem.

    // previous 'below' value,
    // need this to update it properly
    this.below = null;
}

var proto = ScatterMap.prototype;

proto.addSource = function(k, opts, cluster) {
    var sourceOpts = {
        type: 'geojson',
        data: opts.geojson,
    };

    if(cluster && cluster.enabled) {
        Lib.extendFlat(sourceOpts, {
            cluster: true,
            clusterMaxZoom: cluster.maxzoom,
        });
    }
    var isSourceExists = this.subplot.map.getSource(this.sourceIds[k]);
    if(isSourceExists) {
        isSourceExists.setData(opts.geojson);
    } else {
        this.subplot.map.addSource(this.sourceIds[k], sourceOpts);
    }
};

proto.setSourceData = function(k, opts) {
    this.subplot.map
        .getSource(this.sourceIds[k])
        .setData(opts.geojson);
};

proto.addLayer = function(k, opts, below) {
    var source = {
        type: opts.type,
        id: this.layerIds[k],
        source: this.sourceIds[k],
        layout: opts.layout,
        paint: opts.paint,
    };
    if(opts.filter) {
        source.filter = opts.filter;
    }
    var currentLayerId = this.layerIds[k];
    var layerExist;
    var layers = this.subplot.getMapLayers();
    for(var i = 0; i < layers.length; i++) {
        if(layers[i].id === currentLayerId) {
            layerExist = true;
            break;
        }
    }

    if(layerExist) {
        this.subplot.setOptions(currentLayerId, 'setLayoutProperty', source.layout);
        if(source.layout.visibility === 'visible') {
            this.subplot.setOptions(currentLayerId, 'setPaintProperty', source.paint);
        }
    } else {
        this.subplot.addLayer(source, below);
    }
};

proto.update = function update(calcTrace) {
    var trace = calcTrace[0].trace;
    var subplot = this.subplot;
    var map = subplot.map;
    var optsAll = convert(subplot.gd, calcTrace);
    var below = subplot.belowLookup['trace-' + this.uid];
    var hasCluster = !!(trace.cluster && trace.cluster.enabled);
    var hadCluster = !!this.clusterEnabled;
    var lThis = this;

    function addCluster(noSource) {
        if(!noSource) lThis.addSource('circle', optsAll.circle, trace.cluster);
        var order = ORDER.cluster;
        for(var i = 0; i < order.length; i++) {
            var k = order[i];
            var opts = optsAll[k];
            lThis.addLayer(k, opts, below);
        }
    }

    function removeCluster(noSource) {
        var order = ORDER.cluster;
        for(var i = order.length - 1; i >= 0; i--) {
            var k = order[i];
            map.removeLayer(lThis.layerIds[k]);
        }
        if(!noSource) map.removeSource(lThis.sourceIds.circle);
    }

    function addNonCluster(noSource) {
        var order = ORDER.nonCluster;
        for(var i = 0; i < order.length; i++) {
            var k = order[i];
            var opts = optsAll[k];
            if(!noSource) lThis.addSource(k, opts);
            lThis.addLayer(k, opts, below);
        }
    }

    function removeNonCluster(noSource) {
        var order = ORDER.nonCluster;
        for(var i = order.length - 1; i >= 0; i--) {
            var k = order[i];
            map.removeLayer(lThis.layerIds[k]);
            if(!noSource) map.removeSource(lThis.sourceIds[k]);
        }
    }

    function remove(noSource) {
        if(hadCluster) removeCluster(noSource); else removeNonCluster(noSource);
    }

    function add(noSource) {
        if(hasCluster) addCluster(noSource); else addNonCluster(noSource);
    }

    function repaint() {
        var order = hasCluster ? ORDER.cluster : ORDER.nonCluster;
        for(var i = 0; i < order.length; i++) {
            var k = order[i];
            var opts = optsAll[k];
            if(!opts) continue;

            subplot.setOptions(lThis.layerIds[k], 'setLayoutProperty', opts.layout);

            if(opts.layout.visibility === 'visible') {
                if(k !== 'cluster') {
                    lThis.setSourceData(k, opts);
                }
                subplot.setOptions(lThis.layerIds[k], 'setPaintProperty', opts.paint);
            }
        }
    }

    var wasHidden = this.isHidden;
    var isHidden = trace.visible !== true;

    if(isHidden) {
        if(!wasHidden) remove();
    } else if(wasHidden) {
        if(!isHidden) add();
    } else if(hadCluster !== hasCluster) {
        remove();
        add();
    } else if(this.below !== below) {
        remove(true);
        add(true);
        repaint();
    } else {
        repaint();
    }

    this.clusterEnabled = hasCluster;
    this.isHidden = isHidden;
    this.below = below;

    // link ref for quick update during selections
    calcTrace[0].trace._glTrace = this;
};

proto.dispose = function dispose() {
    var map = this.subplot.map;
    var order = this.clusterEnabled ? ORDER.cluster : ORDER.nonCluster;
    for(var i = order.length - 1; i >= 0; i--) {
        var k = order[i];
        map.removeLayer(this.layerIds[k]);
        map.removeSource(this.sourceIds[k]);
    }
};

module.exports = function createScatterMap(subplot, calcTrace) {
    var trace = calcTrace[0].trace;
    var hasCluster = trace.cluster && trace.cluster.enabled;
    var isHidden = trace.visible !== true;

    var scatterMap = new ScatterMap(
        subplot,
        trace.uid,
        hasCluster,
        isHidden
    );

    var optsAll = convert(subplot.gd, calcTrace);
    var below = scatterMap.below = subplot.belowLookup['trace-' + trace.uid];
    var i, k, opts;

    if(hasCluster) {
        scatterMap.addSource('circle', optsAll.circle, trace.cluster);
        for(i = 0; i < ORDER.cluster.length; i++) {
            k = ORDER.cluster[i];
            opts = optsAll[k];
            scatterMap.addLayer(k, opts, below);
        }
    } else {
        for(i = 0; i < ORDER.nonCluster.length; i++) {
            k = ORDER.nonCluster[i];
            opts = optsAll[k];
            scatterMap.addSource(k, opts, trace.cluster);
            scatterMap.addLayer(k, opts, below);
        }
    }

    // link ref for quick update during selections
    calcTrace[0].trace._glTrace = scatterMap;

    return scatterMap;
};
