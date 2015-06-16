'use strict';

var Plotly = require('../../plotly'),
    params = require('../lib/params');

var GeoLayout = module.exports = {};

GeoLayout.layoutAttributes = {
    domain:  {
        x: [
            {type: 'number', min: 0, max: 1, dflt: 0},
            {type: 'number', min: 0, max: 1, dflt: 1}
        ],
        y: [
            {type: 'number', min: 0, max: 1},
            {type: 'number', min: 0, max: 1}
        ]
    },
    resolution: {
        // specifies the resolution of the topojsons
        // the values have units km/mm
        // e.g. 110 corresponds to a scale ratio of 1:110,000,000
        type: 'enumerated',
        values: [110, 50],
        dflt: 110,
        coerceNumber: true
    },
    scope: {
        type: 'enumerated',
        values: Object.keys(params.scopeDefaults),
        dflt: 'world'
    },
    projection: {
        type: {
            type: 'enumerated',
            values: Object.keys(params.projNames)
        },
        rotate: [
            {type: 'number'},
            {type: 'number'},
            {type: 'number'}
        ],
        parallels: [
            {type: 'number'},
            {type: 'number'}
        ],
        scale: {
            type: 'number',
            min: 0,
            max: 10,
            dflt: 1
        }
    },
    showcoastlines: {
        type: 'boolean'
    },
    coastlinescolor: {
        type: 'color',
        dflt: Plotly.Color.defaultLine
    },
    coastlineswidth: {
        type: 'number',
        min: 0,
        dflt: 1
    },
    showland: {
        type: 'boolean',
        dflt: false
    },
    landfillcolor: {
        type: 'color',
        dflt: params.landFillColor
    },
    showocean: {
        type: 'boolean',
        dflt: false
    },
    oceanfillcolor: {
        type: 'color',
        dflt: params.waterFillColor
    },
    showlakes: {
        type: 'boolean',
        dflt: false
    },
    lakesfillcolor: {
        type: 'color',
        dflt: params.waterFillColor
    },
    showrivers: {
        type: 'boolean',
        dflt: false
    },
    riverslinecolor: {
        type: 'color',
        dflt: params.waterFillColor
    },
    riverslinewidth: {
        type: 'number',
        min: 0,
        dflt: 1
    },
    showcountries: {
        type: 'boolean'
    },
    countrieslinecolor: {
        type: 'color',
        dflt: Plotly.Color.defaultLine
    },
    countrieslinewidth: {
        type: 'number',
        min: 0,
        dflt: 1
    },
    showsubunits: {
        type: 'boolean'
    },
    subunitslinecolor: {
        type: 'color',
        dflt: Plotly.Color.defaultLine
    },
    subunitslinewidth: {
        type: 'number',
        min: 0,
        dflt: 1
    },
    showframe: {
        type: 'boolean',
        dflt: true
    },
    framelinecolor: {
        type: 'color',
        dflt: Plotly.Color.defaultLine
    },
    framelinewidth: {
        type: 'number',
        min: 0,
        dflt: 2
    },
    bgcolor: {
        type: 'color',
        dflt: Plotly.Color.background
    },
    _nestedModules: {
        'lonaxis': 'GeoAxes',
        'lataxis': 'GeoAxes'
    }
};

GeoLayout.supplyLayoutDefaults = function(layoutIn, layoutOut, fullData) {
    var geos = findGeosInData(fullData),
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
        coerce('projection.rotate[0]', dfltProjRotate[0]);
        coerce('projection.rotate[1]', dfltProjRotate[1]);
        coerce('projection.rotate[2]', dfltProjRotate[2]);

        show = coerce('showcoastlines', !isScoped);
        if(show) {
            coerce('coastlinescolor');
            coerce('coastlineswidth');
        }

        show = coerce('showocean');
        if(show) coerce('oceanfillcolor');
    }
    else geoLayoutOut.scope = 'usa';

    coerce('projection.scale');

    show = coerce('showland');
    if(show) coerce('landfillcolor');

    show = coerce('showlakes');
    if(show) coerce('lakesfillcolor');

    show = coerce('showrivers');
    if(show) {
        coerce('riverslinecolor');
        coerce('riverslinewidth');
    }

    show = coerce('showcountries', isScoped);
    if(show) {
        coerce('countrieslinecolor');
        coerce('countrieslinewidth');
    }

    if(scope==='usa' || (scope==='north america' && resolution===50)) {
        // Only works for:
        //   USA states at 110m
        //   USA states + Canada provinces at 50m
        coerce('showsubunits', true);
        coerce('subunitslinecolor');
        coerce('subunitslinewidth');
    }

    if(!isScoped) {
        // Does not work in non-world scopes
        show = coerce('showframe');
        if(show) {
            coerce('framelinecolor');
            coerce('framelinewidth');
        }
    }

    coerce('bgcolor');

    Plotly.GeoAxes.supplyLayoutDefaults(geoLayoutIn, geoLayoutOut);

    // bind a few helper variables
    geoLayoutOut._isHighRes = resolution===50;
    geoLayoutOut._isClipped = params.lonaxisSpan[projType];
    geoLayoutOut._clipAngle = params.lonaxisSpan[projType] / 2;
    geoLayoutOut._isAlbersUsa = isAlbersUsa;
    geoLayoutOut._isConic = isConic;
    geoLayoutOut._isScoped = isScoped;
};

function findGeosInData(fullData) {
    var geos = [],
        d;

    for (var i = 0; i < fullData.length; i++) {
        d = fullData[i];
        if(Plotly.Plots.traceIs(d, 'geo')) {
            if(geos.indexOf(d.geo) === -1) geos.push(d.geo);
        }
    }

    return geos;
}
