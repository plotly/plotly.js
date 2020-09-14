/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var hovertemplateAttrs = require('../../plots/template_attributes')
  .hovertemplateAttrs;
var texttemplateAttrs = require('../../plots/template_attributes')
  .texttemplateAttrs;
var scatterGeoAttrs = require('../scattergeo/attributes');
var scatterAttrs = require('../scatter/attributes');
var baseAttrs = require('../../plots/attributes');

var extendFlat = require('../../lib/extend').extendFlat;
var overrideAll = require('../../plot_api/edit_types').overrideAll;
var colorScaleAttrs = require('../../components/colorscale/attributes');

var markerAttrs = scatterGeoAttrs.marker;

module.exports = overrideAll({
    lon: scatterGeoAttrs.lon,
    lat: scatterGeoAttrs.lat,

    cluster: {
        maxZoom: {
            valType: 'number',
            role: 'info',
            min: 0,
            max: 22,
            dflt: 14,
            description: 'Sets the maximum zoom level for the cluster.',
        },
        radius: {
            role: 'info',
            valType: 'number',
            dflt: 50,
            description: 'Radius of each cluster when clustering points.',
        },
        steps: {
            role: 'info',
            valType: 'number',
            arrayOk: true,
            dflt: -1,
            min: -1,
            description: [
                'Sets the steps for each cluster.'
            ].join(' ')
        },
        stepColors: {
            role: 'info',
            valType: 'color',
            dflt: '#51bbd6',
            arrayOk: true,
            editType: 'style',
            anim: true,
            description: [
                'Sets the color for each cluster.'
            ].join(' ')
        },
        stepSize: {
            role: 'info',
            valType: 'number',
            arrayOk: true,
            dflt: 20,
            min: 0,
            description: [
                'Sets the size for each cluster.'
            ].join(' ')
        },
    },

    mode: extendFlat({}, scatterAttrs.mode, {
        dflt: 'markers',
        description: [
            'Determines the drawing mode for this scatter trace.',
        ].join(' '),
        flags: ['markers'],
    }),

    texttemplate: texttemplateAttrs(
    { editType: 'plot' },
        {
            keys: ['lat', 'lon', 'text'],
        }
  ),
    hoverinfo: extendFlat({}, baseAttrs.hoverinfo, {
        flags: ['lon', 'lat', 'text', 'name'],
    }),
    hovertemplate: hovertemplateAttrs(),
    hovertext: extendFlat({}, scatterAttrs.hovertext, {
        description: [
            'Sets hover text elements associated with each (lon,lat) pair',
            'If a single string, the same string appears over',
            'all the data points.',
            'If an array of string, the items are mapped in order to the',
            'this trace\'s (lon,lat) coordinates.',
            'To be seen, trace `hoverinfo` must contain a *text* flag.',
        ].join(' '),
    }),
    marker: extendFlat(
        {
            symbol: {
                valType: 'flaglist',
                flags: ['circle'],
                dflt: 'circle',
                role: 'style',
                description: ['Sets the marker symbol.'].join(' '),
            },
            opacity: markerAttrs.opacity,
            size: markerAttrs.size,
            sizeref: markerAttrs.sizeref,
            sizemin: markerAttrs.sizemin,
            sizemode: markerAttrs.sizemode
        },
    colorScaleAttrs('marker')
  ),
    below: {
        valType: 'string',
        role: 'info',
        description: [
            'Determines if this scattermapbox trace\'s layers are to be inserted',
            'before the layer with the specified ID.',
            'By default, scattermapbox layers are inserted',
            'above all the base layers.',
            'To place the scattermapbox layers above every other layer, set `below` to *\'\'*.'
        ].join(' ')
    },
}, 'calc', 'nested');
