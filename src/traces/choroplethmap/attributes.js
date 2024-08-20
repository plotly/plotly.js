'use strict';

var choroplethAttrs = require('../choropleth/attributes');
var colorScaleAttrs = require('../../components/colorscale/attributes');
var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var baseAttrs = require('../../plots/attributes');
var extendFlat = require('../../lib/extend').extendFlat;

module.exports = extendFlat({
    locations: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Sets which features found in *geojson* to plot using',
            'their feature `id` field.'
        ].join(' ')
    },

    // TODO
    // Maybe start with only one value (that we could name e.g. 'geojson-id'),
    // but eventually:
    // - we could also support for our own dist/topojson/*
    //   .. and locationmode: choroplethAttrs.locationmode,

    z: {
        valType: 'data_array',
        editType: 'calc',
        description: 'Sets the color values.'
    },

    // TODO maybe we could also set a "key" to dig out values out of the
    // GeoJSON feature `properties` fields?

    geojson: {
        valType: 'any',
        editType: 'calc',
        description: [
            'Sets the GeoJSON data associated with this trace.',

            'It can be set as a valid GeoJSON object or as a URL string.',
            'Note that we only accept GeoJSONs of type *FeatureCollection* or *Feature*',
            'with geometries of type *Polygon* or *MultiPolygon*.'
        ].join(' ')
    },
    featureidkey: extendFlat({}, choroplethAttrs.featureidkey, {
        description: [
            'Sets the key in GeoJSON features which is used as id to match the items',
            'included in the `locations` array.',
            'Support nested property, for example *properties.name*.'
        ].join(' ')
    }),

    // TODO agree on name / behaviour
    //
    // 'below' is used currently for layout.map.layers,
    // even though it's not very plotly-esque.
    //
    // Note also, that the map-gl style don't all have the same layers,
    // see https://codepen.io/etpinard/pen/ydVMwM for full list
    below: {
        valType: 'string',
        editType: 'plot',
        description: [
            'Determines if the choropleth polygons will be inserted',
            'before the layer with the specified ID.',
            'By default, choroplethmap traces are placed above the water layers.',
            'If set to \'\',',
            'the layer will be inserted above every existing layer.'
        ].join(' ')
    },

    text: choroplethAttrs.text,
    hovertext: choroplethAttrs.hovertext,

    marker: {
        line: {
            color: extendFlat({}, choroplethAttrs.marker.line.color, {editType: 'plot'}),
            width: extendFlat({}, choroplethAttrs.marker.line.width, {editType: 'plot'}),
            editType: 'calc'
        },
        // TODO maybe having a dflt less than 1, together with `below:''` would be better?
        opacity: extendFlat({}, choroplethAttrs.marker.opacity, {editType: 'plot'}),
        editType: 'calc'
    },

    selected: {
        marker: {
            opacity: extendFlat({}, choroplethAttrs.selected.marker.opacity, {editType: 'plot'}),
            editType: 'plot'
        },
        editType: 'plot'
    },
    unselected: {
        marker: {
            opacity: extendFlat({}, choroplethAttrs.unselected.marker.opacity, {editType: 'plot'}),
            editType: 'plot'
        },
        editType: 'plot'
    },

    hoverinfo: choroplethAttrs.hoverinfo,
    hovertemplate: hovertemplateAttrs({}, {keys: ['properties']}),
    showlegend: extendFlat({}, baseAttrs.showlegend, {dflt: false})
},

    colorScaleAttrs('', {
        cLetter: 'z',
        editTypeOverride: 'calc'
    })
);
