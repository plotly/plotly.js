'use strict';

var fontAttrs = require('./font_attributes');
var animationAttrs = require('./animation_attributes');
var colorAttrs = require('../components/color/attributes');
var drawNewShapeAttrs = require('../components/shapes/draw_newshape/attributes');
var drawNewSelectionAttrs = require('../components/selections/draw_newselection/attributes');
var padAttrs = require('./pad_attributes');
var extendFlat = require('../lib/extend').extendFlat;

var globalFont = fontAttrs({
    editType: 'calc',
    description: [
        'Sets the global font.',
        'Note that fonts used in traces and other',
        'layout components inherit from the global font.'
    ].join(' ')
});
globalFont.family.dflt = '"Open Sans", verdana, arial, sans-serif';
globalFont.size.dflt = 12;
globalFont.color.dflt = colorAttrs.defaultLine;

module.exports = {
    font: globalFont,
    title: {
        text: {
            valType: 'string',
            editType: 'layoutstyle',
            description: 'Sets the plot\'s title.'
        },
        font: fontAttrs({
            editType: 'layoutstyle',
            description: 'Sets the title font.'
        }),
        subtitle: {
            text: {
                valType: 'string',
                editType: 'layoutstyle',
                description: 'Sets the plot\'s subtitle.'
            },
            font: fontAttrs({
                editType: 'layoutstyle',
                description: 'Sets the subtitle font.'
            }),
            editType: 'layoutstyle',
        },
        xref: {
            valType: 'enumerated',
            dflt: 'container',
            values: ['container', 'paper'],
            editType: 'layoutstyle',
            description: [
                'Sets the container `x` refers to.',
                '*container* spans the entire `width` of the plot.',
                '*paper* refers to the width of the plotting area only.'
            ].join(' ')
        },
        yref: {
            valType: 'enumerated',
            dflt: 'container',
            values: ['container', 'paper'],
            editType: 'layoutstyle',
            description: [
                'Sets the container `y` refers to.',
                '*container* spans the entire `height` of the plot.',
                '*paper* refers to the height of the plotting area only.'
            ].join(' ')
        },
        x: {
            valType: 'number',
            min: 0,
            max: 1,
            dflt: 0.5,
            editType: 'layoutstyle',
            description: [
                'Sets the x position with respect to `xref` in normalized',
                'coordinates from *0* (left) to *1* (right).'
            ].join(' ')
        },
        y: {
            valType: 'number',
            min: 0,
            max: 1,
            dflt: 'auto',
            editType: 'layoutstyle',
            description: [
                'Sets the y position with respect to `yref` in normalized',
                'coordinates from *0* (bottom) to *1* (top).',
                '*auto* places the baseline of the title onto the',
                'vertical center of the top margin.'
            ].join(' ')
        },
        xanchor: {
            valType: 'enumerated',
            dflt: 'auto',
            values: ['auto', 'left', 'center', 'right'],
            editType: 'layoutstyle',
            description: [
                'Sets the title\'s horizontal alignment with respect to its x position.',
                '*left* means that the title starts at x,',
                '*right* means that the title ends at x',
                'and *center* means that the title\'s center is at x.',
                '*auto* divides `xref` by three and calculates the `xanchor`',
                'value automatically based on the value of `x`.'
            ].join(' ')
        },
        yanchor: {
            valType: 'enumerated',
            dflt: 'auto',
            values: ['auto', 'top', 'middle', 'bottom'],
            editType: 'layoutstyle',
            description: [
                'Sets the title\'s vertical alignment with respect to its y position.',
                '*top* means that the title\'s cap line is at y,',
                '*bottom* means that the title\'s baseline is at y',
                'and *middle* means that the title\'s midline is at y.',
                '*auto* divides `yref` by three and calculates the `yanchor`',
                'value automatically based on the value of `y`.'
            ].join(' ')
        },
        pad: extendFlat(padAttrs({editType: 'layoutstyle'}), {
            description: [
                'Sets the padding of the title.',
                'Each padding value only applies when the corresponding',
                '`xanchor`/`yanchor` value is set accordingly. E.g. for left',
                'padding to take effect, `xanchor` must be set to *left*.',
                'The same rule applies if `xanchor`/`yanchor` is determined automatically.',
                'Padding is muted if the respective anchor value is *middle*/*center*.'
            ].join(' ')
        }),
        automargin: {
            valType: 'boolean',
            dflt: false,
            editType: 'plot',
            description: [
                'Determines whether the title can automatically push the figure margins.',
                'If `yref=\'paper\'` then the margin will expand to ensure that the title doesn\’t',
                'overlap with the edges of the container. If `yref=\'container\'` then the margins',
                'will ensure that the title doesn\’t overlap with the plot area, tick labels,',
                'and axis titles. If `automargin=true` and the margins need to be expanded,',
                'then y will be set to a default 1 and yanchor will be set to an appropriate',
                'default to ensure that minimal margin space is needed. Note that when `yref=\'paper\'`,',
                'only 1 or 0 are allowed y values. Invalid values will be reset to the default 1.'
            ].join(' ')
        },
        editType: 'layoutstyle'
    },
    uniformtext: {
        mode: {
            valType: 'enumerated',
            values: [false, 'hide', 'show'],
            dflt: false,
            editType: 'plot',
            description: [
                'Determines how the font size for various text',
                'elements are uniformed between each trace type.',
                'If the computed text sizes were smaller than',
                'the minimum size defined by `uniformtext.minsize`',
                'using *hide* option hides the text; and',
                'using *show* option shows the text without further downscaling.',
                'Please note that if the size defined by `minsize` is greater than',
                'the font size defined by trace, then the `minsize` is used.'
            ].join(' ')
        },
        minsize: {
            valType: 'number',
            min: 0,
            dflt: 0,
            editType: 'plot',
            description: [
                'Sets the minimum text size between traces of the same type.'
            ].join(' ')
        },
        editType: 'plot'
    },
    autosize: {
        valType: 'boolean',
        dflt: false,
        // autosize, width, and height get special editType treatment in _relayout
        // so we can handle noop resizes more efficiently
        editType: 'none',
        description: [
            'Determines whether or not a layout width or height',
            'that has been left undefined by the user',
            'is initialized on each relayout.',

            'Note that, regardless of this attribute,',
            'an undefined layout width or height',
            'is always initialized on the first call to plot.'
        ].join(' ')
    },
    width: {
        valType: 'number',
        min: 10,
        dflt: 700,
        editType: 'plot',
        description: [
            'Sets the plot\'s width (in px).'
        ].join(' ')
    },
    height: {
        valType: 'number',
        min: 10,
        dflt: 450,
        editType: 'plot',
        description: [
            'Sets the plot\'s height (in px).'
        ].join(' ')
    },
    minreducedwidth: {
        valType: 'number',
        min: 2,
        dflt: 64,
        editType: 'plot',
        description: 'Minimum width of the plot with margin.automargin applied (in px)'
    },
    minreducedheight: {
        valType: 'number',
        min: 2,
        dflt: 64,
        editType: 'plot',
        description: 'Minimum height of the plot with margin.automargin applied (in px)'
    },
    margin: {
        l: {
            valType: 'number',
            min: 0,
            dflt: 80,
            editType: 'plot',
            description: 'Sets the left margin (in px).'
        },
        r: {
            valType: 'number',
            min: 0,
            dflt: 80,
            editType: 'plot',
            description: 'Sets the right margin (in px).'
        },
        t: {
            valType: 'number',
            min: 0,
            dflt: 100,
            editType: 'plot',
            description: 'Sets the top margin (in px).'
        },
        b: {
            valType: 'number',
            min: 0,
            dflt: 80,
            editType: 'plot',
            description: 'Sets the bottom margin (in px).'
        },
        pad: {
            valType: 'number',
            min: 0,
            dflt: 0,
            editType: 'plot',
            description: [
                'Sets the amount of padding (in px)',
                'between the plotting area and the axis lines'
            ].join(' ')
        },
        autoexpand: {
            valType: 'boolean',
            dflt: true,
            editType: 'plot',
            description: [
                'Turns on/off margin expansion computations.',
                'Legends, colorbars, updatemenus, sliders, axis rangeselector and rangeslider',
                'are allowed to push the margins by defaults.'
            ].join(' ')
        },
        editType: 'plot'
    },
    computed: {
        valType: 'any',
        editType: 'none',
        description: [
            'Placeholder for exporting automargin-impacting values namely',
            '`margin.t`, `margin.b`, `margin.l` and `margin.r` in *full-json* mode.',
        ].join(' ')
    },
    paper_bgcolor: {
        valType: 'color',
        dflt: colorAttrs.background,
        editType: 'plot',
        description: 'Sets the background color of the paper where the graph is drawn.'
    },
    plot_bgcolor: {
        // defined here, but set in cartesian.supplyLayoutDefaults
        // because it needs to know if there are (2D) axes or not
        valType: 'color',
        dflt: colorAttrs.background,
        editType: 'layoutstyle',
        description: [
            'Sets the background color of the plotting area in-between x and y axes.'
        ].join(' ')
    },
    autotypenumbers: {
        valType: 'enumerated',
        values: ['convert types', 'strict'],
        dflt: 'convert types',
        editType: 'calc',
        description: [
            'Using *strict* a numeric string in trace data is not converted to a number.',
            'Using *convert types* a numeric string in trace data may be',
            'treated as a number during automatic axis `type` detection.',
            'This is the default value; however it could be overridden for individual axes.'
        ].join(' ')
    },
    separators: {
        valType: 'string',
        editType: 'plot',
        description: [
            'Sets the decimal and thousand separators.',
            'For example, *. * puts a \'.\' before decimals and a space',
            'between thousands. In English locales, dflt is *.,* but',
            'other locales may alter this default.'
        ].join(' ')
    },
    hidesources: {
        valType: 'boolean',
        dflt: false,
        editType: 'plot',
        description: [
            'Determines whether or not a text link citing the data source is',
            'placed at the bottom-right cored of the figure.',
            'Has only an effect only on graphs that have been generated via',
            'forked graphs from the Chart Studio Cloud (at https://chart-studio.plotly.com or on-premise).'
        ].join(' ')
    },
    showlegend: {
        // handled in legend.supplyLayoutDefaults
        // but included here because it's not in the legend object
        valType: 'boolean',
        editType: 'legend',
        description: [
            'Determines whether or not a legend is drawn.',
            'Default is `true` if there is a trace to show and any of these:',
            'a) Two or more traces would by default be shown in the legend.',
            'b) One pie trace is shown in the legend.',
            'c) One trace is explicitly given with `showlegend: true`.'
        ].join(' ')
    },

    colorway: {
        valType: 'colorlist',
        dflt: colorAttrs.defaults,
        editType: 'calc',
        description: 'Sets the default trace colors.'
    },
    datarevision: {
        valType: 'any',
        editType: 'calc',
        description: [
            'If provided, a changed value tells `Plotly.react` that',
            'one or more data arrays has changed. This way you can modify',
            'arrays in-place rather than making a complete new copy for an',
            'incremental change.',
            'If NOT provided, `Plotly.react` assumes that data arrays are',
            'being treated as immutable, thus any data array with a',
            'different identity from its predecessor contains new data.'
        ].join(' ')
    },
    uirevision: {
        valType: 'any',
        editType: 'none',
        description: [
            'Used to allow user interactions with the plot to persist after',
            '`Plotly.react` calls that are unaware of these interactions.',
            'If `uirevision` is omitted, or if it is given and it changed from',
            'the previous `Plotly.react` call, the exact new figure is used.',
            'If `uirevision` is truthy and did NOT change, any attribute',
            'that has been affected by user interactions and did not receive a',
            'different value in the new figure will keep the interaction value.',
            '`layout.uirevision` attribute serves as the default for',
            '`uirevision` attributes in various sub-containers. For finer',
            'control you can set these sub-attributes directly. For example,',
            'if your app separately controls the data on the x and y axes you',
            'might set `xaxis.uirevision=*time*` and `yaxis.uirevision=*cost*`.',
            'Then if only the y data is changed, you can update',
            '`yaxis.uirevision=*quantity*` and the y axis range will reset but',
            'the x axis range will retain any user-driven zoom.'
        ].join(' ')
    },
    editrevision: {
        valType: 'any',
        editType: 'none',
        description: [
            'Controls persistence of user-driven changes in `editable: true`',
            'configuration, other than trace names and axis titles.',
            'Defaults to `layout.uirevision`.'
        ].join(' ')
    },
    selectionrevision: {
        valType: 'any',
        editType: 'none',
        description: [
            'Controls persistence of user-driven changes in selected points',
            'from all traces.'
        ].join(' ')
    },
    template: {
        valType: 'any',
        editType: 'calc',
        description: [
            'Default attributes to be applied to the plot. Templates can be',
            'created from existing plots using `Plotly.makeTemplate`, or',
            'created manually. They should be objects with format:',
            '`{layout: layoutTemplate, data: {[type]: [traceTemplate, ...]}, ...}`',
            '`layoutTemplate` and `traceTemplate` are objects matching the',
            'attribute structure of `layout` and a data trace. ',
            'Trace templates are applied cyclically to traces of each type.',
            'Container arrays (eg `annotations`) have special handling:',
            'An object ending in `defaults` (eg `annotationdefaults`) is applied',
            'to each array item. But if an item has a `templateitemname` key',
            'we look in the template array for an item with matching `name` and',
            'apply that instead. If no matching `name` is found we mark the item',
            'invisible. Any named template item not referenced is appended to',
            'the end of the array, so you can use this for a watermark annotation',
            'or a logo image, for example. To omit one of these items on the plot,',
            'make an item with matching `templateitemname` and `visible: false`.'
        ].join(' ')
    },

    newshape: drawNewShapeAttrs.newshape,
    activeshape: drawNewShapeAttrs.activeshape,

    newselection: drawNewSelectionAttrs.newselection,
    activeselection: drawNewSelectionAttrs.activeselection,

    meta: {
        valType: 'any',
        arrayOk: true,
        editType: 'plot',
        description: [
            'Assigns extra meta information that can be used in various `text` attributes.',
            'Attributes such as the graph, axis and colorbar `title.text`, annotation `text`',
            '`trace.name` in legend items, `rangeselector`, `updatemenus` and `sliders` `label` text',
            'all support `meta`. One can access `meta` fields using template strings:',
            '`%{meta[i]}` where `i` is the index of the `meta`',
            'item in question.',
            '`meta` can also be an object for example `{key: value}` which can be accessed',
            '%{meta[key]}.'
        ].join(' ')
    },

    transition: extendFlat({}, animationAttrs.transition, {
        description: [
            'Sets transition options used during Plotly.react updates.'
        ].join(' '),
        editType: 'none'
    }),
};
