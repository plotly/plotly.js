'use strict';

module.exports = {
    x0: (function(shape, xa) { return (xa.type === 'date') ? shape.x0 : xa.d2l(shape.x0); }),
    x1: (function(shape, xa) { return (xa.type === 'date') ? shape.x1 : xa.d2l(shape.x1); }),
    y0: (function(shape, xa, ya) { return (ya.type === 'date') ? shape.y0 : ya.d2l(shape.y0); }),
    y1: (function(shape, xa, ya) { return (ya.type === 'date') ? shape.y1 : ya.d2l(shape.y1); }),
    slope: (function(shape, xa, ya) {
        return (ya.d2l(shape.y1) - ya.d2l(shape.y0)) / (xa.d2l(shape.x1) - xa.d2l(shape.x0));
    }),
    dx: (function(shape, xa) { return xa.d2l(shape.x1) - xa.d2l(shape.x0); }),
    dy: (function(shape, xa, ya) { return ya.d2l(shape.y1) - ya.d2l(shape.y0); }),
    width: (function(shape, xa) { return Math.abs(xa.d2l(shape.x1) - xa.d2l(shape.x0)); }),
    height: (function(shape, xa, ya) { return Math.abs(ya.d2l(shape.y1) - ya.d2l(shape.y0)); }),
    length: (function(shape, xa, ya) {
        return (shape.type === 'line') ? Math.sqrt(Math.pow((xa.d2l(shape.x1) - xa.d2l(shape.x0)), 2) + Math.pow((ya.d2l(shape.y1) - ya.d2l(shape.y0)), 2)) : undefined;
    }),
    xcenter: (function(shape, xa) {
        var val = (xa.d2l(shape.x1) + xa.d2l(shape.x0)) / 2;
        return (xa.type === 'date') ? xa.l2d(val) : val;
    }),
    ycenter: (function(shape, xa, ya) {
        var val = (ya.d2l(shape.y1) + ya.d2l(shape.y0)) / 2;
        return (ya.type === 'date') ? ya.l2d(val) : val;
    })
};
