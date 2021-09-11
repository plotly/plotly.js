'use strict';

var axesAttrs = require('../../plots/cartesian/layout_attributes');
var fontAttrs = require('../../plots/font_attributes');
var extendFlat = require('../../lib/extend').extendFlat;
var overrideAll = require('../../plot_api/edit_types').overrideAll;


module.exports = overrideAll({
// TODO: only right is supported currently
//     orient: {
//         valType: 'enumerated',
//         values: ['left', 'right', 'top', 'bottom'],
//         dflt: 'right',
//         description: [
//             'Determines which side are the labels on',
//             '(so left and right make vertical bars, etc.)'
//         ].join(' ')
//     },
    thicknessmode: {
        valType: 'enumerated',
        values: ['fraction', 'pixels'],
        dflt: 'pixels',
        description: [
            'Determines whether this color bar\'s thickness',
            '(i.e. the measure in the constant color direction)',
            'is set in units of plot *fraction* or in *pixels*.',
            'Use `thickness` to set the value.'
        ].join(' ')
    },
    thickness: {
        valType: 'number',
        min: 0,
        dflt: 30,
        description: [
            'Sets the thickness of the color bar',
            'This measure excludes the size of the padding, ticks and labels.'
        ].join(' ')
    },
    lenmode: {
        valType: 'enumerated',
        values: ['fraction', 'pixels'],
        dflt: 'fraction',
        description: [
            'Determines whether this color bar\'s length',
            '(i.e. the measure in the color variation direction)',
            'is set in units of plot *fraction* or in *pixels.',
            'Use `len` to set the value.'
        ].join(' ')
    },
    len: {
        valType: 'number',
        min: 0,
        dflt: 1,
        description: [
            'Sets the length of the color bar',
            'This measure excludes the padding of both ends.',
            'That is, the color bar length is this length minus the',
            'padding on both ends.'
        ].join(' ')
    },
    x: {
        valType: 'number',
        dflt: 1.02,
        min: -2,
        max: 3,
        description: [
            'Sets the x position of the color bar (in plot fraction).'
        ].join(' ')
    },
    xanchor: {
        valType: 'enumerated',
        values: ['left', 'center', 'right'],
        dflt: 'left',
        description: [
            'Sets this color bar\'s horizontal position anchor.',
            'This anchor binds the `x` position to the *left*, *center*',
            'or *right* of the color bar.'
        ].join(' ')
    },
    xpad: {
        valType: 'number',
        min: 0,
        dflt: 10,
        description: 'Sets the amount of padding (in px) along the x direction.'
    },
    y: {
        valType: 'number',
        dflt: 0.5,
        min: -2,
        max: 3,
        description: [
            'Sets the y position of the color bar (in plot fraction).'
        ].join(' ')
    },
    yanchor: {
        valType: 'enumerated',
        values: ['top', 'middle', 'bottom'],
        dflt: 'middle',
        description: [
            'Sets this color bar\'s vertical position anchor',
            'This anchor binds the `y` position to the *top*, *middle*',
            'or *bottom* of the color bar.'
        ].join(' ')
    },
    ypad: {
        valType: 'number',
        min: 0,
        dflt: 10,
        description: 'Sets the amount of padding (in px) along the y direction.'
    },
    // a possible line around the bar itself
    outlinecolor: axesAttrs.linecolor,
    outlinewidth: axesAttrs.linewidth,
    // Should outlinewidth have {dflt: 0} ?
    // another possible line outside the padding and tick labels
    bordercolor: axesAttrs.linecolor,
    borderwidth: {
        valType: 'number',
        min: 0,
        dflt: 0,
        description: [
            'Sets the width (in px) or the border enclosing this color bar.'
        ].join(' ')
    },
    bgcolor: {
        valType: 'color',
        dflt: 'rgba(0,0,0,0)',
        description: 'Sets the color of padded area.'
    },
    // tick and title properties named and function exactly as in axes
    tickmode: axesAttrs.tickmode,
    nticks: axesAttrs.nticks,
    tick0: axesAttrs.tick0,
    dtick: axesAttrs.dtick,
    tickvals: axesAttrs.tickvals,
    ticktext: axesAttrs.ticktext,
    ticks: extendFlat({}, axesAttrs.ticks, {dflt: ''}),
    ticklabeloverflow: extendFlat({}, axesAttrs.ticklabeloverflow, {
        description: [
            'Determines how we handle tick labels that would overflow either the graph div or the domain of the axis.',
            'The default value for inside tick labels is *hide past domain*.',
            'In other cases the default is *hide past div*.'
        ].join(' ')
    }),
    ticklabelposition: {
        valType: 'enumerated',
        values: [
            'outside', 'inside',
            'outside top', 'inside top',
            'outside bottom', 'inside bottom'
        ],
        dflt: 'outside',
        description: [
            'Determines where tick labels are drawn.'
        ].join(' ')
    },
    ticklen: axesAttrs.ticklen,
    tickwidth: axesAttrs.tickwidth,
    tickcolor: axesAttrs.tickcolor,
    showticklabels: axesAttrs.showticklabels,
    tickfont: fontAttrs({
        description: 'Sets the color bar\'s tick label font'
    }),
    tickangle: axesAttrs.tickangle,
    tickformat: axesAttrs.tickformat,
    tickformatstops: axesAttrs.tickformatstops,
    tickprefix: axesAttrs.tickprefix,
    showtickprefix: axesAttrs.showtickprefix,
    ticksuffix: axesAttrs.ticksuffix,
    showticksuffix: axesAttrs.showticksuffix,
    separatethousands: axesAttrs.separatethousands,
    exponentformat: axesAttrs.exponentformat,
    minexponent: axesAttrs.minexponent,
    showexponent: axesAttrs.showexponent,
    title: {
        text: {
            valType: 'string',
            description: [
                'Sets the title of the color bar.',
                'Note that before the existence of `title.text`, the title\'s',
                'contents used to be defined as the `title` attribute itself.',
                'This behavior has been deprecated.'
            ].join(' ')
        },
        font: fontAttrs({
            description: [
                'Sets this color bar\'s title font.',
                'Note that the title\'s font used to be set',
                'by the now deprecated `titlefont` attribute.'
            ].join(' ')
        }),
        side: {
            valType: 'enumerated',
            values: ['right', 'top', 'bottom'],
            dflt: 'top',
            description: [
                'Determines the location of color bar\'s title',
                'with respect to the color bar.',
                'Note that the title\'s location used to be set',
                'by the now deprecated `titleside` attribute.'
            ].join(' ')
        }
    },

    _deprecated: {
        title: {
            valType: 'string',
            description: [
                'Deprecated in favor of color bar\'s `title.text`.',
                'Note that value of color bar\'s `title` is no longer a simple',
                '*string* but a set of sub-attributes.'
            ].join(' ')
        },
        titlefont: fontAttrs({
            description: 'Deprecated in favor of color bar\'s `title.font`.'
        }),
        titleside: {
            valType: 'enumerated',
            values: ['right', 'top', 'bottom'],
            dflt: 'top',
            description: 'Deprecated in favor of color bar\'s `title.side`.'
        }
    }
}, 'colorbars', 'from-root');
