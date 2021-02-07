'use strict';

var histogram2dAttrs = require('../histogram2d/attributes');
var contourAttrs = require('../contour/attributes');
var colorScaleAttrs = require('../../components/colorscale/attributes');

var extendFlat = require('../../lib/extend').extendFlat;

module.exports = extendFlat({
    x: histogram2dAttrs.x,
    y: histogram2dAttrs.y,
    z: histogram2dAttrs.z,
    marker: histogram2dAttrs.marker,

    histnorm: histogram2dAttrs.histnorm,
    histfunc: histogram2dAttrs.histfunc,
    nbinsx: histogram2dAttrs.nbinsx,
    xbins: histogram2dAttrs.xbins,
    nbinsy: histogram2dAttrs.nbinsy,
    ybins: histogram2dAttrs.ybins,
    autobinx: histogram2dAttrs.autobinx,
    autobiny: histogram2dAttrs.autobiny,

    bingroup: histogram2dAttrs.bingroup,
    xbingroup: histogram2dAttrs.xbingroup,
    ybingroup: histogram2dAttrs.ybingroup,

    autocontour: contourAttrs.autocontour,
    ncontours: contourAttrs.ncontours,
    contours: contourAttrs.contours,
    line: {
        color: contourAttrs.line.color,
        width: extendFlat({}, contourAttrs.line.width, {
            dflt: 0.5,
            description: 'Sets the contour line width in (in px)'
        }),
        dash: contourAttrs.line.dash,
        smoothing: contourAttrs.line.smoothing,
        editType: 'plot'
    },
    zhoverformat: histogram2dAttrs.zhoverformat,
    hovertemplate: histogram2dAttrs.hovertemplate
},
    colorScaleAttrs('', {
        cLetter: 'z',
        editTypeOverride: 'calc'
    })
);
