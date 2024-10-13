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
    gridwidth: axesAttrs.gridwidth,
    griddash: axesAttrs.griddash

    // TODO add spike* attributes down the road

    // should we add zeroline* attributes?

}, 'plot', 'from-root');

var axisTickAttrs = overrideAll({
    tickmode: axesAttrs.minor.tickmode,
    nticks: axesAttrs.nticks,
    tick0: axesAttrs.tick0,
    dtick: axesAttrs.dtick,
    tickvals: axesAttrs.tickvals,
    ticktext: axesAttrs.ticktext,
    ticks: axesAttrs.ticks,
    ticklen: axesAttrs.ticklen,
    tickwidth: axesAttrs.tickwidth,
    tickcolor: axesAttrs.tickcolor,
    ticklabelstep: axesAttrs.ticklabelstep,
    showticklabels: axesAttrs.showticklabels,
    labelalias: axesAttrs.labelalias,
    showtickprefix: axesAttrs.showtickprefix,
    tickprefix: axesAttrs.tickprefix,
    showticksuffix: axesAttrs.showticksuffix,
    ticksuffix: axesAttrs.ticksuffix,
    showexponent: axesAttrs.showexponent,
    exponentformat: axesAttrs.exponentformat,
    minexponent: axesAttrs.minexponent,
    separatethousands: axesAttrs.separatethousands,
    tickfont: axesAttrs.tickfont,
    tickangle: axesAttrs.tickangle,
    tickformat: axesAttrs.tickformat,
    tickformatstops: axesAttrs.tickformatstops,
    layer: axesAttrs.layer
}, 'plot', 'from-root');

var radialAxisAttrs = {
    visible: extendFlat({}, axesAttrs.visible, {dflt: true}),
    type: extendFlat({}, axesAttrs.type, {
        values: ['-', 'linear', 'log', 'date', 'category']
    }),
    autotypenumbers: axesAttrs.autotypenumbers,

    autorangeoptions: {
        minallowed: axesAttrs.autorangeoptions.minallowed,
        maxallowed: axesAttrs.autorangeoptions.maxallowed,
        clipmin: axesAttrs.autorangeoptions.clipmin,
        clipmax: axesAttrs.autorangeoptions.clipmax,
        include: axesAttrs.autorangeoptions.include,
        editType: 'plot'
    },
    autorange: extendFlat({}, axesAttrs.autorange, {editType: 'plot'}),
    rangemode: {
        valType: 'enumerated',
        values: ['tozero', 'nonnegative', 'normal'],
        dflt: 'tozero',
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
    minallowed: extendFlat({}, axesAttrs.minallowed, {editType: 'plot'}),
    maxallowed: extendFlat({}, axesAttrs.maxallowed, {editType: 'plot'}),
    range: extendFlat({}, axesAttrs.range, {
        items: [
            {valType: 'any', editType: 'plot', impliedEdits: {'^autorange': false}},
            {valType: 'any', editType: 'plot', impliedEdits: {'^autorange': false}}
        ],
        editType: 'plot'
    }),

    categoryorder: axesAttrs.categoryorder,
    categoryarray: axesAttrs.categoryarray,

    angle: {
        valType: 'angle',
        editType: 'plot',
        description: [
            'Sets the angle (in degrees) from which the radial axis is drawn.',
            'Note that by default, radial axis line on the theta=0 line',
            'corresponds to a line pointing right (like what mathematicians prefer).',
            'Defaults to the first `polar.sector` angle.'
        ].join(' ')
    },

    autotickangles: axesAttrs.autotickangles,

    side: {
        valType: 'enumerated',
        // TODO add 'center' for `showline: false` radial axes
        values: ['clockwise', 'counterclockwise'],
        dflt: 'clockwise',
        editType: 'plot',
        description: [
            'Determines on which side of radial axis line',
            'the tick and tick labels appear.'
        ].join(' ')
    },


    title: {
        // radial title is not gui-editable at the moment,
        // so it needs dflt: '', similar to carpet axes.
        text: extendFlat({}, axesAttrs.title.text, {editType: 'plot', dflt: ''}),
        font: extendFlat({}, axesAttrs.title.font, {editType: 'plot'}),

        // TODO
        // - might need a 'titleside' and even 'titledirection' down the road
        // - what about standoff ??

        editType: 'plot'
    },

    hoverformat: axesAttrs.hoverformat,

    uirevision: {
        valType: 'any',
        editType: 'none',
        description: [
            'Controls persistence of user-driven changes in axis `range`,',
            '`autorange`, `angle`, and `title` if in `editable: true` configuration.',
            'Defaults to `polar<N>.uirevision`.'
        ].join(' ')
    },

    editType: 'calc',
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
        // skip 'date' for first push
        // no 'log' for now
        values: ['-', 'linear', 'category'],
        dflt: '-',
        editType: 'calc',
        _noTemplating: true,
        description: [
            'Sets the angular axis type.',
            'If *linear*, set `thetaunit` to determine the unit in which axis value are shown.',
            'If *category, use `period` to set the number of integer coordinates around polar axis.'
        ].join(' ')
    },
    autotypenumbers: axesAttrs.autotypenumbers,

    categoryorder: axesAttrs.categoryorder,
    categoryarray: axesAttrs.categoryarray,

    thetaunit: {
        valType: 'enumerated',
        values: ['radians', 'degrees'],
        dflt: 'degrees',
        editType: 'calc',
        description: [
            'Sets the format unit of the formatted *theta* values.',
            'Has an effect only when `angularaxis.type` is *linear*.'
        ].join(' ')
    },

    period: {
        valType: 'number',
        editType: 'calc',
        min: 0,
        description: [
            'Set the angular period.',
            'Has an effect only when `angularaxis.type` is *category*.',
        ].join(' ')
        // Examples for date axes:
        //
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
        dflt: 'counterclockwise',
        editType: 'calc',
        description: [
            'Sets the direction corresponding to positive angles.'
        ].join(' ')
    },

    rotation: {
        valType: 'angle',
        editType: 'calc',
        description: [
            'Sets that start position (in degrees) of the angular axis',
            'By default, polar subplots with `direction` set to *counterclockwise*',
            'get a `rotation` of *0*',
            'which corresponds to due East (like what mathematicians prefer).',
            'In turn, polar with `direction` set to *clockwise* get a rotation of *90*',
            'which corresponds to due North (like on a compass),'
        ].join(' ')
    },

    hoverformat: axesAttrs.hoverformat,

    uirevision: {
        valType: 'any',
        editType: 'none',
        description: [
            'Controls persistence of user-driven changes in axis `rotation`.',
            'Defaults to `polar<N>.uirevision`.'
        ].join(' ')
    },

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
        editType: 'plot',
        description: [
            'Sets angular span of this polar subplot with two angles (in degrees).',
            'Sector are assumed to be spanned in the counterclockwise direction',
            'with *0* corresponding to rightmost limit of the polar subplot.'
        ].join(' ')
    },
    hole: {
        valType: 'number',
        min: 0,
        max: 1,
        dflt: 0,
        editType: 'plot',
        description: [
            'Sets the fraction of the radius to cut out of the polar subplot.'
        ].join(' ')
    },

    bgcolor: {
        valType: 'color',
        editType: 'plot',
        dflt: colorAttrs.background,
        description: 'Set the background color of the subplot'
    },

    radialaxis: radialAxisAttrs,
    angularaxis: angularAxisAttrs,

    gridshape: {
        valType: 'enumerated',
        values: ['circular', 'linear'],
        dflt: 'circular',
        editType: 'plot',
        description: [
            'Determines if the radial axis grid lines and angular axis line are drawn',
            'as *circular* sectors or as *linear* (polygon) sectors.',
            'Has an effect only when the angular axis has `type` *category*.',
            'Note that `radialaxis.angle` is snapped to the angle of the closest',
            'vertex when `gridshape` is *circular*',
            '(so that radial axis scale is the same as the data scale).'
        ].join(' ')
    },

    // TODO maybe?
    // annotations:

    uirevision: {
        valType: 'any',
        editType: 'none',
        description: [
            'Controls persistence of user-driven changes in axis attributes,',
            'if not overridden in the individual axes.',
            'Defaults to `layout.uirevision`.'
        ].join(' ')
    },

    editType: 'calc'
};
