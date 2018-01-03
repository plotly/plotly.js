/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var colorAttributes = require('../../components/colorscale/color_attributes');
var errorBarAttrs = require('../../components/errorbars/attributes');
var colorbarAttrs = require('../../components/colorbar/attributes');
var fontAttrs = require('../../plots/font_attributes');
var dash = require('../../components/drawing/attributes').dash;

var Drawing = require('../../components/drawing');
var constants = require('./constants');
var extendFlat = require('../../lib/extend').extendFlat;

module.exports = {
    x: {
        valType: 'data_array',
        editType: 'calc+clearAxisTypes',
        description: 'Sets the x coordinates.'
    },
    x0: {
        valType: 'any',
        dflt: 0,
        role: 'info',
        editType: 'calc+clearAxisTypes',
        description: [
            'Alternate to `x`.',
            'Builds a linear space of x coordinates.',
            'Use with `dx`',
            'where `x0` is the starting coordinate and `dx` the step.'
        ].join(' ')
    },
    dx: {
        valType: 'number',
        dflt: 1,
        role: 'info',
        editType: 'calc',
        description: [
            'Sets the x coordinate step.',
            'See `x0` for more info.'
        ].join(' ')
    },
    y: {
        valType: 'data_array',
        editType: 'calc+clearAxisTypes',
        description: 'Sets the y coordinates.'
    },
    y0: {
        valType: 'any',
        dflt: 0,
        role: 'info',
        editType: 'calc+clearAxisTypes',
        description: [
            'Alternate to `y`.',
            'Builds a linear space of y coordinates.',
            'Use with `dy`',
            'where `y0` is the starting coordinate and `dy` the step.'
        ].join(' ')
    },
    dy: {
        valType: 'number',
        dflt: 1,
        role: 'info',
        editType: 'calc',
        description: [
            'Sets the y coordinate step.',
            'See `y0` for more info.'
        ].join(' ')
    },
    text: {
        valType: 'string',
        role: 'info',
        dflt: '',
        arrayOk: true,
        editType: 'calc',
        description: [
            'Sets text elements associated with each (x,y) pair.',
            'If a single string, the same string appears over',
            'all the data points.',
            'If an array of string, the items are mapped in order to the',
            'this trace\'s (x,y) coordinates.',
            'If trace `hoverinfo` contains a *text* flag and *hovertext* is not set,',
            'these elements will be seen in the hover labels.'
        ].join(' ')
    },
    hovertext: {
        valType: 'string',
        role: 'info',
        dflt: '',
        arrayOk: true,
        editType: 'style',
        description: [
            'Sets hover text elements associated with each (x,y) pair.',
            'If a single string, the same string appears over',
            'all the data points.',
            'If an array of string, the items are mapped in order to the',
            'this trace\'s (x,y) coordinates.',
            'To be seen, trace `hoverinfo` must contain a *text* flag.'
        ].join(' ')
    },
    mode: {
        valType: 'flaglist',
        flags: ['lines', 'markers', 'text'],
        extras: ['none'],
        role: 'info',
        editType: 'calc',
        description: [
            'Determines the drawing mode for this scatter trace.',
            'If the provided `mode` includes *text* then the `text` elements',
            'appear at the coordinates. Otherwise, the `text` elements',
            'appear on hover.',
            'If there are less than ' + constants.PTS_LINESONLY + ' points,',
            'then the default is *lines+markers*. Otherwise, *lines*.'
        ].join(' ')
    },
    hoveron: {
        valType: 'flaglist',
        flags: ['points', 'fills'],
        role: 'info',
        editType: 'style',
        description: [
            'Do the hover effects highlight individual points (markers or',
            'line points) or do they highlight filled regions?',
            'If the fill is *toself* or *tonext* and there are no markers',
            'or text, then the default is *fills*, otherwise it is *points*.'
        ].join(' ')
    },
    line: {
        color: {
            valType: 'color',
            role: 'style',
            editType: 'style',
            description: 'Sets the line color.'
        },
        width: {
            valType: 'number',
            min: 0,
            dflt: 2,
            role: 'style',
            editType: 'style',
            description: 'Sets the line width (in px).'
        },
        shape: {
            valType: 'enumerated',
            values: ['linear', 'spline', 'hv', 'vh', 'hvh', 'vhv'],
            dflt: 'linear',
            role: 'style',
            editType: 'plot',
            description: [
                'Determines the line shape.',
                'With *spline* the lines are drawn using spline interpolation.',
                'The other available values correspond to step-wise line shapes.'
            ].join(' ')
        },
        smoothing: {
            valType: 'number',
            min: 0,
            max: 1.3,
            dflt: 1,
            role: 'style',
            editType: 'plot',
            description: [
                'Has an effect only if `shape` is set to *spline*',
                'Sets the amount of smoothing.',
                '*0* corresponds to no smoothing (equivalent to a *linear* shape).'
            ].join(' ')
        },
        dash: extendFlat({}, dash, {editType: 'style'}),
        simplify: {
            valType: 'boolean',
            dflt: true,
            role: 'info',
            editType: 'plot',
            description: [
                'Simplifies lines by removing nearly-collinear points. When transitioning',
                'lines, it may be desirable to disable this so that the number of points',
                'along the resulting SVG path is unaffected.'
            ].join(' ')
        },
        editType: 'plot'
    },

    connectgaps: {
        valType: 'boolean',
        dflt: false,
        role: 'info',
        editType: 'calc',
        description: [
            'Determines whether or not gaps',
            '(i.e. {nan} or missing values)',
            'in the provided data arrays are connected.'
        ].join(' ')
    },
    cliponaxis: {
        valType: 'boolean',
        dflt: true,
        role: 'info',
        editType: 'plot',
        description: [
            'Determines whether or not markers and text nodes',
            'are clipped about the subplot axes.',
            'To show markers and text nodes above axis lines and tick labels,',
            'make sure to set `xaxis.layer` and `yaxis.layer` to *below traces*.'
        ].join(' ')
    },

    fill: {
        valType: 'enumerated',
        values: ['none', 'tozeroy', 'tozerox', 'tonexty', 'tonextx', 'toself', 'tonext'],
        dflt: 'none',
        role: 'style',
        editType: 'calc',
        description: [
            'Sets the area to fill with a solid color.',
            'Use with `fillcolor` if not *none*.',
            '*tozerox* and *tozeroy* fill to x=0 and y=0 respectively.',
            '*tonextx* and *tonexty* fill between the endpoints of this',
            'trace and the endpoints of the trace before it, connecting those',
            'endpoints with straight lines (to make a stacked area graph);',
            'if there is no trace before it, they behave like *tozerox* and',
            '*tozeroy*.',
            '*toself* connects the endpoints of the trace (or each segment',
            'of the trace if it has gaps) into a closed shape.',
            '*tonext* fills the space between two traces if one completely',
            'encloses the other (eg consecutive contour lines), and behaves like',
            '*toself* if there is no trace before it. *tonext* should not be',
            'used if one trace does not enclose the other.'
        ].join(' ')
    },
    fillcolor: {
        valType: 'color',
        role: 'style',
        editType: 'style',
        description: [
            'Sets the fill color.',
            'Defaults to a half-transparent variant of the line color,',
            'marker color, or marker line color, whichever is available.'
        ].join(' ')
    },
    marker: extendFlat({
        symbol: {
            valType: 'enumerated',
            values: Drawing.symbolList,
            dflt: 'circle',
            arrayOk: true,
            role: 'style',
            editType: 'style',
            description: [
                'Sets the marker symbol type.',
                'Adding 100 is equivalent to appending *-open* to a symbol name.',
                'Adding 200 is equivalent to appending *-dot* to a symbol name.',
                'Adding 300 is equivalent to appending *-open-dot*',
                'or *dot-open* to a symbol name.'
            ].join(' ')
        },
        opacity: {
            valType: 'number',
            min: 0,
            max: 1,
            arrayOk: true,
            role: 'style',
            editType: 'style',
            description: 'Sets the marker opacity.'
        },
        size: {
            valType: 'number',
            min: 0,
            dflt: 6,
            arrayOk: true,
            role: 'style',
            editType: 'calcIfAutorange',
            description: 'Sets the marker size (in px).'
        },
        maxdisplayed: {
            valType: 'number',
            min: 0,
            dflt: 0,
            role: 'style',
            editType: 'plot',
            description: [
                'Sets a maximum number of points to be drawn on the graph.',
                '*0* corresponds to no limit.'
            ].join(' ')
        },
        sizeref: {
            valType: 'number',
            dflt: 1,
            role: 'style',
            editType: 'calc',
            description: [
                'Has an effect only if `marker.size` is set to a numerical array.',
                'Sets the scale factor used to determine the rendered size of',
                'marker points. Use with `sizemin` and `sizemode`.'
            ].join(' ')
        },
        sizemin: {
            valType: 'number',
            min: 0,
            dflt: 0,
            role: 'style',
            editType: 'calc',
            description: [
                'Has an effect only if `marker.size` is set to a numerical array.',
                'Sets the minimum size (in px) of the rendered marker points.'
            ].join(' ')
        },
        sizemode: {
            valType: 'enumerated',
            values: ['diameter', 'area'],
            dflt: 'diameter',
            role: 'info',
            editType: 'calc',
            description: [
                'Has an effect only if `marker.size` is set to a numerical array.',
                'Sets the rule for which the data in `size` is converted',
                'to pixels.'
            ].join(' ')
        },

        showscale: {
            valType: 'boolean',
            role: 'info',
            dflt: false,
            editType: 'calc',
            description: [
                'Has an effect only if `marker.color` is set to a numerical array.',
                'Determines whether or not a colorbar is displayed.'
            ].join(' ')
        },
        colorbar: colorbarAttrs,

        line: extendFlat({
            width: {
                valType: 'number',
                min: 0,
                arrayOk: true,
                role: 'style',
                editType: 'style',
                description: 'Sets the width (in px) of the lines bounding the marker points.'
            },
            editType: 'calc'
        },
            colorAttributes('marker.line')
        ),
        gradient: {
            type: {
                valType: 'enumerated',
                values: ['radial', 'horizontal', 'vertical', 'none'],
                arrayOk: true,
                dflt: 'none',
                role: 'style',
                editType: 'calc',
                description: [
                    'Sets the type of gradient used to fill the markers'
                ].join(' ')
            },
            color: {
                valType: 'color',
                arrayOk: true,
                role: 'style',
                editType: 'calc',
                description: [
                    'Sets the final color of the gradient fill:',
                    'the center color for radial, the right for horizontal,',
                    'or the bottom for vertical.',
                ].join(' ')
            },
            editType: 'calc'
        },
        editType: 'calc'
    },
        colorAttributes('marker')
    ),
    selected: {
        marker: {
            opacity: {
                valType: 'number',
                min: 0,
                max: 1,
                role: 'style',
                editType: 'style',
                description: 'Sets the marker opacity of selected points.'
            },
            color: {
                valType: 'color',
                role: 'style',
                editType: 'style',
                description: 'Sets the marker color of selected points.'
            },
            size: {
                valType: 'number',
                min: 0,
                role: 'style',
                editType: 'style',
                description: 'Sets the marker size of selected points.'
            },
            editType: 'style'
        },
        textfont: {
            color: {
                valType: 'color',
                role: 'style',
                editType: 'style',
                description: 'Sets the text font color of selected points.'
            },
            editType: 'style'
        },
        editType: 'style'
    },
    unselected: {
        marker: {
            opacity: {
                valType: 'number',
                min: 0,
                max: 1,
                role: 'style',
                editType: 'style',
                description: 'Sets the marker opacity of unselected points, applied only when a selection exists.'
            },
            color: {
                valType: 'color',
                role: 'style',
                editType: 'style',
                description: 'Sets the marker color of unselected points, applied only when a selection exists.'
            },
            size: {
                valType: 'number',
                min: 0,
                role: 'style',
                editType: 'style',
                description: 'Sets the marker size of unselected points, applied only when a selection exists.'
            },
            editType: 'style'
        },
        textfont: {
            color: {
                valType: 'color',
                role: 'style',
                editType: 'style',
                description: 'Sets the text font color of unselected points, applied only when a selection exists.'
            },
            editType: 'style'
        },
        editType: 'style'
    },

    textposition: {
        valType: 'enumerated',
        values: [
            'top left', 'top center', 'top right',
            'middle left', 'middle center', 'middle right',
            'bottom left', 'bottom center', 'bottom right'
        ],
        dflt: 'middle center',
        arrayOk: true,
        role: 'style',
        editType: 'calc',
        description: [
            'Sets the positions of the `text` elements',
            'with respects to the (x,y) coordinates.'
        ].join(' ')
    },
    textfont: fontAttrs({
        editType: 'calc',
        colorEditType: 'style',
        arrayOk: true,
        description: 'Sets the text font.'
    }),

    r: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'For legacy polar chart only.',
            'Please switch to *scatterpolar* trace type.',
            'Sets the radial coordinates.'
        ].join('')
    },
    t: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'For legacy polar chart only.',
            'Please switch to *scatterpolar* trace type.',
            'Sets the angular coordinates.'
        ].join('')
    },

    error_y: errorBarAttrs,
    error_x: errorBarAttrs
};
