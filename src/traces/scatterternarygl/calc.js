'use strict';

const isNumeric = require('fast-isnumeric');
const cluster = require('@plotly/point-cluster');

const calcColorscale = require('../scatter/colorscale_calc');
const TOO_MANY_POINTS  = require("../scattergl/constants");

module.exports = function calc(gd, trace) {
    const displaySum = gd._fullLayout[trace.subplot].sum;
    const normSum = trace.sum || displaySum;

    const len = trace._length;
    const aIn = trace.a;
    const bIn = trace.b;
    const cIn = trace.c;
    const a = (trace._a = new Float64Array(len));
    const b = (trace._b = new Float64Array(len));
    const c = (trace._c = new Float64Array(len));
    const x = new Float64Array(len);
    const positions = new Array(len * 2);
    const hasTooManyPoints = len >= TOO_MANY_POINTS;
    const ids = hasTooManyPoints ? null : new Array(len);

    for (let i = 0; i < len; i++) {
        // infer the missing component from the other two
        let ai = aIn ? aIn[i] : normSum - bIn[i] - cIn[i];
        let bi = bIn ? bIn[i] : normSum - aIn[i] - cIn[i];
        let ci = cIn ? cIn[i] : normSum - aIn[i] - bIn[i];

        if (isNumeric(ai) && isNumeric(bi) && isNumeric(ci)) {
            ai = +ai;
            bi = +bi;
            ci = +ci;

            const total = ai + bi + ci;

            if (Number.isFinite(total) && total !== 0) {
                const norm = displaySum / total;
                ai *= norm;
                bi *= norm;
                ci *= norm;
            } else {
                ai = bi = ci = NaN;
            }
        } else {
            ai = bi = ci = NaN;
        }

        if (!Number.isFinite(ai) || !Number.isFinite(bi) || !Number.isFinite(ci)) {
            ai = bi = ci = NaN;
        }

        a[i] = ai;
        b[i] = bi;
        c[i] = ci;
        x[i] = positions[2 * i] = ci - bi;
        positions[2 * i + 1] = ai;

        if(ids) ids[i] = i;
    }

    calcColorscale(gd, trace);

    // adopt the same approach of scattergl: build the tree only when len >= TOO_MANY_POINTS
    // caveat: see https://github.com/plotly/plotly.js/pull/8052
    const stash = { a, b, c, x, y: a, rawx: x, rawy: a, positions };

    if(hasTooManyPoints) {
        stash.tree = cluster(positions);
    } else {
        stash.ids = ids;
    }

    return [{ x: false, y: false, t: stash, trace }];
};
