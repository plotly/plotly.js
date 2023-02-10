'use strict';
var b64decode = require('base64-arraybuffer').decode;
var isNumeric = require('fast-isnumeric');

var isPlainObject = require('./is_plain_object');

var isArray = Array.isArray;

function isInteger(a) {
    return isNumeric(a) && (a % 1 === 0);
}

var ab = ArrayBuffer;
var dv = DataView;

function isTypedArray(a) {
    return ab.isView(a) && !(a instanceof dv);
}
exports.isTypedArray = isTypedArray;

function isArrayOrTypedArray(a) {
    return isArray(a) || isTypedArray(a);
}
exports.isArrayOrTypedArray = isArrayOrTypedArray;

/*
 * Test whether an input object is 1D.
 *
 * Assumes we already know the object is an array.
 *
 * Looks only at the first element, if the dimensionality is
 * not consistent we won't figure that out here.
 */
function isArray1D(a) {
    return !isArrayOrTypedArray(a[0]);
}
exports.isArray1D = isArray1D;

/*
 * Ensures an array has the right amount of storage space. If it doesn't
 * exist, it creates an array. If it does exist, it returns it if too
 * short or truncates it in-place.
 *
 * The goal is to just reuse memory to avoid a bit of excessive garbage
 * collection.
 */
exports.ensureArray = function(out, n) {
    // TODO: typed array support here? This is only used in
    // traces/carpet/compute_control_points
    if(!isArray(out)) out = [];

    // If too long, truncate. (If too short, it will grow
    // automatically so we don't care about that case)
    out.length = n;

    return out;
};

function detectType(a) {
    return typeof a === 'undefined' ? undefined : a;
}

var typedArrays = {
    int8: detectType(Int8Array),
    uint8: detectType(Uint8Array),
    uint8clamped: detectType(Uint8ClampedArray),
    int16: detectType(Int16Array),
    uint16: detectType(Uint16Array),
    int32: detectType(Int32Array),
    uint32: detectType(Uint32Array),
    float32: detectType(Float32Array),
    float64: detectType(Float64Array)
};

exports.decodeTypedArraySpec = function(v) {
    var out = [];
    v = coerceTypedArraySpec(v);
    var T = typedArrays[v.dtype];

    var buffer = v.bvals;
    if(buffer.constructor !== ArrayBuffer) {
        buffer = b64decode(buffer);
    }

    var shape = v.shape;
    var ndims = shape ? shape.length : 1;

    var j;
    var ni = shape[0];
    var nj = shape[1];

    var BYTES_PER_ELEMENT = T.BYTES_PER_ELEMENT;
    var rowBites = BYTES_PER_ELEMENT * ni;
    var pos = 0;

    if(ndims === 1) {
        out = new T(buffer);
    } else if(ndims === 2) {
        for(j = 0; j < nj; j++) {
            out[j] = new T(buffer, pos, ni);
            pos += rowBites;
        }
    /*

    // 3d arrays are not supported in traces e.g. volume & isosurface
    // once supported we could uncomment this part

    } else if(ndims === 3) {
        var nk = shape[2];
        for(var k = 0; k < nk; k++) {
            out[k] = [];
            for(j = 0; j < nj; j++) {
                out[k][j] = new T(buffer, pos, ni);
                pos += rowBites;
            }
        }
    */
    } else {
        throw new Error('Bad shape: "' + shape + '"');
    }

    // attach spec to array for json export
    out.shape = v.shape;
    out.dtype = v.dtype;
    out.bvals = v.bvals;

    return out;
};

exports.isTypedArraySpec = function(v) {
    if(!isPlainObject(v)) return false;

    var shape = v.shape;

    // Assume v has not passed through
    return typedArrays[v.dtype] && v.bvals && (
        isInteger(shape) ||
        (
            isArrayOrTypedArray(shape) &&
            shape.length > 0 &&
            shape.every(isInteger)
        )
    );
};

function coerceTypedArraySpec(v) {
    var shape = v.shape; // TODO: could one skip shape for 1d arrays?

    // Normalize shape to a list
    if(isInteger(shape)) shape = [shape];

    return {
        shape: shape,
        dtype: v.dtype,
        bvals: v.bvals
    };
}

/*
 * TypedArray-compatible concatenation of n arrays
 * if all arrays are the same type it will preserve that type,
 * otherwise it falls back on Array.
 * Also tries to avoid copying, in case one array has zero length
 * But never mutates an existing array
 */
exports.concat = function() {
    var args = [];
    var allArray = true;
    var totalLen = 0;

    var _constructor, arg0, i, argi, posi, leni, out, j;

    for(i = 0; i < arguments.length; i++) {
        argi = arguments[i];
        leni = argi.length;
        if(leni) {
            if(arg0) args.push(argi);
            else {
                arg0 = argi;
                posi = leni;
            }

            if(isArray(argi)) {
                _constructor = false;
            } else {
                allArray = false;
                if(!totalLen) {
                    _constructor = argi.constructor;
                } else if(_constructor !== argi.constructor) {
                    // TODO: in principle we could upgrade here,
                    // ie keep typed array but convert all to Float64Array?
                    _constructor = false;
                }
            }

            totalLen += leni;
        }
    }

    if(!totalLen) return [];
    if(!args.length) return arg0;

    if(allArray) return arg0.concat.apply(arg0, args);
    if(_constructor) {
        // matching typed arrays
        out = new _constructor(totalLen);
        out.set(arg0);
        for(i = 0; i < args.length; i++) {
            argi = args[i];
            out.set(argi, posi);
            posi += argi.length;
        }
        return out;
    }

    // mismatched types or Array + typed
    out = new Array(totalLen);
    for(j = 0; j < arg0.length; j++) out[j] = arg0[j];
    for(i = 0; i < args.length; i++) {
        argi = args[i];
        for(j = 0; j < argi.length; j++) out[posi + j] = argi[j];
        posi += j;
    }
    return out;
};

exports.maxRowLength = function(z) {
    return _rowLength(z, Math.max, 0);
};

exports.minRowLength = function(z) {
    return _rowLength(z, Math.min, Infinity);
};

function _rowLength(z, fn, len0) {
    if(isArrayOrTypedArray(z)) {
        if(isArrayOrTypedArray(z[0])) {
            var len = len0;
            for(var i = 0; i < z.length; i++) {
                len = fn(len, z[i].length);
            }
            return len;
        } else {
            return z.length;
        }
    }
    return 0;
}
