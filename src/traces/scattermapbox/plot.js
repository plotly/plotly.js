/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var convert = require('./convert');
var LAYER_PREFIX = require('../../plots/mapbox/constants').traceLayerPrefix;
var ORDER = {
    cluster: ['cluster', 'clusterCount', 'circle'],
    nonCluster: ['fill', 'line', 'circle', 'symbol'],
};

function ScatterMapbox(subplot, uid, clusterEnabled) {
    this.type = 'scattermapbox';
    this.subplot = subplot;
    this.uid = uid;
    this.clusterEnabled = clusterEnabled;

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
    // for up-to 4 sources per 'scattermapbox' traces becomes a problem.

    // previous 'below' value,
    // need this to update it properly
    this.below = null;
}

var proto = ScatterMapbox.prototype;

proto.addSource = function(k, opts, cluster) {
    var sourceOpts = {
            type: 'geojson',
            data: opts.geojson,
    };
    
    if(cluster.enabled) {
        Lib.extendFlat({}, sourceOpts, {
            cluster: true, // better to rename this key to clusterEnabled?
            clusterMaxZoom: cluster.maxZoom,
            clusterRadius: cluster.radius,
        });
    } 
    
    this.subplot.map.addSource(this.sourceIds[k], sourceOpts);
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
    this.subplot.addLayer(source, below);
};

proto.update = function update(calcTrace) {
    var trace = calcTrace[0].trace;
    var subplot = this.subplot;
    var map = subplot.map;
    var optsAll = convert(subplot.gd, calcTrace);
    var below = subplot.belowLookup['trace-' + this.uid];
    var i, k, opts, order;

    if(trace.cluster.enabled === this.clusterEnabled) {
        order = [];
        if(below !== this.below) {
            for(i = order.length - 1; i >= 0; i--) {
                k = order[i];
                map.removeLayer(this.layerIds[k]);
            }
            for(i = 0; i < order.length; i++) {
                k = order[i];
                opts = optsAll[k];
                this.addLayer(k, opts, below);
            }
            this.below = below;
        }
    } else if(trace.cluster.enabled && !this.clusterEnabled) {
        for(i = ORDER.nonCluster.length - 1; i >= 0; i--) {
            k = ORDER.nonCluster[i];
            map.removeLayer(this.layerIds[k]);
            map.removeSource(this.sourceIds[k]);
        }
        this.addSource('circle', optsAll.circle, trace.cluster);
        for(i = 0; i < ORDER.cluster.length; i++) {
            k = ORDER.cluster[i];
            opts = optsAll[k];
            this.addLayer(k, opts, below);
        }
        this.clusterEnabled = trace.cluster.enabled;
    } else if(!trace.cluster.enabled && this.clusterEnabled) {
        for(i = 0; i < ORDER.cluster.length; i++) {
            k = ORDER.cluster[i];
            map.removeLayer(this.layerIds[k]);
        }
        map.removeSource(this.sourceIds.circle);
        for(i = 0; i < ORDER.nonCluster.length; i++) {
            k = ORDER.nonCluster[i];
            opts = optsAll[k];
            this.addSource(k, opts, trace.cluster);
            this.addLayer(k, opts, below);
        }
        this.clusterEnabled = trace.cluster.enabled;
    }

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

module.exports = function createScatterMapbox(subplot, calcTrace) {
    var trace = calcTrace[0].trace;
    var scatterMapbox = new ScatterMapbox(
    subplot,
    trace.uid,
    trace.cluster.enabled
  );
    var optsAll = convert(subplot.gd, calcTrace);
    var below = scatterMapbox.below = subplot.belowLookup['trace-' + trace.uid];
    var i, k, opts;

    if(trace.cluster.enabled) {
        scatterMapbox.addSource('circle', optsAll.circle, trace.cluster);
        for(i = 0; i < ORDER.cluster.length; i++) {
            k = ORDER.cluster[i];
            opts = optsAll[k];
            scatterMapbox.addLayer(k, opts, below);
        }
    } else {
        for(i = 0; i < ORDER.nonCluster.length; i++) {
            k = ORDER.nonCluster[i];
            opts = optsAll[k];
            scatterMapbox.addSource(k, opts, trace.cluster);
            scatterMapbox.addLayer(k, opts, below);
        }
    }

    // link ref for quick update during selections
    calcTrace[0].trace._glTrace = scatterMapbox;

    return scatterMapbox;
};
