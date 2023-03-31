'use strict';

function d2l(v, axis) {
    return (
        axis.type === 'log' ? v :
        axis.d2l(v)
    );
}

function getPos(x, xa) {
    return (
        xa.type === 'date' ? x :
        d2l(x, xa)
    );
}

function x0Fn(shape, xa) { return getPos(shape.x0, xa); }
function x1Fn(shape, xa) { return getPos(shape.x1, xa); }
function y0Fn(shape, xa, ya) { return getPos(shape.y0, ya); }
function y1Fn(shape, xa, ya) { return getPos(shape.y1, ya); }

function dxFn(shape, xa) {
    return (
        d2l(shape.x1, xa) -
        d2l(shape.x0, xa)
    );
}

function dyFn(shape, xa, ya) {
    return (
        d2l(shape.y1, ya) -
        d2l(shape.y0, ya)
    );
}

function widthFn(shape, xa) {
    return Math.abs(dxFn(shape, xa));
}

function heightFn(shape, xa, ya) {
    return Math.abs(dyFn(shape, xa, ya));
}

function lengthFn(shape, xa, ya) {
    return (shape.type !== 'line') ? undefined :
        Math.sqrt(
            Math.pow((d2l(shape.x1, xa) - d2l(shape.x0, xa)), 2) +
            Math.pow((d2l(shape.y1, ya) - d2l(shape.y0, ya)), 2)
        );
}

function xcenterFn(shape, xa) {
    var val = (d2l(shape.x1, xa) + d2l(shape.x0, xa)) / 2;
    return (xa.type === 'date') ? xa.l2d(val) : val;
}

function ycenterFn(shape, xa, ya) {
    var val = (d2l(shape.y1, ya) + d2l(shape.y0, ya)) / 2;
    return (ya.type === 'date') ? ya.l2d(val) : val;
}

function slopeFn(shape, xa, ya) {
    return (shape.type !== 'line') ? undefined : (
        (d2l(shape.y1, ya) - d2l(shape.y0, ya)) /
        (d2l(shape.x1, xa) - d2l(shape.x0, xa))
    );
}

module.exports = {
    x0: x0Fn,
    x1: x1Fn,
    y0: y0Fn,
    y1: y1Fn,
    slope: slopeFn,
    dx: dxFn,
    dy: dyFn,
    width: widthFn,
    height: heightFn,
    length: lengthFn,
    xcenter: xcenterFn,
    ycenter: ycenterFn,
};
