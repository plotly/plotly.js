/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var mapboxgl = require('mapbox-gl');

var Lib = require('../../lib');
var strTranslate = Lib.strTranslate;
var strScale = Lib.strScale;
var getSubplotCalcData = require('../../plots/get_data').getSubplotCalcData;
var xmlnsNamespaces = require('../../constants/xmlns_namespaces');
var d3 = require('d3');
var Drawing = require('../../components/drawing');
var svgTextUtils = require('../../lib/svg_text_utils');

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
            logo.attr('transform', strTranslate(size.l + size.w * domain.x[0] + 10, size.t + size.h * (1 - domain.y[0]) - 31));
            logo.append('path')
              .attr('d', constants.mapboxLogo.path0)
              .style({
                  opacity: 0.9,
                  fill: '#ffffff',
                  'enable-background': 'new'
              });

            logo.append('path')
              .attr('d', constants.mapboxLogo.path1)
              .style('opacity', 0.35)
              .style('enable-background', 'new');

            logo.append('path')
              .attr('d', constants.mapboxLogo.path2)
              .style('opacity', 0.35)
              .style('enable-background', 'new');

            logo.append('polygon')
              .attr('points', constants.mapboxLogo.polygon)
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
              'data-unformatted': attributions
          });

        var bBox = Drawing.bBox(attributionText.node());

        // Break into multiple lines twice larger than domain
        var maxWidth = size.w * (domain.x[1] - domain.x[0]);
        if((bBox.width > maxWidth / 2)) {
            var multilineAttributions = attributions.split('|').join('<br>');
            attributionText
              .text(multilineAttributions)
              .attr('data-unformatted', multilineAttributions)
              .call(svgTextUtils.convertToTspans, gd);

            bBox = Drawing.bBox(attributionText.node());
        }
        attributionText.attr('transform', strTranslate(-3, -bBox.height + 8));

        // Draw white rectangle behind text
        attributionGroup
          .insert('rect', '.static-attribution')
          .attr({
              x: -bBox.width - 6,
              y: -bBox.height - 3,
              width: bBox.width + 6,
              height: bBox.height + 3,
              fill: 'rgba(255, 255, 255, 0.75)'
          });

        // Scale down if larger than domain
        var scaleRatio = 1;
        if((bBox.width + 6) > maxWidth) scaleRatio = maxWidth / (bBox.width + 6);

        var offset = [(size.l + size.w * domain.x[1]), (size.t + size.h * (1 - domain.y[0]))];
        attributionGroup.attr('transform', strTranslate(offset[0], offset[1]) + strScale(scaleRatio));
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
    var hasOneSetMapboxStyle = false;
    var wontWork = false;

    // Take the first token we find in a mapbox subplot.
    // These default to the context value but may be overridden.
    for(var i = 0; i < mapboxIds.length; i++) {
        var opts = fullLayout[mapboxIds[i]];
        var token = opts.accesstoken;

        if(isMapboxStyle(opts.style)) {
            if(token) {
                Lib.pushUnique(tokensUseful, token);
            } else {
                if(isMapboxStyle(opts._input.style)) {
                    Lib.error('Uses Mapbox map style, but did not set an access token.');
                    hasOneSetMapboxStyle = true;
                }
                wontWork = true;
            }
        }

        if(token) {
            Lib.pushUnique(tokensListed, token);
        }
    }

    if(wontWork) {
        var msg = hasOneSetMapboxStyle ?
            constants.noAccessTokenErrorMsg :
            constants.missingStyleErrorMsg;
        Lib.error(msg);
        throw new Error(msg);
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

function isMapboxStyle(s) {
    return typeof s === 'string' && (
        constants.styleValuesMapbox.indexOf(s) !== -1 ||
        s.indexOf('mapbox://') === 0
    );
}

exports.updateFx = function(gd) {
    var fullLayout = gd._fullLayout;
    var subplotIds = fullLayout._subplots[MAPBOX];

    for(var i = 0; i < subplotIds.length; i++) {
        var subplotObj = fullLayout[subplotIds[i]]._subplot;
        subplotObj.updateFx(fullLayout);
    }
};
