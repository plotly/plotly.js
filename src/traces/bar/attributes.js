'use strict';

var scatterAttrs = require('../scatter/attributes');
var axisHoverFormat = require('../../plots/cartesian/axis_format_attributes').axisHoverFormat;
var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var texttemplateAttrs = require('../../plots/template_attributes').texttemplateAttrs;
var colorScaleAttrs = require('../../components/colorscale/attributes');
var fontAttrs = require('../../plots/font_attributes');
var constants = require('./constants');
var pattern = require('../../components/drawing/attributes').pattern;

var extendFlat = require('../../lib/extend').extendFlat;

var textFontAttrs = fontAttrs({
    editType: 'calc',
    arrayOk: true,
    colorEditType: 'style',
    description: ''
});

var scatterMarkerAttrs = scatterAttrs.marker;
var scatterMarkerLineAttrs = scatterMarkerAttrs.line;

var markerLineWidth = extendFlat({},
    scatterMarkerLineAttrs.width, { dflt: 0 });

var markerLine = extendFlat({
    width: markerLineWidth,
    editType: 'calc'
}, colorScaleAttrs('marker.line'));

var marker = extendFlat({
    line: markerLine,
    editType: 'calc'
}, colorScaleAttrs('marker'), {
    opacity: {
        valType: 'number',
        arrayOk: true,
        dflt: 1,
        min: 0,
        max: 1,
        editType: 'style',
        description: 'Sets the opacity of the bars.'
    },
    pattern: pattern,
    cornerradius: {
        valType: 'any',
        editType: 'calc',
        description: [
            'Sets the rounding of corners. May be an integer number of pixels,',
            'or a percentage of bar width (as a string ending in %). Defaults to `layout.barcornerradius`.',
            'In stack or relative barmode, the first trace to set cornerradius is used for the whole stack.'
        ].join(' ')
    },
});

module.exports = {
    x: scatterAttrs.x,
    x0: scatterAttrs.x0,
    dx: scatterAttrs.dx,
    y: scatterAttrs.y,
    y0: scatterAttrs.y0,
    dy: scatterAttrs.dy,

    xperiod: scatterAttrs.xperiod,
    yperiod: scatterAttrs.yperiod,
    xperiod0: scatterAttrs.xperiod0,
    yperiod0: scatterAttrs.yperiod0,
    xperiodalignment: scatterAttrs.xperiodalignment,
    yperiodalignment: scatterAttrs.yperiodalignment,
    xhoverformat: axisHoverFormat('x'),
    yhoverformat: axisHoverFormat('y'),

    text: scatterAttrs.text,
    texttemplate: texttemplateAttrs({editType: 'plot'}, {
        keys: constants.eventDataKeys
    }),
    hovertext: scatterAttrs.hovertext,
    hovertemplate: hovertemplateAttrs({}, {
        keys: constants.eventDataKeys
    }),

    textposition: {
        valType: 'enumerated',
        values: ['inside', 'outside', 'auto', 'none'],
        dflt: 'auto',
        arrayOk: true,
        editType: 'calc',
        description: [
            'Specifies the location of the `text`.',
            '*inside* positions `text` inside, next to the bar end',
            '(rotated and scaled if needed).',
            '*outside* positions `text` outside, next to the bar end',
            '(scaled if needed), unless there is another bar stacked on',
            'this one, then the text gets pushed inside.',
            '*auto* tries to position `text` inside the bar, but if',
            'the bar is too small and no bar is stacked on this one',
            'the text is moved outside.',
            'If *none*, no text appears.'
        ].join(' ')
    },

    insidetextanchor: {
        valType: 'enumerated',
        values: ['end', 'middle', 'start'],
        dflt: 'end',
        editType: 'plot',
        description: [
            'Determines if texts are kept at center or start/end points in `textposition` *inside* mode.'
        ].join(' ')
    },

    textangle: {
        valType: 'angle',
        dflt: 'auto',
        editType: 'plot',
        description: [
            'Sets the angle of the tick labels with respect to the bar.',
            'For example, a `tickangle` of -90 draws the tick labels',
            'vertically. With *auto* the texts may automatically be',
            'rotated to fit with the maximum size in bars.'
        ].join(' ')
    },

    textfont: extendFlat({}, textFontAttrs, {
        description: 'Sets the font used for `text`.'
    }),

    insidetextfont: extendFlat({}, textFontAttrs, {
        description: 'Sets the font used for `text` lying inside the bar.'
    }),

    outsidetextfont: extendFlat({}, textFontAttrs, {
        description: 'Sets the font used for `text` lying outside the bar.'
    }),

    constraintext: {
        valType: 'enumerated',
        values: ['inside', 'outside', 'both', 'none'],
        dflt: 'both',
        editType: 'calc',
        description: [
            'Constrain the size of text inside or outside a bar to be no',
            'larger than the bar itself.'
        ].join(' ')
    },

    cliponaxis: extendFlat({}, scatterAttrs.cliponaxis, {
        description: [
            'Determines whether the text nodes',
            'are clipped about the subplot axes.',
            'To show the text nodes above axis lines and tick labels,',
            'make sure to set `xaxis.layer` and `yaxis.layer` to *below traces*.'
        ].join(' ')
    }),

    orientation: {
        valType: 'enumerated',
        values: ['v', 'h'],
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the orientation of the bars.',
            'With *v* (*h*), the value of the each bar spans',
            'along the vertical (horizontal).'
        ].join(' ')
    },

    base: {
        valType: 'any',
        dflt: null,
        arrayOk: true,
        editType: 'calc',
        description: [
            'Sets where the bar base is drawn (in position axis units).',
            'In *stack* or *relative* barmode,',
            'traces that set *base* will be excluded',
            'and drawn in *overlay* mode instead.'
        ].join(' ')
    },

    offset: {
        valType: 'number',
        dflt: null,
        arrayOk: true,
        editType: 'calc',
        description: [
            'Shifts the position where the bar is drawn',
            '(in position axis units).',
            'In *group* barmode,',
            'traces that set *offset* will be excluded',
            'and drawn in *overlay* mode instead.'
        ].join(' ')
    },

    width: {
        valType: 'number',
        dflt: null,
        min: 0,
        arrayOk: true,
        editType: 'calc',
        description: [
            'Sets the bar width (in position axis units).'
        ].join(' ')
    },

    marker: marker,

    offsetgroup: scatterAttrs.offsetgroup,
    alignmentgroup: scatterAttrs.alignmentgroup,

    selected: {
        marker: {
            opacity: scatterAttrs.selected.marker.opacity,
            color: scatterAttrs.selected.marker.color,
            editType: 'style'
        },
        textfont: scatterAttrs.selected.textfont,
        editType: 'style'
    },
    unselected: {
        marker: {
            opacity: scatterAttrs.unselected.marker.opacity,
            color: scatterAttrs.unselected.marker.color,
            editType: 'style'
        },
        textfont: scatterAttrs.unselected.textfont,
        editType: 'style'
    },
    zorder: scatterAttrs.zorder,
};
