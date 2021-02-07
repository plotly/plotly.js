'use strict';


var parcats = require('./parcats');

/**
 * Create / update parcat traces
 *
 * @param {Object} graphDiv
 * @param {Array.<ParcatsModel>} parcatsModels
 */
module.exports = function plot(graphDiv, parcatsModels, transitionOpts, makeOnCompleteCallback) {
    var fullLayout = graphDiv._fullLayout;
    var svg = fullLayout._paper;
    var size = fullLayout._size;

    parcats(
        graphDiv,
        svg,
        parcatsModels,
        {
            width: size.w,
            height: size.h,
            margin: {
                t: size.t,
                r: size.r,
                b: size.b,
                l: size.l
            }
        },
        transitionOpts,
        makeOnCompleteCallback
    );
};
