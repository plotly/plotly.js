'use strict';

var baseAttrs = require('../../plots/attributes');
var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var fontAttrs = require('../../plots/font_attributes');
var axisHoverFormat = require('../../plots/cartesian/axis_format_attributes').axisHoverFormat;
var extendFlat = require('../../lib/extend').extendFlat;
var colorScaleAttrs = require('../../components/colorscale/attributes');
var dash = require('../../components/drawing/attributes').dash;

var attrs = {
    x: {
        valType: 'data_array',
        editType: 'calc+clearAxisTypes',
        anim: true,
        description: 'Sets the x coordinates of the arrow locations.'
    },
    y: {
        valType: 'data_array',
        editType: 'calc+clearAxisTypes',
        anim: true,
        description: 'Sets the y coordinates of the arrow locations.'
    },
    u: {
        valType: 'data_array',
        editType: 'calc',
        anim: true,
        description: 'Sets the x components of the arrow vectors.'
    },
    v: {
        valType: 'data_array',
        editType: 'calc',
        anim: true,
        description: 'Sets the y components of the arrow vectors.'
    },
    sizemode: {
        valType: 'enumerated',
        values: ['scaled', 'absolute', 'raw'],
        editType: 'calc',
        dflt: 'scaled',
        description: [
            'Determines whether `sizeref` is set as a *scaled* (unitless) scalar',
            '(normalized by the max u/v norm in the vector field), as an *absolute*',
            'value (in the same units as the vector field), or *raw* to use the',
            'raw vector lengths.'
        ].join(' ')
    },
    sizeref: {
        valType: 'number',
        min: 0,
        editType: 'calc',
        description: [
            'Adjusts the arrow size scaling.',
            'The arrow length is determined by the vector norm multiplied by `sizeref`,',
            'optionally normalized when `sizemode` is *scaled*.'
        ].join(' ')
    },
    anchor: {
        valType: 'enumerated',
        values: ['tip', 'tail', 'cm', 'center', 'middle'],
        dflt: 'tail',
        editType: 'calc',
        description: [
            'Sets the arrows\' anchor with respect to their (x,y) positions.',
            'Use *tail* to place (x,y) at the base, *tip* to place (x,y) at the head,',
            'or *cm*/*center*/*middle* to center the arrow on (x,y).'
        ].join(' ')
    },
    hoverdistance: {
        valType: 'number',
        min: -1,
        dflt: 20,
        editType: 'calc',
        description: 'Maximum distance (in pixels) to look for nearby arrows on hover.'
    },

    xhoverformat: axisHoverFormat('x'),
    yhoverformat: axisHoverFormat('y'),
    uhoverformat: axisHoverFormat('u', 'noDate'),
    vhoverformat: axisHoverFormat('v', 'noDate'),

    // Arrowhead sizing, consistent with annotations API naming
    arrowsize: {
        valType: 'number',
        min: 0.3,
        dflt: 1,
        editType: 'calc',
        description: [
            'Scales the size of the arrow head relative to a base size.',
            'Higher values produce larger heads.'
        ].join(' ')
    },
    // Back-compat alias
    arrow_scale: {
        valType: 'number',
        min: 0,
        max: 1,
        editType: 'calc',
        description: 'Deprecated alias for `arrowsize`-based sizing. Prefer using `arrowsize`.'
    },

    // Text and labels
    text: {
        valType: 'data_array',
        editType: 'calc',
        anim: true,
        description: 'Sets text elements associated with each (x,y) pair.'
    },
    textposition: {
        valType: 'enumerated',
        values: [
            'top left', 'top center', 'top right',
            'middle left', 'middle center', 'middle right',
            'bottom left', 'bottom center', 'bottom right'
        ],
        dflt: 'middle center',
        editType: 'calc',
        description: 'Sets the positions of the `text` elements with respects to the (x,y) coordinates.'
    },
    // Text font
    textfont: fontAttrs({
        editType: 'calc',
        colorEditType: 'style',
        arrayOk: true,
        description: 'Sets the text font.'
    }),

    // Marker: color, colorscale, and line styling for arrows
    marker: extendFlat(
        {
            line: {
                width: {
                    valType: 'number',
                    min: 0,
                    dflt: 1,
                    editType: 'style',
                    description: 'Sets the width (in px) of the arrow lines.'
                },
                dash: dash,
                editType: 'style'
            },
            editType: 'calc'
        },
        colorScaleAttrs('marker', {
            showScaleDflt: true,
            editTypeOverride: 'calc'
        })
    ),

    // Selection and styling
    selected: {
        line: {
            color: {
                valType: 'color',
                editType: 'style',
                description: 'Sets the line color of selected points.'
            },
            width: {
                valType: 'number',
                min: 0,
                editType: 'style',
                description: 'Sets the line width of selected points.'
            },
            editType: 'style'
        },
        textfont: {
            color: {
                valType: 'color',
                editType: 'style',
                description: 'Sets the text font color of selected points, applied only when a selection exists.'
            },
            editType: 'style'
        },
        editType: 'style'
    },
    unselected: {
        line: {
            color: {
                valType: 'color',
                editType: 'style',
                description: 'Sets the line color of unselected points.'
            },
            width: {
                valType: 'number',
                min: 0,
                editType: 'style',
                description: 'Sets the line width of unselected points.'
            },
            editType: 'style'
        },
        textfont: {
            color: {
                valType: 'color',
                editType: 'style',
                description: 'Sets the text font color of unselected points, applied only when a selection exists.'
            },
            editType: 'style'
        },
        editType: 'style'
    }
};

// Extend with base attributes (includes hoverinfo, etc.)
extendFlat(attrs, baseAttrs);

// Add hoverinfo with proper flags for quiver
// We need to create a new object to avoid mutating the shared base attributes
attrs.hoverinfo = extendFlat({}, baseAttrs.hoverinfo, {
    flags: ['x', 'y', 'u', 'v', 'text', 'name'],
    dflt: 'all'
});

// Add hovertemplate
attrs.hovertemplate = extendFlat({}, hovertemplateAttrs({}, {
    keys: ['x', 'y', 'u', 'v', 'text', 'name']
}));

module.exports = attrs;
