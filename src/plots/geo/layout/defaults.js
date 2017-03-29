/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var handleSubplotDefaults = require('../../subplot_defaults');
var constants = require('../constants');
var layoutAttributes = require('./layout_attributes');
var supplyGeoAxisLayoutDefaults = require('./axis_defaults');


module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, fullData) {
    handleSubplotDefaults(layoutIn, layoutOut, fullData, {
        type: 'geo',
        attributes: layoutAttributes,
        handleDefaults: handleGeoDefaults,
        partition: 'y'
    });
};

function handleGeoDefaults(geoLayoutIn, geoLayoutOut, coerce) {
    var show;

    var scope = coerce('scope');
    var isScoped = (scope !== 'world');
    var scopeParams = constants.scopeDefaults[scope];

    var resolution = coerce('resolution');

    var projType = coerce('projection.type', scopeParams.projType);
    var isAlbersUsa = projType === 'albers usa';
    var isConic = projType.indexOf('conic') !== -1;

    if(isConic) {
        var dfltProjParallels = scopeParams.projParallels || [0, 60];
        coerce('projection.parallels', dfltProjParallels);
    }

    if(!isAlbersUsa) {
        var dfltProjRotate = scopeParams.projRotate || [0, 0, 0];
        coerce('projection.rotation.lon', dfltProjRotate[0]);
        coerce('projection.rotation.lat', dfltProjRotate[1]);
        coerce('projection.rotation.roll', dfltProjRotate[2]);

        show = coerce('showcoastlines', !isScoped);
        if(show) {
            coerce('coastlinecolor');
            coerce('coastlinewidth');
        }

        show = coerce('showocean');
        if(show) coerce('oceancolor');
    }
    else geoLayoutOut.scope = 'usa';

    coerce('projection.scale');

    show = coerce('showland');
    if(show) coerce('landcolor');

    show = coerce('showlakes');
    if(show) coerce('lakecolor');

    show = coerce('showrivers');
    if(show) {
        coerce('rivercolor');
        coerce('riverwidth');
    }

    show = coerce('showcountries', isScoped && scope !== 'usa');
    if(show) {
        coerce('countrycolor');
        coerce('countrywidth');
    }

    if(scope === 'usa' || (scope === 'north america' && resolution === 50)) {
        // Only works for:
        //   USA states at 110m
        //   USA states + Canada provinces at 50m
        coerce('showsubunits', true);
        coerce('subunitcolor');
        coerce('subunitwidth');
    }

    if(!isScoped) {
        // Does not work in non-world scopes
        show = coerce('showframe', true);
        if(show) {
            coerce('framecolor');
            coerce('framewidth');
        }
    }

    coerce('bgcolor');

    supplyGeoAxisLayoutDefaults(geoLayoutIn, geoLayoutOut);

    // bind a few helper variables
    geoLayoutOut._isHighRes = resolution === 50;
    geoLayoutOut._clipAngle = constants.lonaxisSpan[projType] / 2;
    geoLayoutOut._isAlbersUsa = isAlbersUsa;
    geoLayoutOut._isConic = isConic;
    geoLayoutOut._isScoped = isScoped;

    var rotation = geoLayoutOut.projection.rotation || {};
    geoLayoutOut.projection._rotate = [
        -rotation.lon || 0,
        -rotation.lat || 0,
        rotation.roll || 0
    ];
}
