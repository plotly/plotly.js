'use strict';
var b64decode = require('base64-arraybuffer').decode;

var isPlainObject = require('./is_plain_object');

var isArray = Array.isArray;

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

var typedArrays = {
    u1c: typeof Uint8ClampedArray === 'undefined' ? undefined :
                Uint8ClampedArray, // not supported in numpy?

    i1: typeof Int8Array === 'undefined' ? undefined :
               Int8Array,

    u1: typeof Uint8Array === 'undefined' ? undefined :
               Uint8Array,

    i2: typeof Int16Array === 'undefined' ? undefined :
               Int16Array,

    u2: typeof Uint16Array === 'undefined' ? undefined :
               Uint16Array,

    i4: typeof Int32Array === 'undefined' ? undefined :
               Int32Array,

    u4: typeof Uint32Array === 'undefined' ? undefined :
               Uint32Array,

    f4: typeof Float32Array === 'undefined' ? undefined :
               Float32Array,

    f8: typeof Float64Array === 'undefined' ? undefined :
               Float64Array,

    /* TODO: potentially add Big Int

    i8: typeof BigInt64Array === 'undefined' ? undefined :
               BigInt64Array,

    u8: typeof BigUint64Array === 'undefined' ? undefined :
               BigUint64Array,
    */
};

typedArrays.uint8c = typedArrays.u1c;
typedArrays.uint8 = typedArrays.u1;
typedArrays.int8 = typedArrays.i1;
typedArrays.uint16 = typedArrays.u2;
typedArrays.int16 = typedArrays.i2;
typedArrays.uint32 = typedArrays.u4;
typedArrays.int32 = typedArrays.i4;
typedArrays.float32 = typedArrays.f4;
typedArrays.float64 = typedArrays.f8;

function isArrayBuffer(a) {
    return a.constructor === ArrayBuffer;
}
exports.isArrayBuffer = isArrayBuffer;

exports.decodeTypedArraySpec = function(vIn) {
    var out = [];
    var v = coerceTypedArraySpec(vIn);
    var dtype = v.dtype;

    var T = typedArrays[dtype];
    if(!T) throw new Error('Error in dtype: "' + dtype + '"');
    var BYTES_PER_ELEMENT = T.BYTES_PER_ELEMENT;

    var buffer = v.bdata;
    if(!isArrayBuffer(buffer)) {
        buffer = b64decode(buffer);
    }
    var shape = v.shape === undefined ?
        // detect 1-d length
        [buffer.byteLength / BYTES_PER_ELEMENT] :
        // convert number to string and split to array
        ('' + v.shape).split(',');

    shape.reverse(); // i.e. to match numpy order
    var ndim = shape.length;

    var nj, j;
    var ni = +shape[0];

    var rowBytes = BYTES_PER_ELEMENT * ni;
    var pos = 0;

    if(ndim === 1) {
        out = new T(buffer);
    } else if(ndim === 2) {
        nj = +shape[1];
        for(j = 0; j < nj; j++) {
            out[j] = new T(buffer, pos, ni);
            pos += rowBytes;
        }
    } else if(ndim === 3) {
        nj = +shape[1];
        var nk = +shape[2];
        for(var k = 0; k < nk; k++) {
            out[k] = [];
            for(j = 0; j < nj; j++) {
                out[k][j] = new T(buffer, pos, ni);
                pos += rowBytes;
            }
        }
    } else {
        throw new Error('ndim: ' + ndim + 'is not supported with the shape:"' + v.shape + '"');
    }

    // attach bdata, dtype & shape to array for json export
    out.bdata = v.bdata;
    out.dtype = v.dtype;
    out.shape = shape.reverse().join(',');

    vIn._inputArray = out;

    return out;
};

exports.isTypedArraySpec = function(v) {
    return (
        isPlainObject(v) &&
        v.hasOwnProperty('dtype') && (typeof v.dtype === 'string') &&

        v.hasOwnProperty('bdata') && (typeof v.bdata === 'string' || isArrayBuffer(v.bdata)) &&

        (v.shape === undefined || (
            v.hasOwnProperty('shape') && (typeof v.shape === 'string' || typeof v.shape === 'number')
        ))
    );
};

function coerceTypedArraySpec(v) {
    return {
        bdata: v.bdata,
        dtype: v.dtype,
        shape: v.shape
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
