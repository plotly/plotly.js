/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';
var b64 = require('base64-arraybuffer');
var isPlainObject = require('./is_plain_object');

var isArray = Array.isArray;

// IE9 fallbacks

var ab = (typeof ArrayBuffer === 'undefined' || !ArrayBuffer.isView) ?
    {isView: function() { return false; }} :
    ArrayBuffer;

var dv = (typeof DataView === 'undefined') ?
    function() {} :
    DataView;

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

var typedArrays = {
    int8: typeof Int8Array !== 'undefined' ? Int8Array : null,
    uint8: typeof Uint8Array !== 'undefined' ? Uint8Array : null,
    uint8clamped: typeof Uint8ClampedArray !== 'undefined' ? Uint8ClampedArray : null,
    int16: typeof Int16Array !== 'undefined' ? Int16Array : null,
    uint16: typeof Uint16Array !== 'undefined' ? Uint16Array : null,
    int32: typeof Int32Array !== 'undefined' ? Int32Array : null,
    uint32: typeof Uint32Array !== 'undefined' ? Uint32Array : null,
    float32: typeof Float32Array !== 'undefined' ? Float32Array : null,
    float64: typeof Float64Array !== 'undefined' ? Float64Array : null,
};
exports.typedArrays = typedArrays;


exports.decodeTypedArraySpec = function(v) {
    // Assume processed by coerceTypedArraySpec
    v = coerceTypedArraySpec(v);
    var T = typedArrays[v.dtype];
    var buffer;
    if(v.bvals.constructor === ArrayBuffer) {
        // Already an ArrayBuffer
        buffer = v.bvals;
    } else {
        // Decode, assuming a string
        buffer = b64.decode(v.bvals);
    }

    // Check if 1d shape. If so, we're done
    if(v.ndims === 1) {
        // Construct single Typed array over entire buffer
        return new T(buffer);
    } else {
        // Reshape into nested plain arrays with innermost
        // level containing typed arrays
        // We could eventually adopt an ndarray library

        // Build cumulative product of dimensions
        var cumulativeShape = v.shape.map(function(a, i) {
            return a * (v.shape[i - 1] || 1);
        });

        // Loop of dimensions in reverse order
        var nestedArray = [];
        for(var dimInd = v.ndims - 1; dimInd > 0; dimInd--) {
            var subArrayLength = v.shape[dimInd];
            var numSubArrays = cumulativeShape[dimInd - 1];
            var nextArray = [];

            if(dimInd === v.ndims - 1) {
                // First time through, we build the
                // inner most typed arrays
                for(var typedInd = 0; typedInd < numSubArrays; typedInd++) {
                    var typedOffset = typedInd * subArrayLength;
                    nextArray.push(
                        new T(buffer, typedOffset * T.BYTES_PER_ELEMENT, subArrayLength)
                    );
                }
            } else {
                // Following times through, build
                // next layer of nested arrays
                for(var i = 0; i < numSubArrays; i++) {
                    var offset = i * subArrayLength;
                    nextArray.push(nextArray.slice(offset, offset + subArrayLength - 1));
                }
            }

            // Update nested array with next nesting level
            nestedArray = nextArray;
        }

        return nestedArray;
    }
};

function isTypedArraySpec(v) {
    // Assume v has not passed through
    return isPlainObject(v) && typedArrays[v.dtype] && v.bvals && (
        Number.isInteger(v.shape) ||
        (isArrayOrTypedArray(v.shape) &&
            v.shape.length > 0 &&
            v.shape.every(function(d) { return Number.isInteger(d); }))
    );
}
exports.isTypedArraySpec = isTypedArraySpec;

function coerceTypedArraySpec(v) {
    // Assume isTypedArraySpec passed
    var coerced = {dtype: v.dtype, bvals: v.bvals};

    // Normalize shape to a list
    if(Number.isInteger(v.shape)) {
        coerced.shape = [v.shape];
    } else {
        coerced.shape = v.shape;
    }

    // Add length property
    coerced.length = v.shape.reduce(function(a, b) { return a * b; });

    // Add ndims
    coerced.ndims = v.shape.length;

    return coerced;
}
exports.coerceTypedArraySpec = coerceTypedArraySpec;

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
