/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var mapboxgl = require('mapbox-gl');

var Lib = require('../../lib');
var getSubplotCalcData = require('../../plots/get_data').getSubplotCalcData;
var xmlnsNamespaces = require('../../constants/xmlns_namespaces');
var d3 = require('d3');
var Drawing = require('../../components/drawing');

var Mapbox = require('./mapbox');

var MAPBOX = 'mapbox';

var constants = exports.constants = require('./constants');

exports.name = MAPBOX;

exports.attr = 'subplot';

exports.idRoot = MAPBOX;

exports.idRegex = exports.attrRegex = Lib.counterRegex(MAPBOX);

exports.attributes = {
    subplot: {
        valType: 'subplotid',
        role: 'info',
        dflt: 'mapbox',
        editType: 'calc',
        description: [
            'Sets a reference between this trace\'s data coordinates and',
            'a mapbox subplot.',
            'If *mapbox* (the default value), the data refer to `layout.mapbox`.',
            'If *mapbox2*, the data refer to `layout.mapbox2`, and so on.'
        ].join(' ')
    }
};

exports.layoutAttributes = require('./layout_attributes');

exports.supplyLayoutDefaults = require('./layout_defaults');

exports.plot = function plot(gd) {
    var fullLayout = gd._fullLayout;
    var calcData = gd.calcdata;
    var mapboxIds = fullLayout._subplots[MAPBOX];

    if(mapboxgl.version !== constants.requiredVersion) {
        throw new Error(constants.wrongVersionErrorMsg);
    }

    var accessToken = findAccessToken(gd, mapboxIds);
    mapboxgl.accessToken = accessToken;

    for(var i = 0; i < mapboxIds.length; i++) {
        var id = mapboxIds[i];
        var subplotCalcData = getSubplotCalcData(calcData, MAPBOX, id);
        var opts = fullLayout[id];
        var mapbox = opts._subplot;

        if(!mapbox) {
            mapbox = new Mapbox(gd, id);
            fullLayout[id]._subplot = mapbox;
        }

        if(!mapbox.viewInitial) {
            mapbox.viewInitial = {
                center: Lib.extendFlat({}, opts.center),
                zoom: opts.zoom,
                bearing: opts.bearing,
                pitch: opts.pitch
            };
        }

        mapbox.plot(subplotCalcData, fullLayout, gd._promises);
    }
};

exports.clean = function(newFullData, newFullLayout, oldFullData, oldFullLayout) {
    var oldMapboxKeys = oldFullLayout._subplots[MAPBOX] || [];

    for(var i = 0; i < oldMapboxKeys.length; i++) {
        var oldMapboxKey = oldMapboxKeys[i];

        if(!newFullLayout[oldMapboxKey] && !!oldFullLayout[oldMapboxKey]._subplot) {
            oldFullLayout[oldMapboxKey]._subplot.destroy();
        }
    }
};

exports.toSVG = function(gd) {
    var fullLayout = gd._fullLayout;
    var subplotIds = fullLayout._subplots[MAPBOX];
    var size = fullLayout._size;

    for(var i = 0; i < subplotIds.length; i++) {
        var opts = fullLayout[subplotIds[i]];
        var domain = opts.domain;
        var mapbox = opts._subplot;

        var imageData = mapbox.toImage('png');
        var image = fullLayout._glimages.append('svg:image');

        image.attr({
            xmlns: xmlnsNamespaces.svg,
            'xlink:href': imageData,
            x: size.l + size.w * domain.x[0],
            y: size.t + size.h * (1 - domain.y[1]),
            width: size.w * (domain.x[1] - domain.x[0]),
            height: size.h * (domain.y[1] - domain.y[0]),
            preserveAspectRatio: 'none'
        });

        var subplotDiv = d3.select(opts._subplot.div);

        // Append logo if visible
        var hidden = subplotDiv.select('.mapboxgl-ctrl-logo').node().offsetParent === null;
        if(!hidden) {
            var logo = fullLayout._glimages.append('g');
            logo.attr('transform', 'translate(' + (size.l + size.w * domain.x[0] + 10) + ', ' + (size.t + size.h * (1 - domain.y[0]) - 31) + ')');
            logo.append('path')
              .attr('d', 'm 10.5,1.24 c -5.11,0 -9.25,4.15 -9.25,9.25 0,5.1 4.15,9.25 9.25,9.25 5.1,0 9.25,-4.15 9.25,-9.25 0,-5.11 -4.14,-9.25 -9.25,-9.25 z m 4.39,11.53 c -1.93,1.93 -4.78,2.31 -6.7,2.31 -0.7,0 -1.41,-0.05 -2.1,-0.16 0,0 -1.02,-5.64 2.14,-8.81 0.83,-0.83 1.95,-1.28 3.13,-1.28 1.27,0 2.49,0.51 3.39,1.42 1.84,1.84 1.89,4.75 0.14,6.52 z')
              .style({
                  opacity: 0.9,
                  fill: '#ffffff',
                  'enable-background': 'new'
              });

            logo.append('path')
              .attr('d', 'M 10.5,-0.01 C 4.7,-0.01 0,4.7 0,10.49 c 0,5.79 4.7,10.5 10.5,10.5 5.8,0 10.5,-4.7 10.5,-10.5 C 20.99,4.7 16.3,-0.01 10.5,-0.01 Z m 0,19.75 c -5.11,0 -9.25,-4.15 -9.25,-9.25 0,-5.1 4.14,-9.26 9.25,-9.26 5.11,0 9.25,4.15 9.25,9.25 0,5.13 -4.14,9.26 -9.25,9.26 z')
              .style('opacity', 0.35)
              .style('enable-background', 'new');

            logo.append('path')
              .attr('d', 'M 14.74,6.25 C 12.9,4.41 9.98,4.35 8.23,6.1 5.07,9.27 6.09,14.91 6.09,14.91 c 0,0 5.64,1.02 8.81,-2.14 C 16.64,11 16.59,8.09 14.74,6.25 Z m -2.27,4.09 -0.91,1.87 -0.9,-1.87 -1.86,-0.91 1.86,-0.9 0.9,-1.87 0.91,1.87 1.86,0.9 z')
              .style('opacity', 0.35)
              .style('enable-background', 'new');

            logo.append('polygon')
              .attr('points', '11.56,12.21 10.66,10.34 8.8,9.43 10.66,8.53 11.56,6.66 12.47,8.53 14.33,9.43 12.47,10.34')
              .style({
                  opacity: 0.9,
                  fill: '#ffffff',
                  'enable-background': 'new'
              });
        }

        // Add attributions
        var attributions = subplotDiv
                              .select('.mapboxgl-ctrl-attrib').text()
                              .replace('Improve this map', '');

        var attributionGroup = fullLayout._glimages.append('g');

        var attributionText = attributionGroup.append('text');
        attributionText
          .text(attributions)
          .classed('static-attribution', true)
          .attr({
              'font-size': 12,
              'font-family': 'Arial',
              'color': 'rgba(0, 0, 0, 0.75)',
              'text-anchor': 'end',
              'data-unformatted': attributions,
              x: size.l + size.w * domain.x[1] - 3,
              y: size.t + size.h * (1 - domain.y[0]) - 4
          });

        var bBox = Drawing.bBox(attributionText.node());
        attributionGroup
          .insert('rect', '.static-attribution')
          .attr({
              x: size.l + size.w * domain.x[1] - bBox.width - 6,
              y: size.t + size.h * (1 - domain.y[0]) - (bBox.height + 3),
              width: bBox.width + 6,
              height: bBox.height + 3,
              fill: 'rgba(255, 255, 255, 0.75)'
          });
    }
};

// N.B. mapbox-gl only allows one accessToken to be set per page:
// https://github.com/mapbox/mapbox-gl-js/issues/6331
function findAccessToken(gd, mapboxIds) {
    var fullLayout = gd._fullLayout;
    var context = gd._context;

    // special case for Mapbox Atlas users
    if(context.mapboxAccessToken === '') return '';

    var tokensUseful = [];
    var tokensListed = [];
    var wontWork = false;

    // Take the first token we find in a mapbox subplot.
    // These default to the context value but may be overridden.
    for(var i = 0; i < mapboxIds.length; i++) {
        var opts = fullLayout[mapboxIds[i]];
        var style = opts.style;
        var token = opts.accesstoken;

        if(typeof style === 'string' && constants.styleValuesMapbox.indexOf(style) !== -1) {
            if(token) {
                Lib.pushUnique(tokensUseful, token);
            } else {
                Lib.error('Uses Mapbox map style, but did not set an access token.');
                wontWork = true;
            }
        }

        if(token) {
            Lib.pushUnique(tokensListed, token);
        }
    }

    if(wontWork) {
        throw new Error(constants.noAccessTokenErrorMsg);
    }

    if(tokensUseful.length) {
        if(tokensUseful.length > 1) {
            Lib.warn(constants.multipleTokensErrorMsg);
        }
        return tokensUseful[0];
    } else {
        if(tokensListed.length) {
            Lib.log([
                'Listed mapbox access token(s)', tokensListed.join(','),
                'but did not use a Mapbox map style, ignoring token(s).'
            ].join(' '));
        }
        return '';
    }
}

exports.updateFx = function(gd) {
    var fullLayout = gd._fullLayout;
    var subplotIds = fullLayout._subplots[MAPBOX];

    for(var i = 0; i < subplotIds.length; i++) {
        var subplotObj = fullLayout[subplotIds[i]]._subplot;
        subplotObj.updateFx(fullLayout);
    }
};
