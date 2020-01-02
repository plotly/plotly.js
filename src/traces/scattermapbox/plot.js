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
var ORDER = ['fill', 'line', 'circle', 'symbol'];

function ScatterMapbox(subplot, uid) {
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

var proto = ScatterMapbox.prototype;

proto.addSource = function(k, opts) {
    this.subplot.map.addSource(this.sourceIds[k], {
        type: 'geojson',
        data: opts.geojson
    });
};

proto.setSourceData = function(k, opts) {
    this.subplot.map
        .getSource(this.sourceIds[k])
        .setData(opts.geojson);
};

proto.addLayer = function(k, opts, below) {
    this.subplot.addLayer({
        type: k,
        id: this.layerIds[k],
        source: this.sourceIds[k],
        layout: opts.layout,
        paint: opts.paint
    }, below);
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
            map.removeLayer(this.layerIds[k]);
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

        subplot.setOptions(this.layerIds[k], 'setLayoutProperty', opts.layout);

        if(opts.layout.visibility === 'visible') {
            this.setSourceData(k, opts);
            subplot.setOptions(this.layerIds[k], 'setPaintProperty', opts.paint);
        }
    }

    // link ref for quick update during selections
    calcTrace[0].trace._glTrace = this;
};

proto.dispose = function dispose() {
    var map = this.subplot.map;

    for(var i = ORDER.length - 1; i >= 0; i--) {
        var k = ORDER[i];
        map.removeLayer(this.layerIds[k]);
        map.removeSource(this.sourceIds[k]);
    }
};

module.exports = function createScatterMapbox(subplot, calcTrace) {
    var trace = calcTrace[0].trace;
    var scatterMapbox = new ScatterMapbox(subplot, trace.uid);
    var optsAll = convert(subplot.gd, calcTrace);
    var below = scatterMapbox.below = subplot.belowLookup['trace-' + trace.uid];

    for(var i = 0; i < ORDER.length; i++) {
        var k = ORDER[i];
        var opts = optsAll[k];
        scatterMapbox.addSource(k, opts);
        scatterMapbox.addLayer(k, opts, below);
    }

    // link ref for quick update during selections
    calcTrace[0].trace._glTrace = scatterMapbox;

    return scatterMapbox;
};
