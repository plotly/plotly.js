'use strict';

var Lib = require('../../lib');

var handleSubplotDefaults = require('../subplot_defaults');
var handleArrayContainerDefaults = require('../array_container_defaults');
var layoutAttributes = require('./layout_attributes');


module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, fullData) {
    handleSubplotDefaults(layoutIn, layoutOut, fullData, {
        type: 'map',
        attributes: layoutAttributes,
        handleDefaults: handleDefaults,
        partition: 'y',
        fullData: fullData
    });
};

function handleDefaults(containerIn, containerOut, coerce, opts) {
    coerce('style');
    coerce('center.lon');
    coerce('center.lat');
    coerce('zoom');
    coerce('bearing');
    coerce('pitch');

    var west = coerce('bounds.west');
    var east = coerce('bounds.east');
    var south = coerce('bounds.south');
    var north = coerce('bounds.north');

    // Auto-calculate bounds from data if not provided
    if(west === undefined && east === undefined && south === undefined && north === undefined) {
        var traceBounds = {
            west: Infinity,
            east: -Infinity,
            south: Infinity,
            north: -Infinity
        };
        var hasTraceBounds = false;

        for(var i = 0; i < fullData.length; i++) {
            var trace = fullData[i];
            // Check if trace belongs to this map subplot
            if(trace.visible !== true || trace.subplot !== opts.id) continue;

            // Handle scattermap traces
            if(trace.type === 'scattermap') {
                var lon = trace.lon || [];
                var lat = trace.lat || [];
                var len = Math.min(lon.length, lat.length);

                for(var j = 0; j < len; j++) {
                    var l = lon[j];
                    var t = lat[j];
                    if(l !== undefined && t !== undefined) {
                        traceBounds.west = Math.min(traceBounds.west, l);
                        traceBounds.east = Math.max(traceBounds.east, l);
                        traceBounds.south = Math.min(traceBounds.south, t);
                        traceBounds.north = Math.max(traceBounds.north, t);
                        hasTraceBounds = true;
                    }
                }
            }
            // Add other map trace types here if needed (choroplethmap, etc)
        }

    if(hasTraceBounds) {
        var domain = containerOut.domain;
        var width = layoutOut.width * (domain.x[1] - domain.x[0]);
        var height = layoutOut.height * (domain.y[1] - domain.y[0]);

        // Default zoom calculation
        if(containerOut.zoom === undefined) {
            var padding = 0.1; // 10% padding
            var dLon = Math.abs(traceBounds.east - traceBounds.west);
            if(dLon === 0) dLon = 0.01; // Avoid division by zero
            if(dLon > 360) dLon = 360;

            // Simple Mercator projection for lat
            function mercatorY(lat) {
                var rad = lat * Math.PI / 180;
                return Math.log(Math.tan(Math.PI / 4 + rad / 2));
            }

            var yNorth = mercatorY(traceBounds.north);
            var ySouth = mercatorY(traceBounds.south);
            var dLat = Math.abs(yNorth - ySouth);
            if(dLat === 0) dLat = 0.01;

            // 360 degrees = 2*PI radians. Mapbox world width is 512 pixels at zoom 0?
            // Wait, Mapbox tile size is 512px by default in GL JS.
            // 360 degrees fits in 512px at z=0?
            // Let's use 360 degrees fits in 256 * 2^z (standard web mercator)
            // Mapbox GL usually matches this.
            // But let's be conservative.

            // Zoom for longitude fit:
            // pixelWidth = (dLon / 360) * 512 * 2^z
            // 2^z = (pixelWidth * 360) / (dLon * 512)
            // z = log2(...)
            var zLon = Math.log2((width * 360) / (dLon * 512));

            // Zoom for latitude fit:
            // pixelHeight = (dLat / (2 * Math.PI)) * 512 * 2^z
            // 2^z = (pixelHeight * 2 * Math.PI) / (dLat * 512)
            var zLat = Math.log2((height * 2 * Math.PI) / (dLat * 512));

            var zoom = Math.min(zLon, zLat);
            zoom = Math.max(0, Math.min(22, zoom)); // Clamp to valid zoom range
            zoom -= padding; // Apply padding

            containerOut.zoom = zoom;
        }

        // Default center calculation
        if(containerOut.center.lon === undefined) {
            containerOut.center.lon = (traceBounds.west + traceBounds.east) / 2;
        }
        if(containerOut.center.lat === undefined) {
            // Center latitude in Mercator projection, then unproject
            function mercatorY(lat) {
                var rad = lat * Math.PI / 180;
                return Math.log(Math.tan(Math.PI / 4 + rad / 2));
            }
            function unMercatorY(y) {
                return (2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180 / Math.PI;
            }

            var yNorth = mercatorY(traceBounds.north);
            var ySouth = mercatorY(traceBounds.south);
            var yCenter = (yNorth + ySouth) / 2;
            containerOut.center.lat = unMercatorY(yCenter);
        }

        // Do NOT set containerOut.bounds here as that restricts panning!
    }
    } // End of auto-calculate bounds block

    if(
        west === undefined ||
        east === undefined ||
        south === undefined ||
        north === undefined
    ) {
        delete containerOut.bounds;

        if(fitBounds) {
            delete containerOut.center.lon;
            delete containerOut.center.lat;
            delete containerOut.zoom;
        }
    }

    handleArrayContainerDefaults(containerIn, containerOut, {
        name: 'layers',
        handleItemDefaults: handleLayerDefaults
    });

    // copy ref to input container to update 'center' and 'zoom' on map move
    containerOut._input = containerIn;
}

function handleLayerDefaults(layerIn, layerOut) {
    function coerce(attr, dflt) {
        return Lib.coerce(layerIn, layerOut, layoutAttributes.layers, attr, dflt);
    }

    var visible = coerce('visible');
    if(visible) {
        var sourceType = coerce('sourcetype');
        var mustBeRasterLayer = sourceType === 'raster' || sourceType === 'image';

        coerce('source');
        coerce('sourceattribution');

        if(sourceType === 'vector') {
            coerce('sourcelayer');
        }

        if(sourceType === 'image') {
            coerce('coordinates');
        }

        var typeDflt;
        if(mustBeRasterLayer) typeDflt = 'raster';

        var type = coerce('type', typeDflt);

        if(mustBeRasterLayer && type !== 'raster') {
            type = layerOut.type = 'raster';
            Lib.log('Source types *raster* and *image* must drawn *raster* layer type.');
        }

        coerce('below');
        coerce('color');
        coerce('opacity');
        coerce('minzoom');
        coerce('maxzoom');

        if(type === 'circle') {
            coerce('circle.radius');
        }

        if(type === 'line') {
            coerce('line.width');
            coerce('line.dash');
        }

        if(type === 'fill') {
            coerce('fill.outlinecolor');
        }

        if(type === 'symbol') {
            coerce('symbol.icon');
            coerce('symbol.iconsize');

            coerce('symbol.text');
            Lib.coerceFont(coerce, 'symbol.textfont', undefined, {
                noFontVariant: true,
                noFontShadow: true,
                noFontLineposition: true,
                noFontTextcase: true,
            });
            coerce('symbol.textposition');
            coerce('symbol.placement');
        }
    }
}
