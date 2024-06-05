'use strict';

var colorScaleAttrs = require('../../components/colorscale/attributes');
var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var baseAttrs = require('../../plots/attributes');
var scatterMapLibreAttrs = require('../scattermaplibre/attributes');

var extendFlat = require('../../lib/extend').extendFlat;


/*
 *
 * In mathematical terms, MapLibre GL heatmaps are a bivariate (2D) kernel density
 * estimation with a Gaussian kernel. It means that each data point has an area
 * of “influence” around it (called a kernel) where the numerical value of
 * influence (which we call density) decreases as you go further from the point.
 * If we sum density values of all points in every pixel of the screen, we get a
 * combined density value which we then map to a heatmap color.
 *
 */

module.exports = extendFlat({
    lon: scatterMapLibreAttrs.lon,
    lat: scatterMapLibreAttrs.lat,

    z: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Sets the points\' weight.',
            'For example, a value of 10 would be equivalent to having 10 points of weight 1',
            'in the same spot'
        ].join(' ')
    },

    radius: {
        valType: 'number',
        editType: 'plot',
        arrayOk: true,
        min: 1,
        dflt: 30,
        description: [
            'Sets the radius of influence of one `lon` / `lat` point in pixels.',
            'Increasing the value makes the densitymaplibre trace smoother, but less detailed.'
        ].join(' ')
    },

    below: {
        valType: 'string',
        editType: 'plot',
        description: [
            'Determines if the densitymaplibre trace will be inserted',
            'before the layer with the specified ID.',
            'By default, densitymaplibre traces are placed below the first',
            'layer of type symbol',
            'If set to \'\',',
            'the layer will be inserted above every existing layer.'
        ].join(' ')
    },

    text: scatterMapLibreAttrs.text,
    hovertext: scatterMapLibreAttrs.hovertext,

    hoverinfo: extendFlat({}, baseAttrs.hoverinfo, {
        flags: ['lon', 'lat', 'z', 'text', 'name']
    }),
    hovertemplate: hovertemplateAttrs(),
    showlegend: extendFlat({}, baseAttrs.showlegend, {dflt: false})
},
    colorScaleAttrs('', {
        cLetter: 'z',
        editTypeOverride: 'calc'
    })
);
