'use strict';

var heatmapAttrs = require('../heatmap/attributes');
var contourAttrs = require('../contour/attributes');
var colorScaleAttrs = require('../../components/colorscale/attributes');

var extendFlat = require('../../lib/extend').extendFlat;

var contourContourAttrs = contourAttrs.contours;

module.exports = extendFlat({
    carpet: {
        valType: 'string',
        editType: 'calc',
        description: [
            'The `carpet` of the carpet axes on which this contour trace lies'
        ].join(' ')
    },
    z: heatmapAttrs.z,
    a: heatmapAttrs.x,
    a0: heatmapAttrs.x0,
    da: heatmapAttrs.dx,
    b: heatmapAttrs.y,
    b0: heatmapAttrs.y0,
    db: heatmapAttrs.dy,
    text: heatmapAttrs.text,
    hovertext: heatmapAttrs.hovertext,
    transpose: heatmapAttrs.transpose,
    atype: heatmapAttrs.xtype,
    btype: heatmapAttrs.ytype,

    fillcolor: contourAttrs.fillcolor,

    autocontour: contourAttrs.autocontour,
    ncontours: contourAttrs.ncontours,

    contours: {
        type: contourContourAttrs.type,
        start: contourContourAttrs.start,
        end: contourContourAttrs.end,
        size: contourContourAttrs.size,
        coloring: {
            // from contourAttrs.contours.coloring but no 'heatmap' option
            valType: 'enumerated',
            values: ['fill', 'lines', 'none'],
            dflt: 'fill',
            editType: 'calc',
            description: [
                'Determines the coloring method showing the contour values.',
                'If *fill*, coloring is done evenly between each contour level',
                'If *lines*, coloring is done on the contour lines.',
                'If *none*, no coloring is applied on this trace.'
            ].join(' ')
        },
        showlines: contourContourAttrs.showlines,
        showlabels: contourContourAttrs.showlabels,
        labelfont: contourContourAttrs.labelfont,
        labelformat: contourContourAttrs.labelformat,
        operation: contourContourAttrs.operation,
        value: contourContourAttrs.value,
        editType: 'calc',
        impliedEdits: {autocontour: false}
    },

    line: {
        color: contourAttrs.line.color,
        width: contourAttrs.line.width,
        dash: contourAttrs.line.dash,
        smoothing: contourAttrs.line.smoothing,
        editType: 'plot'
    },

    transforms: undefined,
    zindex: {
        valType: 'integer',
        dflt: 0,
        editType: 'calc',
        description: [
            'Sets the layer on which this trace is displayed, relative to ',
            'other traces on the same axes. Traces with higher `zindex` ',
            'appear in front of those with lower `zindex`.'
        ].join(' ')
    }
},

    colorScaleAttrs('', {
        cLetter: 'z',
        autoColorDflt: false
    })
);
