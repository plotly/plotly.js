/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var isNumeric = require('fast-isnumeric');

var numConstants = require('../constants/numerical');
var FP_SAFE = numConstants.FP_SAFE;
var BADNUM = numConstants.BADNUM;

var lib = module.exports = {};

lib.nestedProperty = require('./nested_property');
lib.keyedContainer = require('./keyed_container');
lib.isPlainObject = require('./is_plain_object');
lib.isArray = require('./is_array');
lib.mod = require('./mod');
lib.toLogRange = require('./to_log_range');
lib.relinkPrivateKeys = require('./relink_private');
lib.ensureArray = require('./ensure_array');

var coerceModule = require('./coerce');
lib.valObjects = coerceModule.valObjects;
lib.coerce = coerceModule.coerce;
lib.coerce2 = coerceModule.coerce2;
lib.coerceFont = coerceModule.coerceFont;
lib.coerceHoverinfo = coerceModule.coerceHoverinfo;
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

var statsModule = require('./stats');
lib.aggNums = statsModule.aggNums;
lib.len = statsModule.len;
lib.mean = statsModule.mean;
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
lib.apply2DTransform = matrixModule.apply2DTransform;
lib.apply2DTransform2 = matrixModule.apply2DTransform2;

var geom2dModule = require('./geometry2d');
lib.segmentsIntersect = geom2dModule.segmentsIntersect;
lib.segmentDistance = geom2dModule.segmentDistance;
lib.getTextLocation = geom2dModule.getTextLocation;
lib.clearLocationCache = geom2dModule.clearLocationCache;
lib.getVisibleSegment = geom2dModule.getVisibleSegment;

var extendModule = require('./extend');
lib.extendFlat = extendModule.extendFlat;
lib.extendDeep = extendModule.extendDeep;
lib.extendDeepAll = extendModule.extendDeepAll;
lib.extendDeepNoArrays = extendModule.extendDeepNoArrays;

var loggersModule = require('./loggers');
lib.log = loggersModule.log;
lib.warn = loggersModule.warn;
lib.error = loggersModule.error;

lib.notifier = require('./notifier');

lib.filterUnique = require('./filter_unique');
lib.filterVisible = require('./filter_visible');
lib.pushUnique = require('./push_unique');

lib.cleanNumber = require('./clean_number');

lib.ensureNumber = function num(v) {
    if(!isNumeric(v)) return BADNUM;
    v = Number(v);
    if(v < -FP_SAFE || v > FP_SAFE) return BADNUM;
    return isNumeric(v) ? Number(v) : BADNUM;
};

lib.noop = require('./noop');
lib.identity = require('./identity');

/**
 * swap x and y of the same attribute in container cont
 * specify attr with a ? in place of x/y
 * you can also swap other things than x/y by providing part1 and part2
 */
lib.swapAttrs = function(cont, attrList, part1, part2) {
    if(!part1) part1 = 'x';
    if(!part2) part2 = 'y';
    for(var i = 0; i < attrList.length; i++) {
        var attr = attrList[i],
            xp = lib.nestedProperty(cont, attr.replace('?', part1)),
            yp = lib.nestedProperty(cont, attr.replace('?', part2)),
            temp = xp.get();
        xp.set(yp.get());
        yp.set(temp);
    }
};

/**
 * to prevent event bubbling, in particular text selection during drag.
 * see http://stackoverflow.com/questions/5429827/
 *      how-can-i-prevent-text-element-selection-with-cursor-drag
 * for maximum effect use:
 *      return pauseEvent(e);
 */
lib.pauseEvent = function(e) {
    if(e.stopPropagation) e.stopPropagation();
    if(e.preventDefault) e.preventDefault();
    e.cancelBubble = true;
    return false;
};

// constrain - restrict a number v to be between v0 and v1
lib.constrain = function(v, v0, v1) {
    if(v0 > v1) return Math.max(v1, Math.min(v0, v));
    return Math.max(v0, Math.min(v1, v));
};

/**
 * do two bounding boxes from getBoundingClientRect,
 * ie {left,right,top,bottom,width,height}, overlap?
 * takes optional padding pixels
 */
lib.bBoxIntersect = function(a, b, pad) {
    pad = pad || 0;
    return (a.left <= b.right + pad &&
            b.left <= a.right + pad &&
            a.top <= b.bottom + pad &&
            b.top <= a.bottom + pad);
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
lib.simpleMap = function(array, func, x1, x2) {
    var len = array.length,
        out = new Array(len);
    for(var i = 0; i < len; i++) out[i] = func(array[i], x1, x2);
    return out;
};

// random string generator
lib.randstr = function randstr(existing, bits, base) {
    /*
     * Include number of bits, the base of the string you want
     * and an optional array of existing strings to avoid.
     */
    if(!base) base = 16;
    if(bits === undefined) bits = 24;
    if(bits <= 0) return '0';

    var digits = Math.log(Math.pow(2, bits)) / Math.log(base),
        res = '',
        i,
        b,
        x;

    for(i = 2; digits === Infinity; i *= 2) {
        digits = Math.log(Math.pow(2, bits / i)) / Math.log(base) * i;
    }

    var rem = digits - Math.floor(digits);

    for(i = 0; i < Math.floor(digits); i++) {
        x = Math.floor(Math.random() * base).toString(base);
        res = x + res;
    }

    if(rem) {
        b = Math.pow(base, rem);
        x = Math.floor(Math.random() * b).toString(base);
        res = x + res;
    }

    var parsed = parseInt(res, base);
    if((existing && (existing.indexOf(res) > -1)) ||
         (parsed !== Infinity && parsed >= Math.pow(2, bits))) {
        return randstr(existing, bits, base);
    }
    else return res;
};

lib.OptionControl = function(opt, optname) {
    /*
     * An environment to contain all option setters and
     * getters that collectively modify opts.
     *
     * You can call up opts from any function in new object
     * as this.optname || this.opt
     *
     * See FitOpts for example of usage
     */
    if(!opt) opt = {};
    if(!optname) optname = 'opt';

    var self = {};
    self.optionList = [];

    self._newoption = function(optObj) {
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
lib.smooth = function(arrayIn, FWHM) {
    FWHM = Math.round(FWHM) || 0; // only makes sense for integers
    if(FWHM < 2) return arrayIn;

    var alen = arrayIn.length,
        alen2 = 2 * alen,
        wlen = 2 * FWHM - 1,
        w = new Array(wlen),
        arrayOut = new Array(alen),
        i,
        j,
        k,
        v;

    // first make the window array
    for(i = 0; i < wlen; i++) {
        w[i] = (1 - Math.cos(Math.PI * (i + 1) / FWHM)) / (2 * FWHM);
    }

    // now do the convolution
    for(i = 0; i < alen; i++) {
        v = 0;
        for(j = 0; j < wlen; j++) {
            k = i + j + 1 - FWHM;

            // multibounce
            if(k < -alen) k -= alen2 * Math.round(k / alen2);
            else if(k >= alen2) k -= alen2 * Math.floor(k / alen2);

            // single bounce
            if(k < 0) k = - 1 - k;
            else if(k >= alen) k = alen2 - 1 - k;

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
lib.syncOrAsync = function(sequence, arg, finalStep) {
    var ret, fni;

    function continueAsync() {
        return lib.syncOrAsync(sequence, arg, finalStep);
    }

    while(sequence.length) {
        fni = sequence.splice(0, 1)[0];
        ret = fni(arg);

        if(ret && ret.then) {
            return ret.then(continueAsync)
                .then(undefined, lib.promiseError);
        }
    }

    return finalStep && finalStep(arg);
};


/**
 * Helper to strip trailing slash, from
 * http://stackoverflow.com/questions/6680825/return-string-without-trailing-slash
 */
lib.stripTrailingSlash = function(str) {
    if(str.substr(-1) === '/') return str.substr(0, str.length - 1);
    return str;
};

lib.noneOrAll = function(containerIn, containerOut, attrList) {
    /**
     * some attributes come together, so if you have one of them
     * in the input, you should copy the default values of the others
     * to the input as well.
     */
    if(!containerIn) return;

    var hasAny = false,
        hasAll = true,
        i,
        val;

    for(i = 0; i < attrList.length; i++) {
        val = containerIn[attrList[i]];
        if(val !== undefined && val !== null) hasAny = true;
        else hasAll = false;
    }

    if(hasAny && !hasAll) {
        for(i = 0; i < attrList.length; i++) {
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
lib.mergeArray = function(traceAttr, cd, cdAttr) {
    if(Array.isArray(traceAttr)) {
        var imax = Math.min(traceAttr.length, cd.length);
        for(var i = 0; i < imax; i++) cd[i][cdAttr] = traceAttr[i];
    }
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
lib.fillArray = function(traceAttr, cd, cdAttr, fn) {
    fn = fn || lib.identity;

    if(Array.isArray(traceAttr)) {
        for(var i = 0; i < cd.length; i++) {
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
lib.castOption = function(trace, ptNumber, astr, fn) {
    fn = fn || lib.identity;

    var val = lib.nestedProperty(trace, astr).get();

    if(Array.isArray(val)) {
        if(Array.isArray(ptNumber) && Array.isArray(val[ptNumber[0]])) {
            return fn(val[ptNumber[0]][ptNumber[1]]);
        } else {
            return fn(val[ptNumber]);
        }
    } else {
        return val;
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
lib.getTargetArray = function(trace, transformOpts) {
    var target = transformOpts.target;

    if(typeof target === 'string' && target) {
        var array = lib.nestedProperty(trace, target).get();
        return Array.isArray(array) ? array : false;
    } else if(Array.isArray(target)) {
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
lib.minExtend = function(obj1, obj2) {
    var objOut = {};
    if(typeof obj2 !== 'object') obj2 = {};
    var arrayLen = 3,
        keys = Object.keys(obj1),
        i,
        k,
        v;
    for(i = 0; i < keys.length; i++) {
        k = keys[i];
        v = obj1[k];
        if(k.charAt(0) === '_' || typeof v === 'function') continue;
        else if(k === 'module') objOut[k] = v;
        else if(Array.isArray(v)) objOut[k] = v.slice(0, arrayLen);
        else if(v && (typeof v === 'object')) objOut[k] = lib.minExtend(obj1[k], obj2[k]);
        else objOut[k] = v;
    }

    keys = Object.keys(obj2);
    for(i = 0; i < keys.length; i++) {
        k = keys[i];
        v = obj2[k];
        if(typeof v !== 'object' || !(k in objOut) || typeof objOut[k] !== 'object') {
            objOut[k] = v;
        }
    }

    return objOut;
};

lib.titleCase = function(s) {
    return s.charAt(0).toUpperCase() + s.substr(1);
};

lib.containsAny = function(s, fragments) {
    for(var i = 0; i < fragments.length; i++) {
        if(s.indexOf(fragments[i]) !== -1) return true;
    }
    return false;
};

lib.isPlotDiv = function(el) {
    var el3 = d3.select(el);
    return el3.node() instanceof HTMLElement &&
        el3.size() &&
        el3.classed('js-plotly-plot');
};

lib.removeElement = function(el) {
    var elParent = el && el.parentNode;
    if(elParent) elParent.removeChild(el);
};

/**
 * for dynamically adding style rules
 * makes one stylesheet that contains all rules added
 * by all calls to this function
 */
lib.addStyleRule = function(selector, styleString) {
    if(!lib.styleSheet) {
        var style = document.createElement('style');
        // WebKit hack :(
        style.appendChild(document.createTextNode(''));
        document.head.appendChild(style);
        lib.styleSheet = style.sheet;
    }
    var styleSheet = lib.styleSheet;

    if(styleSheet.insertRule) {
        styleSheet.insertRule(selector + '{' + styleString + '}', 0);
    }
    else if(styleSheet.addRule) {
        styleSheet.addRule(selector, styleString, 0);
    }
    else lib.warn('addStyleRule failed');
};

lib.isIE = function() {
    return typeof window.navigator.msSaveBlob !== 'undefined';
};

/**
 * Duck typing to recognize a d3 selection, mostly for IE9's benefit
 * because it doesn't handle instanceof like modern browsers
 */
lib.isD3Selection = function(obj) {
    return obj && (typeof obj.classed === 'function');
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
lib.objectFromPath = function(path, value) {
    var keys = path.split('.'),
        tmpObj,
        obj = tmpObj = {};

    for(var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var el = null;

        var parts = keys[i].match(/(.*)\[([0-9]+)\]/);

        if(parts) {
            key = parts[1];
            el = parts[2];

            tmpObj = tmpObj[key] = [];

            if(i === keys.length - 1) {
                tmpObj[el] = value;
            } else {
                tmpObj[el] = {};
            }

            tmpObj = tmpObj[el];
        } else {

            if(i === keys.length - 1) {
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
 * It does NOT, however, merge mulitple mutliply-nested arrays::
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

lib.expandObjectPaths = function(data) {
    var match, key, prop, datum, idx, dest, trailingPath;
    if(typeof data === 'object' && !Array.isArray(data)) {
        for(key in data) {
            if(data.hasOwnProperty(key)) {
                if((match = key.match(dottedPropertyRegex))) {
                    datum = data[key];
                    prop = match[1];

                    delete data[key];

                    data[prop] = lib.extendDeepNoArrays(data[prop] || {}, lib.objectFromPath(key, lib.expandObjectPaths(datum))[prop]);
                } else if((match = key.match(indexedPropertyRegex))) {
                    datum = data[key];

                    prop = match[1];
                    idx = parseInt(match[2]);

                    delete data[key];

                    data[prop] = data[prop] || [];

                    if(match[3] === '.') {
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
                        data[prop][idx] = lib.expandObjectPaths(datum);
                    }
                } else {
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
lib.numSeparate = function(value, separators, separatethousands) {
    if(!separatethousands) separatethousands = false;

    if(typeof separators !== 'string' || separators.length === 0) {
        throw new Error('Separator string required for formatting!');
    }

    if(typeof value === 'number') {
        value = String(value);
    }

    var thousandsRe = /(\d+)(\d{3})/,
        decimalSep = separators.charAt(0),
        thouSep = separators.charAt(1);

    var x = value.split('.'),
        x1 = x[0],
        x2 = x.length > 1 ? decimalSep + x[1] : '';

    // Years are ignored for thousands separators
    if(thouSep && (x.length > 1 || x1.length > 4 || separatethousands)) {
        while(thousandsRe.test(x1)) {
            x1 = x1.replace(thousandsRe, '$1' + thouSep + '$2');
        }
    }

    return x1 + x2;
};

var TEMPLATE_STRING_REGEX = /%{([^\s%{}]*)}/g;
var SIMPLE_PROPERTY_REGEX = /^\w*$/;

/*
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

lib.templateString = function(string, obj) {
    // Not all that useful, but cache nestedProperty instantiation
    // just in case it speeds things up *slightly*:
    var getterCache = {};

    return string.replace(TEMPLATE_STRING_REGEX, function(dummy, key) {
        if(SIMPLE_PROPERTY_REGEX.test(key)) {
            return obj[key] || '';
        }
        getterCache[key] = getterCache[key] || lib.nestedProperty(obj, key).get;
        return getterCache[key]() || '';
    });
};
