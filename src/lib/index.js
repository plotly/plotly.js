'use strict';

var d3 = require('@plotly/d3');
var utcFormat = require('d3-time-format').utcFormat;
var d3Format = require('d3-format').format;
var isNumeric = require('fast-isnumeric');

var numConstants = require('../constants/numerical');
var MAX_SAFE = numConstants.FP_SAFE;
var MIN_SAFE = -MAX_SAFE;
var BADNUM = numConstants.BADNUM;

var lib = (module.exports = {});

lib.adjustFormat = function adjustFormat(formatStr) {
    if (!formatStr || /^\d[.]\df/.test(formatStr) || /[.]\d%/.test(formatStr)) return formatStr;

    if (formatStr === '0.f') return '~f';
    if (/^\d%/.test(formatStr)) return '~%';
    if (/^\ds/.test(formatStr)) return '~s';

    // try adding tilde to the start of format in order to trim
    if (!/^[~,.0$]/.test(formatStr) && /[&fps]/.test(formatStr)) return '~' + formatStr;

    return formatStr;
};

var seenBadFormats = {};
lib.warnBadFormat = function (f) {
    var key = String(f);
    if (!seenBadFormats[key]) {
        seenBadFormats[key] = 1;
        lib.warn('encountered bad format: "' + key + '"');
    }
};

lib.noFormat = function (value) {
    return String(value);
};

lib.numberFormat = function (formatStr) {
    var fn;
    try {
        fn = d3Format(lib.adjustFormat(formatStr));
    } catch (e) {
        lib.warnBadFormat(formatStr);
        return lib.noFormat;
    }

    return fn;
};

lib.nestedProperty = require('./nested_property');
lib.keyedContainer = require('./keyed_container');
lib.relativeAttr = require('./relative_attr');
lib.isPlainObject = require('./is_plain_object');
lib.toLogRange = require('./to_log_range');
lib.relinkPrivateKeys = require('./relink_private');

var arrayModule = require('./array');
lib.isArrayBuffer = arrayModule.isArrayBuffer;
lib.isTypedArray = arrayModule.isTypedArray;
lib.isArrayOrTypedArray = arrayModule.isArrayOrTypedArray;
lib.isArray1D = arrayModule.isArray1D;
lib.ensureArray = arrayModule.ensureArray;
lib.concat = arrayModule.concat;
lib.maxRowLength = arrayModule.maxRowLength;
lib.minRowLength = arrayModule.minRowLength;

var modModule = require('./mod');
lib.mod = modModule.mod;
lib.modHalf = modModule.modHalf;

var coerceModule = require('./coerce');
lib.valObjectMeta = coerceModule.valObjectMeta;
lib.coerce = coerceModule.coerce;
lib.coerce2 = coerceModule.coerce2;
lib.coerceFont = coerceModule.coerceFont;
lib.coercePattern = coerceModule.coercePattern;
lib.coerceHoverinfo = coerceModule.coerceHoverinfo;
lib.coerceSelectionMarkerOpacity = coerceModule.coerceSelectionMarkerOpacity;
lib.validate = coerceModule.validate;

var datesModule = require('./dates');
lib.dateTime2ms = datesModule.dateTime2ms;
lib.isDateTime = datesModule.isDateTime;
lib.ms2DateTime = datesModule.ms2DateTime;
lib.ms2DateTimeLocal = datesModule.ms2DateTimeLocal;
lib.cleanDate = datesModule.cleanDate;
lib.isJSDate = datesModule.isJSDate;
lib.formatDate = datesModule.formatDate;
lib.incrementMonth = datesModule.incrementMonth;
lib.dateTick0 = datesModule.dateTick0;
lib.dfltRange = datesModule.dfltRange;
lib.findExactDates = datesModule.findExactDates;
lib.MIN_MS = datesModule.MIN_MS;
lib.MAX_MS = datesModule.MAX_MS;

var searchModule = require('./search');
lib.findBin = searchModule.findBin;
lib.sorterAsc = searchModule.sorterAsc;
lib.sorterDes = searchModule.sorterDes;
lib.distinctVals = searchModule.distinctVals;
lib.roundUp = searchModule.roundUp;
lib.sort = searchModule.sort;
lib.findIndexOfMin = searchModule.findIndexOfMin;

lib.sortObjectKeys = require('./sort_object_keys');

var statsModule = require('./stats');
lib.aggNums = statsModule.aggNums;
lib.len = statsModule.len;
lib.mean = statsModule.mean;
lib.geometricMean = statsModule.geometricMean;
lib.median = statsModule.median;
lib.midRange = statsModule.midRange;
lib.variance = statsModule.variance;
lib.stdev = statsModule.stdev;
lib.interp = statsModule.interp;

var matrixModule = require('./matrix');
lib.init2dArray = matrixModule.init2dArray;
lib.transposeRagged = matrixModule.transposeRagged;
lib.dot = matrixModule.dot;
lib.translationMatrix = matrixModule.translationMatrix;
lib.rotationMatrix = matrixModule.rotationMatrix;
lib.rotationXYMatrix = matrixModule.rotationXYMatrix;
lib.apply3DTransform = matrixModule.apply3DTransform;
lib.apply2DTransform = matrixModule.apply2DTransform;
lib.apply2DTransform2 = matrixModule.apply2DTransform2;
lib.convertCssMatrix = matrixModule.convertCssMatrix;
lib.inverseTransformMatrix = matrixModule.inverseTransformMatrix;

var anglesModule = require('./angles');
lib.deg2rad = anglesModule.deg2rad;
lib.rad2deg = anglesModule.rad2deg;
lib.angleDelta = anglesModule.angleDelta;
lib.angleDist = anglesModule.angleDist;
lib.isFullCircle = anglesModule.isFullCircle;
lib.isAngleInsideSector = anglesModule.isAngleInsideSector;
lib.isPtInsideSector = anglesModule.isPtInsideSector;
lib.pathArc = anglesModule.pathArc;
lib.pathSector = anglesModule.pathSector;
lib.pathAnnulus = anglesModule.pathAnnulus;

var anchorUtils = require('./anchor_utils');
lib.isLeftAnchor = anchorUtils.isLeftAnchor;
lib.isCenterAnchor = anchorUtils.isCenterAnchor;
lib.isRightAnchor = anchorUtils.isRightAnchor;
lib.isTopAnchor = anchorUtils.isTopAnchor;
lib.isMiddleAnchor = anchorUtils.isMiddleAnchor;
lib.isBottomAnchor = anchorUtils.isBottomAnchor;

var geom2dModule = require('./geometry2d');
lib.segmentsIntersect = geom2dModule.segmentsIntersect;
lib.segmentDistance = geom2dModule.segmentDistance;
lib.getTextLocation = geom2dModule.getTextLocation;
lib.clearLocationCache = geom2dModule.clearLocationCache;
lib.getVisibleSegment = geom2dModule.getVisibleSegment;
lib.findPointOnPath = geom2dModule.findPointOnPath;

var extendModule = require('./extend');
lib.extendFlat = extendModule.extendFlat;
lib.extendDeep = extendModule.extendDeep;
lib.extendDeepAll = extendModule.extendDeepAll;
lib.extendDeepNoArrays = extendModule.extendDeepNoArrays;

var loggersModule = require('./loggers');
lib.log = loggersModule.log;
lib.warn = loggersModule.warn;
lib.error = loggersModule.error;

var regexModule = require('./regex');
lib.counterRegex = regexModule.counter;

var throttleModule = require('./throttle');
lib.throttle = throttleModule.throttle;
lib.throttleDone = throttleModule.done;
lib.clearThrottle = throttleModule.clear;

var domModule = require('./dom');
lib.getGraphDiv = domModule.getGraphDiv;
lib.isPlotDiv = domModule.isPlotDiv;
lib.removeElement = domModule.removeElement;
lib.addStyleRule = domModule.addStyleRule;
lib.addRelatedStyleRule = domModule.addRelatedStyleRule;
lib.deleteRelatedStyleRule = domModule.deleteRelatedStyleRule;
lib.setStyleOnHover = domModule.setStyleOnHover;
lib.getFullTransformMatrix = domModule.getFullTransformMatrix;
lib.getElementTransformMatrix = domModule.getElementTransformMatrix;
lib.getElementAndAncestors = domModule.getElementAndAncestors;
lib.equalDomRects = domModule.equalDomRects;

lib.clearResponsive = require('./clear_responsive');
lib.preserveDrawingBuffer = require('./preserve_drawing_buffer');

lib.makeTraceGroups = require('./make_trace_groups');

lib._ = require('./localize');

lib.notifier = require('./notifier');

lib.filterUnique = require('./filter_unique');
lib.filterVisible = require('./filter_visible');
lib.pushUnique = require('./push_unique');

lib.increment = require('./increment');

lib.cleanNumber = require('./clean_number');

lib.ensureNumber = function ensureNumber(v) {
    if (!isNumeric(v)) return BADNUM;
    v = Number(v);
    return v > MAX_SAFE || v < MIN_SAFE ? BADNUM : v;
};

/**
 * Is v a valid array index? Accepts numeric strings as well as numbers.
 *
 * @param {any} v: the value to test
 * @param {Optional[integer]} len: the array length we are indexing
 *
 * @return {bool}: v is a valid array index
 */
lib.isIndex = function (v, len) {
    if (len !== undefined && v >= len) return false;
    return isNumeric(v) && v >= 0 && v % 1 === 0;
};

lib.noop = require('./noop');
lib.identity = require('./identity');

/**
 * create an array of length 'cnt' filled with 'v' at all indices
 *
 * @param {any} v
 * @param {number} cnt
 * @return {array}
 */
lib.repeat = function (v, cnt) {
    var out = new Array(cnt);
    for (var i = 0; i < cnt; i++) {
        out[i] = v;
    }
    return out;
};

/**
 * swap x and y of the same attribute in container cont
 * specify attr with a ? in place of x/y
 * you can also swap other things than x/y by providing part1 and part2
 */
lib.swapAttrs = function (cont, attrList, part1, part2) {
    if (!part1) part1 = 'x';
    if (!part2) part2 = 'y';
    for (var i = 0; i < attrList.length; i++) {
        var attr = attrList[i];
        var xp = lib.nestedProperty(cont, attr.replace('?', part1));
        var yp = lib.nestedProperty(cont, attr.replace('?', part2));
        var temp = xp.get();
        xp.set(yp.get());
        yp.set(temp);
    }
};

/**
 * SVG painter's algo worked around with reinsertion
 */
lib.raiseToTop = function raiseToTop(elem) {
    elem.parentNode.appendChild(elem);
};

/**
 * cancel a possibly pending transition; returned selection may be used by caller
 */
lib.cancelTransition = function (selection) {
    return selection.transition().duration(0);
};

// constrain - restrict a number v to be between v0 and v1
lib.constrain = function (v, v0, v1) {
    if (v0 > v1) return Math.max(v1, Math.min(v0, v));
    return Math.max(v0, Math.min(v1, v));
};

/**
 * do two bounding boxes from getBoundingClientRect,
 * ie {left,right,top,bottom,width,height}, overlap?
 * takes optional padding pixels
 */
lib.bBoxIntersect = function (a, b, pad) {
    pad = pad || 0;
    return a.left <= b.right + pad && b.left <= a.right + pad && a.top <= b.bottom + pad && b.top <= a.bottom + pad;
};

/*
 * simpleMap: alternative to Array.map that only
 * passes on the element and up to 2 extra args you
 * provide (but not the array index or the whole array)
 *
 * array: the array to map it to
 * func: the function to apply
 * x1, x2: optional extra args
 */
lib.simpleMap = function (array, func, x1, x2, opts) {
    var len = array.length;
    var out = new Array(len);
    for (var i = 0; i < len; i++) out[i] = func(array[i], x1, x2, opts);
    return out;
};

/**
 * Random string generator
 *
 * @param {object} existing
 *     pass in strings to avoid as keys with truthy values
 * @param {int} bits
 *     bits of information in the output string, default 24
 * @param {int} base
 *     base of string representation, default 16. Should be a power of 2.
 */
lib.randstr = function randstr(existing, bits, base, _recursion) {
    if (!base) base = 16;
    if (bits === undefined) bits = 24;
    if (bits <= 0) return '0';

    var digits = Math.log(Math.pow(2, bits)) / Math.log(base);
    var res = '';
    var i, b, x;

    for (i = 2; digits === Infinity; i *= 2) {
        digits = (Math.log(Math.pow(2, bits / i)) / Math.log(base)) * i;
    }

    var rem = digits - Math.floor(digits);

    for (i = 0; i < Math.floor(digits); i++) {
        x = Math.floor(Math.random() * base).toString(base);
        res = x + res;
    }

    if (rem) {
        b = Math.pow(base, rem);
        x = Math.floor(Math.random() * b).toString(base);
        res = x + res;
    }

    var parsed = parseInt(res, base);
    if ((existing && existing[res]) || (parsed !== Infinity && parsed >= Math.pow(2, bits))) {
        if (_recursion > 10) {
            lib.warn('randstr failed uniqueness');
            return res;
        }
        return randstr(existing, bits, base, (_recursion || 0) + 1);
    } else return res;
};

lib.OptionControl = function (opt, optname) {
    /*
     * An environment to contain all option setters and
     * getters that collectively modify opts.
     *
     * You can call up opts from any function in new object
     * as this.optname || this.opt
     *
     * See FitOpts for example of usage
     */
    if (!opt) opt = {};
    if (!optname) optname = 'opt';

    var self = {};
    self.optionList = [];

    self._newoption = function (optObj) {
        optObj[optname] = opt;
        self[optObj.name] = optObj;
        self.optionList.push(optObj);
    };

    self['_' + optname] = opt;
    return self;
};

/**
 * lib.smooth: smooth arrayIn by convolving with
 * a hann window with given full width at half max
 * bounce the ends in, so the output has the same length as the input
 */
lib.smooth = function (arrayIn, FWHM) {
    FWHM = Math.round(FWHM) || 0; // only makes sense for integers
    if (FWHM < 2) return arrayIn;

    var alen = arrayIn.length;
    var alen2 = 2 * alen;
    var wlen = 2 * FWHM - 1;
    var w = new Array(wlen);
    var arrayOut = new Array(alen);
    var i;
    var j;
    var k;
    var v;

    // first make the window array
    for (i = 0; i < wlen; i++) {
        w[i] = (1 - Math.cos((Math.PI * (i + 1)) / FWHM)) / (2 * FWHM);
    }

    // now do the convolution
    for (i = 0; i < alen; i++) {
        v = 0;
        for (j = 0; j < wlen; j++) {
            k = i + j + 1 - FWHM;

            // multibounce
            if (k < -alen) k -= alen2 * Math.round(k / alen2);
            else if (k >= alen2) k -= alen2 * Math.floor(k / alen2);

            // single bounce
            if (k < 0) k = -1 - k;
            else if (k >= alen) k = alen2 - 1 - k;

            v += arrayIn[k] * w[j];
        }
        arrayOut[i] = v;
    }

    return arrayOut;
};

/**
 * syncOrAsync: run a sequence of functions synchronously
 * as long as its returns are not promises (ie have no .then)
 * includes one argument arg to send to all functions...
 * this is mainly just to prevent us having to make wrapper functions
 * when the only purpose of the wrapper is to reference gd
 * and a final step to be executed at the end
 * TODO: if there's an error and everything is sync,
 * this doesn't happen yet because we want to make sure
 * that it gets reported
 */
lib.syncOrAsync = function (sequence, arg, finalStep) {
    var ret, fni;

    function continueAsync() {
        return lib.syncOrAsync(sequence, arg, finalStep);
    }

    while (sequence.length) {
        fni = sequence.splice(0, 1)[0];
        ret = fni(arg);

        if (ret && ret.then) {
            return ret.then(continueAsync);
        }
    }

    return finalStep && finalStep(arg);
};

/**
 * Helper to strip trailing slash, from
 * http://stackoverflow.com/questions/6680825/return-string-without-trailing-slash
 */
lib.stripTrailingSlash = function (str) {
    if (str.slice(-1) === '/') return str.slice(0, -1);
    return str;
};

lib.noneOrAll = function (containerIn, containerOut, attrList) {
    /**
     * some attributes come together, so if you have one of them
     * in the input, you should copy the default values of the others
     * to the input as well.
     */
    if (!containerIn) return;

    var hasAny = false;
    var hasAll = true;
    var i;
    var val;

    for (i = 0; i < attrList.length; i++) {
        val = containerIn[attrList[i]];
        if (val !== undefined && val !== null) hasAny = true;
        else hasAll = false;
    }

    if (hasAny && !hasAll) {
        for (i = 0; i < attrList.length; i++) {
            containerIn[attrList[i]] = containerOut[attrList[i]];
        }
    }
};

/** merges calcdata field (given by cdAttr) with traceAttr values
 *
 * N.B. Loop over minimum of cd.length and traceAttr.length
 * i.e. it does not try to fill in beyond traceAttr.length-1
 *
 * @param {array} traceAttr : trace attribute
 * @param {object} cd : calcdata trace
 * @param {string} cdAttr : calcdata key
 */
lib.mergeArray = function (traceAttr, cd, cdAttr, fn) {
    var hasFn = typeof fn === 'function';
    if (lib.isArrayOrTypedArray(traceAttr)) {
        var imax = Math.min(traceAttr.length, cd.length);
        for (var i = 0; i < imax; i++) {
            var v = traceAttr[i];
            cd[i][cdAttr] = hasFn ? fn(v) : v;
        }
    }
};

// cast numbers to positive numbers, returns 0 if not greater than 0
lib.mergeArrayCastPositive = function (traceAttr, cd, cdAttr) {
    return lib.mergeArray(traceAttr, cd, cdAttr, function (v) {
        var w = +v;
        return !isFinite(w) ? 0 : w > 0 ? w : 0;
    });
};

/** fills calcdata field (given by cdAttr) with traceAttr values
 *  or function of traceAttr values (e.g. some fallback)
 *
 * N.B. Loops over all cd items.
 *
 * @param {array} traceAttr : trace attribute
 * @param {object} cd : calcdata trace
 * @param {string} cdAttr : calcdata key
 * @param {function} [fn] : optional function to apply to each array item
 */
lib.fillArray = function (traceAttr, cd, cdAttr, fn) {
    fn = fn || lib.identity;

    if (lib.isArrayOrTypedArray(traceAttr)) {
        for (var i = 0; i < cd.length; i++) {
            cd[i][cdAttr] = fn(traceAttr[i]);
        }
    }
};

/** Handler for trace-wide vs per-point options
 *
 * @param {object} trace : (full) trace object
 * @param {number} ptNumber : index of the point in question
 * @param {string} astr : attribute string
 * @param {function} [fn] : optional function to apply to each array item
 *
 * @return {any}
 */
lib.castOption = function (trace, ptNumber, astr, fn) {
    fn = fn || lib.identity;

    var val = lib.nestedProperty(trace, astr).get();

    if (lib.isArrayOrTypedArray(val)) {
        if (Array.isArray(ptNumber) && lib.isArrayOrTypedArray(val[ptNumber[0]])) {
            return fn(val[ptNumber[0]][ptNumber[1]]);
        } else {
            return fn(val[ptNumber]);
        }
    } else {
        return val;
    }
};

/** Extract option from calcdata item, correctly falling back to
 *  trace value if not found.
 *
 *  @param {object} calcPt : calcdata[i][j] item
 *  @param {object} trace : (full) trace object
 *  @param {string} calcKey : calcdata key
 *  @param {string} traceKey : aka trace attribute string
 *  @return {any}
 */
lib.extractOption = function (calcPt, trace, calcKey, traceKey) {
    if (calcKey in calcPt) return calcPt[calcKey];

    // fallback to trace value,
    //   must check if value isn't itself an array
    //   which means the trace attribute has a corresponding
    //   calcdata key, but its value is falsy
    var traceVal = lib.nestedProperty(trace, traceKey).get();
    if (!Array.isArray(traceVal)) return traceVal;
};

function makePtIndex2PtNumber(indexToPoints) {
    var ptIndex2ptNumber = {};
    for (var k in indexToPoints) {
        var pts = indexToPoints[k];
        for (var j = 0; j < pts.length; j++) {
            ptIndex2ptNumber[pts[j]] = +k;
        }
    }
    return ptIndex2ptNumber;
}

/** Tag selected calcdata items
 *
 * N.B. note that point 'index' corresponds to input data array index
 *  whereas 'number' is its post-transform version.
 *
 * @param {array} calcTrace
 * @param {object} trace
 *  - selectedpoints {array}
 *  - _indexToPoints {object}
 * @param {ptNumber2cdIndex} ptNumber2cdIndex (optional)
 *  optional map object for trace types that do not have 1-to-1 point number to
 *  calcdata item index correspondence (e.g. histogram)
 */
lib.tagSelected = function (calcTrace, trace, ptNumber2cdIndex) {
    var selectedpoints = trace.selectedpoints;
    var indexToPoints = trace._indexToPoints;
    var ptIndex2ptNumber;

    // make pt index-to-number map object, which takes care of transformed traces
    if (indexToPoints) {
        ptIndex2ptNumber = makePtIndex2PtNumber(indexToPoints);
    }

    function isCdIndexValid(v) {
        return v !== undefined && v < calcTrace.length;
    }

    for (var i = 0; i < selectedpoints.length; i++) {
        var ptIndex = selectedpoints[i];

        if (
            lib.isIndex(ptIndex) ||
            (lib.isArrayOrTypedArray(ptIndex) && lib.isIndex(ptIndex[0]) && lib.isIndex(ptIndex[1]))
        ) {
            var ptNumber = ptIndex2ptNumber ? ptIndex2ptNumber[ptIndex] : ptIndex;
            var cdIndex = ptNumber2cdIndex ? ptNumber2cdIndex[ptNumber] : ptNumber;

            if (isCdIndexValid(cdIndex)) {
                calcTrace[cdIndex].selected = 1;
            }
        }
    }
};

lib.selIndices2selPoints = function (trace) {
    var selectedpoints = trace.selectedpoints;
    var indexToPoints = trace._indexToPoints;

    if (indexToPoints) {
        var ptIndex2ptNumber = makePtIndex2PtNumber(indexToPoints);
        var out = [];

        for (var i = 0; i < selectedpoints.length; i++) {
            var ptIndex = selectedpoints[i];
            if (lib.isIndex(ptIndex)) {
                var ptNumber = ptIndex2ptNumber[ptIndex];
                if (lib.isIndex(ptNumber)) {
                    out.push(ptNumber);
                }
            }
        }

        return out;
    } else {
        return selectedpoints;
    }
};

/** Returns target as set by 'target' transform attribute
 *
 * @param {object} trace : full trace object
 * @param {object} transformOpts : transform option object
 *  - target (string} :
 *      either an attribute string referencing an array in the trace object, or
 *      a set array.
 *
 * @return {array or false} : the target array (NOT a copy!!) or false if invalid
 */
lib.getTargetArray = function (trace, transformOpts) {
    var target = transformOpts.target;

    if (typeof target === 'string' && target) {
        var array = lib.nestedProperty(trace, target).get();
        return lib.isArrayOrTypedArray(array) ? array : false;
    } else if (lib.isArrayOrTypedArray(target)) {
        return target;
    }

    return false;
};

/**
 * modified version of jQuery's extend to strip out private objs and functions,
 * and cut arrays down to first <arraylen> or 1 elements
 * because extend-like algorithms are hella slow
 * obj2 is assumed to already be clean of these things (including no arrays)
 */
function minExtend(obj1, obj2, opt) {
    var objOut = {};
    if (typeof obj2 !== 'object') obj2 = {};

    var arrayLen = opt === 'pieLike' ? -1 : 3;

    var keys = Object.keys(obj1);
    var i, k, v;

    for (i = 0; i < keys.length; i++) {
        k = keys[i];
        v = obj1[k];
        if (k.charAt(0) === '_' || typeof v === 'function') continue;
        else if (k === 'module') objOut[k] = v;
        else if (Array.isArray(v)) {
            if (k === 'colorscale' || arrayLen === -1) {
                objOut[k] = v.slice();
            } else {
                objOut[k] = v.slice(0, arrayLen);
            }
        } else if (lib.isTypedArray(v)) {
            if (arrayLen === -1) {
                objOut[k] = v.subarray();
            } else {
                objOut[k] = v.subarray(0, arrayLen);
            }
        } else if (v && typeof v === 'object') objOut[k] = minExtend(obj1[k], obj2[k], opt);
        else objOut[k] = v;
    }

    keys = Object.keys(obj2);
    for (i = 0; i < keys.length; i++) {
        k = keys[i];
        v = obj2[k];
        if (typeof v !== 'object' || !(k in objOut) || typeof objOut[k] !== 'object') {
            objOut[k] = v;
        }
    }

    return objOut;
}
lib.minExtend = minExtend;

lib.titleCase = function (s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
};

lib.containsAny = function (s, fragments) {
    for (var i = 0; i < fragments.length; i++) {
        if (s.indexOf(fragments[i]) !== -1) return true;
    }
    return false;
};

var IS_SAFARI_REGEX = /Version\/[\d\.]+.*Safari/;
lib.isSafari = function () {
    return IS_SAFARI_REGEX.test(window.navigator.userAgent);
};

var IS_IOS_REGEX = /iPad|iPhone|iPod/;
lib.isIOS = function () {
    return IS_IOS_REGEX.test(window.navigator.userAgent);
};

// The WKWebView user agent string doesn't include 'Safari', so we need a separate test
// for a UA string like this:
// Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko)
const IS_MAC_WKWEBVIEW_REGEX = /Macintosh.+AppleWebKit.+Gecko\)$/;
lib.isMacWKWebView = () => IS_MAC_WKWEBVIEW_REGEX.test(window.navigator.userAgent);

var FIREFOX_VERSION_REGEX = /Firefox\/(\d+)\.\d+/;
lib.getFirefoxVersion = function () {
    var match = FIREFOX_VERSION_REGEX.exec(window.navigator.userAgent);
    if (match && match.length === 2) {
        var versionInt = parseInt(match[1]);
        if (!isNaN(versionInt)) {
            return versionInt;
        }
    }
    return null;
};

lib.isD3Selection = function (obj) {
    return obj instanceof d3.selection;
};

/**
 * Append element to DOM only if not present.
 *
 * @param {d3 selection} parent : parent selection of the element in question
 * @param {string} nodeType : node type of element to append
 * @param {string} className (optional) : class name of element in question
 * @param {fn} enterFn (optional) : optional fn applied to entering elements only
 * @return {d3 selection} selection of new layer
 *
 * Previously, we were using the following pattern:
 *
 * ```
 * var sel = parent.selectAll('.' + className)
 *     .data([0]);
 *
 * sel.enter().append(nodeType)
 *     .classed(className, true);
 *
 * return sel;
 * ```
 *
 * in numerous places in our codebase to achieve the same behavior.
 *
 * The logic below performs much better, mostly as we are using
 * `.select` instead `.selectAll` that is `querySelector` instead of
 * `querySelectorAll`.
 *
 */
lib.ensureSingle = function (parent, nodeType, className, enterFn) {
    var sel = parent.select(nodeType + (className ? '.' + className : ''));
    if (sel.size()) return sel;

    var layer = parent.append(nodeType);
    if (className) layer.classed(className, true);
    if (enterFn) layer.call(enterFn);

    return layer;
};

/**
 * Same as Lib.ensureSingle, but using id as selector.
 * This version is mostly used for clipPath nodes.
 *
 * @param {d3 selection} parent : parent selection of the element in question
 * @param {string} nodeType : node type of element to append
 * @param {string} id : id of element in question
 * @param {fn} enterFn (optional) : optional fn applied to entering elements only
 * @return {d3 selection} selection of new layer
 */
lib.ensureSingleById = function (parent, nodeType, id, enterFn) {
    var sel = parent.select(nodeType + '#' + id);
    if (sel.size()) return sel;

    var layer = parent.append(nodeType).attr('id', id);
    if (enterFn) layer.call(enterFn);

    return layer;
};

/**
 * Converts a string path to an object.
 *
 * When given a string containing an array element, it will create a `null`
 * filled array of the given size.
 *
 * @example
 * lib.objectFromPath('nested.test[2].path', 'value');
 * // returns { nested: { test: [null, null, { path: 'value' }]}
 *
 * @param   {string}    path to nested value
 * @param   {*}         any value to be set
 *
 * @return {Object} the constructed object with a full nested path
 */
lib.objectFromPath = function (path, value) {
    var keys = path.split('.');
    var tmpObj;
    var obj = (tmpObj = {});

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var el = null;

        var parts = keys[i].match(/(.*)\[([0-9]+)\]/);

        if (parts) {
            key = parts[1];
            el = parts[2];

            tmpObj = tmpObj[key] = [];

            if (i === keys.length - 1) {
                tmpObj[el] = value;
            } else {
                tmpObj[el] = {};
            }

            tmpObj = tmpObj[el];
        } else {
            if (i === keys.length - 1) {
                tmpObj[key] = value;
            } else {
                tmpObj[key] = {};
            }

            tmpObj = tmpObj[key];
        }
    }

    return obj;
};

/**
 * Iterate through an object in-place, converting dotted properties to objects.
 *
 * Examples:
 *
 *   lib.expandObjectPaths({'nested.test.path': 'value'});
 *     => { nested: { test: {path: 'value'}}}
 *
 * It also handles array notation, e.g.:
 *
 *   lib.expandObjectPaths({'foo[1].bar': 'value'});
 *     => { foo: [null, {bar: value}] }
 *
 * It handles merges the results when two properties are specified in parallel:
 *
 *   lib.expandObjectPaths({'foo[1].bar': 10, 'foo[0].bar': 20});
 *     => { foo: [{bar: 10}, {bar: 20}] }
 *
 * It does NOT, however, merge multiple multiply-nested arrays::
 *
 *   lib.expandObjectPaths({'marker[1].range[1]': 5, 'marker[1].range[0]': 4})
 *     => { marker: [null, {range: 4}] }
 */

// Store this to avoid recompiling regex on *every* prop since this may happen many
// many times for animations. Could maybe be inside the function. Not sure about
// scoping vs. recompilation tradeoff, but at least it's not just inlining it into
// the inner loop.
var dottedPropertyRegex = /^([^\[\.]+)\.(.+)?/;
var indexedPropertyRegex = /^([^\.]+)\[([0-9]+)\](\.)?(.+)?/;

function notValid(prop) {
    // guard against polluting __proto__ and other internals getters and setters
    return prop.slice(0, 2) === '__';
}

lib.expandObjectPaths = function (data) {
    var match, key, prop, datum, idx, dest, trailingPath;
    if (typeof data === 'object' && !Array.isArray(data)) {
        for (key in data) {
            if (data.hasOwnProperty(key)) {
                if ((match = key.match(dottedPropertyRegex))) {
                    datum = data[key];
                    prop = match[1];
                    if (notValid(prop)) continue;

                    delete data[key];

                    data[prop] = lib.extendDeepNoArrays(
                        data[prop] || {},
                        lib.objectFromPath(key, lib.expandObjectPaths(datum))[prop]
                    );
                } else if ((match = key.match(indexedPropertyRegex))) {
                    datum = data[key];

                    prop = match[1];
                    if (notValid(prop)) continue;

                    idx = parseInt(match[2]);

                    delete data[key];

                    data[prop] = data[prop] || [];

                    if (match[3] === '.') {
                        // This is the case where theere are subsequent properties into which
                        // we must recurse, e.g. transforms[0].value
                        trailingPath = match[4];
                        dest = data[prop][idx] = data[prop][idx] || {};

                        // NB: Extend deep no arrays prevents this from working on multiple
                        // nested properties in the same object, e.g.
                        //
                        // {
                        //   foo[0].bar[1].range
                        //   foo[0].bar[0].range
                        // }
                        //
                        // In this case, the extendDeepNoArrays will overwrite one array with
                        // the other, so that both properties *will not* be present in the
                        // result. Fixing this would require a more intelligent tracking
                        // of changes and merging than extendDeepNoArrays currently accomplishes.
                        lib.extendDeepNoArrays(dest, lib.objectFromPath(trailingPath, lib.expandObjectPaths(datum)));
                    } else {
                        // This is the case where this property is the end of the line,
                        // e.g. xaxis.range[0]

                        if (notValid(prop)) continue;
                        data[prop][idx] = lib.expandObjectPaths(datum);
                    }
                } else {
                    if (notValid(key)) continue;
                    data[key] = lib.expandObjectPaths(data[key]);
                }
            }
        }
    }

    return data;
};

/**
 * Converts value to string separated by the provided separators.
 *
 * @example
 * lib.numSeparate(2016, '.,');
 * // returns '2016'
 *
 * @example
 * lib.numSeparate(3000, '.,', true);
 * // returns '3,000'
 *
 * @example
 * lib.numSeparate(1234.56, '|,')
 * // returns '1,234|56'
 *
 * @param   {string|number} value       the value to be converted
 * @param   {string}    separators  string of decimal, then thousands separators
 * @param   {boolean}    separatethousands  boolean, 4-digit integers are separated if true
 *
 * @return  {string}    the value that has been separated
 */
lib.numSeparate = function (value, separators, separatethousands) {
    if (!separatethousands) separatethousands = false;

    if (typeof separators !== 'string' || separators.length === 0) {
        throw new Error('Separator string required for formatting!');
    }

    if (typeof value === 'number') {
        value = String(value);
    }

    var thousandsRe = /(\d+)(\d{3})/;
    var decimalSep = separators.charAt(0);
    var thouSep = separators.charAt(1);

    var x = value.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? decimalSep + x[1] : '';

    // Years are ignored for thousands separators
    if (thouSep && (x.length > 1 || x1.length > 4 || separatethousands)) {
        while (thousandsRe.test(x1)) {
            x1 = x1.replace(thousandsRe, '$1' + thouSep + '$2');
        }
    }

    return x1 + x2;
};

lib.TEMPLATE_STRING_REGEX = /%{([^\s%{}:]*)([:|\|][^}]*)?}/g;
var SIMPLE_PROPERTY_REGEX = /^\w*$/;

/**
 * Substitute values from an object into a string
 *
 * Examples:
 *  Lib.templateString('name: %{trace}', {trace: 'asdf'}) --> 'name: asdf'
 *  Lib.templateString('name: %{trace[0].name}', {trace: [{name: 'asdf'}]}) --> 'name: asdf'
 *
 * @param {string}  input string containing %{...} template strings
 * @param {obj}     data object containing substitution values
 *
 * @return {string} templated string
 */
lib.templateString = function (string, obj) {
    // Not all that useful, but cache nestedProperty instantiation
    // just in case it speeds things up *slightly*:
    var getterCache = {};

    return string.replace(lib.TEMPLATE_STRING_REGEX, function (dummy, key) {
        var v;
        if (SIMPLE_PROPERTY_REGEX.test(key)) {
            v = obj[key];
        } else {
            getterCache[key] = getterCache[key] || lib.nestedProperty(obj, key).get;
            v = getterCache[key](true); // true means don't replace undefined with null
        }
        return v !== undefined ? v : '';
    });
};

const hovertemplateWarnings = {
    max: 10,
    count: 0,
    name: 'hovertemplate'
};
lib.hovertemplateString = (params) => templateFormatString({ ...params, opts: hovertemplateWarnings });

const texttemplateWarnings = {
    max: 10,
    count: 0,
    name: 'texttemplate'
};
lib.texttemplateString = (params) => templateFormatString({ ...params, opts: texttemplateWarnings });

// Regex for parsing multiplication and division operations applied to a template key
// Used for shape.label.texttemplate
// Matches a key name (non-whitespace characters), followed by a * or / character, followed by a number
// For example, the following strings are matched: `x0*2`, `slope/1.60934`, `y1*2.54`
var MULT_DIV_REGEX = /^(\S+)([\*\/])(-?\d+(\.\d+)?)$/;
function multDivParser(inputStr) {
    var match = inputStr.match(MULT_DIV_REGEX);
    if (match) return { key: match[1], op: match[2], number: Number(match[3]) };
    return { key: inputStr, op: null, number: null };
}
var texttemplateWarningsForShapes = {
    max: 10,
    count: 0,
    name: 'texttemplate',
    parseMultDiv: true
};
lib.texttemplateStringForShapes = (params) => templateFormatString({ ...params, opts: texttemplateWarningsForShapes });

var TEMPLATE_STRING_FORMAT_SEPARATOR = /^[:|\|]/;
/**
 * Substitute values from an object into a string and optionally formats them using d3-format,
 * or fallback to associated labels.
 *
 * Examples:
 *  Lib.templateFormatString({ template 'name: %{trace}', labels: {trace: 'asdf'} }) --> 'name: asdf'
 *  Lib.templateFormatString({ template: 'name: %{trace[0].name}', labels: { trace: [{ name: 'asdf' }] } }) --> 'name: asdf'
 *  Lib.templateFormatString({ template: 'price: %{y:$.2f}', labels: { y: 1 } }) --> 'price: $1.00'
 *
 * @param {object}  options - Configuration object
 * @param {array}   options.data - Data objects containing substitution values
 * @param {boolean|string}  options.fallback - Fallback value when substitution fails. If false, the specifier is used.
 * @param {object}  options.labels - Data object containing fallback text when no formatting is specified, ex.: {yLabel: 'formattedYValue'}
 * @param {object}  options.locale - D3 locale for formatting
 * @param {object}  options.opts - Additional options
 * @param {number}  options.opts.count - Count of warnings for missing values
 * @param {number}  options.opts.max - Maximum allowed count of warnings for missing values before suppressing the warning message
 * @param {string}  options.opts.name - Template name, used in warning message
 * @param {boolean} options.opts.parseMultDiv - Parse * and / operators in template string (used in shape labels)
 * @param {string}  options.template - Input string containing %{...:...} template string specifiers
 *
 * @return {string} templated string
 */
function templateFormatString({ data = [], locale, fallback, labels = {}, opts, template }) {
    return template.replace(lib.TEMPLATE_STRING_REGEX, (match, key, format) => {
        const isOther = ['xother', 'yother'].includes(key);
        const isSpaceOther = ['_xother', '_yother'].includes(key);
        const isSpaceOtherSpace = ['_xother_', '_yother_'].includes(key);
        const isOtherSpace = ['xother_', 'yother_'].includes(key);
        const hasOther = isOther || isSpaceOther || isOtherSpace || isSpaceOtherSpace;

        // Remove underscores from key
        if (isSpaceOther || isSpaceOtherSpace) key = key.substring(1);
        if (isOtherSpace || isSpaceOtherSpace) key = key.substring(0, key.length - 1);

        let parsedOp = null;
        let parsedNumber = null;
        if (opts.parseMultDiv) {
            var _match = multDivParser(key);
            key = _match.key;
            parsedOp = _match.op;
            parsedNumber = _match.number;
        }

        let value = undefined;
        if (hasOther) {
            // 'other' specifiers that are undefined return an empty string by design
            if (labels[key] === undefined) return '';
            value = labels[key];
        } else {
            for (const obj of data) {
                if (!obj) continue;
                if (obj.hasOwnProperty(key)) {
                    value = obj[key];
                    break;
                }

                if (!SIMPLE_PROPERTY_REGEX.test(key)) {
                    // true here means don't convert null to undefined
                    value = lib.nestedProperty(obj, key).get(true);
                }
                if (value !== undefined) break;
            }
        }

        if (value === undefined) {
            const { count, max, name } = opts;
            const fallbackValue = fallback === false ? match : fallback;
            if (count < max) {
                lib.warn(
                    [
                        `Variable '${key}' in ${name} could not be found!`,
                        'Please verify that the template is correct.',
                        `Using value: '${fallbackValue}'.`
                    ].join(' ')
                );
            }
            if (count === max) lib.warn(`Too many '${name}' warnings - additional warnings will be suppressed.`);
            opts.count++;

            return fallbackValue;
        }

        if (parsedOp === '*') value *= parsedNumber;
        if (parsedOp === '/') value /= parsedNumber;

        if (format) {
            var fmt;
            if (format[0] === ':') {
                fmt = locale ? locale.numberFormat : lib.numberFormat;
                if (value !== '') {
                    // e.g. skip missing data on heatmap
                    value = fmt(format.replace(TEMPLATE_STRING_FORMAT_SEPARATOR, ''))(value);
                }
            }

            if (format[0] === '|') {
                fmt = locale ? locale.timeFormat : utcFormat;
                var ms = lib.dateTime2ms(value);
                value = lib.formatDate(ms, format.replace(TEMPLATE_STRING_FORMAT_SEPARATOR, ''), false, fmt);
            }
        } else {
            var keyLabel = key + 'Label';
            if (labels.hasOwnProperty(keyLabel)) value = labels[keyLabel];
        }

        if (hasOther) {
            value = '(' + value + ')';
            if (isSpaceOther || isSpaceOtherSpace) value = ' ' + value;
            if (isOtherSpace || isSpaceOtherSpace) value = value + ' ';
        }

        return value;
    });
}

/*
 * alphanumeric string sort, tailored for subplot IDs like scene2, scene10, x10y13 etc
 */
var char0 = 48;
var char9 = 57;
lib.subplotSort = function (a, b) {
    var l = Math.min(a.length, b.length) + 1;
    var numA = 0;
    var numB = 0;
    for (var i = 0; i < l; i++) {
        var charA = a.charCodeAt(i) || 0;
        var charB = b.charCodeAt(i) || 0;
        var isNumA = charA >= char0 && charA <= char9;
        var isNumB = charB >= char0 && charB <= char9;

        if (isNumA) numA = 10 * numA + charA - char0;
        if (isNumB) numB = 10 * numB + charB - char0;

        if (!isNumA || !isNumB) {
            if (numA !== numB) return numA - numB;
            if (charA !== charB) return charA - charB;
        }
    }
    return numB - numA;
};

// repeatable pseudorandom generator
var randSeed = 2000000000;

lib.seedPseudoRandom = function () {
    randSeed = 2000000000;
};

lib.pseudoRandom = function () {
    var lastVal = randSeed;
    randSeed = (69069 * randSeed + 1) % 4294967296;
    // don't let consecutive vals be too close together
    // gets away from really trying to be random, in favor of better local uniformity
    if (Math.abs(randSeed - lastVal) < 429496729) return lib.pseudoRandom();
    return randSeed / 4294967296;
};

/** Fill hover 'pointData' container with 'correct' hover text value
 *
 * - If trace hoverinfo contains a 'text' flag and hovertext is not set,
 *   the text elements will be seen in the hover labels.
 *
 * - If trace hoverinfo contains a 'text' flag and hovertext is set,
 *   hovertext takes precedence over text
 *   i.e. the hoverinfo elements will be seen in the hover labels
 *
 *  @param {object} calcPt
 *  @param {object} trace
 *  @param {object || array} contOut (mutated here)
 */
lib.fillText = function (calcPt, trace, contOut) {
    var fill = Array.isArray(contOut)
        ? function (v) {
              contOut.push(v);
          }
        : function (v) {
              contOut.text = v;
          };

    var htx = lib.extractOption(calcPt, trace, 'htx', 'hovertext');
    if (lib.isValidTextValue(htx)) return fill(htx);

    var tx = lib.extractOption(calcPt, trace, 'tx', 'text');
    if (lib.isValidTextValue(tx)) return fill(tx);
};

// accept all truthy values and 0 (which gets cast to '0' in the hover labels)
lib.isValidTextValue = function (v) {
    return v || v === 0;
};

/**
 * @param {number} ratio
 * @param {number} n (number of decimal places)
 */
lib.formatPercent = function (ratio, n) {
    n = n || 0;
    var str = (Math.round(100 * ratio * Math.pow(10, n)) * Math.pow(0.1, n)).toFixed(n) + '%';
    for (var i = 0; i < n; i++) {
        if (str.indexOf('.') !== -1) {
            str = str.replace('0%', '%');
            str = str.replace('.%', '%');
        }
    }
    return str;
};

lib.isHidden = function (gd) {
    var display = window.getComputedStyle(gd).display;
    return !display || display === 'none';
};

lib.strTranslate = function (x, y) {
    return x || y ? 'translate(' + x + ',' + y + ')' : '';
};

lib.strRotate = function (a) {
    return a ? 'rotate(' + a + ')' : '';
};

lib.strScale = function (s) {
    return s !== 1 ? 'scale(' + s + ')' : '';
};

/** Return transform text for bar bar-like rectangles and pie-like slices
 *  @param {object} transform
 *  - targetX: desired position on the x-axis
 *  - targetY: desired position on the y-axis
 *  - textX: text middle position on the x-axis
 *  - textY: text middle position on the y-axis
 *  - anchorX: (optional) text anchor position on the x-axis (computed from textX), zero for middle anchor
 *  - anchorY: (optional) text anchor position on the y-axis (computed from textY), zero for middle anchor
 *  - scale: (optional) scale applied after translate
 *  - rotate: (optional) rotation applied after scale
 *  - noCenter: when defined no extra arguments needed in rotation
 */
lib.getTextTransform = function (transform) {
    var noCenter = transform.noCenter;
    var textX = transform.textX;
    var textY = transform.textY;
    var targetX = transform.targetX;
    var targetY = transform.targetY;
    var anchorX = transform.anchorX || 0;
    var anchorY = transform.anchorY || 0;
    var rotate = transform.rotate;
    var scale = transform.scale;
    if (!scale) scale = 0;
    else if (scale > 1) scale = 1;

    return (
        lib.strTranslate(targetX - scale * (textX + anchorX), targetY - scale * (textY + anchorY)) +
        lib.strScale(scale) +
        (rotate ? 'rotate(' + rotate + (noCenter ? '' : ' ' + textX + ' ' + textY) + ')' : '')
    );
};

lib.setTransormAndDisplay = function (s, transform) {
    s.attr('transform', lib.getTextTransform(transform));
    s.style('display', transform.scale ? null : 'none');
};

lib.ensureUniformFontSize = function (gd, baseFont) {
    var out = lib.extendFlat({}, baseFont);
    out.size = Math.max(baseFont.size, gd._fullLayout.uniformtext.minsize || 0);
    return out;
};

/**
 * provide a human-readable list e.g. "A, B, C and D" with an ending separator
 *
 * @param {array} arr : the array to join
 * @param {string} mainSeparator : main separator
 * @param {string} lastSeparator : last separator
 *
 * @return {string} : joined list
 */
lib.join2 = function (arr, mainSeparator, lastSeparator) {
    var len = arr.length;
    if (len > 1) {
        return arr.slice(0, -1).join(mainSeparator) + lastSeparator + arr[len - 1];
    }
    return arr.join(mainSeparator);
};

lib.bigFont = function (size) {
    return Math.round(1.2 * size);
};

var firefoxVersion = lib.getFirefoxVersion();
// see https://bugzilla.mozilla.org/show_bug.cgi?id=1684973
var isProblematicFirefox = firefoxVersion !== null && firefoxVersion < 86;

/**
 * Return the mouse position from the last event registered by D3.
 * @returns An array with two numbers, representing the x and y coordinates of the mouse pointer
 *   at the event relative to the targeted node.
 */
lib.getPositionFromD3Event = function () {
    if (isProblematicFirefox) {
        // layerX and layerY are non-standard, so we only fallback to them when we have to:
        return [d3.event.layerX, d3.event.layerY];
    } else {
        return [d3.event.offsetX, d3.event.offsetY];
    }
};
