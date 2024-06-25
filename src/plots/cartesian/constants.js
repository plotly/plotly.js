'use strict';

var counterRegex = require('../../lib/regex').counter;

module.exports = {
    idRegex: {
        x: counterRegex('x', '( domain)?'),
        y: counterRegex('y', '( domain)?')
    },

    attrRegex: counterRegex('[xy]axis'),

    // axis match regular expression
    xAxisMatch: counterRegex('xaxis'),
    yAxisMatch: counterRegex('yaxis'),

    // pattern matching axis ids and names
    // note that this is more permissive than counterRegex, as
    // id2name, name2id, and cleanId accept "x1" etc
    AX_ID_PATTERN: /^[xyz][0-9]*( domain)?$/,
    AX_NAME_PATTERN: /^[xyz]axis[0-9]*$/,

    // and for 2D subplots
    SUBPLOT_PATTERN: /^x([0-9]*)y([0-9]*)$/,

    HOUR_PATTERN: 'hour',
    WEEKDAY_PATTERN: 'day of week',

    // pixels to move mouse before you stop clamping to starting point
    MINDRAG: 8,

    // smallest dimension allowed for a zoombox
    MINZOOM: 20,

    // width of axis drag regions
    DRAGGERSIZE: 20,

    // delay before a redraw (relayout) after smooth panning and zooming
    REDRAWDELAY: 50,

    // last resort axis ranges for x and y axes if we have no data
    DFLTRANGEX: [-1, 6],
    DFLTRANGEY: [-1, 4],

    // Layers to keep trace types in the right order
    // N.B. each  'unique' plot method must have its own layer
    traceLayerClasses: [
        'imagelayer',
        'heatmaplayer',
        'contourcarpetlayer', 'contourlayer',
        'funnellayer', 'waterfalllayer', 'barlayer',
        'carpetlayer',
        'violinlayer',
        'boxlayer',
        'ohlclayer',
        'scattercarpetlayer', 'scatterlayer'
    ],

    clipOnAxisFalseQuery: [
        '.scatterlayer',
        '.barlayer',
        '.funnellayer',
        '.waterfalllayer'
    ],

    layerValue2layerClass: {
        'above traces': 'above',
        'below traces': 'below'
    },

    zindexSeparator: 'z', // used for zindex of cartesian subplots e.g. xy, xyz2, xyz3, etc.
};
