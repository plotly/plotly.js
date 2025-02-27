'use strict';

var convert = require('./convert').convert;
var convertOnSelect = require('./convert').convertOnSelect;
var LAYER_PREFIX = require('../../plots/map/constants').traceLayerPrefix;

function ChoroplethMap(subplot, uid) {
    this.type = 'choroplethmap';
    this.subplot = subplot;
    this.uid = uid;

    // N.B. fill and line layers share same source
    this.sourceId = 'source-' + uid;

    this.layerList = [
        ['fill', LAYER_PREFIX + uid + '-fill'],
        ['line', LAYER_PREFIX + uid + '-line']
    ];

    // previous 'below' value,
    // need this to update it properly
    this.below = null;
}

var proto = ChoroplethMap.prototype;

proto.update = function(calcTrace) {
    this._update(convert(calcTrace));

    // link ref for quick update during selections
    calcTrace[0].trace._glTrace = this;
};

proto.updateOnSelect = function(calcTrace) {
    this._update(convertOnSelect(calcTrace));
};

proto._update = function(optsAll) {
    var subplot = this.subplot;
    var layerList = this.layerList;
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

module.exports = function createChoroplethMap(subplot, calcTrace) {
    var trace = calcTrace[0].trace;
    var choroplethMap = new ChoroplethMap(subplot, trace.uid);
    var sourceId = choroplethMap.sourceId;
    var optsAll = convert(calcTrace);
    var below = choroplethMap.below = subplot.belowLookup['trace-' + trace.uid];

    subplot.map.addSource(sourceId, {
        type: 'geojson',
        data: optsAll.geojson
    });

    choroplethMap._addLayers(optsAll, below);

    // link ref for quick update during selections
    calcTrace[0].trace._glTrace = choroplethMap;

    return choroplethMap;
};
