'use strict';

var Lib = require('../../lib');

var handleSubplotDefaults = require('../subplot_defaults');
var handleArrayContainerDefaults = require('../array_container_defaults');
var layoutAttributes = require('./layout_attributes');


module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, fullData) {
    handleSubplotDefaults(layoutIn, layoutOut, fullData, {
        type: 'mapbox',
        attributes: layoutAttributes,
        handleDefaults: handleDefaults,
        partition: 'y',
        accessToken: layoutOut._mapboxAccessToken
    });
};

function handleDefaults(containerIn, containerOut, coerce, opts) {
    coerce('accesstoken', opts.accessToken);
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
    if(
        west === undefined ||
        east === undefined ||
        south === undefined ||
        north === undefined
    ) {
        delete containerOut.bounds;
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
