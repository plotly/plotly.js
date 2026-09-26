'use strict';

var Lib = require('../../lib');

var handleSubplotDefaults = require('../subplot_defaults');
var handleArrayContainerDefaults = require('../array_container_defaults');
var layoutAttributes = require('./layout_attributes');
const { getMapFitBounds } = require('./get_map_fit_bounds');

module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, fullData) {
    handleSubplotDefaults(layoutIn, layoutOut, fullData, {
        type: 'map',
        attributes: layoutAttributes,
        handleDefaults,
        partition: 'y',
        fullData
    });
};

function handleDefaults(containerIn, containerOut, coerce, opts) {
    coerce('style');
    coerce('center.lon');
    coerce('center.lat');
    coerce('zoom');
    coerce('bearing');
    coerce('pitch');
    const fitbounds = coerce('fitbounds');

    var west = coerce('bounds.west');
    var east = coerce('bounds.east');
    var south = coerce('bounds.south');
    var north = coerce('bounds.north');
    if (west === undefined || east === undefined || south === undefined || north === undefined) {
        delete containerOut.bounds;
    }

    handleArrayContainerDefaults(containerIn, containerOut, {
        name: 'layers',
        handleItemDefaults: handleLayerDefaults
    });

    // Explicitly reset `_fitBounds` to null so that `relinkPrivateKeys`
    // doesn't carry a stale value forward from the previous render
    containerOut._fitBounds = null;

    // Fit the view to the data. Runs when no view attributes have
    // been set (initial render, or user cleared them) OR when they still
    // hold the exact values that were auto-computed last time. Skipped when
    // the user has explicitly opted out via `fitbounds: false`.
    // - `_fitBounds` contains the lon/lat coords for the geometry bounding box
    //   and is used to store the values passed in to MapLibre for fitting
    // - `_fitView` contains the view attributes after the MapLibre auto-fit
    //   has been completed and is used to determine if the current view is
    //   still the auto-fit view
    const { _fitView: { center: fitCenter, zoom: fitZoom } = {}, center, zoom } = containerIn;
    const isFitView = center?.lon === fitCenter?.lon && center?.lat === fitCenter?.lat && zoom === fitZoom;
    if (fitbounds && isFitView) {
        const fitBounds = getMapFitBounds(opts.fullData, opts.id);
        if (fitBounds) containerOut._fitBounds = fitBounds;
    }

    // copy ref to input container to update 'center' and 'zoom' on map move
    containerOut._input = containerIn;
}

function handleLayerDefaults(layerIn, layerOut) {
    function coerce(attr, dflt) {
        return Lib.coerce(layerIn, layerOut, layoutAttributes.layers, attr, dflt);
    }

    var visible = coerce('visible');
    if (visible) {
        var sourceType = coerce('sourcetype');
        var mustBeRasterLayer = sourceType === 'raster' || sourceType === 'image';

        coerce('source');
        coerce('sourceattribution');

        if (sourceType === 'vector') {
            coerce('sourcelayer');
        }

        if (sourceType === 'image') {
            coerce('coordinates');
        }

        var typeDflt;
        if (mustBeRasterLayer) typeDflt = 'raster';

        var type = coerce('type', typeDflt);

        if (mustBeRasterLayer && type !== 'raster') {
            type = layerOut.type = 'raster';
            Lib.log('Source types *raster* and *image* must drawn *raster* layer type.');
        }

        coerce('below');
        coerce('color');
        coerce('opacity');
        coerce('minzoom');
        coerce('maxzoom');

        if (type === 'circle') {
            coerce('circle.radius');
        }

        if (type === 'line') {
            coerce('line.width');
            coerce('line.dash');
        }

        if (type === 'fill') {
            coerce('fill.outlinecolor');
        }

        if (type === 'symbol') {
            coerce('symbol.icon');
            coerce('symbol.iconsize');

            coerce('symbol.text');
            Lib.coerceFont(coerce, 'symbol.textfont', undefined, {
                noFontVariant: true,
                noFontShadow: true,
                noFontLineposition: true,
                noFontTextcase: true
            });
            coerce('symbol.textposition');
            coerce('symbol.placement');
        }
    }
}
