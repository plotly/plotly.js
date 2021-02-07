'use strict';

var Lib = require('../../lib');
var BADNUM = require('../../constants/numerical').BADNUM;
var alignPeriod = require('../../plots/cartesian/align_period');

module.exports = function convertColumnData(trace, ax1, ax2, var1Name, var2Name, arrayVarNames) {
    var colLen = trace._length;
    var col1 = ax1.makeCalcdata(trace, var1Name);
    var col2 = ax2.makeCalcdata(trace, var2Name);
    col1 = alignPeriod(trace, ax1, var1Name, col1);
    col2 = alignPeriod(trace, ax2, var2Name, col2);

    var textCol = trace.text;
    var hasColumnText = (textCol !== undefined && Lib.isArray1D(textCol));
    var hoverTextCol = trace.hovertext;
    var hasColumnHoverText = (hoverTextCol !== undefined && Lib.isArray1D(hoverTextCol));
    var i, j;

    var col1dv = Lib.distinctVals(col1);
    var col1vals = col1dv.vals;
    var col2dv = Lib.distinctVals(col2);
    var col2vals = col2dv.vals;
    var newArrays = [];
    var text;
    var hovertext;

    var nI = col2vals.length;
    var nJ = col1vals.length;

    for(i = 0; i < arrayVarNames.length; i++) {
        newArrays[i] = Lib.init2dArray(nI, nJ);
    }

    if(hasColumnText) {
        text = Lib.init2dArray(nI, nJ);
    }
    if(hasColumnHoverText) {
        hovertext = Lib.init2dArray(nI, nJ);
    }

    var after2before = Lib.init2dArray(nI, nJ);

    for(i = 0; i < colLen; i++) {
        if(col1[i] !== BADNUM && col2[i] !== BADNUM) {
            var i1 = Lib.findBin(col1[i] + col1dv.minDiff / 2, col1vals);
            var i2 = Lib.findBin(col2[i] + col2dv.minDiff / 2, col2vals);

            for(j = 0; j < arrayVarNames.length; j++) {
                var arrayVarName = arrayVarNames[j];
                var arrayVar = trace[arrayVarName];
                var newArray = newArrays[j];
                newArray[i2][i1] = arrayVar[i];
                after2before[i2][i1] = i;
            }

            if(hasColumnText) text[i2][i1] = textCol[i];
            if(hasColumnHoverText) hovertext[i2][i1] = hoverTextCol[i];
        }
    }

    trace['_' + var1Name] = col1vals;
    trace['_' + var2Name] = col2vals;
    for(j = 0; j < arrayVarNames.length; j++) {
        trace['_' + arrayVarNames[j]] = newArrays[j];
    }
    if(hasColumnText) trace._text = text;
    if(hasColumnHoverText) trace._hovertext = hovertext;

    if(ax1 && ax1.type === 'category') {
        trace['_' + var1Name + 'CategoryMap'] = col1vals.map(function(v) { return ax1._categories[v];});
    }

    if(ax2 && ax2.type === 'category') {
        trace['_' + var2Name + 'CategoryMap'] = col2vals.map(function(v) { return ax2._categories[v];});
    }

    trace._after2before = after2before;
};
