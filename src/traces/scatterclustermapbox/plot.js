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
var ORDER = ['circle'];

function ScatterClusterMapbox(subplot, uid) {
    this.type = 'scatterclustermapbox';
    this.subplot = subplot;
    this.uid = uid;

    this.sourceIds = {
        circle: 'source-' + uid + '-circle',
    };

    this.pointLayerIds = {
        circle: LAYER_PREFIX + uid + '-circle',
    };

    this.clusterLayerIds = {
        circle: LAYER_PREFIX + uid + '-cluster-circle'
    };

    this.clusterCountIds = {
        circle: LAYER_PREFIX + uid + '-count-circle'
    };

  // We could merge the 'fill' source with the 'line' source and
  // the 'circle' source with the 'symbol' source if ever having
  // for up-to 4 sources per 'scatterclustermapbox' traces becomes a problem.

  // previous 'below' value,
  // need this to update it properly
    this.below = null;
}

var proto = ScatterClusterMapbox.prototype;

proto.addSource = function(k, opts) {
    this.subplot.map.addSource(this.sourceIds[k], {
        type: 'geojson',
        data: opts.circle.geojson,
        cluster: true,
        clusterMaxZoom: opts.cluster.maxZoom,
        clusterRadius: opts.cluster.radius,
    });
};

proto.setSourceData = function(k, opts) {
    this.subplot.map.getSource(this.sourceIds[k]).setData(opts.geojson);
};

proto.addLayer = function(k, opts, below) {
    var subplot = this.subplot;
    var map = subplot.map;

    map.addLayer(
        {
            type: k,
            id: this.pointLayerIds[k],
            source: this.sourceIds[k],
            layout: opts.circle.layout,
            paint: opts.circle.paint,
            filter: opts.circle.filter,
        },
    below
  );
    map.addLayer(
        {
            type: 'circle',
            id: this.clusterLayerIds[k],
            source: this.sourceIds[k],
            filter: opts.cluster.filter,
            paint: opts.cluster.paint
        }
  );
    map.addLayer(
        {
            type: 'symbol',
            id: this.clusterCountIds[k],
            source: this.sourceIds[k],
            filter: opts.clusterCount.filter,
            layout: opts.clusterCount.layout
        }
  );
};

proto.update = function update(calcTrace) {
    var subplot = this.subplot;
    var map = subplot.map;
    var optsAll = convert(subplot.gd, calcTrace);
    var below = subplot.belowLookup['trace-' + this.uid];
    var i, k, opts;

    if(below !== this.below) {
        for(i = ORDER.length - 1; i >= 0; i--) {
            k = ORDER[i];
            map.removeLayer(this.pointLayerIds[k]);
            map.removeLayer(this.clusterLayerIds[k]);
            map.removeLayer(this.clusterCountIds[k]);
        }
        for(i = 0; i < ORDER.length; i++) {
            k = ORDER[i];
            opts = optsAll[k];
            this.addLayer(k, opts, below);
        }
        this.below = below;
    }

    for(i = 0; i < ORDER.length; i++) {
        k = ORDER[i];
        opts = optsAll[k];

        subplot.setOptions(this.pointLayerIds[k], 'setLayoutProperty', opts.circle.layout);
        subplot.setOptions(this.clusterLayerIds[k], 'setLayoutProperty', opts.cluster.layout);
        subplot.setOptions(this.clusterCountIds[k], 'setLayoutProperty', opts.clusterCount.layout);

        if(opts.circle.layout.visibility === 'visible') {
            this.setSourceData(k, opts.circle);
            subplot.setOptions(this.pointLayerIds[k], 'setPaintProperty', opts.circle.paint);
            subplot.setOptions(this.clusterLayerIds[k], 'setPaintProperty', opts.cluster.paint);
            subplot.setOptions(this.clusterCountIds[k], 'setPaintProperty', opts.clusterCount.paint);
        }
    }
};

proto.dispose = function dispose() {
    var map = this.subplot.map;

    for(var i = ORDER.length - 1; i >= 0; i--) {
        var k = ORDER[i];
        map.removeLayer(this.pointLayerIds[k]);
        map.removeSource(this.sourceIds[k]);
    }
};

module.exports = function createScatterClusterMapbox(subplot, calcTrace) {
    var trace = calcTrace[0].trace;
    var scatterClusterMapbox = new ScatterClusterMapbox(subplot, trace.uid);
    var optsAll = convert(subplot.gd, calcTrace);
    var below = (scatterClusterMapbox.below =
    subplot.belowLookup['trace-' + trace.uid]);


    for(var i = 0; i < ORDER.length; i++) {
        var k = ORDER[i];
        var opts = optsAll[k];
        scatterClusterMapbox.addSource(k, opts);
        scatterClusterMapbox.addLayer(k, opts, below);
    }

  // link ref for quick update during selections
    calcTrace[0].trace._glTrace = scatterClusterMapbox;
    return scatterClusterMapbox;
};
