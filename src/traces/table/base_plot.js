'use strict';

var getModuleCalcData = require('../../plots/get_data').getModuleCalcData;
var tablePlot = require('./plot');

var TABLE = 'table';

exports.name = TABLE;

exports.plot = function(gd) {
    var calcData = getModuleCalcData(gd.calcdata, TABLE)[0];
    if(calcData.length) tablePlot(gd, calcData);
};

exports.clean = function(newFullData, newFullLayout, oldFullData, oldFullLayout) {
    var hadTable = (oldFullLayout._has && oldFullLayout._has(TABLE));
    var hasTable = (newFullLayout._has && newFullLayout._has(TABLE));

    if(hadTable && !hasTable) {
        oldFullLayout._paperdiv.selectAll('.table').remove();
    }
};
