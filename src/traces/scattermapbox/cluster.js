'use strict';

var Supercluster = require('supercluster');
var tinySDF = require('tiny-sdf');

var Lib = require('../../lib');
var Fx = require('../../components/fx');
var getTraceColor = require('../scatter/get_trace_color');
var attributes = require('./attributes');

var CLUSTER_COUNT_FONT = {
    'font-family': 'Open Sans Regular, Arial Unicode MS Regular',
    'font-size': 12
};

function Cluster(mapbox, cd) {
    this.mapbox = mapbox;
    this.cd = cd;
    this.node3 = mapbox.getNode3();

    this.update(cd[0].trace.source);
}

var proto = Cluster.prototype;

proto.update = function(sourceData) {
    var trace = this.cd[0].trace;
    var map = this.mapbox.map;
    var self = this;

    var fontCache = {};

    if(this.supercluster) this.supercluster.load(sourceData.features);
    else {
        this.supercluster = new Supercluster({
            radius: trace.cluster.size,
            maxZoom: trace.cluster.maxzoom,
            step: trace.cluster.step,
            extent: 256,
            log: false
        });

        this.supercluster.load(sourceData.features);
    }

    if(this.supercluster.options.font) {
        // NOP
    } else {
        this.supercluster.options.font = function(props) {
            var pointCount = props.point_count;
            var pointCountAbbreviated = props.point_count_abbreviated;

            var fontKey = pointCount + '-' + pointCountAbbreviated;
            if(fontCache[fontKey]) return fontCache[fontKey];

            var label = self.labels[pointCount] || pointCountAbbreviated;
            var font = Lib.extendFlat({}, CLUSTER_COUNT_FONT);
            font['font-stack'] = font['font-family'];
            font.label = String(label);

            fontCache[fontKey] = font;
            return font;
        };
    }

    if(this.sdf) {
        // NOP
    } else {
        this.sdf = {};

        var font = Lib.extendFlat({}, CLUSTER_COUNT_FONT);
        var sdf = new tinySDF(
            font['font-size'],
            3,
            8,
            0.25,
            font['font-family'],
            'normal'
        );

        for(var charCode = 32; charCode < 128; charCode++) {
            var char = String.fromCharCode(charCode);
            this.sdf[char] = sdf.draw(char);
        }
    }

    var sourceId = 'source-' + trace.uid;
    var layerIdUnclustered = 'unclustered-' + trace.uid;
    var layerIdClusters = 'clusters-' + trace.uid;
    var layerIdClusterCount = 'cluster-count-' + trace.uid;

    var source = map.getSource(sourceId);
    var features = this.supercluster.getClusters([-180, -85, 180, 85], Math.floor(map.getZoom()));

    features.forEach(function(feature) {
        var props = feature.properties;
        if(props.cluster) {
            var pointCount = props.point_count;
            if(pointCount > 1000) {
                props.point_count_abbreviated = Math.round(pointCount / 1000) + 'k';
            } else {
                props.point_count_abbreviated = String(pointCount);
            }
        }
    });

    var data = {
        type: 'FeatureCollection',
        features: features
    };

    if(source) {
        source.setData(data);
    } else {
        map.addSource(sourceId, {
            type: 'geojson',
            data: data,
            buffer: 0,
            cluster: false
        });
    }

    var layers = map.getStyle().layers || [];
    var layerIds = layers.map(function(layer) { return layer.id; });

    if(layerIds.indexOf(layerIdUnclustered) !== -1) map.removeLayer(layerIdUnclustered);
    if(layerIds.indexOf(layerIdClusters) !== -1) map.removeLayer(layerIdClusters);
    if(layerIds.indexOf(layerIdClusterCount) !== -1) map.removeLayer(layerIdClusterCount);

    var before = getFirstSymbolLayerId(map);

    var textFontFamily = trace.cluster.textfont.family;
    var dfltFamily = attributes.cluster.textfont.family.dflt;

    if(textFontFamily === dfltFamily) {
        var firstFont = findFirstFont(map);
        if(firstFont) {
            textFontFamily = firstFont;
        } else {
            textFontFamily = null;
        }
    }

    map.addLayer({
        id: layerIdUnclustered,
        type: 'circle',
        source: sourceId,
        filter: ['!', ['has', 'point_count']],
        paint: {
            'circle-color': trace.marker.color,
            'circle-radius': trace.marker.size / 2,
            'circle-opacity': trace.marker.opacity
        },
        metadata: {
            'plotly-trace-uid': trace.uid
        }
    }, before);

    map.addLayer({
        id: layerIdClusters,
        type: 'circle',
        source: sourceId,
        filter: ['has', 'point_count'],
        paint: {
            'circle-color': trace.cluster.color,
            'circle-radius': trace.cluster.size / 2,
            'circle-opacity': trace.cluster.opacity
        },
        metadata: {
            'plotly-trace-uid': trace.uid
        }
    }, before);

    if(textFontFamily) {
        var style = map.getStyle();
        if(style && style.glyphs) {
            map.addLayer({
                id: layerIdClusterCount,
                type: 'symbol',
                source: sourceId,
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-font': [textFontFamily],
                    'text-size': trace.cluster.textfont.size,
                    'text-offset': [0, 0]
                },
                paint: {
                    'text-color': trace.cluster.textfont.color,
                    'text-halo-color': 'rgba(255, 255, 255, 1)',
                    'text-halo-width': 1
                },
                metadata: {
                    'plotly-trace-uid': trace.uid
                }
            }, before);
        }
    }

    if(this.onClick) {
        // NOP
    } else {
        this.onClick = function(e) {
            var features = e.features;
            if(!features.length) return;

            var feature = features[0];
            if(
                feature.layer.id !== layerIdClusters &&
                feature.layer.id !== layerIdUnclustered
            ) return;

            var clusterId = feature.properties.cluster_id;
            if(!clusterId) {
                Fx.click(self.mapbox.gd, e);
                return;
            }

            var source = map.getSource(sourceId);
            source.getClusterExpansionZoom(clusterId, function(err, zoom) {
                if(err) return;

                map.easeTo({
                    center: feature.geometry.coordinates,
                    zoom: zoom
                });
            });
        };

        map.on('click', this.onClick);
    }
};

proto.destroy = function() {
    var map = this.mapbox.map;
    var trace = this.cd[0].trace;
    var sourceId = 'source-' + trace.uid;
    var layerIdUnclustered = 'unclustered-' + trace.uid;
    var layerIdClusters = 'clusters-' + trace.uid;
    var layerIdClusterCount = 'cluster-count-' + trace.uid;

    if(this.onClick) {
        map.off('click', this.onClick);
        this.onClick = null;
    }

    var layers = map.getStyle().layers || [];
    var layerIds = layers.map(function(layer) { return layer.id; });

    if(layerIds.indexOf(layerIdUnclustered) !== -1) map.removeLayer(layerIdUnclustered);
    if(layerIds.indexOf(layerIdClusters) !== -1) map.removeLayer(layerIdClusters);
    if(layerIds.indexOf(layerIdClusterCount) !== -1) map.removeLayer(layerIdClusterCount);

    if(map.getSource(sourceId)) {
        map.removeSource(sourceId);
    }
};

function findFirstFont(map) {
    var style = map.getStyle();
    if(!style || !style.layers) return;

    for(var i = 0; i < style.layers.length; i++) {
        var layer = style.layers[i];
        if(layer.layout && layer.layout['text-font']) {
            var font = layer.layout['text-font'];
            // mapbox-gl-js text-font is an array of strings
            return Array.isArray(font) ? font[0] : font;
        }
    }
}

function getFirstSymbolLayerId(map) {
    var layers = map.getStyle().layers || [];
    for(var i = 0; i < layers.length; i++) {
        if(layers[i].type === 'symbol') {
            return layers[i].id;
        }
    }
}

module.exports = Cluster;
