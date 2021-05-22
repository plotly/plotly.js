'use strict';

var heatmapAttrs = require('../heatmap/attributes');
var colorScaleAttrs = require('../../components/colorscale/attributes');

var extendFlat = require('../../lib/extend').extendFlat;
var overrideAll = require('../../plot_api/edit_types').overrideAll;

var commonList = [
    'z',
    'x', 'x0', 'dx',
    'y', 'y0', 'dy',
    'text', 'transpose',
    'xtype', 'ytype'
];

var attrs = {};

for(var i = 0; i < commonList.length; i++) {
    var k = commonList[i];
    attrs[k] = heatmapAttrs[k];
}

attrs.zsmooth = {
    valType: 'enumerated',
    values: ['fast', false],
    dflt: 'fast',
    editType: 'calc',
    description: 'Picks a smoothing algorithm use to smooth `z` data.'
};

extendFlat(
    attrs,
    colorScaleAttrs('', {cLetter: 'z', autoColorDflt: false})
);

module.exports = overrideAll(attrs, 'calc', 'nested');
