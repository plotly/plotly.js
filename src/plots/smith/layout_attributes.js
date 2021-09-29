'use strict';

var colorAttrs = require('../../components/color/attributes');
var axesAttrs = require('../cartesian/layout_attributes');
var domainAttrs = require('../domain').attributes;
var extendFlat = require('../../lib').extendFlat;
var overrideAll = require('../../plot_api/edit_types').overrideAll;

var axisLineGridAttr = overrideAll({
    color: axesAttrs.color,
    showline: extendFlat({}, axesAttrs.showline, {dflt: true}),
    linecolor: axesAttrs.linecolor,
    linewidth: axesAttrs.linewidth,
    showgrid: extendFlat({}, axesAttrs.showgrid, {dflt: true}),
    gridcolor: axesAttrs.gridcolor,
    gridwidth: axesAttrs.gridwidth
}, 'plot', 'from-root');

var axisTickAttrs = overrideAll({
    ticklen: axesAttrs.ticklen,
    tickwidth: extendFlat({}, axesAttrs.tickwidth, {dflt: 2}),
    tickcolor: axesAttrs.tickcolor,
    showticklabels: axesAttrs.showticklabels,
    showtickprefix: axesAttrs.showtickprefix,
    tickprefix: axesAttrs.tickprefix,
    showticksuffix: axesAttrs.showticksuffix,
    ticksuffix: axesAttrs.ticksuffix,
    showexponent: axesAttrs.showexponent,
    exponentformat: axesAttrs.exponentformat,
    minexponent: axesAttrs.minexponent,
    separatethousands: axesAttrs.separatethousands,
    tickfont: axesAttrs.tickfont,
    tickformat: axesAttrs.tickformat,
    hoverformat: axesAttrs.hoverformat,
    layer: axesAttrs.layer
}, 'plot', 'from-root');

var realAxisAttrs = {
    visible: extendFlat({}, axesAttrs.visible, {dflt: true}),

    tickvals: {
        dflt: [
            0.2, 0.4, 0.6, 0.8,
            1, 1.5, 2, 3, 4, 5, 10, 20
        ],
        valType: 'data_array',
        editType: 'plot',
        description: 'Sets the values at which ticks on this axis appear.'
    },

    tickangle: extendFlat({}, axesAttrs.tickangle, {dflt: 90}),

    ticks: {
        valType: 'enumerated',
        values: ['top', 'bottom', ''],
        editType: 'ticks',
        description: [
            'Determines whether ticks are drawn or not.',
            'If **, this axis\' ticks are not drawn.',
            'If *top* (*bottom*), this axis\' are drawn above (below)',
            'the axis line.'
        ].join(' ')
    },

    side: {
        valType: 'enumerated',
        values: ['top', 'bottom'],
        dflt: 'top',
        editType: 'plot',
        description: [
            'Determines on which side of real axis line',
            'the tick and tick labels appear.'
        ].join(' ')
    },

    title: {
        text: extendFlat({}, axesAttrs.title.text, {editType: 'plot', dflt: ''}),
        font: extendFlat({}, axesAttrs.title.font, {editType: 'plot'}),

        editType: 'plot'
    },

    editType: 'calc',
};

extendFlat(
    realAxisAttrs,
    axisLineGridAttr,
    axisTickAttrs
);

var imaginaryAxisAttrs = {
    visible: extendFlat({}, axesAttrs.visible, {dflt: true}),

    tickvals: {
        dflt: [
            -20, -10, -5, -4, -3, -2, -1.5, -1,
            -0.8, -0.6, -0.4, -0.2,
            0, 0.2, 0.4, 0.6, 0.8,
            1, 1.5, 2, 3, 4, 5, 10, 20
        ],
        valType: 'data_array',
        editType: 'plot',
        description: 'Sets the values at which ticks on this axis appear.'
    },

    tickangle: axesAttrs.tickangle,

    ticks: axesAttrs.ticks,

    editType: 'calc'
};

extendFlat(
    imaginaryAxisAttrs,
    axisLineGridAttr,
    axisTickAttrs
);

module.exports = {
    domain: domainAttrs({name: 'smith', editType: 'plot'}),

    bgcolor: {
        valType: 'color',
        editType: 'plot',
        dflt: colorAttrs.background,
        description: 'Set the background color of the subplot'
    },

    realaxis: realAxisAttrs,
    imaginaryaxis: imaginaryAxisAttrs,

    editType: 'calc'
};
