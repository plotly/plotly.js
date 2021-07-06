'use strict';

var mat4X4 = require('gl-mat4');

exports.init2dArray = function(rowLength, colLength) {
    var array = new Array(rowLength);
    for(var i = 0; i < rowLength; i++) array[i] = new Array(colLength);
    return array;
};

/**
 * transpose a (possibly ragged) 2d array z. inspired by
 * http://stackoverflow.com/questions/17428587/
 * transposing-a-2d-array-in-javascript
 */
exports.transposeRagged = function(z) {
    var maxlen = 0;
    var zlen = z.length;
    var i, j;
    // Maximum row length:
    for(i = 0; i < zlen; i++) maxlen = Math.max(maxlen, z[i].length);

    var t = new Array(maxlen);
    for(i = 0; i < maxlen; i++) {
        t[i] = new Array(zlen);
        for(j = 0; j < zlen; j++) t[i][j] = z[j][i];
    }

    return t;
};

// our own dot function so that we don't need to include numeric
exports.dot = function(x, y) {
    if(!(x.length && y.length) || x.length !== y.length) return null;

    var len = x.length;
    var out;
    var i;

    if(x[0].length) {
        // mat-vec or mat-mat
        out = new Array(len);
        for(i = 0; i < len; i++) out[i] = exports.dot(x[i], y);
    } else if(y[0].length) {
        // vec-mat
        var yTranspose = exports.transposeRagged(y);
        out = new Array(yTranspose.length);
        for(i = 0; i < yTranspose.length; i++) out[i] = exports.dot(x, yTranspose[i]);
    } else {
        // vec-vec
        out = 0;
        for(i = 0; i < len; i++) out += x[i] * y[i];
    }

    return out;
};

// translate by (x,y)
exports.translationMatrix = function(x, y) {
    return [[1, 0, x], [0, 1, y], [0, 0, 1]];
};

// rotate by alpha around (0,0)
exports.rotationMatrix = function(alpha) {
    var a = alpha * Math.PI / 180;
    return [[Math.cos(a), -Math.sin(a), 0],
            [Math.sin(a), Math.cos(a), 0],
            [0, 0, 1]];
};

// rotate by alpha around (x,y)
exports.rotationXYMatrix = function(a, x, y) {
    return exports.dot(
        exports.dot(exports.translationMatrix(x, y),
                    exports.rotationMatrix(a)),
        exports.translationMatrix(-x, -y));
};

// applies a 3D transformation matrix to either x, y and z params
// Note: z is optional
exports.apply3DTransform = function(transform) {
    return function() {
        var args = arguments;
        var xyz = arguments.length === 1 ? args[0] : [args[0], args[1], args[2] || 0];
        return exports.dot(transform, [xyz[0], xyz[1], xyz[2], 1]).slice(0, 3);
    };
};

// applies a 2D transformation matrix to either x and y params or an [x,y] array
exports.apply2DTransform = function(transform) {
    return function() {
        var args = arguments;
        if(args.length === 3) {
            args = args[0];
        } // from map
        var xy = arguments.length === 1 ? args[0] : [args[0], args[1]];
        return exports.dot(transform, [xy[0], xy[1], 1]).slice(0, 2);
    };
};

// applies a 2D transformation matrix to an [x1,y1,x2,y2] array (to transform a segment)
exports.apply2DTransform2 = function(transform) {
    var at = exports.apply2DTransform(transform);
    return function(xys) {
        return at(xys.slice(0, 2)).concat(at(xys.slice(2, 4)));
    };
};

exports.convertCssMatrix = function(m) {
    if(m) {
        var len = m.length;
        if(len === 16) return m;
        if(len === 6) {
            // converts a 2x3 css transform matrix to a 4x4 matrix see https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/matrix
            return [
                m[0], m[1], 0, 0,
                m[2], m[3], 0, 0,
                0, 0, 1, 0,
                m[4], m[5], 0, 1
            ];
        }
    }
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];
};

// find the inverse for a 4x4 affine transform matrix
exports.inverseTransformMatrix = function(m) {
    var out = [];
    mat4X4.invert(out, m);
    return [
        [out[0], out[1], out[2], out[3]],
        [out[4], out[5], out[6], out[7]],
        [out[8], out[9], out[10], out[11]],
        [out[12], out[13], out[14], out[15]]
    ];
};
