/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var clipPad = require('./constants').clipPad;

function createGeoScale(geoLayout, graphSize) {
    var projLayout = geoLayout.projection,
        lonaxisLayout = geoLayout.lonaxis,
        lataxisLayout = geoLayout.lataxis,
        geoDomain = geoLayout.domain,
        frameWidth = geoLayout.framewidth || 0;

    // width & height the geo div
    var geoWidth = graphSize.w * (geoDomain.x[1] - geoDomain.x[0]),
        geoHeight = graphSize.h * (geoDomain.y[1] - geoDomain.y[0]);

    // add padding around range to avoid aliasing
    var lon0 = lonaxisLayout.range[0] + clipPad,
        lon1 = lonaxisLayout.range[1] - clipPad,
        lat0 = lataxisLayout.range[0] + clipPad,
        lat1 = lataxisLayout.range[1] - clipPad,
        lonfull0 = lonaxisLayout._fullRange[0] + clipPad,
        lonfull1 = lonaxisLayout._fullRange[1] - clipPad,
        latfull0 = lataxisLayout._fullRange[0] + clipPad,
        latfull1 = lataxisLayout._fullRange[1] - clipPad;

    // initial translation (makes the math easier)
    projLayout._translate0 = [
        graphSize.l + geoWidth / 2, graphSize.t + geoHeight / 2
    ];


    // center of the projection is given by
    // the lon/lat ranges and the rotate angle
    var dlon = lon1 - lon0,
        dlat = lat1 - lat0,
        c0 = [lon0 + dlon / 2, lat0 + dlat / 2],
        r = projLayout._rotate;

    projLayout._center = [c0[0] + r[0], c0[1] + r[1]];

    // needs a initial projection; it is called from makeProjection
    var setScale = function(projection) {
        var scale0 = projection.scale(),
            translate0 = projLayout._translate0,
            rangeBox = makeRangeBox(lon0, lat0, lon1, lat1),
            fullRangeBox = makeRangeBox(lonfull0, latfull0, lonfull1, latfull1);

        var scale, translate, bounds, fullBounds;

        // Inspired by: http://stackoverflow.com/a/14654988/4068492
        // using the path determine the bounds of the current map and use
        // these to determine better values for the scale and translation

        function getScale(bounds) {
            return Math.min(
                scale0 * geoWidth / (bounds[1][0] - bounds[0][0]),
                scale0 * geoHeight / (bounds[1][1] - bounds[0][1])
            );
        }

        // scale projection given how range box get deformed
        // by the projection
        bounds = getBounds(projection, rangeBox);
        scale = getScale(bounds);

        // similarly, get scale at full range
        fullBounds = getBounds(projection, fullRangeBox);
        projLayout._fullScale = getScale(fullBounds);

        projection.scale(scale);

        // translate the projection so that the top-left corner
        // of the range box is at the top-left corner of the viewbox
        bounds = getBounds(projection, rangeBox);
        translate = [
            translate0[0] - bounds[0][0] + frameWidth,
            translate0[1] - bounds[0][1] + frameWidth
        ];
        projLayout._translate = translate;
        projection.translate(translate);

        // clip regions out of the range box
        // (these are clipping along horizontal/vertical lines)
        bounds = getBounds(projection, rangeBox);
        if(!geoLayout._isAlbersUsa) projection.clipExtent(bounds);

        // adjust scale one more time with the 'scale' attribute
        scale = projLayout.scale * scale;

        // set projection scale and save it
        projLayout._scale = scale;

        // save the effective width & height of the geo framework
        geoLayout._width = Math.round(bounds[1][0]) + frameWidth;
        geoLayout._height = Math.round(bounds[1][1]) + frameWidth;

        // save the margin length induced by the map scaling
        geoLayout._marginX = (geoWidth - Math.round(bounds[1][0])) / 2;
        geoLayout._marginY = (geoHeight - Math.round(bounds[1][1])) / 2;
    };

    return setScale;
}

module.exports = createGeoScale;

// polygon GeoJSON corresponding to lon/lat range box
// with well-defined direction
function makeRangeBox(lon0, lat0, lon1, lat1) {
    var dlon4 = (lon1 - lon0) / 4;

    // TODO is this enough to handle ALL cases?
    // -- this makes scaling less precise than using d3.geo.graticule
    //    as great circles can overshoot the boundary
    //    (that's not a big deal I think)
    return {
        type: 'Polygon',
        coordinates: [
            [ [lon0, lat0],
            [lon0, lat1],
            [lon0 + dlon4, lat1],
            [lon0 + 2 * dlon4, lat1],
            [lon0 + 3 * dlon4, lat1],
            [lon1, lat1],
            [lon1, lat0],
            [lon1 - dlon4, lat0],
            [lon1 - 2 * dlon4, lat0],
            [lon1 - 3 * dlon4, lat0],
            [lon0, lat0] ]
        ]
    };
}

// bounds array [[top, left], [bottom, right]]
// of the lon/lat range box
function getBounds(projection, rangeBox) {
    return d3.geo.path().projection(projection).bounds(rangeBox);
}
