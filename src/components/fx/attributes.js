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
