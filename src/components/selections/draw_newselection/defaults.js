'use strict';

module.exports = function supplyDrawNewSelectionDefaults(layoutIn, layoutOut, coerce) {
    coerce('newselection.mode');

    var newselectionLineWidth = coerce('newselection.line.width');
    if(newselectionLineWidth) {
        coerce('newselection.line.color');
        coerce('newselection.line.dash');
    }

    coerce('activeselection.fillcolor');
    coerce('activeselection.opacity');
};
