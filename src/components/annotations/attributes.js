'use strict';

var ARROWPATHS = require('./arrow_paths');
var fontAttrs = require('../../plots/font_attributes');
var cartesianConstants = require('../../plots/cartesian/constants');
var templatedArray = require('../../plot_api/plot_template').templatedArray;
var axisPlaceableObjs = require('../../constants/axis_placeable_objects');

function arrowAxisRefDescription(axis) {
    return [
        'In order for absolute positioning of the arrow to work, *a' + axis +
        'ref* must be exactly the same as *' + axis + 'ref*, otherwise *a' + axis +
        'ref* will revert to *pixel* (explained next).',
        'For relative positioning, *a' + axis + 'ref* can be set to *pixel*,',
        'in which case the *a' + axis + '* value is specified in pixels',
        'relative to *' + axis + '*.',
        'Absolute positioning is useful',
        'for trendline annotations which should continue to indicate',
        'the correct trend when zoomed. Relative positioning is useful',
        'for specifying the text offset for an annotated point.'
    ].join(' ');
}

function arrowCoordinateDescription(axis, lower, upper) {
    return [
        'Sets the', axis, 'component of the arrow tail about the arrow head.',
        'If `a' + axis + 'ref` is `pixel`, a positive (negative)',
        'component corresponds to an arrow pointing',
        'from', upper, 'to', lower, '(' + lower, 'to', upper + ').',
        'If `a' + axis + 'ref` is not `pixel` and is exactly the same as `' + axis + 'ref`,',
        'this is an absolute value on that axis,',
        'like `' + axis + '`, specified in the same coordinates as `' + axis + 'ref`.'
    ].join(' ');
}

module.exports = templatedArray('annotation', {
    visible: {
        valType: 'boolean',
        dflt: true,
        editType: 'calc+arraydraw',
        description: [
            'Determines whether or not this annotation is visible.'
        ].join(' ')
    },

    text: {
        valType: 'string',
        editType: 'calc+arraydraw',
        description: [
            'Sets the text associated with this annotation.',
            'Plotly uses a subset of HTML tags to do things like',
            'newline (<br>), bold (<b></b>), italics (<i></i>),',
            'hyperlinks (<a href=\'...\'></a>). Tags <em>, <sup>, <sub>',
            '<span> are also supported.'
        ].join(' ')
    },
    textangle: {
        valType: 'angle',
        dflt: 0,
        editType: 'calc+arraydraw',
        description: [
            'Sets the angle at which the `text` is drawn',
            'with respect to the horizontal.'
        ].join(' ')
    },
    font: fontAttrs({
        editType: 'calc+arraydraw',
        colorEditType: 'arraydraw',
        description: 'Sets the annotation text font.'
    }),
    width: {
        valType: 'number',
        min: 1,
        dflt: null,
        editType: 'calc+arraydraw',
        description: [
            'Sets an explicit width for the text box. null (default) lets the',
            'text set the box width. Wider text will be clipped.',
            'There is no automatic wrapping; use <br> to start a new line.'
        ].join(' ')
    },
    height: {
        valType: 'number',
        min: 1,
        dflt: null,
        editType: 'calc+arraydraw',
        description: [
            'Sets an explicit height for the text box. null (default) lets the',
            'text set the box height. Taller text will be clipped.'
        ].join(' ')
    },
    opacity: {
        valType: 'number',
        min: 0,
        max: 1,
        dflt: 1,
        editType: 'arraydraw',
        description: 'Sets the opacity of the annotation (text + arrow).'
    },
    align: {
        valType: 'enumerated',
        values: ['left', 'center', 'right'],
        dflt: 'center',
        editType: 'arraydraw',
        description: [
            'Sets the horizontal alignment of the `text` within the box.',
            'Has an effect only if `text` spans two or more lines',
            '(i.e. `text` contains one or more <br> HTML tags) or if an',
            'explicit width is set to override the text width.'
        ].join(' ')
    },
    valign: {
        valType: 'enumerated',
        values: ['top', 'middle', 'bottom'],
        dflt: 'middle',
        editType: 'arraydraw',
        description: [
            'Sets the vertical alignment of the `text` within the box.',
            'Has an effect only if an explicit height is set to override',
            'the text height.'
        ].join(' ')
    },
    bgcolor: {
        valType: 'color',
        dflt: 'rgba(0,0,0,0)',
        editType: 'arraydraw',
        description: 'Sets the background color of the annotation.'
    },
    bordercolor: {
        valType: 'color',
        dflt: 'rgba(0,0,0,0)',
        editType: 'arraydraw',
        description: [
            'Sets the color of the border enclosing the annotation `text`.'
        ].join(' ')
    },
    borderpad: {
        valType: 'number',
        min: 0,
        dflt: 1,
        editType: 'calc+arraydraw',
        description: [
            'Sets the padding (in px) between the `text`',
            'and the enclosing border.'
        ].join(' ')
    },
    borderwidth: {
        valType: 'number',
        min: 0,
        dflt: 1,
        editType: 'calc+arraydraw',
        description: [
            'Sets the width (in px) of the border enclosing',
            'the annotation `text`.'
        ].join(' ')
    },
    // arrow
    showarrow: {
        valType: 'boolean',
        dflt: true,
        editType: 'calc+arraydraw',
        description: [
            'Determines whether or not the annotation is drawn with an arrow.',
            'If *true*, `text` is placed near the arrow\'s tail.',
            'If *false*, `text` lines up with the `x` and `y` provided.'
        ].join(' ')
    },
    arrowcolor: {
        valType: 'color',
        editType: 'arraydraw',
        description: 'Sets the color of the annotation arrow.'
    },
    arrowhead: {
        valType: 'integer',
        min: 0,
        max: ARROWPATHS.length,
        dflt: 1,
        editType: 'arraydraw',
        description: 'Sets the end annotation arrow head style.'
    },
    startarrowhead: {
        valType: 'integer',
        min: 0,
        max: ARROWPATHS.length,
        dflt: 1,
        editType: 'arraydraw',
        description: 'Sets the start annotation arrow head style.'
    },
    arrowside: {
        valType: 'flaglist',
        flags: ['end', 'start'],
        extras: ['none'],
        dflt: 'end',
        editType: 'arraydraw',
        description: 'Sets the annotation arrow head position.'
    },
    arrowsize: {
        valType: 'number',
        min: 0.3,
        dflt: 1,
        editType: 'calc+arraydraw',
        description: [
            'Sets the size of the end annotation arrow head, relative to `arrowwidth`.',
            'A value of 1 (default) gives a head about 3x as wide as the line.'
        ].join(' ')
    },
    startarrowsize: {
        valType: 'number',
        min: 0.3,
        dflt: 1,
        editType: 'calc+arraydraw',
        description: [
            'Sets the size of the start annotation arrow head, relative to `arrowwidth`.',
            'A value of 1 (default) gives a head about 3x as wide as the line.'
        ].join(' ')
    },
    arrowwidth: {
        valType: 'number',
        min: 0.1,
        editType: 'calc+arraydraw',
        description: 'Sets the width (in px) of annotation arrow line.'
    },
    standoff: {
        valType: 'number',
        min: 0,
        dflt: 0,
        editType: 'calc+arraydraw',
        description: [
            'Sets a distance, in pixels, to move the end arrowhead away from the',
            'position it is pointing at, for example to point at the edge of',
            'a marker independent of zoom. Note that this shortens the arrow',
            'from the `ax` / `ay` vector, in contrast to `xshift` / `yshift`',
            'which moves everything by this amount.'
        ].join(' ')
    },
    startstandoff: {
        valType: 'number',
        min: 0,
        dflt: 0,
        editType: 'calc+arraydraw',
        description: [
            'Sets a distance, in pixels, to move the start arrowhead away from the',
            'position it is pointing at, for example to point at the edge of',
            'a marker independent of zoom. Note that this shortens the arrow',
            'from the `ax` / `ay` vector, in contrast to `xshift` / `yshift`',
            'which moves everything by this amount.'
        ].join(' ')
    },
    ax: {
        valType: 'any',
        editType: 'calc+arraydraw',
        description: [
            arrowCoordinateDescription('x', 'left', 'right')
        ].join(' ')
    },
    ay: {
        valType: 'any',
        editType: 'calc+arraydraw',
        description: [
            arrowCoordinateDescription('y', 'top', 'bottom')
        ].join(' ')
    },
    axref: {
        valType: 'enumerated',
        dflt: 'pixel',
        values: [
            'pixel',
            cartesianConstants.idRegex.x.toString()
        ],
        editType: 'calc',
        description: [
            'Indicates in what coordinates the tail of the',
            'annotation (ax,ay) is specified.',
            axisPlaceableObjs.axisRefDescription('x', 'left', 'right'),
            arrowAxisRefDescription('x')
        ].join(' ')
    },
    ayref: {
        valType: 'enumerated',
        dflt: 'pixel',
        values: [
            'pixel',
            cartesianConstants.idRegex.y.toString()
        ],
        editType: 'calc',
        description: [
            'Indicates in what coordinates the tail of the',
            'annotation (ax,ay) is specified.',
            axisPlaceableObjs.axisRefDescription('y', 'bottom', 'top'),
            arrowAxisRefDescription('y')
        ].join(' ')
    },
    // positioning
    xref: {
        valType: 'enumerated',
        values: [
            'paper',
            cartesianConstants.idRegex.x.toString()
        ],
        editType: 'calc',
        description: [
            'Sets the annotation\'s x coordinate axis.',
            axisPlaceableObjs.axisRefDescription('x', 'left', 'right'),
        ].join(' ')
    },
    x: {
        valType: 'any',
        editType: 'calc+arraydraw',
        description: [
            'Sets the annotation\'s x position.',
            'If the axis `type` is *log*, then you must take the',
            'log of your desired range.',
            'If the axis `type` is *date*, it should be date strings,',
            'like date data, though Date objects and unix milliseconds',
            'will be accepted and converted to strings.',
            'If the axis `type` is *category*, it should be numbers,',
            'using the scale where each category is assigned a serial',
            'number from zero in the order it appears.'
        ].join(' ')
    },
    xanchor: {
        valType: 'enumerated',
        values: ['auto', 'left', 'center', 'right'],
        dflt: 'auto',
        editType: 'calc+arraydraw',
        description: [
            'Sets the text box\'s horizontal position anchor',
            'This anchor binds the `x` position to the *left*, *center*',
            'or *right* of the annotation.',
            'For example, if `x` is set to 1, `xref` to *paper* and',
            '`xanchor` to *right* then the right-most portion of the',
            'annotation lines up with the right-most edge of the',
            'plotting area.',
            'If *auto*, the anchor is equivalent to *center* for',
            'data-referenced annotations or if there is an arrow,',
            'whereas for paper-referenced with no arrow, the anchor picked',
            'corresponds to the closest side.'
        ].join(' ')
    },
    xshift: {
        valType: 'number',
        dflt: 0,
        editType: 'calc+arraydraw',
        description: [
            'Shifts the position of the whole annotation and arrow to the',
            'right (positive) or left (negative) by this many pixels.'
        ].join(' ')
    },
    yref: {
        valType: 'enumerated',
        values: [
            'paper',
            cartesianConstants.idRegex.y.toString()
        ],
        editType: 'calc',
        description: [
            'Sets the annotation\'s y coordinate axis.',
            axisPlaceableObjs.axisRefDescription('y', 'bottom', 'top'),
        ].join(' ')
    },
    y: {
        valType: 'any',
        editType: 'calc+arraydraw',
        description: [
            'Sets the annotation\'s y position.',
            'If the axis `type` is *log*, then you must take the',
            'log of your desired range.',
            'If the axis `type` is *date*, it should be date strings,',
            'like date data, though Date objects and unix milliseconds',
            'will be accepted and converted to strings.',
            'If the axis `type` is *category*, it should be numbers,',
            'using the scale where each category is assigned a serial',
            'number from zero in the order it appears.'
        ].join(' ')
    },
    yanchor: {
        valType: 'enumerated',
        values: ['auto', 'top', 'middle', 'bottom'],
        dflt: 'auto',
        editType: 'calc+arraydraw',
        description: [
            'Sets the text box\'s vertical position anchor',
            'This anchor binds the `y` position to the *top*, *middle*',
            'or *bottom* of the annotation.',
            'For example, if `y` is set to 1, `yref` to *paper* and',
            '`yanchor` to *top* then the top-most portion of the',
            'annotation lines up with the top-most edge of the',
            'plotting area.',
            'If *auto*, the anchor is equivalent to *middle* for',
            'data-referenced annotations or if there is an arrow,',
            'whereas for paper-referenced with no arrow, the anchor picked',
            'corresponds to the closest side.'
        ].join(' ')
    },
    yshift: {
        valType: 'number',
        dflt: 0,
        editType: 'calc+arraydraw',
        description: [
            'Shifts the position of the whole annotation and arrow up',
            '(positive) or down (negative) by this many pixels.'
        ].join(' ')
    },
    clicktoshow: {
        valType: 'enumerated',
        values: [false, 'onoff', 'onout'],
        dflt: false,
        editType: 'arraydraw',
        description: [
            'Makes this annotation respond to clicks on the plot.',
            'If you click a data point that exactly matches the `x` and `y`',
            'values of this annotation, and it is hidden (visible: false),',
            'it will appear. In *onoff* mode, you must click the same point',
            'again to make it disappear, so if you click multiple points,',
            'you can show multiple annotations. In *onout* mode, a click',
            'anywhere else in the plot (on another data point or not) will',
            'hide this annotation.',
            'If you need to show/hide this annotation in response to different',
            '`x` or `y` values, you can set `xclick` and/or `yclick`. This is',
            'useful for example to label the side of a bar. To label markers',
            'though, `standoff` is preferred over `xclick` and `yclick`.'
        ].join(' ')
    },
    xclick: {
        valType: 'any',
        editType: 'arraydraw',
        description: [
            'Toggle this annotation when clicking a data point whose `x` value',
            'is `xclick` rather than the annotation\'s `x` value.'
        ].join(' ')
    },
    yclick: {
        valType: 'any',
        editType: 'arraydraw',
        description: [
            'Toggle this annotation when clicking a data point whose `y` value',
            'is `yclick` rather than the annotation\'s `y` value.'
        ].join(' ')
    },
    hovertext: {
        valType: 'string',
        editType: 'arraydraw',
        description: [
            'Sets text to appear when hovering over this annotation.',
            'If omitted or blank, no hover label will appear.'
        ].join(' ')
    },
    hoverlabel: {
        bgcolor: {
            valType: 'color',
            editType: 'arraydraw',
            description: [
                'Sets the background color of the hover label.',
                'By default uses the annotation\'s `bgcolor` made opaque,',
                'or white if it was transparent.'
            ].join(' ')
        },
        bordercolor: {
            valType: 'color',
            editType: 'arraydraw',
            description: [
                'Sets the border color of the hover label.',
                'By default uses either dark grey or white, for maximum',
                'contrast with `hoverlabel.bgcolor`.'
            ].join(' ')
        },
        font: fontAttrs({
            editType: 'arraydraw',
            description: [
                'Sets the hover label text font.',
                'By default uses the global hover font and size,',
                'with color from `hoverlabel.bordercolor`.'
            ].join(' ')
        }),
        editType: 'arraydraw'
    },
    captureevents: {
        valType: 'boolean',
        editType: 'arraydraw',
        description: [
            'Determines whether the annotation text box captures mouse move',
            'and click events, or allows those events to pass through to data',
            'points in the plot that may be behind the annotation. By default',
            '`captureevents` is *false* unless `hovertext` is provided.',
            'If you use the event `plotly_clickannotation` without `hovertext`',
            'you must explicitly enable `captureevents`.'
        ].join(' ')
    },
    editType: 'calc',

    _deprecated: {
        ref: {
            valType: 'string',
            editType: 'calc',
            description: [
                'Obsolete. Set `xref` and `yref` separately instead.'
            ].join(' ')
        }
    }
});
