'use strict';

var Color = require('../../color');
var Lib = require('../../../lib');

function dfltLabelYanchor(isLine, labelTextPosition) {
    // If shape is a line, default y-anchor is 'bottom' (so that text is above line by default)
    // Otherwise, default y-anchor is equal to y-component of `textposition`
    // (so that text is positioned inside shape bounding box by default)
    return isLine
        ? 'bottom'
        : labelTextPosition.indexOf('top') !== -1
          ? 'top'
          : labelTextPosition.indexOf('bottom') !== -1
            ? 'bottom'
            : 'middle';
}

module.exports = function supplyDrawNewShapeDefaults(layoutIn, layoutOut, coerce) {
    coerce('newshape.visible');
    coerce('newshape.name');
    coerce('newshape.showlegend');
    coerce('newshape.legend');
    coerce('newshape.legendwidth');
    coerce('newshape.legendgroup');
    coerce('newshape.legendgrouptitle.text');
    Lib.coerceFont(coerce, 'newshape.legendgrouptitle.font');
    coerce('newshape.legendrank');

    coerce('newshape.drawdirection');
    coerce('newshape.layer');
    coerce('newshape.fillcolor');
    coerce('newshape.fillrule');
    coerce('newshape.opacity');
    var newshapeLineWidth = coerce('newshape.line.width');
    if (newshapeLineWidth) {
        var bgcolor = (layoutIn || {}).plot_bgcolor || '#FFF';
        coerce('newshape.line.color', Color.contrast(bgcolor));
        coerce('newshape.line.dash');
    }

    var isLine = layoutIn.dragmode === 'drawline';
    var labelText = coerce('newshape.label.text');
    var labelTextTemplate = coerce('newshape.label.texttemplate');
    coerce('newshape.label.texttemplatefallback');
    if (labelText || labelTextTemplate) {
        coerce('newshape.label.textangle');
        var labelTextPosition = coerce('newshape.label.textposition', isLine ? 'middle' : 'middle center');
        coerce('newshape.label.xanchor');
        coerce('newshape.label.yanchor', dfltLabelYanchor(isLine, labelTextPosition));
        coerce('newshape.label.padding');
        Lib.coerceFont(coerce, 'newshape.label.font', layoutOut.font);
    }

    coerce('activeshape.fillcolor');
    coerce('activeshape.opacity');
};
