/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var convert = require('./convert');


function ScatterMapbox(mapbox, uid) {
    this.mapbox = mapbox;
    this.map = mapbox.map;

    this.uid = uid;

    this.idSourceFill = uid + '-source-fill';
    this.idSourceLine = uid + '-source-line';
    this.idSourceCircle = uid + '-source-circle';
    this.idSourceSymbol = uid + '-source-symbol';

    this.idLayerFill = uid + '-layer-fill';
    this.idLayerLine = uid + '-layer-line';
    this.idLayerCircle = uid + '-layer-circle';
    this.idLayerSymbol = uid + '-layer-symbol';

    this.mapbox.initSource(this.idSourceFill);
    this.mapbox.initSource(this.idSourceLine);
    this.mapbox.initSource(this.idSourceCircle);
    this.mapbox.initSource(this.idSourceSymbol);

    this.map.addLayer({
        id: this.idLayerFill,
        source: this.idSourceFill,
        type: 'fill'
    });

    this.map.addLayer({
        id: this.idLayerLine,
        source: this.idSourceLine,
        type: 'line'
    });

    this.map.addLayer({
        id: this.idLayerCircle,
        source: this.idSourceCircle,
        type: 'circle'
    });

    this.map.addLayer({
        id: this.idLayerSymbol,
        source: this.idSourceSymbol,
        type: 'symbol'
    });

    // We could merge the 'fill' source with the 'line' source and
    // the 'circle' source with the 'symbol' source if ever having
    // for up-to 4 sources per 'scattermapbox' traces becomes a problem.
}

var proto = ScatterMapbox.prototype;

proto.update = function update(calcTrace) {
    var mapbox = this.mapbox;
    var opts = convert(calcTrace);

    mapbox.setOptions(this.idLayerFill, 'setLayoutProperty', opts.fill.layout);
    mapbox.setOptions(this.idLayerLine, 'setLayoutProperty', opts.line.layout);
    mapbox.setOptions(this.idLayerCircle, 'setLayoutProperty', opts.circle.layout);
    mapbox.setOptions(this.idLayerSymbol, 'setLayoutProperty', opts.symbol.layout);

    if(isVisible(opts.fill)) {
        mapbox.setSourceData(this.idSourceFill, opts.fill.geojson);
        mapbox.setOptions(this.idLayerFill, 'setPaintProperty', opts.fill.paint);
    }

    if(isVisible(opts.line)) {
        mapbox.setSourceData(this.idSourceLine, opts.line.geojson);
        mapbox.setOptions(this.idLayerLine, 'setPaintProperty', opts.line.paint);
    }

    if(isVisible(opts.circle)) {
        mapbox.setSourceData(this.idSourceCircle, opts.circle.geojson);
        mapbox.setOptions(this.idLayerCircle, 'setPaintProperty', opts.circle.paint);
    }

    if(isVisible(opts.symbol)) {
        mapbox.setSourceData(this.idSourceSymbol, opts.symbol.geojson);
        mapbox.setOptions(this.idLayerSymbol, 'setPaintProperty', opts.symbol.paint);
    }
};

proto.dispose = function dispose() {
    var map = this.map;

    map.removeLayer(this.idLayerFill);
    map.removeLayer(this.idLayerLine);
    map.removeLayer(this.idLayerCircle);
    map.removeLayer(this.idLayerSymbol);

    map.removeSource(this.idSourceFill);
    map.removeSource(this.idSourceLine);
    map.removeSource(this.idSourceCircle);
    map.removeSource(this.idSourceSymbol);
};

function isVisible(layerOpts) {
    return layerOpts.layout.visibility === 'visible';
}

module.exports = function createScatterMapbox(mapbox, calcTrace) {
    var trace = calcTrace[0].trace;

    var scatterMapbox = new ScatterMapbox(mapbox, trace.uid);
    scatterMapbox.update(calcTrace);

    return scatterMapbox;
};
