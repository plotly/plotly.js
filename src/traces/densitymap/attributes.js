'use strict';

var colorScaleAttrs = require('../../components/colorscale/attributes');
const { hovertemplateAttrs, templatefallbackAttrs } = require('../../plots/template_attributes');
var baseAttrs = require('../../plots/attributes');
var scatterMapAttrs = require('../scattermap/attributes');

var extendFlat = require('../../lib/extend').extendFlat;

/*
 * - https://docs.map.com/help/tutorials/make-a-heatmap-with-mapbox-gl-js/
 * - https://docs.mapbox.com/mapbox-gl-js/example/heatmap-layer/
 * - https://docs.mapbox.com/mapbox-gl-js/style-spec/#layers-heatmap
 * - https://blog.map.com/introducing-heatmaps-in-mapbox-gl-js-71355ada9e6c
 *
 * Gotchas:
 * - https://github.com/mapbox/mapbox-gl-js/issues/6463
 * - https://github.com/mapbox/mapbox-gl-js/issues/6112
 */

/*
 *
 * In mathematical terms, Map GL heatmaps are a bivariate (2D) kernel density
 * estimation with a Gaussian kernel. It means that each data point has an area
 * of “influence” around it (called a kernel) where the numerical value of
 * influence (which we call density) decreases as you go further from the point.
 * If we sum density values of all points in every pixel of the screen, we get a
 * combined density value which we then map to a heatmap color.
 *
 */

module.exports = extendFlat(
    {
        lon: scatterMapAttrs.lon,
        lat: scatterMapAttrs.lat,

        z: {
            valType: 'data_array',
            editType: 'calc',
            description: [
                "Sets the points' weight.",
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
                'Increasing the value makes the densitymap trace smoother, but less detailed.'
            ].join(' ')
        },

        below: {
            valType: 'string',
            editType: 'plot',
            description: [
                'Determines if the densitymap trace will be inserted',
                'before the layer with the specified ID.',
                'By default, densitymap traces are placed below the first',
                'layer of type symbol',
                "If set to '',",
                'the layer will be inserted above every existing layer.'
            ].join(' ')
        },

        text: scatterMapAttrs.text,
        hovertext: scatterMapAttrs.hovertext,

        hoverinfo: extendFlat({}, baseAttrs.hoverinfo, {
            flags: ['lon', 'lat', 'z', 'text', 'name']
        }),
        hovertemplate: hovertemplateAttrs(),
        hovertemplatefallback: templatefallbackAttrs(),
        showlegend: extendFlat({}, baseAttrs.showlegend, { dflt: false })
    },
    colorScaleAttrs('', {
        cLetter: 'z',
        editTypeOverride: 'calc'
    })
);
