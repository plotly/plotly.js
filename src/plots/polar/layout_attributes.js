/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var colorAttrs = require('../../components/color/attributes');
var axesAttrs = require('../cartesian/layout_attributes');
var domainAttrs = require('../domain_attributes');
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

    // TODO add spike* attributes down the road

    // should we add zeroline* attributes?

}, 'plot', 'from-root');

var axisTickAttrs = overrideAll({
    tickmode: axesAttrs.tickmode,
    nticks: axesAttrs.nticks,
    tick0: axesAttrs.tick0,
    dtick: axesAttrs.dtick,
    tickvals: axesAttrs.tickvals,
    ticktext: axesAttrs.ticktext,
    ticks: axesAttrs.ticks,
    ticklen: axesAttrs.ticklen,
    tickwidth: axesAttrs.tickwidth,
    tickcolor: axesAttrs.tickcolor,
    showticklabels: axesAttrs.showticklabels,
    showtickprefix: axesAttrs.showtickprefix,
    tickprefix: axesAttrs.tickprefix,
    showticksuffix: axesAttrs.showticksuffix,
    ticksuffix: axesAttrs.ticksuffix,
    showexponent: axesAttrs.showexponent,
    exponentformat: axesAttrs.exponentformat,
    separatethousands: axesAttrs.separatethousands,
    tickfont: axesAttrs.tickfont,
    tickangle: axesAttrs.tickangle,
    tickformat: axesAttrs.tickformat,
    tickformatstops: axesAttrs.tickformatstops,
    layer: axesAttrs.layer
}, 'plot', 'from-root');

var radialAxisAttrs = {
    visible: extendFlat({}, axesAttrs.visible, {dflt: true}),
    type: axesAttrs.type,

    autorange: axesAttrs.autorange,
    rangemode: {
        valType: 'enumerated',
        values: ['tozero', 'nonnegative', 'normal'],
        dflt: 'tozero',
        role: 'style',
        editType: 'calc',
        description: [
            'If *tozero*`, the range extends to 0,',
            'regardless of the input data',
            'If *nonnegative*, the range is non-negative,',
            'regardless of the input data.',
            'If *normal*, the range is computed in relation to the extrema',
            'of the input data (same behavior as for cartesian axes).'
        ].join(' ')
    },
    range: axesAttrs.range,

    categoryorder: axesAttrs.categoryorder,
    categoryarray: axesAttrs.categoryarray,

    angle: {
        valType: 'angle',
        editType: 'plot',
        role: 'info',
        description: [
            'Sets the angle (in degrees) from which the radial axis is drawn.',
            'Note that by default, radial axis line on the theta=0 line',
            'corresponds to a line pointing right (like what mathematicians prefer).',
            'Defaults to the first `polar.sector` angle.'
        ].join(' ')
    },

    side: {
        valType: 'enumerated',
        // TODO add 'center' for `showline: false` radial axes
        values: ['clockwise', 'counterclockwise'],
        dflt: 'clockwise',
        editType: 'plot',
        role: 'info',
        description: [
            'Determines on which side of radial axis line',
            'the tick and tick labels appear.'
        ].join(' ')
    },


    title: extendFlat({}, axesAttrs.title, {editType: 'plot', dflt: ''}),
    titlefont: overrideAll(axesAttrs.titlefont, 'plot', 'from-root'),
    // might need a 'titleside' and even 'titledirection' down the road

    hoverformat: axesAttrs.hoverformat,

    // More attributes:

    // We'll need some attribute that determines the span
    // to draw donut-like charts
    // e.g. https://github.com/matplotlib/matplotlib/issues/4217
    //
    // maybe something like 'span' or 'hole' (like pie, but pie set it in data coords?)
    // span: {},
    // hole: 1

    // maybe should add a boolean to enable square grid lines
    // and square axis lines
    // (most common in radar-like charts)
    // e.g. squareline/squaregrid or showline/showgrid: 'square' (on-top of true)

    editType: 'calc'
};

extendFlat(
    radialAxisAttrs,

    // N.B. radialaxis grid lines are circular,
    // but radialaxis lines are straight from circle center to outer bound
    axisLineGridAttr,
    axisTickAttrs
);

var angularAxisAttrs = {
    visible: extendFlat({}, axesAttrs.visible, {dflt: true}),
    type: {
        valType: 'enumerated',
        // 'linear' should maybe be called 'angle' or 'angular' here
        // to make clear that axis here is periodic and more tightly match
        // `thetaunit`?
        //
        // no 'log' for now
        values: ['-', 'linear', 'date', 'category'],
        dflt: '-',
        role: 'info',
        editType: 'calc',
        description: [
            'Sets the angular axis type.',
            'If *linear*, set `thetaunit` to determine the unit in which axis value are shown.',
            'If *date*, use `period` to set the unit of time that determines a complete rotation',
            'If *category, use `period` to set the number of integer coordinates around polar axis.'
        ].join(' ')
    },

    categoryorder: axesAttrs.categoryorder,
    categoryarray: axesAttrs.categoryarray,

    thetaunit: {
        valType: 'enumerated',
        values: ['radians', 'degrees'],
        dflt: 'degrees',
        role: 'info',
        editType: 'calc',
        description: [
            'Sets the format unit of the formatted *theta* values.',
            'Has an effect only when `angularaxis.type` is *linear*.'
        ].join(' ')
    },

    period: {
        valType: 'any',
        editType: 'calc',
        role: 'info',
        description: ''

        // 360 / 2*pi for linear (might not need to set it)
        // and to full range for other types

        // 'period' is the angular equivalent to 'range'

        // similar to dtick, one way to achieve e.g.:
        // - period that equals the timeseries length
        //  http://flowingdata.com/2017/01/24/one-dataset-visualized-25-ways/18-polar-coordinates/
        // - and 1-year periods (focusing on seasonal change0
        //  http://otexts.org/fpp2/seasonal-plots.html
        //  https://blogs.scientificamerican.com/sa-visual/why-are-so-many-babies-born-around-8-00-a-m/
        //  http://www.seasonaladjustment.com/2012/09/05/clock-plot-visualising-seasonality-using-r-and-ggplot2-part-3/
        //  https://i.pinimg.com/736x/49/b9/72/49b972ccb3206a1a6d6f870dac543280.jpg
        //  https://www.climate-lab-book.ac.uk/spirals/
    },

    direction: {
        valType: 'enumerated',
        values: ['counterclockwise', 'clockwise'],
        // we could make the default 'clockwise' for category and date angular axes
        dflt: 'counterclockwise',
        role: 'info',
        editType: 'calc',
        description: [
            'Sets the direction corresponding to positive angles.'
        ].join(' ')
    },

    rotation: {
        valType: 'angle',
        // we could maybe make `rotation: 90` by default for category and date angular axes
        dflt: 0,
        editType: 'calc',
        role: 'info',
        description: [
            'Sets that start position (in degrees) of the angular axis',
            'Note that by default, polar subplots are orientation such that the theta=0',
            'corresponds to a line pointing right (like what mathematicians prefer).',
            'For example to make the angular axis start from the North (like on a compass),',
            'set `angularaxis.rotation` to *90*.'
        ].join(' ')
    },

    hoverformat: axesAttrs.hoverformat,

    editType: 'calc'
};

extendFlat(
    angularAxisAttrs,

    // N.B. angular grid lines are straight lines from circle center to outer bound
    // the angular line is circular bounding the polar plot area.
    axisLineGridAttr,

    // N.B. ticksuffix defaults to '°' for angular axes with `thetaunit: 'degrees'`
    axisTickAttrs
);

module.exports = {
    // TODO for x/y/zoom system for paper-based zooming:
    // x: {},
    // y: {},
    // zoom: {},

    domain: domainAttrs({name: 'polar', editType: 'plot'}),

    sector: {
        valType: 'info_array',
        items: [
            {valType: 'number', editType: 'plot'},
            {valType: 'number', editType: 'plot'}
        ],
        dflt: [0, 360],
        role: 'info',
        editType: 'plot',
        description: [
            'Sets angular span of this polar subplot with two angles (in degrees).',
            'Sector are assumed to be spanned in the counterclockwise direction',
            'with *0* corresponding to rightmost limit of the polar subplot.'
        ].join(' ')
    },

    bgcolor: {
        valType: 'color',
        role: 'style',
        editType: 'plot',
        dflt: colorAttrs.background,
        description: 'Set the background color of the subplot'
    },

    radialaxis: radialAxisAttrs,
    angularaxis: angularAxisAttrs,

    // TODO maybe?
    // annotations:

    editType: 'calc'
};
