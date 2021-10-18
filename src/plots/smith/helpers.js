'use strict';

function sign(x) {
    return (
        x < 0 ? -1 :
        x > 0 ? 1 : 0
    );
}

// adapted from Mike Bostock's https://observablehq.com/@mbostock/smith-chart
function smith(a) {
    var R = a[0];
    var X = a[1];

    if(!isFinite(R) || !isFinite(X)) return [1, 0];

    var D = (R + 1) * (R + 1) + X * X;
    return [(R * R + X * X - 1) / D, 2 * X / D];
}

function transform(subplot, a) {
    var x = a[0];
    var y = a[1];

    return [
        x * subplot.radius + subplot.cx,
        -y * subplot.radius + subplot.cy
    ];
}

function scale(subplot, r) {
    return r * subplot.radius;
}

function reactanceArc(subplot, X, R1, R2) {
    var t1 = transform(subplot, smith([R1, X]));
    var x1 = t1[0];
    var y1 = t1[1];

    var t2 = transform(subplot, smith([R2, X]));
    var x2 = t2[0];
    var y2 = t2[1];

    if(X === 0) {
        return [
            'M' + x1 + ',' + y1,
            'L' + x2 + ',' + y2
        ].join(' ');
    }

    var r = scale(subplot, 1 / Math.abs(X));

    return [
        'M' + x1 + ',' + y1,
        'A' + r + ',' + r + ' 0 0,' + (X < 0 ? 1 : 0) + ' ' + x2 + ',' + y2
    ].join(' ');
}

function resistanceArc(subplot, R, X1, X2) {
    var r = scale(subplot, 1 / (R + 1));

    var t1 = transform(subplot, smith([R, X1]));
    var x1 = t1[0];
    var y1 = t1[1];

    var t2 = transform(subplot, smith([R, X2]));
    var x2 = t2[0];
    var y2 = t2[1];

    if(sign(X1) !== sign(X2)) {
        var t0 = transform(subplot, smith([R, 0]));
        var x0 = t0[0];
        var y0 = t0[1];

        return [
            'M' + x1 + ',' + y1,
            'A' + r + ',' + r + ' 0 0,' + (0 < X1 ? 0 : 1) + ' ' + x0 + ',' + y0,
            'A' + r + ',' + r + ' 0 0,' + (X2 < 0 ? 0 : 1) + x2 + ',' + y2,
        ].join(' ');
    }

    return [
        'M' + x1 + ',' + y1,
        'A' + r + ',' + r + ' 0 0,' + (X2 < X1 ? 0 : 1) + ' ' + x2 + ',' + y2
    ].join(' ');
}

module.exports = {
    smith: smith,
    reactanceArc: reactanceArc,
    resistanceArc: resistanceArc,
    smithTransform: transform
};
