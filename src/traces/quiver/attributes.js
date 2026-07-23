'use strict';

var baseAttrs = require('../../plots/attributes');
var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var axisHoverFormat = require('../../plots/cartesian/axis_format_attributes').axisHoverFormat;
var extendFlat = require('../../lib/extend').extendFlat;
var colorScaleAttrs = require('../../components/colorscale/attributes');
var dash = require('../../components/drawing/attributes').dash;
var annotationAttrs = require('../../components/annotations/attributes');
var scatterAttrs = require('../scatter/attributes');

var attrs = {
    x: {
        valType: 'data_array',
        editType: 'calc+clearAxisTypes',
        anim: true,
        description: 'Sets the x coordinates of the arrow locations.'
    },
    x0: scatterAttrs.x0,
    dx: scatterAttrs.dx,
    y: {
        valType: 'data_array',
        editType: 'calc+clearAxisTypes',
        anim: true,
        description: 'Sets the y coordinates of the arrow locations.'
    },
    y0: scatterAttrs.y0,
    dy: scatterAttrs.dy,
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
    anglemode: {
        valType: 'enumerated',
        values: ['paper', 'data'],
        dflt: 'axis',
        editType: 'calc',
        description: [
            'Sets the mode used to determine the angle of the arrow vectors.',
            'If *paper*, u/v are interpreted in pixel coordinates and the rendered vector angle',
            'does not change regardless of the axes scales.',
            'If *data*, u/v are interpreted in data coordinates and the rendered vector angle',
            'may change, e.g. if zooming in along a single axis'
        ].join(' ')
    },
    sizemode: {
        valType: 'enumerated',
        values: ['scaled', 'raw'],
        editType: 'calc',
        dflt: 'scaled',
        description: [
            'Determines whether arrows are drawn according to their raw lengths,',
            'or scaled based on the maximum vector length and point density. Note: When `anglemode` is *data*', 
            'arrows are alwyas scaled and `sizemode` *raw* is ignored.',
        ].join(' ')
    },
    sizeref: {
        valType: 'number',
        min: 0,
        editType: 'calc',
        dflt: 1,
        description: [
            'Adjusts the arrow size scaling. The arrow length is determined by the vector norm multiplied by `sizeref`,',
            'optionally normalized when `sizemode` is *scaled* (`sizeref` is applied after scaling).'
        ].join(' ')
    },
    anchor: {
        valType: 'enumerated',
        values: ['tip', 'tail', 'center'],
        dflt: 'tail',
        editType: 'calc',
        description: [
            'Sets the arrows\' anchor with respect to their (x,y) positions.',
            'Use *tail* to place (x,y) at the base, *tip* to place (x,y) at the head,',
            'or *center* to center the arrow on (x,y).'
        ].join(' ')
    },
    xhoverformat: axisHoverFormat('x'),
    yhoverformat: axisHoverFormat('y'),
    uhoverformat: axisHoverFormat('u', 'noDate'),
    vhoverformat: axisHoverFormat('v', 'noDate'),

    hoverinfo: extendFlat({}, baseAttrs.hoverinfo, {
        flags: ['x', 'y', 'u', 'v', 'text', 'name'],
        dflt: 'all'
    }),
    hovertemplate: hovertemplateAttrs({}, {
        keys: ['x', 'y', 'u', 'v', 'text', 'name']
    }),

    // Text and labels (shared with scatter)
    text: scatterAttrs.text,
    textposition: scatterAttrs.textposition,
    textfont: scatterAttrs.textfont,

    // Marker: color, colorscale, arrowhead sizing, and line styling for arrows
    marker: extendFlat(
        {
            arrowsize: extendFlat({}, annotationAttrs.arrowsize, {
                editType: 'calc',
                description: [
                    'Sets the size of the arrow head relative to `marker.line.width`.',
                    'A value of 1 (default) gives a head about 3x as wide as the line.'
                ].join(' ')
            }),
            line: {
                width: {
                    valType: 'number',
                    min: 0,
                    dflt: 2,
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
    selected: {
        marker: {
            color: {
                valType: 'color',
                editType: 'style',
                description: 'Sets the marker color of selected points.'
            },
            line: {
                width: {
                    valType: 'number',
                    min: 0,
                    editType: 'style',
                    description: 'Sets the line width of selected points.'
                },
                editType: 'style'
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
        marker: {
            color: {
                valType: 'color',
                editType: 'style',
                description: 'Sets the marker color of unselected points, applied only when a selection exists.'
            },
            line: {
                width: {
                    valType: 'number',
                    min: 0,
                    editType: 'style',
                    description: 'Sets the line width of unselected points, applied only when a selection exists.'
                },
                editType: 'style'
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

module.exports = attrs;
