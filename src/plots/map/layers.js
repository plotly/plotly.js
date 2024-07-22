'use strict';

var Lib = require('../../lib');
var sanitizeHTML = require('../../lib/svg_text_utils').sanitizeHTML;
var convertTextOpts = require('./convert_text_opts');
var constants = require('./constants');

function MapLayer(subplot, index) {
    this.subplot = subplot;

    this.uid = subplot.uid + '-' + index;
    this.index = index;

    this.idSource = 'source-' + this.uid;
    this.idLayer = constants.layoutLayerPrefix + this.uid;

    // some state variable to check if a remove/add step is needed
    this.sourceType = null;
    this.source = null;
    this.layerType = null;
    this.below = null;

    // is layer currently visible
    this.visible = false;
}

var proto = MapLayer.prototype;

proto.update = function update(opts) {
    if(!this.visible) {
        // IMPORTANT: must create source before layer to not cause errors
        this.updateSource(opts);
        this.updateLayer(opts);
    } else if(this.needsNewImage(opts)) {
        this.updateImage(opts);
    } else if(this.needsNewSource(opts)) {
        // IMPORTANT: must delete layer before source to not cause errors
        this.removeLayer();
        this.updateSource(opts);
        this.updateLayer(opts);
    } else if(this.needsNewLayer(opts)) {
        this.updateLayer(opts);
    } else {
        this.updateStyle(opts);
    }

    this.visible = isVisible(opts);
};

proto.needsNewImage = function(opts) {
    var map = this.subplot.map;
    return (
        map.getSource(this.idSource) &&
        this.sourceType === 'image' &&
        opts.sourcetype === 'image' &&
        (this.source !== opts.source ||
            JSON.stringify(this.coordinates) !==
            JSON.stringify(opts.coordinates))
    );
};

proto.needsNewSource = function(opts) {
    // for some reason changing layer to 'fill' or 'symbol'
    // w/o changing the source throws an exception in map-gl 0.18 ;
    // stay safe and make new source on type changes
    return (
        this.sourceType !== opts.sourcetype ||
        JSON.stringify(this.source) !== JSON.stringify(opts.source) ||
        this.layerType !== opts.type
    );
};

proto.needsNewLayer = function(opts) {
    return (
        this.layerType !== opts.type ||
        this.below !== this.subplot.belowLookup['layout-' + this.index]
    );
};

proto.lookupBelow = function() {
    return this.subplot.belowLookup['layout-' + this.index];
};

proto.updateImage = function(opts) {
    var map = this.subplot.map;
    map.getSource(this.idSource).updateImage({
        url: opts.source, coordinates: opts.coordinates
    });

    // Since the `updateImage` control flow doesn't call updateLayer,
    // We need to take care of moving the image layer to match the location
    // where updateLayer would have placed it.
    var _below = this.findFollowingMapLayerId(this.lookupBelow());
    if(_below !== null) {
        this.subplot.map.moveLayer(this.idLayer, _below);
    }
};

proto.updateSource = function(opts) {
    var map = this.subplot.map;

    if(map.getSource(this.idSource)) map.removeSource(this.idSource);

    this.sourceType = opts.sourcetype;
    this.source = opts.source;

    if(!isVisible(opts)) return;

    var sourceOpts = convertSourceOpts(opts);

    map.addSource(this.idSource, sourceOpts);
};

proto.findFollowingMapLayerId = function(below) {
    if(below === 'traces') {
        var mapLayers = this.subplot.getMapLayers();

        // find id of first plotly trace layer
        for(var i = 0; i < mapLayers.length; i++) {
            var layerId = mapLayers[i].id;
            if(typeof layerId === 'string' &&
                layerId.indexOf(constants.traceLayerPrefix) === 0
            ) {
                below = layerId;
                break;
            }
        }
    }
    return below;
};

proto.updateLayer = function(opts) {
    var subplot = this.subplot;
    var convertedOpts = convertOpts(opts);
    var below = this.lookupBelow();
    var _below = this.findFollowingMapLayerId(below);

    this.removeLayer();

    if(isVisible(opts)) {
        subplot.addLayer({
            id: this.idLayer,
            source: this.idSource,
            'source-layer': opts.sourcelayer || '',
            type: opts.type,
            minzoom: opts.minzoom,
            maxzoom: opts.maxzoom,
            layout: convertedOpts.layout,
            paint: convertedOpts.paint
        }, _below);
    }

    this.layerType = opts.type;
    this.below = below;
};

proto.updateStyle = function(opts) {
    if(isVisible(opts)) {
        var convertedOpts = convertOpts(opts);
        this.subplot.setOptions(this.idLayer, 'setLayoutProperty', convertedOpts.layout);
        this.subplot.setOptions(this.idLayer, 'setPaintProperty', convertedOpts.paint);
    }
};

proto.removeLayer = function() {
    var map = this.subplot.map;
    if(map.getLayer(this.idLayer)) {
        map.removeLayer(this.idLayer);
    }
};

proto.dispose = function() {
    var map = this.subplot.map;
    if(map.getLayer(this.idLayer)) map.removeLayer(this.idLayer);
    if(map.getSource(this.idSource)) map.removeSource(this.idSource);
};

function isVisible(opts) {
    if(!opts.visible) return false;

    var source = opts.source;

    if(Array.isArray(source) && source.length > 0) {
        for(var i = 0; i < source.length; i++) {
            if(typeof source[i] !== 'string' || source[i].length === 0) {
                return false;
            }
        }
        return true;
    }

    return Lib.isPlainObject(source) ||
        (typeof source === 'string' && source.length > 0);
}

function convertOpts(opts) {
    var layout = {};
    var paint = {};

    switch(opts.type) {
        case 'circle':
            Lib.extendFlat(paint, {
                'circle-radius': opts.circle.radius,
                'circle-color': opts.color,
                'circle-opacity': opts.opacity
            });
            break;

        case 'line':
            Lib.extendFlat(paint, {
                'line-width': opts.line.width,
                'line-color': opts.color,
                'line-opacity': opts.opacity,
                'line-dasharray': opts.line.dash
            });
            break;

        case 'fill':
            Lib.extendFlat(paint, {
                'fill-color': opts.color,
                'fill-outline-color': opts.fill.outlinecolor,
                'fill-opacity': opts.opacity

                // no way to pass specify outline width at the moment
            });
            break;

        case 'symbol':
            var symbol = opts.symbol;
            var textOpts = convertTextOpts(symbol.textposition, symbol.iconsize);

            Lib.extendFlat(layout, {
                'icon-image': symbol.icon + '-15',
                'icon-size': symbol.iconsize / 10,

                'text-field': symbol.text,
                'text-size': symbol.textfont.size,
                'text-anchor': textOpts.anchor,
                'text-offset': textOpts.offset,
                'symbol-placement': symbol.placement,

                // TODO font family
                // 'text-font': symbol.textfont.family.split(', '),
            });

            Lib.extendFlat(paint, {
                'icon-color': opts.color,
                'text-color': symbol.textfont.color,
                'text-opacity': opts.opacity
            });
            break;
        case 'raster':
            Lib.extendFlat(paint, {
                'raster-fade-duration': 0,
                'raster-opacity': opts.opacity
            });
            break;
    }

    return {
        layout: layout,
        paint: paint
    };
}

function convertSourceOpts(opts) {
    var sourceType = opts.sourcetype;
    var source = opts.source;
    var sourceOpts = {type: sourceType};
    var field;

    if(sourceType === 'geojson') {
        field = 'data';
    } else if(sourceType === 'vector') {
        field = typeof source === 'string' ? 'url' : 'tiles';
    } else if(sourceType === 'raster') {
        field = 'tiles';
        sourceOpts.tileSize = 256;
    } else if(sourceType === 'image') {
        field = 'url';
        sourceOpts.coordinates = opts.coordinates;
    }

    sourceOpts[field] = source;

    if(opts.sourceattribution) {
        sourceOpts.attribution = sanitizeHTML(opts.sourceattribution);
    }

    return sourceOpts;
}

module.exports = function createMapLayer(subplot, index, opts) {
    var mapLayer = new MapLayer(subplot, index);

    mapLayer.update(opts);

    return mapLayer;
};
