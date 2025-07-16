'use strict';

var constants = require('./constants');

var fontAttrs = require('../../plots/font_attributes');

var font = fontAttrs({
    editType: 'none',
    description: 'Sets the default hover label font used by all traces on the graph.'
});
font.family.dflt = constants.HOVERFONT;
font.size.dflt = constants.HOVERFONTSIZE;

module.exports = {
    clickmode: {
        valType: 'flaglist',
        flags: ['event', 'select'],
        dflt: 'event',
        editType: 'plot',
        extras: ['none'],
        description: [
            'Determines the mode of single click interactions.',
            '*event* is the default value and emits the `plotly_click`',
            'event. In addition this mode emits the `plotly_selected` event',
            'in drag modes *lasso* and *select*, but with no event data attached',
            '(kept for compatibility reasons).',
            'The *select* flag enables selecting single',
            'data points via click. This mode also supports persistent selections,',
            'meaning that pressing Shift while clicking, adds to / subtracts from an',
            'existing selection. *select* with `hovermode`: *x* can be confusing, consider',
            'explicitly setting `hovermode`: *closest* when using this feature.',
            'Selection events are sent accordingly as long as *event* flag is set as well.',
            'When the *event* flag is missing, `plotly_click` and `plotly_selected`',
            'events are not fired.'
        ].join(' ')
    },
    dragmode: {
        valType: 'enumerated',
        values: [
            'zoom',
            'pan',
            'select',
            'lasso',
            'drawclosedpath',
            'drawopenpath',
            'drawline',
            'drawrect',
            'drawcircle',
            'orbit',
            'turntable',
            false
        ],
        dflt: 'zoom',
        editType: 'modebar',
        description: [
            'Determines the mode of drag interactions.',
            '*select* and *lasso* apply only to scatter traces with',
            'markers or text. *orbit* and *turntable* apply only to',
            '3D scenes.'
        ].join(' ')
    },
    hovermode: {
        valType: 'enumerated',
        values: ['x', 'y', 'closest', false, 'x unified', 'y unified'],
        dflt: 'closest',
        editType: 'modebar',
        description: [
            'Determines the mode of hover interactions.',
            'If *closest*, a single hoverlabel will appear',
            'for the *closest* point within the `hoverdistance`.',
            'If *x* (or *y*), multiple hoverlabels will appear for multiple points',
            'at the *closest* x- (or y-) coordinate within the `hoverdistance`,',
            'with the caveat that no more than one hoverlabel will appear per trace.',
            'If *x unified* (or *y unified*), a single hoverlabel will appear',
            'multiple points at the closest x- (or y-) coordinate within the `hoverdistance`',
            'with the caveat that no more than one hoverlabel will appear per trace.',
            'In this mode, spikelines are enabled by default perpendicular to the specified axis.',
            'If false, hover interactions are disabled.'
        ].join(' ')
    },
    hoversubplots: {
        valType: 'enumerated',
        values: ['single', 'overlaying', 'axis'],
        dflt: 'overlaying',
        editType: 'none',
        description: [
            'Determines expansion of hover effects to other subplots',
            'If *single* just the axis pair of the primary point is included without overlaying subplots.',
            'If *overlaying* all subplots using the main axis and occupying the same space are included.',
            'If *axis*, also include stacked subplots using the same axis',
            'when `hovermode` is set to *x*, *x unified*, *y* or *y unified*.',
        ].join(' ')
    },
    hoverdistance: {
        valType: 'integer',
        min: -1,
        dflt: 20,
        editType: 'none',
        description: [
            'Sets the default distance (in pixels) to look for data',
            'to add hover labels (-1 means no cutoff, 0 means no looking for data).',
            'This is only a real distance for hovering on point-like objects,',
            'like scatter points. For area-like objects (bars, scatter fills, etc)',
            'hovering is on inside the area and off outside, but these objects',
            'will not supersede hover on point-like objects in case of conflict.'
        ].join(' ')
    },
    spikedistance: {
        valType: 'integer',
        min: -1,
        dflt: -1,
        editType: 'none',
        description: [
            'Sets the default distance (in pixels) to look for data to draw',
            'spikelines to (-1 means no cutoff, 0 means no looking for data).',
            'As with hoverdistance, distance does not apply to area-like objects.',
            'In addition, some objects can be hovered on but will not generate',
            'spikelines, such as scatter fills.'
        ].join(' ')
    },
    hoverlabel: {
        bgcolor: {
            valType: 'color',
            editType: 'none',
            description: [
                'Sets the background color of all hover labels on graph'
            ].join(' ')
        },
        bordercolor: {
            valType: 'color',
            editType: 'none',
            description: [
                'Sets the border color of all hover labels on graph.'
            ].join(' ')
        },
        font: font,
        grouptitlefont: fontAttrs({
            editType: 'none',
            description: [
                'Sets the font for group titles in hover (unified modes).',
                'Defaults to `hoverlabel.font`.'
            ].join(' ')
        }),
        align: {
            valType: 'enumerated',
            values: ['left', 'right', 'auto'],
            dflt: 'auto',
            editType: 'none',
            description: [
                'Sets the horizontal alignment of the text content within hover label box.',
                'Has an effect only if the hover label text spans more two or more lines'
            ].join(' ')
        },
        namelength: {
            valType: 'integer',
            min: -1,
            dflt: 15,
            editType: 'none',
            description: [
                'Sets the default length (in number of characters) of the trace name in',
                'the hover labels for all traces. -1 shows the whole name',
                'regardless of length. 0-3 shows the first 0-3 characters, and',
                'an integer >3 will show the whole name if it is less than that',
                'many characters, but if it is longer, will truncate to',
                '`namelength - 3` characters and add an ellipsis.'
            ].join(' ')
        },
        showarrow: {
            valType: 'boolean',
            dflt: true,
            editType: 'none',
            description: [
                'Sets whether or not to show the hover label arrow/triangle',
                'pointing to the data point.'
            ].join(' ')
        },

        editType: 'none'
    },
    selectdirection: {
        valType: 'enumerated',
        values: ['h', 'v', 'd', 'any'],
        dflt: 'any',
        description: [
            'When `dragmode` is set to *select*, this limits the selection of the drag to',
            'horizontal, vertical or diagonal. *h* only allows horizontal selection,',
            '*v* only vertical, *d* only diagonal and *any* sets no limit.'
        ].join(' '),
        editType: 'none'
    }
};
