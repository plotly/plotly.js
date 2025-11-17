'use strict';

var histogram2dAttrs = require('../histogram2d/attributes');
var contourAttrs = require('../contour/attributes');
var colorScaleAttrs = require('../../components/colorscale/attributes');
var axisHoverFormat = require('../../plots/cartesian/axis_format_attributes').axisHoverFormat;

var extendFlat = require('../../lib/extend').extendFlat;

module.exports = extendFlat(
    {
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
        xhoverformat: axisHoverFormat('x'),
        yhoverformat: axisHoverFormat('y'),
        zhoverformat: axisHoverFormat('z', 1),
        hovertemplate: histogram2dAttrs.hovertemplate,
        hovertemplatefallback: histogram2dAttrs.hovertemplatefallback,
        texttemplate: contourAttrs.texttemplate,
        texttemplatefallback: contourAttrs.texttemplatefallback,
        textfont: contourAttrs.textfont
    },
    colorScaleAttrs('', {
        cLetter: 'z',
        editTypeOverride: 'calc'
    })
);
