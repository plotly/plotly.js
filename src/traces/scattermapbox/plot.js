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

function ScatterMapbox(subplot, uid) {
    this.order = ['fill', 'line', 'circle', 'symbol'];
    this.type = 'scattermapbox';
    this.subplot = subplot;
    this.uid = uid;

    this.sourceIds = {
        fill: 'source-' + uid + '-fill',
        line: 'source-' + uid + '-line',
        circle: 'source-' + uid + '-circle',
        symbol: 'source-' + uid + '-symbol'
    };

    this.layerIds = {
        fill: LAYER_PREFIX + uid + '-fill',
        line: LAYER_PREFIX + uid + '-line',
        circle: LAYER_PREFIX + uid + '-circle',
        symbol: LAYER_PREFIX + uid + '-symbol'
    };

    // We could merge the 'fill' source with the 'line' source and
    // the 'circle' source with the 'symbol' source if ever having
    // for up-to 4 sources per 'scattermapbox' traces becomes a problem.

    // previous 'below' value,
    // need this to update it properly
    this.below = null;
}

var scattermapboxproto = ScatterMapbox.prototype;

scattermapboxproto.addSource = function(k, opts) {
    this.subplot.map.addSource(this.sourceIds[k], {
        type: 'geojson',
        data: opts.geojson
    });
};

scattermapboxproto.setSourceData = function(k, opts) {
    this.subplot.map
        .getSource(this.sourceIds[k])
        .setData(opts.geojson);
};

scattermapboxproto.addLayer = function(k, opts, below) {
    this.subplot.addLayer({
        type: k,
        id: this.layerIds[k],
        source: this.sourceIds[k],
        layout: opts.layout,
        paint: opts.paint
    }, below);
};

scattermapboxproto.update = function update(calcTrace) {
    var subplot = this.subplot;
    var map = subplot.map;
    var optsAll = convert(subplot.gd, calcTrace);
    var below = subplot.belowLookup['trace-' + this.uid];
    var i, k, opts;

    if(below !== this.below) {
        for(i = this.order.length - 1; i >= 0; i--) {
            k = this.order[i];
            map.removeLayer(this.layerIds[k]);
        }
        for(i = 0; i < this.order.length; i++) {
            k = this.order[i];
            opts = optsAll[k];
            this.addLayer(k, opts, below);
        }
        this.below = below;
    }

    for(i = 0; i < this.order.length; i++) {
        k = this.order[i];
        opts = optsAll[k];

        subplot.setOptions(this.layerIds[k], 'setLayoutProperty', opts.layout);

        if(opts.layout.visibility === 'visible') {
            this.setSourceData(k, opts);
            subplot.setOptions(this.layerIds[k], 'setPaintProperty', opts.paint);
        }
    }

    // link ref for quick update during selections
    calcTrace[0].trace._glTrace = this;
};

scattermapboxproto.dispose = function dispose() {
    var map = this.subplot.map;

    for(var i = this.order.length - 1; i >= 0; i--) {
        var k = this.order[i];
        map.removeLayer(this.layerIds[k]);
        map.removeSource(this.sourceIds[k]);
    }
};


function ScatterClusterMapbox(subplot, uid) {
    this.type = 'scatterclustermapbox';
    this.subplot = subplot;
    this.uid = uid;
    this.order = ['cluster', 'clusterCount', 'clusterPoints'];

    this.sourceId = 'source-' + uid + '-cluster';

    this.layerIds = {
        cluster: LAYER_PREFIX + uid + '-cluster',
        clusterCount: LAYER_PREFIX + uid + '-cluster-count',
        clusterPoints: LAYER_PREFIX + uid + '-cluster-points'
    };

    // We could merge the 'fill' source with the 'line' source and
    // the 'circle' source with the 'symbol' source if ever having
    // for up-to 4 sources per 'scattermapbox' traces becomes a problem.

    // previous 'below' value,
    // need this to update it properly
    this.below = null;
}

var scatterclustermapboxproto = ScatterClusterMapbox.prototype;

scatterclustermapboxproto.addSource = function(opts) {
    this.subplot.map.addSource(this.sourceId, {
        type: 'geojson',
        data: opts.circle.geojson,
        cluster: true,
        clusterMaxZoom: opts.cluster.maxZoom,
        clusterRadius: opts.cluster.radius
    });
};

scatterclustermapboxproto.setSourceData = function(k, opts) {
    this.subplot.map
        .getSource(this.sourceId)
        .setData(opts.circle.geojson);
};

scatterclustermapboxproto.addLayer = function(opts, below) {
    var clusterId = this.layerIds.cluster;
    var sourceId = this.sourceId;
    var map = this.subplot.map;
    this.subplot.addLayer({
        id: clusterId,
        type: 'circle',
        source: sourceId,
        layout: opts.cluster.layout,
        filter: ['has', 'point_count'],
        paint: opts.cluster.paint
    }, below);
    this.subplot.addLayer({
        id: this.layerIds.clusterCount,
        type: 'symbol',
        source: sourceId,
        filter: ['has', 'point_count'],
        layout: opts.clusterCount.layout
    }, below);
    this.subplot.addLayer({
        id: this.layerIds.clusterPoints,
        type: 'circle',
        source: sourceId,
        layout: opts.circle.layout,
        paint: opts.circle.paint,
        filter: ['!', ['has', 'point_count']],
    }, below);
    this.subplot.map.on('click', clusterId, function(e) {
        var features = map.queryRenderedFeatures(e.point, {
            layers: [clusterId]
        });
        var clusterId_ = features[0].properties.cluster_id;
        map.getSource(sourceId).getClusterExpansionZoom(
            clusterId_,
            function(err, zoom) {
                if(err) return;
                map.easeTo({
                    center: features[0].geometry.coordinates,
                    zoom: zoom
                });
            }
            );
    });
};

scatterclustermapboxproto.update = function update(calcTrace) {
    var subplot = this.subplot;
    var map = subplot.map;
    var optsAll = convert(subplot.gd, calcTrace);
    var below = subplot.belowLookup['trace-' + this.uid];
    var idx, k, opts;

    if(below !== this.below) {
        for(idx = 0; idx < this.order.length; idx++) {
            map.removeLayer(this.layerIds[this.order[idx]]);
        }
        this.addLayer(optsAll, below);
        this.below = below;
    }

    for(idx = 0; idx < this.order.length; idx++) {
        k = this.order[idx];
        opts = optsAll[k];
        subplot.setOptions(this.layerIds[k], 'setLayoutProperty', opts.layout);
        if(opts.layout.visibility === 'visible') {
            this.setSourceData(k, opts);
            subplot.setOptions(this.layerIds[k], 'setPaintProperty', opts.paint);
        }
    }

    // link ref for quick update during selections
    calcTrace[0].trace._glTrace = this;
};

scatterclustermapboxproto.dispose = function dispose() {
    var map = this.subplot.map;
    var idx;

    for(idx = 0; idx < this.order.length; idx++) {
        var k = this.order[idx];
        map.removeLayer(this.layerIds[k]);
    }
    map.removeSource(this.sourceId);
};

function createScatterMapboxInstance(subplot, uid, clusterEnabled) {
    var scatterMapbox;
    if(clusterEnabled) {
        scatterMapbox = new ScatterClusterMapbox(subplot, uid);
    } else {
        scatterMapbox = new ScatterMapbox(subplot, uid);
    }
    scatterMapbox.below = subplot.belowLookup['trace-' + uid];
    return scatterMapbox;
}

function renderScatterMapbox(scatterMapbox, clusterEnabled, optsAll) {
    if(clusterEnabled) {
        scatterMapbox.addSource(optsAll);
        scatterMapbox.addLayer(optsAll, scatterMapbox.below);
    } else {
        for(var i = 0; i < scatterMapbox.order.length; i++) {
            var k = scatterMapbox.order[i];
            var opts = optsAll[k];
            scatterMapbox.addSource(k, opts);
            scatterMapbox.addLayer(k, opts, scatterMapbox.below);
        }
    }
}


module.exports = function createScatterMapbox(subplot, calcTrace) {
    var trace = calcTrace[0].trace;
    var optsAll = convert(subplot.gd, calcTrace);
    var clusterEnabled = trace.cluster.enabled;
    var scatterMapbox = createScatterMapboxInstance(subplot, trace.uid, clusterEnabled);
    renderScatterMapbox(scatterMapbox, clusterEnabled, optsAll)

    // link ref for quick update during selections
    calcTrace[0].trace._glTrace = scatterMapbox;

    return scatterMapbox;
};
