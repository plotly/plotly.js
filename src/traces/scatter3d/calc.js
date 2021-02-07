'use strict';

var arraysToCalcdata = require('../scatter/arrays_to_calcdata');
var calcColorscale = require('../scatter/colorscale_calc');

/**
 * This is a kludge to put the array attributes into
 * calcdata the way Scatter.plot does, so that legends and
 * popovers know what to do with them.
 */
module.exports = function calc(gd, trace) {
    var cd = [{x: false, y: false, trace: trace, t: {}}];

    arraysToCalcdata(cd, trace);
    calcColorscale(gd, trace);

    return cd;
};
