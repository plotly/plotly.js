/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var convert = require('./convert').convert;
var convertOnSelect = require('./convert').convertOnSelect;

function ChoroplethMapbox(subplot, uid) {
    this.subplot = subplot;
    this.uid = uid;

    // N.B. fill and line layers share same source
    this.sourceId = uid + '-source';

    this.layerList = [
        ['fill', uid + '-layer-fill'],
        ['line', uid + '-layer-line']
    ];
}

var proto = ChoroplethMapbox.prototype;

proto.update = function(calcTrace) {
    this._update(convert(calcTrace));
};

proto.updateOnSelect = function(calcTrace) {
    this._update(convertOnSelect(calcTrace));
};

proto._update = function(optsAll) {
    var subplot = this.subplot;
    var layerList = this.layerList;

    subplot.map
        .getSource(this.sourceId)
        .setData(optsAll.geojson);

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

proto.dispose = function() {
    var map = this.subplot.map;
    var layerList = this.layerList;

    for(var i = 0; i < layerList.length; i++) {
        map.removeLayer(layerList[i][0]);
    }
    map.removeSource(this.sourceId);
};

module.exports = function createChoroplethMapbox(subplot, calcTrace) {
    var trace = calcTrace[0].trace;
    var choroplethMapbox = new ChoroplethMapbox(subplot, trace.uid);
    var sourceId = choroplethMapbox.sourceId;
    var layerList = choroplethMapbox.layerList;

    var optsAll = convert(calcTrace);

    subplot.map.addSource(sourceId, {
        type: 'geojson',
        data: optsAll.geojson
    });

    for(var i = 0; i < layerList.length; i++) {
        var item = layerList[i];
        var k = item[0];
        var opts = optsAll[k];

        subplot.map.addLayer({
            type: k,
            id: item[1],
            source: sourceId,
            layout: opts.layout,
            paint: opts.paint
        });
    }

    // link ref for quick update during selections
    calcTrace[0].trace._glTrace = choroplethMapbox;

    return choroplethMapbox;
};
