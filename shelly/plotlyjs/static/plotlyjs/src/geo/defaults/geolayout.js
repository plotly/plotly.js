'use strict';

var Plotly = require('../../plotly'),
    params = require('../lib/params');

var GeoLayout = module.exports = {};

GeoLayout.layoutAttributes = require('../attributes/geolayout');

GeoLayout.supplyLayoutDefaults = function(layoutIn, layoutOut, fullData) {
    var geos = Plotly.Plots.getSubplotIdsInData(fullData, 'geo'),
        geosLength = geos.length;
    
    var geo, geoLayoutIn, geoLayoutOut;

    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(geoLayoutIn, geoLayoutOut,
                                 GeoLayout.layoutAttributes, attr, dflt);
    }

    for(var i = 0; i < geosLength; i++) {
        geo = geos[i];
        geoLayoutIn = layoutIn[geo] || {};
        geoLayoutOut = {};

        coerce('domain.x[0]');
        coerce('domain.x[1]');
        coerce('domain.y[0]', i / geosLength);
        coerce('domain.y[1]', (i + 1) / geosLength);

        GeoLayout.handleGeoDefaults(geoLayoutIn, geoLayoutOut, coerce);
        layoutOut[geo] = geoLayoutOut;
    }
};

GeoLayout.handleGeoDefaults = function(geoLayoutIn, geoLayoutOut, coerce) {
    var scope, resolution, projType,
        scopeParams, dfltProjRotate, dfltProjParallels,
        isScoped, isAlbersUsa, isConic, show;

    scope = coerce('scope');
    isScoped = scope!=='world';
    scopeParams = params.scopeDefaults[scope];

    resolution = coerce('resolution');

    projType = coerce('projection.type', scopeParams.projType);
    isAlbersUsa = projType==='albers usa';
    isConic = projType.indexOf('conic')!==-1;

    if(isConic) {
        dfltProjParallels = scopeParams.projParallels || [0, 60];
        coerce('projection.parallels[0]', dfltProjParallels[0]);
        coerce('projection.parallels[1]', dfltProjParallels[1]);
    }

    if(!isAlbersUsa) {
        dfltProjRotate = scopeParams.projRotate || [0, 0, 0];
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

    show = coerce('showcountries', isScoped);
    if(show) {
        coerce('countrycolor');
        coerce('countrywidth');
    }

    if(scope==='usa' || (scope==='north america' && resolution===50)) {
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

    Plotly.GeoAxes.supplyLayoutDefaults(geoLayoutIn, geoLayoutOut);

    // bind a few helper variables
    geoLayoutOut._isHighRes = resolution===50;
    geoLayoutOut._clipAngle = params.lonaxisSpan[projType] / 2;
    geoLayoutOut._isAlbersUsa = isAlbersUsa;
    geoLayoutOut._isConic = isConic;
    geoLayoutOut._isScoped = isScoped;

    var rotation = geoLayoutOut.projection.rotation || {};
    geoLayoutOut.projection._rotate = [
        -rotation.lon || 0,
        -rotation.lat || 0,
        rotation.roll || 0
    ];
};
