'use strict';

var baseAttrs = require('../../plots/attributes');
var domainAttrs = require('../../plots/domain').attributes;
var fontAttrs = require('../../plots/font_attributes');
var colorAttrs = require('../../components/color/attributes');
const { hovertemplateAttrs, texttemplateAttrs, templatefallbackAttrs } = require('../../plots/template_attributes');

var extendFlat = require('../../lib/extend').extendFlat;
var pattern = require('../../components/drawing/attributes').pattern;

var textFontAttrs = fontAttrs({
    editType: 'plot',
    arrayOk: true,
    colorEditType: 'plot',
    description: 'Sets the font used for `textinfo`.'
});

module.exports = {
    labels: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Sets the sector labels.',
            'If `labels` entries are duplicated, we sum associated `values`',
            'or simply count occurrences if `values` is not provided.',
            'For other array attributes (including color) we use the first',
            'non-empty entry among all occurrences of the label.'
        ].join(' ')
    },
    // equivalent of x0 and dx, if label is missing
    label0: {
        valType: 'number',
        dflt: 0,
        editType: 'calc',
        description: [
            'Alternate to `labels`.',
            'Builds a numeric set of labels.',
            'Use with `dlabel`',
            'where `label0` is the starting label and `dlabel` the step.'
        ].join(' ')
    },
    dlabel: {
        valType: 'number',
        dflt: 1,
        editType: 'calc',
        description: 'Sets the label step. See `label0` for more info.'
    },

    values: {
        valType: 'data_array',
        editType: 'calc',
        description: ['Sets the values of the sectors.', 'If omitted, we count occurrences of each label.'].join(' ')
    },

    marker: {
        colors: {
            valType: 'data_array', // TODO 'color_array' ?
            editType: 'calc',
            description: [
                'Sets the color of each sector.',
                'If not specified, the default trace color set is used',
                'to pick the sector colors.'
            ].join(' ')
        },

        line: {
            color: {
                valType: 'color',
                dflt: colorAttrs.defaultLine,
                arrayOk: true,
                editType: 'style',
                description: ['Sets the color of the line enclosing each sector.'].join(' ')
            },
            width: {
                valType: 'number',
                min: 0,
                dflt: 0,
                arrayOk: true,
                editType: 'style',
                description: ['Sets the width (in px) of the line enclosing each sector.'].join(' ')
            },
            editType: 'calc'
        },
        pattern: pattern,
        editType: 'calc'
    },

    text: {
        valType: 'data_array',
        editType: 'plot',
        description: [
            'Sets text elements associated with each sector.',
            'If trace `textinfo` contains a *text* flag, these elements will be seen',
            'on the chart.',
            'If trace `hoverinfo` contains a *text* flag and *hovertext* is not set,',
            'these elements will be seen in the hover labels.'
        ].join(' ')
    },
    hovertext: {
        valType: 'string',
        dflt: '',
        arrayOk: true,
        editType: 'style',
        description: [
            'Sets hover text elements associated with each sector.',
            'If a single string, the same string appears for',
            'all data points.',
            'If an array of string, the items are mapped in order of',
            "this trace's sectors.",
            'To be seen, trace `hoverinfo` must contain a *text* flag.'
        ].join(' ')
    },

    // 'see eg:'
    // 'https://www.e-education.psu.edu/natureofgeoinfo/sites/www.e-education.psu.edu.natureofgeoinfo/files/image/hisp_pies.gif',
    // '(this example involves a map too - may someday be a whole trace type',
    // 'of its own. but the point is the size of the whole pie is important.)'
    scalegroup: {
        valType: 'string',
        dflt: '',
        editType: 'calc',
        description: [
            'If there are multiple pie charts that should be sized according to',
            'their totals, link them by providing a non-empty group id here',
            'shared by every trace in the same group.'
        ].join(' ')
    },

    // labels (legend is handled by plots.attributes.showlegend and layout.hiddenlabels)
    textinfo: {
        valType: 'flaglist',
        flags: ['label', 'text', 'value', 'percent'],
        extras: ['none'],
        editType: 'calc',
        description: ['Determines which trace information appear on the graph.'].join(' ')
    },
    hoverinfo: extendFlat({}, baseAttrs.hoverinfo, {
        flags: ['label', 'text', 'value', 'percent', 'name']
    }),
    hovertemplate: hovertemplateAttrs({}, { keys: ['label', 'color', 'value', 'percent', 'text'] }),
    hovertemplatefallback: templatefallbackAttrs(),
    texttemplate: texttemplateAttrs({ editType: 'plot' }, { keys: ['label', 'color', 'value', 'percent', 'text'] }),
    texttemplatefallback: templatefallbackAttrs({ editType: 'plot' }),
    textposition: {
        valType: 'enumerated',
        values: ['inside', 'outside', 'auto', 'none'],
        dflt: 'auto',
        arrayOk: true,
        editType: 'plot',
        description: ['Specifies the location of the `textinfo`.'].join(' ')
    },
    textfont: extendFlat({}, textFontAttrs, {
        description: 'Sets the font used for `textinfo`.'
    }),
    insidetextorientation: {
        valType: 'enumerated',
        values: ['horizontal', 'radial', 'tangential', 'auto'],
        dflt: 'auto',
        editType: 'plot',
        description: [
            'Controls the orientation of the text inside chart sectors.',
            'When set to *auto*, text may be oriented in any direction in order',
            'to be as big as possible in the middle of a sector.',
            'The *horizontal* option orients text to be parallel with the bottom',
            'of the chart, and may make text smaller in order to achieve that goal.',
            'The *radial* option orients text along the radius of the sector.',
            'The *tangential* option orients text perpendicular to the radius of the sector.'
        ].join(' ')
    },
    insidetextfont: extendFlat({}, textFontAttrs, {
        description: 'Sets the font used for `textinfo` lying inside the sector.'
    }),
    outsidetextfont: extendFlat({}, textFontAttrs, {
        description: 'Sets the font used for `textinfo` lying outside the sector.'
    }),
    automargin: {
        valType: 'boolean',
        dflt: false,
        editType: 'plot',
        description: ['Determines whether outside text labels can push the margins.'].join(' ')
    },
    showlegend: extendFlat({}, baseAttrs.showlegend, {
        arrayOk: true,
        description: [
            'Determines whether or not items corresponding to the pie slices are shown in the',
            'legend. Can be an array if `values` is set. In that case, each entry specifies',
            'appearance in the legend for one slice.'
        ].join(' ')
    }),
    legend: extendFlat({}, baseAttrs.legend, {
        arrayOk: true,
        description: [
            'Sets the reference to a legend to show the pie slices in. Can be an array if `values`',
            'is set. In that case, each entry specifies the legend reference for one slice.',
            'References to these legends are *legend*, *legend2*, *legend3*, etc.',
            'Settings for these legends are set in the layout, under',
            '`layout.legend`, `layout.legend2`, etc.'
        ].join(' ')
    }),
    title: {
        text: {
            valType: 'string',
            dflt: '',
            editType: 'plot',
            description: ['Sets the title of the chart.', 'If it is empty, no title is displayed.'].join(' ')
        },
        font: extendFlat({}, textFontAttrs, {
            description: 'Sets the font used for `title`.'
        }),
        position: {
            valType: 'enumerated',
            values: [
                'top left',
                'top center',
                'top right',
                'middle center',
                'bottom left',
                'bottom center',
                'bottom right'
            ],
            editType: 'plot',
            description: ['Specifies the location of the `title`.'].join(' ')
        },

        editType: 'plot'
    },

    // position and shape
    domain: domainAttrs({ name: 'pie', trace: true, editType: 'calc' }),

    hole: {
        valType: 'number',
        min: 0,
        max: 1,
        dflt: 0,
        editType: 'calc',
        description: ['Sets the fraction of the radius to cut out of the pie.', 'Use this to make a donut chart.'].join(
            ' '
        )
    },

    // ordering and direction
    sort: {
        valType: 'boolean',
        dflt: true,
        editType: 'calc',
        description: ['Determines whether or not the sectors are reordered', 'from largest to smallest.'].join(' ')
    },
    direction: {
        /**
         * there are two common conventions, both of which place the first
         * (largest, if sorted) slice with its left edge at 12 o'clock but
         * succeeding slices follow either cw or ccw from there.
         *
         * see http://visage.co/data-visualization-101-pie-charts/
         */
        valType: 'enumerated',
        values: ['clockwise', 'counterclockwise'],
        dflt: 'counterclockwise',
        editType: 'calc',
        description: ['Specifies the direction at which succeeding sectors follow', 'one another.'].join(' ')
    },
    rotation: {
        valType: 'angle',
        dflt: 0,
        editType: 'calc',
        description: ["Instead of the first slice starting at 12 o'clock,", 'rotate to some other angle.'].join(' ')
    },

    pull: {
        valType: 'number',
        min: 0,
        max: 1,
        dflt: 0,
        arrayOk: true,
        editType: 'calc',
        description: [
            'Sets the fraction of larger radius to pull the sectors',
            'out from the center. This can be a constant',
            'to pull all slices apart from each other equally',
            'or an array to highlight one or more slices.'
        ].join(' ')
    }
};
