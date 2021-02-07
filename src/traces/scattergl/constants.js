'use strict';

var SYMBOL_SIZE = 20;

module.exports = {
    TOO_MANY_POINTS: 1e5,

    SYMBOL_SDF_SIZE: 200,
    SYMBOL_SIZE: SYMBOL_SIZE,
    SYMBOL_STROKE: SYMBOL_SIZE / 20,

    DOT_RE: /-dot/,
    OPEN_RE: /-open/,

    DASHES: {
        solid: [1],
        dot: [1, 1],
        dash: [4, 1],
        longdash: [8, 1],
        dashdot: [4, 1, 1, 1],
        longdashdot: [8, 1, 1, 1]
    }
};
