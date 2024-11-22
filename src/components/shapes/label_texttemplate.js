'use strict';

// Wrapper functions to handle paper-referenced shapes, which have no axis

function d2l(v, axis) {
    return axis ? axis.d2l(v) : v;
}

function l2d(v, axis) {
    return axis ? axis.l2d(v) : v;
}


function x0Fn(shape) { return shape.x0; }
function x1Fn(shape) { return shape.x1; }
function y0Fn(shape) { return shape.y0; }
function y1Fn(shape) { return shape.y1; }

function x0shiftFn(shape) { return shape.x0shift || 0; }
function x1shiftFn(shape) { return shape.x1shift || 0; }
function y0shiftFn(shape) { return shape.y0shift || 0; }
function y1shiftFn(shape) { return shape.y1shift || 0; }

function dxFn(shape, xa) {
    return d2l(shape.x1, xa) + x1shiftFn(shape) - d2l(shape.x0, xa) - x0shiftFn(shape);
}

function dyFn(shape, xa, ya) {
    return d2l(shape.y1, ya) + y1shiftFn(shape) - d2l(shape.y0, ya) - y0shiftFn(shape);
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
            Math.pow(dxFn(shape, xa), 2) +
            Math.pow(dyFn(shape, xa, ya), 2)
        );
}

function xcenterFn(shape, xa) {
    return l2d((d2l(shape.x1, xa) + x1shiftFn(shape) + d2l(shape.x0, xa) + x0shiftFn(shape)) / 2, xa);
}

function ycenterFn(shape, xa, ya) {
    return l2d((d2l(shape.y1, ya) + y1shiftFn(shape) + d2l(shape.y0, ya) + y0shiftFn(shape)) / 2, ya);
}

function slopeFn(shape, xa, ya) {
    return (shape.type !== 'line') ? undefined : (
        dyFn(shape, xa, ya) / dxFn(shape, xa)
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
