'use strict';

var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var texttemplateAttrs = require('../../plots/template_attributes').texttemplateAttrs;
var makeFillcolorAttr = require('../scatter/fillcolor_attribute');
var scatterAttrs = require('../scatter/attributes');
var baseAttrs = require('../../plots/attributes');
var colorAttributes = require('../../components/colorscale/attributes');
var dash = require('../../components/drawing/attributes').dash;

var extendFlat = require('../../lib/extend').extendFlat;
var overrideAll = require('../../plot_api/edit_types').overrideAll;

var scatterMarkerAttrs = scatterAttrs.marker;
var scatterLineAttrs = scatterAttrs.line;
var scatterMarkerLineAttrs = scatterMarkerAttrs.line;

module.exports = overrideAll({
    lon: {
        valType: 'data_array',
        description: 'Sets the longitude coordinates (in degrees East).'
    },
    lat: {
        valType: 'data_array',
        description: 'Sets the latitude coordinates (in degrees North).'
    },

    locations: {
        valType: 'data_array',
        description: [
            'Sets the coordinates via location IDs or names.',
            'Coordinates correspond to the centroid of each location given.',
            'See `locationmode` for more info.'
        ].join(' ')
    },
    locationmode: {
        valType: 'enumerated',
        values: ['ISO-3', 'USA-states', 'country names', 'geojson-id'],
        dflt: 'ISO-3',
        description: [
            'Determines the set of locations used to match entries in `locations`',
            'to regions on the map.',
            'Values *ISO-3*, *USA-states*, *country names* correspond to features on',
            'the base map and value *geojson-id* corresponds to features from a custom',
            'GeoJSON linked to the `geojson` attribute.'
        ].join(' ')
    },

    geojson: {
        valType: 'any',
        editType: 'calc',
        description: [
            'Sets optional GeoJSON data associated with this trace.',
            'If not given, the features on the base map are used when `locations` is set.',

            'It can be set as a valid GeoJSON object or as a URL string.',
            'Note that we only accept GeoJSONs of type *FeatureCollection* or *Feature*',
            'with geometries of type *Polygon* or *MultiPolygon*.'

            // TODO add topojson support with additional 'topojsonobject' attr?
            // https://github.com/topojson/topojson-specification/blob/master/README.md
        ].join(' ')
    },
    featureidkey: {
        valType: 'string',
        editType: 'calc',
        dflt: 'id',
        description: [
            'Sets the key in GeoJSON features which is used as id to match the items',
            'included in the `locations` array.',
            'Only has an effect when `geojson` is set.',
            'Support nested property, for example *properties.name*.'
        ].join(' ')
    },

    mode: extendFlat({}, scatterAttrs.mode, {dflt: 'markers'}),

    text: extendFlat({}, scatterAttrs.text, {
        description: [
            'Sets text elements associated with each (lon,lat) pair',
            'or item in `locations`.',
            'If a single string, the same string appears over',
            'all the data points.',
            'If an array of string, the items are mapped in order to the',
            'this trace\'s (lon,lat) or `locations` coordinates.',
            'If trace `hoverinfo` contains a *text* flag and *hovertext* is not set,',
            'these elements will be seen in the hover labels.'
        ].join(' ')
    }),
    texttemplate: texttemplateAttrs({editType: 'plot'}, {
        keys: ['lat', 'lon', 'location', 'text']
    }),
    hovertext: extendFlat({}, scatterAttrs.hovertext, {
        description: [
            'Sets hover text elements associated with each (lon,lat) pair',
            'or item in `locations`.',
            'If a single string, the same string appears over',
            'all the data points.',
            'If an array of string, the items are mapped in order to the',
            'this trace\'s (lon,lat) or `locations` coordinates.',
            'To be seen, trace `hoverinfo` must contain a *text* flag.'
        ].join(' ')
    }),

    textfont: scatterAttrs.textfont,
    textposition: scatterAttrs.textposition,

    line: {
        color: scatterLineAttrs.color,
        width: scatterLineAttrs.width,
        dash: dash
    },
    connectgaps: scatterAttrs.connectgaps,

    marker: extendFlat({
        symbol: scatterMarkerAttrs.symbol,
        opacity: scatterMarkerAttrs.opacity,
        angle: scatterMarkerAttrs.angle,
        angleref: extendFlat({}, scatterMarkerAttrs.angleref, {
            values: ['previous', 'up', 'north'],
            description: [
                'Sets the reference for marker angle.',
                'With *previous*, angle 0 points along the line from the previous point to this one.',
                'With *up*, angle 0 points toward the top of the screen.',
                'With *north*, angle 0 points north based on the current map projection.',
            ].join(' ')
        }),
        standoff: scatterMarkerAttrs.standoff,
        size: scatterMarkerAttrs.size,
        sizeref: scatterMarkerAttrs.sizeref,
        sizemin: scatterMarkerAttrs.sizemin,
        sizemode: scatterMarkerAttrs.sizemode,
        colorbar: scatterMarkerAttrs.colorbar,
        line: extendFlat({
            width: scatterMarkerLineAttrs.width
        },
            colorAttributes('marker.line')
        ),
        gradient: scatterMarkerAttrs.gradient
    },
        colorAttributes('marker')
    ),

    fill: {
        valType: 'enumerated',
        values: ['none', 'toself'],
        dflt: 'none',
        description: [
            'Sets the area to fill with a solid color.',
            'Use with `fillcolor` if not *none*.',
            '*toself* connects the endpoints of the trace (or each segment',
            'of the trace if it has gaps) into a closed shape.'
        ].join(' ')
    },
    fillcolor: makeFillcolorAttr(),

    selected: scatterAttrs.selected,
    unselected: scatterAttrs.unselected,

    hoverinfo: extendFlat({}, baseAttrs.hoverinfo, {
        flags: ['lon', 'lat', 'location', 'text', 'name']
    }),
    hovertemplate: hovertemplateAttrs(),
}, 'calc', 'nested');
