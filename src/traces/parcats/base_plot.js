'use strict';

var getModuleCalcData = require('../../plots/get_data').getModuleCalcData;
var parcatsPlot = require('./plot');

var PARCATS = 'parcats';
exports.name = PARCATS;

exports.plot = function(gd, traces, transitionOpts, makeOnCompleteCallback) {
    var cdModuleAndOthers = getModuleCalcData(gd.calcdata, PARCATS);

    if(cdModuleAndOthers.length) {
        var calcData = cdModuleAndOthers[0];
        parcatsPlot(gd, calcData, transitionOpts, makeOnCompleteCallback);
    }
};

exports.clean = function(newFullData, newFullLayout, oldFullData, oldFullLayout) {
    var hadTable = (oldFullLayout._has && oldFullLayout._has('parcats'));
    var hasTable = (newFullLayout._has && newFullLayout._has('parcats'));

    if(hadTable && !hasTable) {
        oldFullLayout._paperdiv.selectAll('.parcats').remove();
    }
};
