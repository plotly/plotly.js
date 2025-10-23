'use strict';

var baseAttrs = require('../../plots/attributes');
var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var fontAttrs = require('../../plots/font_attributes');
var dash = require('../../components/drawing/attributes').dash;

var extendFlat = require('../../lib/extend').extendFlat;

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
    scale: {
        valType: 'number',
        dflt: 0.1,
        min: 0,
        max: 1,
        editType: 'calc',
        description: 'Scales size of the arrows (ideally to avoid overlap). Default = 0.1'
    },
    arrow_scale: {
        valType: 'number',
        dflt: 0.3,
        min: 0,
        max: 1,
        editType: 'calc',
        description: 'Value multiplied to length of barb to get length of arrowhead. Default = 0.3'
    },
    angle: {
        valType: 'number',
        dflt: Math.PI / 9,
        min: 0,
        max: Math.PI / 2,
        editType: 'calc',
        description: 'Angle of arrowhead in radians. Default = π/9'
    },
    scaleratio: {
        valType: 'number',
        min: 0,
        editType: 'calc',
        description: 'The ratio between the scale of the y-axis and the scale of the x-axis (scale_y / scale_x). Default = null, the scale ratio is not fixed.'
    },
    hoverdistance: {
        valType: 'number',
        min: -1,
        dflt: 20,
        editType: 'calc',
        description: 'Maximum distance (in pixels) to look for nearby arrows on hover.'
    },

    // Line styling for arrows
    line: {
        color: {
            valType: 'color',
            dflt: '#000',
            editType: 'style',
            description: 'Sets the color of the arrow lines.'
        },
        width: {
            valType: 'number',
            min: 0,
            dflt: 1,
            editType: 'style',
            description: 'Sets the width (in px) of the arrow lines.'
        },
        dash: dash,
        shape: {
            valType: 'enumerated',
            values: ['linear', 'spline', 'hv', 'vh', 'hvh', 'vhv'],
            dflt: 'linear',
            editType: 'plot',
            description: 'Determines the line shape.'
        },
        smoothing: {
            valType: 'number',
            min: 0,
            max: 1.3,
            dflt: 1,
            editType: 'plot',
            description: 'Has an effect only if `shape` is set to *spline*. Sets the amount of smoothing.'
        },
        simplify: {
            valType: 'boolean',
            dflt: true,
            editType: 'plot',
            description: 'Simplifies lines by removing nearly-overlapping points.'
        },
        editType: 'style'
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