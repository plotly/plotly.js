/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Color = require('../../components/color');
var colorscaleAttrs = require('../../components/colorscale/attributes');
var colorbarAttrs = require('../../components/colorbar/attributes');

var extendFlat = require('../../lib/extend').extendFlat;

function makeContourProjAttr(axLetter) {
    return {
        valType: 'boolean',
        role: 'info',
        dflt: false,
        description: [
            'Determines whether or not these contour lines are projected',
            'on the', axLetter, 'plane.',
            'If `highlight` is set to *true* (the default), the projected',
            'lines are shown on hover.',
            'If `show` is set to *true*, the projected lines are shown',
            'in permanence.'
        ].join(' ')
    };
}

function makeContourAttr(axLetter) {
    return {
        show: {
            valType: 'boolean',
            role: 'info',
            dflt: false,
            description: [
                'Determines whether or not contour lines about the', axLetter,
                'dimension are drawn.'
            ].join(' ')
        },
        project: {
            x: makeContourProjAttr('x'),
            y: makeContourProjAttr('y'),
            z: makeContourProjAttr('z')
        },
        color: {
            valType: 'color',
            role: 'style',
            dflt: Color.defaultLine,
            description: 'Sets the color of the contour lines.'
        },
        usecolormap: {
            valType: 'boolean',
            role: 'info',
            dflt: false,
            description: [
                'An alternate to *color*.',
                'Determines whether or not the contour lines are colored using',
                'the trace *colorscale*.'
            ].join(' ')
        },
        width: {
            valType: 'number',
            role: 'style',
            min: 1,
            max: 16,
            dflt: 2,
            description: 'Sets the width of the contour lines.'
        },
        highlight: {
            valType: 'boolean',
            role: 'info',
            dflt: true,
            description: [
                'Determines whether or not contour lines about the', axLetter,
                'dimension are highlighted on hover.'
            ].join(' ')
        },
        highlightcolor: {
            valType: 'color',
            role: 'style',
            dflt: Color.defaultLine,
            description: 'Sets the color of the highlighted contour lines.'
        },
        highlightwidth: {
            valType: 'number',
            role: 'style',
            min: 1,
            max: 16,
            dflt: 2,
            description: 'Sets the width of the highlighted contour lines.'
        }
    };
}

module.exports = {
    z: {
        valType: 'data_array',
        description: 'Sets the z coordinates.'
    },
    x: {
        valType: 'data_array',
        description: 'Sets the x coordinates.'
    },
    y: {
        valType: 'data_array',
        description: 'Sets the y coordinates.'
    },

    text: {
        valType: 'data_array',
        description: 'Sets the text elements associated with each z value.'
    },
    surfacecolor: {
        valType: 'data_array',
        description: [
            'Sets the surface color values,',
            'used for setting a color scale independent of `z`.'
        ].join(' ')
    },

    // Todo this block has a structure of colorscale/attributes.js but with colorscale/color_attributes.js names
    cauto: colorscaleAttrs.zauto,
    cmin: colorscaleAttrs.zmin,
    cmax: colorscaleAttrs.zmax,
    colorscale: colorscaleAttrs.colorscale,
    autocolorscale: extendFlat({}, colorscaleAttrs.autocolorscale,
        {dflt: false}),
    reversescale: colorscaleAttrs.reversescale,
    showscale: colorscaleAttrs.showscale,
    colorbar: colorbarAttrs,

    contours: {
        x: makeContourAttr('x'),
        y: makeContourAttr('y'),
        z: makeContourAttr('z')
    },
    hidesurface: {
        valType: 'boolean',
        role: 'info',
        dflt: false,
        description: [
            'Determines whether or not a surface is drawn.',
            'For example, set `hidesurface` to *false*',
            '`contours.x.show` to *true* and',
            '`contours.y.show` to *true* to draw a wire frame plot.'
        ].join(' ')
    },

    lightposition: {
        x: {
            valType: 'number',
            role: 'style',
            min: -1e5,
            max: 1e5,
            dflt: 10,
            description: 'Numeric vector, representing the X coordinate for each vertex.'
        },
        y: {
            valType: 'number',
            role: 'style',
            min: -1e5,
            max: 1e5,
            dflt: 1e4,
            description: 'Numeric vector, representing the Y coordinate for each vertex.'
        },
        z: {
            valType: 'number',
            role: 'style',
            min: -1e5,
            max: 1e5,
            dflt: 0,
            description: 'Numeric vector, representing the Z coordinate for each vertex.'
        }
    },

    lighting: {
        ambient: {
            valType: 'number',
            role: 'style',
            min: 0.00,
            max: 1.0,
            dflt: 0.8,
            description: 'Ambient light increases overall color visibility but can wash out the image.'
        },
        diffuse: {
            valType: 'number',
            role: 'style',
            min: 0.00,
            max: 1.00,
            dflt: 0.8,
            description: 'Represents the extent that incident rays are reflected in a range of angles.'
        },
        specular: {
            valType: 'number',
            role: 'style',
            min: 0.00,
            max: 2.00,
            dflt: 0.05,
            description: 'Represents the level that incident rays are reflected in a single direction, causing shine.'
        },
        roughness: {
            valType: 'number',
            role: 'style',
            min: 0.00,
            max: 1.00,
            dflt: 0.5,
            description: 'Alters specular reflection; the rougher the surface, the wider and less contrasty the shine.'
        },
        fresnel: {
            valType: 'number',
            role: 'style',
            min: 0.00,
            max: 5.00,
            dflt: 0.2,
            description: [
                'Represents the reflectance as a dependency of the viewing angle; e.g. paper is reflective',
                'when viewing it from the edge of the paper (almost 90 degrees), causing shine.'
            ].join(' ')
        }
    },

    opacity: {
        valType: 'number',
        role: 'style',
        min: 0,
        max: 1,
        dflt: 1,
        description: 'Sets the opacity of the surface.'
    },

    _deprecated: {
        zauto: extendFlat({}, colorscaleAttrs.zauto, {
            description: 'Obsolete. Use `cauto` instead.'
        }),
        zmin: extendFlat({}, colorscaleAttrs.zmin, {
            description: 'Obsolete. Use `cmin` instead.'
        }),
        zmax: extendFlat({}, colorscaleAttrs.zmax, {
            description: 'Obsolete. Use `cmax` instead.'
        })
    }
};
