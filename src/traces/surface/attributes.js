'use strict';

var Color = require('../../components/color');
var colorScaleAttrs = require('../../components/colorscale/attributes');
var axisHoverFormat = require('../../plots/cartesian/axis_format_attributes').axisHoverFormat;
var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var baseAttrs = require('../../plots/attributes');

var extendFlat = require('../../lib/extend').extendFlat;
var overrideAll = require('../../plot_api/edit_types').overrideAll;

function makeContourProjAttr(axLetter) {
    return {
        valType: 'boolean',
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
            dflt: false,
            description: [
                'Determines whether or not contour lines about the', axLetter,
                'dimension are drawn.'
            ].join(' ')
        },
        start: {
            valType: 'number',
            dflt: null,
            editType: 'plot',
         // impliedEdits: {'^autocontour': false},
            description: [
                'Sets the starting contour level value.',
                'Must be less than `contours.end`'
            ].join(' ')
        },
        end: {
            valType: 'number',
            dflt: null,
            editType: 'plot',
         // impliedEdits: {'^autocontour': false},
            description: [
                'Sets the end contour level value.',
                'Must be more than `contours.start`'
            ].join(' ')
        },
        size: {
            valType: 'number',
            dflt: null,
            min: 0,
            editType: 'plot',
         // impliedEdits: {'^autocontour': false},
            description: [
                'Sets the step between each contour level.',
                'Must be positive.'
            ].join(' ')
        },
        project: {
            x: makeContourProjAttr('x'),
            y: makeContourProjAttr('y'),
            z: makeContourProjAttr('z')
        },
        color: {
            valType: 'color',
            dflt: Color.defaultLine,
            description: 'Sets the color of the contour lines.'
        },
        usecolormap: {
            valType: 'boolean',
            dflt: false,
            description: [
                'An alternate to *color*.',
                'Determines whether or not the contour lines are colored using',
                'the trace *colorscale*.'
            ].join(' ')
        },
        width: {
            valType: 'number',
            min: 1,
            max: 16,
            dflt: 2,
            description: 'Sets the width of the contour lines.'
        },
        highlight: {
            valType: 'boolean',
            dflt: true,
            description: [
                'Determines whether or not contour lines about the', axLetter,
                'dimension are highlighted on hover.'
            ].join(' ')
        },
        highlightcolor: {
            valType: 'color',
            dflt: Color.defaultLine,
            description: 'Sets the color of the highlighted contour lines.'
        },
        highlightwidth: {
            valType: 'number',
            min: 1,
            max: 16,
            dflt: 2,
            description: 'Sets the width of the highlighted contour lines.'
        }
    };
}

var attrs = module.exports = overrideAll(extendFlat({
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
        valType: 'string',
        dflt: '',
        arrayOk: true,
        description: [
            'Sets the text elements associated with each z value.',
            'If trace `hoverinfo` contains a *text* flag and *hovertext* is not set,',
            'these elements will be seen in the hover labels.'
        ].join(' ')
    },
    hovertext: {
        valType: 'string',
        dflt: '',
        arrayOk: true,
        description: 'Same as `text`.'
    },
    hovertemplate: hovertemplateAttrs(),

    xhoverformat: axisHoverFormat('x'),
    yhoverformat: axisHoverFormat('y'),
    zhoverformat: axisHoverFormat('z'),

    connectgaps: {
        valType: 'boolean',
        dflt: false,
        editType: 'calc',
        description: [
            'Determines whether or not gaps',
            '(i.e. {nan} or missing values)',
            'in the `z` data are filled in.'
        ].join(' ')
    },

    surfacecolor: {
        valType: 'data_array',
        description: [
            'Sets the surface color values,',
            'used for setting a color scale independent of `z`.'
        ].join(' ')
    },
},

colorScaleAttrs('', {
    colorAttr: 'z or surfacecolor',
    showScaleDflt: true,
    autoColorDflt: false,
    editTypeOverride: 'calc'
}), {
    contours: {
        x: makeContourAttr('x'),
        y: makeContourAttr('y'),
        z: makeContourAttr('z')
    },
    hidesurface: {
        valType: 'boolean',
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
            min: -1e5,
            max: 1e5,
            dflt: 10,
            description: 'Numeric vector, representing the X coordinate for each vertex.'
        },
        y: {
            valType: 'number',
            min: -1e5,
            max: 1e5,
            dflt: 1e4,
            description: 'Numeric vector, representing the Y coordinate for each vertex.'
        },
        z: {
            valType: 'number',
            min: -1e5,
            max: 1e5,
            dflt: 0,
            description: 'Numeric vector, representing the Z coordinate for each vertex.'
        }
    },

    lighting: {
        ambient: {
            valType: 'number',
            min: 0.00,
            max: 1.0,
            dflt: 0.8,
            description: 'Ambient light increases overall color visibility but can wash out the image.'
        },
        diffuse: {
            valType: 'number',
            min: 0.00,
            max: 1.00,
            dflt: 0.8,
            description: 'Represents the extent that incident rays are reflected in a range of angles.'
        },
        specular: {
            valType: 'number',
            min: 0.00,
            max: 2.00,
            dflt: 0.05,
            description: 'Represents the level that incident rays are reflected in a single direction, causing shine.'
        },
        roughness: {
            valType: 'number',
            min: 0.00,
            max: 1.00,
            dflt: 0.5,
            description: 'Alters specular reflection; the rougher the surface, the wider and less contrasty the shine.'
        },
        fresnel: {
            valType: 'number',
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
        min: 0,
        max: 1,
        dflt: 1,
        description: [
            'Sets the opacity of the surface.',
            'Please note that in the case of using high `opacity` values for example a value',
            'greater than or equal to 0.5 on two surfaces (and 0.25 with four surfaces), an',
            'overlay of multiple transparent surfaces may not perfectly be sorted in depth by the',
            'webgl API. This behavior may be improved in the near future and is subject to change.'
        ].join(' ')
    },

    opacityscale: {
        valType: 'any',
        editType: 'calc',
        description: [
            'Sets the opacityscale.',
            'The opacityscale must be an array containing',
            'arrays mapping a normalized value to an opacity value.',
            'At minimum, a mapping for the lowest (0) and highest (1)',
            'values are required. For example,',
            '`[[0, 1], [0.5, 0.2], [1, 1]]` means that higher/lower values would have',
            'higher opacity values and those in the middle would be more transparent',
            'Alternatively, `opacityscale` may be a palette name string',
            'of the following list: \'min\', \'max\', \'extremes\' and \'uniform\'.',
            'The default is \'uniform\'.'
        ].join(' ')
    },

    _deprecated: {
        zauto: extendFlat({}, colorScaleAttrs.zauto, {
            description: 'Obsolete. Use `cauto` instead.'
        }),
        zmin: extendFlat({}, colorScaleAttrs.zmin, {
            description: 'Obsolete. Use `cmin` instead.'
        }),
        zmax: extendFlat({}, colorScaleAttrs.zmax, {
            description: 'Obsolete. Use `cmax` instead.'
        })
    },

    hoverinfo: extendFlat({}, baseAttrs.hoverinfo),
    showlegend: extendFlat({}, baseAttrs.showlegend, {dflt: false}),
}), 'calc', 'nested');

attrs.x.editType = attrs.y.editType = attrs.z.editType = 'calc+clearAxisTypes';
attrs.transforms = undefined;
