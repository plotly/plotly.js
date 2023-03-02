'use strict';

var Color = require('../../color');
var Lib = require('../../../lib');


function dfltLabelYanchor(isLine, labelTextPosition) {
    var dfltYanchor;
    if(isLine) {
        dfltYanchor = 'bottom';
    } else {
        if(labelTextPosition.indexOf('top') !== -1) {
            dfltYanchor = 'top';
        } else if(labelTextPosition.indexOf('bottom') !== -1) {
            dfltYanchor = 'bottom';
        } else {
            dfltYanchor = 'middle';
        }
    }
    return dfltYanchor;
}

module.exports = function supplyDrawNewShapeDefaults(layoutIn, layoutOut, coerce) {
    coerce('newshape.drawdirection');
    coerce('newshape.layer');
    coerce('newshape.fillcolor');
    coerce('newshape.fillrule');
    coerce('newshape.opacity');
    var newshapeLineWidth = coerce('newshape.line.width');
    if(newshapeLineWidth) {
        var bgcolor = (layoutIn || {}).plot_bgcolor || '#FFF';
        coerce('newshape.line.color', Color.contrast(bgcolor));
        coerce('newshape.line.dash');
    }

    var isLine = layoutIn.dragmode === 'drawline';
    var labelText = coerce('newshape.label.text');
    if(labelText) {
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
