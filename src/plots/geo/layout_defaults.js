'use strict';

var Lib = require('../../lib');
var handleSubplotDefaults = require('../subplot_defaults');
var getSubplotData = require('../get_data').getSubplotData;
const { unwrapLonRange } = require('../../lib/geo_location_utils');

var constants = require('./constants');
var layoutAttributes = require('./layout_attributes');

var axesNames = constants.axesNames;

module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, fullData) {
    handleSubplotDefaults(layoutIn, layoutOut, fullData, {
        type: 'geo',
        attributes: layoutAttributes,
        handleDefaults: handleGeoDefaults,
        fullData: fullData,
        partition: 'y'
    });
};

function handleGeoDefaults(geoLayoutIn, geoLayoutOut, coerce, opts) {
    var subplotData = getSubplotData(opts.fullData, 'geo', opts.id);
    var traceIndices = subplotData.map(function (t) {
        return t.index;
    });

    var resolution = coerce('resolution');
    var scope = coerce('scope');
    var scopeParams = constants.scopeDefaults[scope];

    var projType = coerce('projection.type', scopeParams.projType);
    var isAlbersUsa = (geoLayoutOut._isAlbersUsa = projType === 'albers usa');

    // no other scopes are allowed for 'albers usa' projection
    if (isAlbersUsa) scope = geoLayoutOut.scope = 'usa';

    var isScoped = (geoLayoutOut._isScoped = scope !== 'world');
    var isSatellite = (geoLayoutOut._isSatellite = projType === 'satellite');
    var isConic = (geoLayoutOut._isConic = projType.indexOf('conic') !== -1 || projType === 'albers');
    var isClipped = (geoLayoutOut._isClipped = !!constants.lonaxisSpan[projType]);

    if (geoLayoutIn.visible === false) {
        // should override template.layout.geo.show* - see issue 4482

        // make a copy
        var newTemplate = Lib.extendDeep({}, geoLayoutOut._template);

        // override show*
        newTemplate.showcoastlines = false;
        newTemplate.showcountries = false;
        newTemplate.showframe = false;
        newTemplate.showlakes = false;
        newTemplate.showland = false;
        newTemplate.showocean = false;
        newTemplate.showrivers = false;
        newTemplate.showsubunits = false;
        if (newTemplate.lonaxis) newTemplate.lonaxis.showgrid = false;
        if (newTemplate.lataxis) newTemplate.lataxis.showgrid = false;

        // set ref to copy
        geoLayoutOut._template = newTemplate;
    }
    var visible = coerce('visible');

    var show;
    for (var i = 0; i < axesNames.length; i++) {
        var axisName = axesNames[i];
        var dtickDflt = [30, 10][i];
        var rangeDflt;

        if (isScoped) {
            rangeDflt = scopeParams[axisName + 'Range'];
        } else {
            var dfltSpans = constants[axisName + 'Span'];
            var hSpan = (dfltSpans[projType] || dfltSpans['*']) / 2;
            var rot = coerce('projection.rotation.' + axisName.slice(0, 3), scopeParams.projRotate[i]);
            rangeDflt = [rot - hSpan, rot + hSpan];
        }

        var range = coerce(axisName + '.range', rangeDflt);
        coerce(axisName + '.tick0');
        coerce(axisName + '.dtick', dtickDflt);

        show = coerce(axisName + '.showgrid', !visible ? false : undefined);
        if (show) {
            coerce(axisName + '.gridcolor');
            coerce(axisName + '.gridwidth');
            coerce(axisName + '.griddash');
        }

        // mock axis for autorange computations
        geoLayoutOut[axisName]._ax = {
            type: 'linear',
            _id: axisName.slice(0, 3),
            _traceIndices: traceIndices,
            setScale: Lib.identity,
            c2l: Lib.identity,
            r2l: Lib.identity,
            autorange: true,
            range: range.slice(),
            _m: 1,
            _input: {}
        };
    }

    var lonRange = geoLayoutOut.lonaxis.range;
    var latRange = geoLayoutOut.lataxis.range;

    const [lon0, lon1] = unwrapLonRange(lonRange);

    var centerLon = (lon0 + lon1) / 2;
    var projLon;

    if (!isAlbersUsa) {
        var dfltProjRotate = isScoped ? scopeParams.projRotate : [centerLon, 0, 0];

        projLon = coerce('projection.rotation.lon', dfltProjRotate[0]);
        coerce('projection.rotation.lat', dfltProjRotate[1]);
        coerce('projection.rotation.roll', dfltProjRotate[2]);

        show = coerce('showcoastlines', !isScoped && visible);
        if (show) {
            coerce('coastlinecolor');
            coerce('coastlinewidth');
        }

        show = coerce('showocean', !visible ? false : undefined);
        if (show) coerce('oceancolor');
    }

    var centerLonDflt;
    var centerLatDflt;

    if (isAlbersUsa) {
        // 'albers usa' does not have a 'center',
        // these values were found using via:
        //   projection.invert([geoLayout.center.lon, geoLayoutIn.center.lat])
        centerLonDflt = -96.6;
        centerLatDflt = 38.7;
    } else {
        centerLonDflt = isScoped ? centerLon : projLon;
        centerLatDflt = (latRange[0] + latRange[1]) / 2;
    }

    coerce('center.lon', centerLonDflt);
    coerce('center.lat', centerLatDflt);

    if (isSatellite) {
        coerce('projection.tilt');
        coerce('projection.distance');
    }

    if (isConic) {
        var dfltProjParallels = scopeParams.projParallels || [0, 60];
        coerce('projection.parallels', dfltProjParallels);
    }

    coerce('projection.scale');
    coerce('projection.minscale');
    coerce('projection.maxscale');

    show = coerce('showland', !visible ? false : undefined);
    if (show) coerce('landcolor');

    show = coerce('showlakes', !visible ? false : undefined);
    if (show) coerce('lakecolor');

    show = coerce('showrivers', !visible ? false : undefined);
    if (show) {
        coerce('rivercolor');
        coerce('riverwidth');
    }

    show = coerce('showcountries', isScoped && scope !== 'usa' && visible);
    if (show) {
        coerce('countrycolor');
        coerce('countrywidth');
    }

    if (scope === 'usa' || (scope === 'north america' && resolution === 50)) {
        // Only works for:
        //   USA states at 110m
        //   USA states + Canada provinces at 50m
        coerce('showsubunits', visible);
        coerce('subunitcolor');
        coerce('subunitwidth');
    }

    if (!isScoped) {
        // Does not work in non-world scopes
        show = coerce('showframe', visible);
        if (show) {
            coerce('framecolor');
            coerce('framewidth');
        }
    }

    coerce('bgcolor');

    // `fitbounds` updates a selection of view attributes, specific to the projection type.
    // Check to see if a user has set any of these. If they have, skip fitbounds. Otherwise
    // null out the proper attributes and run the fitting logic.
    coerce('fitbounds');
    if (geoLayoutOut.fitbounds) {
        const centerIn = geoLayoutIn.center || {};
        const projectionIn = geoLayoutIn.projection || {};
        const rotationIn = projectionIn.rotation || {};
        const lonaxisIn = geoLayoutIn.lonaxis || {};
        const lataxisIn = geoLayoutIn.lataxis || {};
        // All projection types will set these attributes
        const viewAttributes = [
            { dst: geoLayoutOut.center, key: 'lon', src: centerIn },
            { dst: geoLayoutOut.center, key: 'lat', src: centerIn },
            { dst: geoLayoutOut.projection, key: 'scale', src: projectionIn }
        ];
        // Branch order is important because scoped projections can also be clipped,
        // but these should be treated as scoped below
        if (isScoped) {
            // Scoped only sets center, so move on
        } else if (isClipped) {
            viewAttributes.push(
                { dst: geoLayoutOut.projection.rotation, key: 'lon', src: rotationIn },
                { dst: geoLayoutOut.projection.rotation, key: 'lat', src: rotationIn },
                { dst: geoLayoutOut.lonaxis, key: 'range', src: lonaxisIn },
                { dst: geoLayoutOut.lataxis, key: 'range', src: lataxisIn }
            );
        } else {
            viewAttributes.push({ dst: geoLayoutOut.projection.rotation, key: 'lon', src: rotationIn });
        }

        // Add entries for axis ranges with no `dst` key for non-clipped projections.
        // These ranges signal user view-config intent, but non-clipped projections should
        // skip the null step because it would break the fit calc.
        if (!isClipped) {
            viewAttributes.push({ key: 'range', src: lonaxisIn }, { key: 'range', src: lataxisIn });
        }
        const hasUserView = viewAttributes.some(({ src, key }) => src[key] != null); // Use loose comparison so null/undefined count as unset
        if (hasUserView || constants.fitboundsIncompatible.has(projType)) {
            geoLayoutOut.fitbounds = false;
        } else {
            // Set auto-filled view attributes to null so updateProjection can
            // compute the fit from scratch and fullLayout matches user input
            viewAttributes.forEach(({ dst, key }) => dst && (dst[key] = null));
        }
    }
}
