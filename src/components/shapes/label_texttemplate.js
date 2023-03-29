'use strict';

module.exports = {
    shapeLabelTexttemplateVars: {
        x0: (function(shape, _xa) { return (_xa.type === 'date') ? shape.x0 : _xa.d2l(shape.x0); }),
        x1: (function(shape, _xa) { return (_xa.type === 'date') ? shape.x1 : _xa.d2l(shape.x1); }),
        y0: (function(shape, _xa, _ya) { return (_ya.type === 'date') ? shape.y0 : _ya.d2l(shape.y0); }),
        y1: (function(shape, _xa, _ya) { return (_ya.type === 'date') ? shape.y1 : _ya.d2l(shape.y1); }),
        slope: (function(shape, _xa, _ya) {
            return (_ya.d2l(shape.y1) - _ya.d2l(shape.y0)) / (_xa.d2l(shape.x1) - _xa.d2l(shape.x0));
        }),
        dx: (function(shape, _xa) { return _xa.d2l(shape.x1) - _xa.d2l(shape.x0); }),
        dy: (function(shape, _xa, _ya) { return _ya.d2l(shape.y1) - _ya.d2l(shape.y0); }),
        width: (function(shape, _xa) { return Math.abs(_xa.d2l(shape.x1) - _xa.d2l(shape.x0)); }),
        height: (function(shape, _xa, _ya) { return Math.abs(_ya.d2l(shape.y1) - _ya.d2l(shape.y0)); }),
        length: (function(shape, _xa, _ya) {
            return (shape.type === 'line') ? Math.sqrt(Math.pow((_xa.d2l(shape.x1) - _xa.d2l(shape.x0)), 2) + Math.pow((_ya.d2l(shape.y1) - _ya.d2l(shape.y0)), 2)) : undefined;
        }),
        xcenter: (function(shape, _xa) {
            var val = (_xa.d2l(shape.x1) + _xa.d2l(shape.x0)) / 2;
            return (_xa.type === 'date') ? _xa.l2d(val) : val;
        }),
        ycenter: (function(shape, _xa, _ya) {
            var val = (_ya.d2l(shape.y1) + _ya.d2l(shape.y0)) / 2;
            return (_ya.type === 'date') ? _ya.l2d(val) : val;
        }),
    }
};
