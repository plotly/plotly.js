/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var texttemplateAttrs = require('../../plots/template_attributes').texttemplateAttrs;
var scatterGeoAttrs = require('../scattergeo/attributes');
var scatterAttrs = require('../scatter/attributes');
var mapboxAttrs = require('../../plots/mapbox/layout_attributes');
var baseAttrs = require('../../plots/attributes');
var colorScaleAttrs = require('../../components/colorscale/attributes');

var extendFlat = require('../../lib/extend').extendFlat;
var overrideAll = require('../../plot_api/edit_types').overrideAll;

var lineAttrs = scatterGeoAttrs.line;
var markerAttrs = scatterGeoAttrs.marker;

module.exports = overrideAll({
    lon: scatterGeoAttrs.lon,
    lat: scatterGeoAttrs.lat,

    // locations
    // locationmode

    mode: extendFlat({}, scatterAttrs.mode, {
        dflt: 'markers',
        description: [
            'Determines the drawing mode for this scatter trace.',
            'If the provided `mode` includes *text* then the `text` elements',
            'appear at the coordinates. Otherwise, the `text` elements',
            'appear on hover.'
        ].join(' ')
    }),

    text: extendFlat({}, scatterAttrs.text, {
        description: [
            'Sets text elements associated with each (lon,lat) pair',
            'If a single string, the same string appears over',
            'all the data points.',
            'If an array of string, the items are mapped in order to the',
            'this trace\'s (lon,lat) coordinates.',
            'If trace `hoverinfo` contains a *text* flag and *hovertext* is not set,',
            'these elements will be seen in the hover labels.'
        ].join(' ')
    }),
    texttemplate: texttemplateAttrs({editType: 'plot'}, {
        keys: ['lat', 'lon', 'text']
    }),
    hovertext: extendFlat({}, scatterAttrs.hovertext, {
        description: [
            'Sets hover text elements associated with each (lon,lat) pair',
            'If a single string, the same string appears over',
            'all the data points.',
            'If an array of string, the items are mapped in order to the',
            'this trace\'s (lon,lat) coordinates.',
            'To be seen, trace `hoverinfo` must contain a *text* flag.'
        ].join(' ')
    }),

    line: {
        color: lineAttrs.color,
        width: lineAttrs.width

        // TODO
        // dash: dash
    },

    connectgaps: scatterAttrs.connectgaps,

    marker: extendFlat({
        symbol: {
            valType: 'string',
            dflt: 'circle',
            role: 'style',
            arrayOk: true,
            description: [
                'Sets the marker symbol.',
                'Full list: https://www.mapbox.com/maki-icons/',
                'Note that the array `marker.color` and `marker.size`',
                'are only available for *circle* symbols.'
            ].join(' ')
        },
        angle: {
            valType: 'number',
            dflt: 'auto',
            role: 'style',
            arrayOk: true,
            description: [
                'Sets the marker orientation from true North, in degrees clockwise.',
                'When using the *auto* default, no rotation would be applied',
                'in perspective views which is different from using a zero angle.'
            ].join(' ')
        },
        allowoverlap: {
            valType: 'boolean',
            dflt: false,
            role: 'style',
            description: [
                'Flag to draw all symbols, even if they overlap.'
            ].join(' ')
        },
        opacity: markerAttrs.opacity,
        size: markerAttrs.size,
        sizeref: markerAttrs.sizeref,
        sizemin: markerAttrs.sizemin,
        sizemode: markerAttrs.sizemode
    },
        colorScaleAttrs('marker')
        // line
    ),

    fill: scatterGeoAttrs.fill,
    fillcolor: scatterAttrs.fillcolor,

    textfont: mapboxAttrs.layers.symbol.textfont,
    textposition: mapboxAttrs.layers.symbol.textposition,

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

    selected: {
        marker: scatterAttrs.selected.marker
    },
    unselected: {
        marker: scatterAttrs.unselected.marker
    },

    hoverinfo: extendFlat({}, baseAttrs.hoverinfo, {
        flags: ['lon', 'lat', 'text', 'name']
    }),
    hovertemplate: hovertemplateAttrs(),
}, 'calc', 'nested');
