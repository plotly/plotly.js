'use strict';


// common to 'scatter' and 'scatterternary'
module.exports = function handleLineShapeDefaults(traceIn, traceOut, coerce) {
    var shape = coerce('line.shape');
    if(shape === 'spline') coerce('line.smoothing');
};
