/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');


function MapboxLayer(mapbox, index) {
    this.mapbox = mapbox;
    this.map = mapbox.map;

    this.uid = mapbox.uid + '-' + 'layer' + index;

    this.idSource = this.uid + '-source';
    this.idLayer = this.uid + '-layer';

    // some state variable to check if a remove/add step is needed
    this.sourceType = null;
    this.source = null;
    this.layerType = null;
    this.below = null;
}

var proto = MapboxLayer.prototype;

proto.update = function update(opts) {
    if(this.needsNewSource(opts)) {

        // IMPORTANT: must delete layer before source to not cause errors
        this.updateLayer(opts);
        this.updateSource(opts);
    }
    else if(this.needsNewLayer(opts)) {
        this.updateLayer(opts);
    }

    this.updateStyle(opts);
};

proto.needsNewSource = function(opts) {
    return (
        this.sourceType !== opts.sourcetype ||
        this.source !== opts.source
    );
};

proto.needsNewLayer = function(opts) {
    return (
        this.layerType !== opts.type ||
        this.below !== opts.below
    );
};

proto.updateSource = function(opts) {
    var map = this.map;

    if(map.getSource(this.idSource)) map.removeSource(this.idSource);

    this.sourceType = opts.sourcetype;
    this.source = opts.source;

    if(!isVisible(opts)) return;

    var sourceOpts = convertSourceOpts(opts);

    map.addSource(this.idSource, sourceOpts);
};

proto.updateLayer = function(opts) {
    var map = this.map;

    if(map.getLayer(this.idLayer)) map.removeLayer(this.idLayer);

    this.layerType = opts.type;

    if(!isVisible(opts)) return;

    map.addLayer({
        id: this.idLayer,
        source: this.idSource,
        'source-layer': opts.sourcelayer || '',
        type: opts.type
    }, opts.below);

    // the only way to make a layer invisible is to remove it
    var layoutOpts = { visibility: 'visible' };
    this.mapbox.setOptions(this.idLayer, 'setLayoutProperty', layoutOpts);
};

proto.updateStyle = function(opts) {
    var paintOpts = convertPaintOpts(opts);

    if(isVisible(opts)) {
        this.mapbox.setOptions(this.idLayer, 'setPaintProperty', paintOpts);
    }
};

proto.dispose = function dispose() {
    var map = this.map;

    map.removeLayer(this.idLayer);
    map.removeSource(this.idSource);
};

function isVisible(opts) {
    var source = opts.source;

    // For some weird reason Lib.isPlainObject fails
    // to detect `source` as a plain object in nw.js 0.12.

    return (
        typeof source === 'object' ||
        (typeof source === 'string' && source.length > 0)
    );
}

function convertPaintOpts(opts) {
    var paintOpts = {};

    switch(opts.type) {

        case 'line':
            Lib.extendFlat(paintOpts, {
                'line-width': opts.line.width,
                'line-color': opts.line.color,
                'line-opacity': opts.opacity
            });
            break;

        case 'fill':
            Lib.extendFlat(paintOpts, {
                'fill-color': opts.fillcolor,
                'fill-outline-color': opts.line.color,
                'fill-opacity': opts.opacity

                // no way to pass line.width at the moment
            });
            break;
    }

    return paintOpts;
}

function convertSourceOpts(opts) {
    var sourceType = opts.sourcetype,
        source = opts.source,
        sourceOpts = { type: sourceType },
        isSourceAString = (typeof source === 'string'),
        field;

    if(sourceType === 'geojson') field = 'data';
    else if(sourceType === 'vector') {
        field = isSourceAString ? 'url' : 'tiles';
    }

    sourceOpts[field] = source;

    return sourceOpts;
}

module.exports = function createMapboxLayer(mapbox, index, opts) {
    var mapboxLayer = new MapboxLayer(mapbox, index);

    // IMPORTANT: must create source before layer to not cause errors
    mapboxLayer.updateSource(opts);
    mapboxLayer.updateLayer(opts);
    mapboxLayer.updateStyle(opts);

    return mapboxLayer;
};
