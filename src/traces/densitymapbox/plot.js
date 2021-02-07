'use strict';

var convert = require('./convert');
var LAYER_PREFIX = require('../../plots/mapbox/constants').traceLayerPrefix;

function DensityMapbox(subplot, uid) {
    this.type = 'densitymapbox';
    this.subplot = subplot;
    this.uid = uid;

    this.sourceId = 'source-' + uid;

    this.layerList = [
        ['heatmap', LAYER_PREFIX + uid + '-heatmap']
    ];

    // previous 'below' value,
    // need this to update it properly
    this.below = null;
}

var proto = DensityMapbox.prototype;

proto.update = function(calcTrace) {
    var subplot = this.subplot;
    var layerList = this.layerList;
    var optsAll = convert(calcTrace);
    var below = subplot.belowLookup['trace-' + this.uid];

    subplot.map
        .getSource(this.sourceId)
        .setData(optsAll.geojson);

    if(below !== this.below) {
        this._removeLayers();
        this._addLayers(optsAll, below);
        this.below = below;
    }

    for(var i = 0; i < layerList.length; i++) {
        var item = layerList[i];
        var k = item[0];
        var id = item[1];
        var opts = optsAll[k];

        subplot.setOptions(id, 'setLayoutProperty', opts.layout);

        if(opts.layout.visibility === 'visible') {
            subplot.setOptions(id, 'setPaintProperty', opts.paint);
        }
    }
};

proto._addLayers = function(optsAll, below) {
    var subplot = this.subplot;
    var layerList = this.layerList;
    var sourceId = this.sourceId;

    for(var i = 0; i < layerList.length; i++) {
        var item = layerList[i];
        var k = item[0];
        var opts = optsAll[k];

        subplot.addLayer({
            type: k,
            id: item[1],
            source: sourceId,
            layout: opts.layout,
            paint: opts.paint
        }, below);
    }
};

proto._removeLayers = function() {
    var map = this.subplot.map;
    var layerList = this.layerList;

    for(var i = layerList.length - 1; i >= 0; i--) {
        map.removeLayer(layerList[i][1]);
    }
};

proto.dispose = function() {
    var map = this.subplot.map;
    this._removeLayers();
    map.removeSource(this.sourceId);
};

module.exports = function createDensityMapbox(subplot, calcTrace) {
    var trace = calcTrace[0].trace;
    var densityMapbox = new DensityMapbox(subplot, trace.uid);
    var sourceId = densityMapbox.sourceId;
    var optsAll = convert(calcTrace);
    var below = densityMapbox.below = subplot.belowLookup['trace-' + trace.uid];

    subplot.map.addSource(sourceId, {
        type: 'geojson',
        data: optsAll.geojson
    });

    densityMapbox._addLayers(optsAll, below);

    return densityMapbox;
};
