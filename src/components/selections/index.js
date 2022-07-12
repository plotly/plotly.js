'use strict';

var drawModule = require('./draw');
var select = require('./select');

module.exports = {
    moduleType: 'component',
    name: 'selections',

    layoutAttributes: require('./attributes'),
    supplyLayoutDefaults: require('./defaults'),
    supplyDrawNewSelectionDefaults: require('./draw_newselection/defaults'),
    includeBasePlot: require('../../plots/cartesian/include_components')('selections'),

    draw: drawModule.draw,
    drawOne: drawModule.drawOne,

    reselect: select.reselect,
    prepSelect: select.prepSelect,
    clearOutline: select.clearOutline,
    clearSelectionsCache: select.clearSelectionsCache,
    selectOnClick: select.selectOnClick
};
