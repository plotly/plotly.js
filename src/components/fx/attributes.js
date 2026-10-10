'use strict';

var fontAttrs = require('../../plots/font_attributes');
var hoverLabelAttrs = require('./layout_attributes').hoverlabel;
var extendFlat = require('../../lib/extend').extendFlat;

module.exports = {
    hoverlabel: {
        bgcolor: extendFlat({}, hoverLabelAttrs.bgcolor, {
            arrayOk: true,
            description: 'Sets the background color of the hover labels for this trace'
        }),
        bordercolor: extendFlat({}, hoverLabelAttrs.bordercolor, {
            arrayOk: true,
            description: 'Sets the border color of the hover labels for this trace.'
        }),
        borderwidth: extendFlat({}, hoverLabelAttrs.borderwidth, {
            description: 'Sets the border width (in px) of the hover labels for this trace.'
        }),
        borderradius: extendFlat({}, hoverLabelAttrs.borderradius, {
            description: 'Sets the border radius (in px) of the hover labels for this trace.'
        }),
        borderpad: extendFlat({}, hoverLabelAttrs.borderpad, {
            description: 'Sets the padding (in px) between the text and the border of the hover labels for this trace.'
        }),
        namecolor: extendFlat({}, hoverLabelAttrs.namecolor, {
            description: 'Sets the text color of the secondary hover label for this trace.'
        }),
        bgnamecolor: extendFlat({}, hoverLabelAttrs.bgnamecolor, {
            description: 'Sets the background color of the secondary hover label for this trace.'
        }),
        shadow: extendFlat({}, hoverLabelAttrs.shadow, {
            description: 'Sets the shadow of the hover labels for this trace.'
        }),
        font: fontAttrs({
            arrayOk: true,
            editType: 'none',
            description: 'Sets the font used in hover labels.'
        }),
        align: extendFlat({}, hoverLabelAttrs.align, {arrayOk: true}),
        namelength: extendFlat({}, hoverLabelAttrs.namelength, {arrayOk: true}),
        showarrow: extendFlat({}, hoverLabelAttrs.showarrow),
        editType: 'none'
    }
};
