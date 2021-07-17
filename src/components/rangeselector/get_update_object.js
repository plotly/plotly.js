'use strict';

var d3Time = require('d3-time');
var titleCase = require('../../lib').titleCase;

module.exports = function getUpdateObject(axisLayout, buttonLayout) {
    var axName = axisLayout._name;
    var update = {};

    if(buttonLayout.step === 'all') {
        update[axName + '.autorange'] = true;
    } else {
        var xrange = getXRange(axisLayout, buttonLayout);

        update[axName + '.range[0]'] = xrange[0];
        update[axName + '.range[1]'] = xrange[1];
    }

    return update;
};

function getXRange(axisLayout, buttonLayout) {
    var currentRange = axisLayout.range;
    var base = new Date(axisLayout.r2l(currentRange[1]));
    var step = buttonLayout.step;

    var utcStep = d3Time['utc' + titleCase(step)];

    var count = buttonLayout.count;
    var range0;

    switch(buttonLayout.stepmode) {
        case 'backward':
            range0 = axisLayout.l2r(+utcStep.offset(base, -count));
            break;

        case 'todate':
            var base2 = utcStep.offset(base, -count);

            range0 = axisLayout.l2r(+utcStep.ceil(base2));
            break;
    }

    var range1 = currentRange[1];

    return [range0, range1];
}
