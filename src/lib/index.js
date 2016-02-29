/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var lib = module.exports = {};

lib.nestedProperty = require('./nested_property');
lib.isPlainObject = require('./is_plain_object');

var coerceModule = require('./coerce');
lib.valObjects = coerceModule.valObjects;
lib.coerce = coerceModule.coerce;
lib.coerce2 = coerceModule.coerce2;
lib.coerceFont = coerceModule.coerceFont;

var datesModule = require('./dates');
lib.dateTime2ms = datesModule.dateTime2ms;
lib.isDateTime = datesModule.isDateTime;
lib.ms2DateTime = datesModule.ms2DateTime;
lib.parseDate = datesModule.parseDate;

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

var extendModule = require('./extend');
lib.extendFlat = extendModule.extendFlat;
lib.extendDeep = extendModule.extendDeep;
lib.extendDeepAll = extendModule.extendDeepAll;

lib.notifier = require('./notifier');

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

/**
 * ------------------------------------------
 * debugging tools
 * ------------------------------------------
 */

// set VERBOSE to true to get a lot more logging and tracing
lib.VERBOSE = false;

// first markTime call will return time from page load
lib.TIMER = new Date().getTime();

// console.log that only runs if VERBOSE is on
lib.log = function() {
    if(lib.VERBOSE) console.log.apply(console, arguments);
};

/**
 * markTime - for debugging, mark the number of milliseconds
 * since the previous call to markTime and log arbitrary info too
 */
lib.markTime = function(v) {
    if(!lib.VERBOSE) return;
    var t2 = new Date().getTime();
    console.log(v, t2 - lib.TIMER, '(msec)');
    if(lib.VERBOSE === 'trace') console.trace();
    lib.TIMER = t2;
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

// minor convenience/performance booster for d3...
lib.identity = function(d) { return d; };

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

    self['_'+optname] = opt;
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

// helpers for promises

/**
 * promiseError: log errors properly inside promises
 * use:
 * <promise>.then(undefined,Plotly.Lib.promiseError) (for IE compatibility)
 * or <promise>.catch(Plotly.Lib.promiseError)
 * TODO: I guess we need another step to send this error to Sentry?
 */
lib.promiseError = function(err) { console.log(err, err.stack); };

/**
 * syncOrAsync: run a sequence of functions synchronously
 * as long as its returns are not promises (ie have no .then)
 * includes one argument arg to send to all functions...
 * this is mainly just to prevent us having to make wrapper functions
 * when the only purpose of the wrapper is to reference gd / td
 * and a final step to be executed at the end
 * TODO: if there's an error and everything is sync,
 * this doesn't happen yet because we want to make sure
 * that it gets reported
 */
lib.syncOrAsync = function(sequence, arg, finalStep) {
    var ret, fni;

    function continueAsync() {
        lib.markTime('async done ' + fni.name);
        return lib.syncOrAsync(sequence, arg, finalStep);
    }
    while(sequence.length) {
        fni = sequence.splice(0, 1)[0];
        ret = fni(arg);
        // lib.markTime('done calling '+fni.name)
        if(ret && ret.then) {
            return ret.then(continueAsync)
                .then(undefined, lib.promiseError);
        }
        lib.markTime('sync done ' + fni.name);
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

lib.mergeArray = function(traceAttr, cd, cdAttr) {
    if(Array.isArray(traceAttr)) {
        var imax = Math.min(traceAttr.length, cd.length);
        for(var i=0; i<imax; i++) cd[i][cdAttr] = traceAttr[i];
    }
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
        if(k.charAt(0)==='_' || typeof v === 'function') continue;
        else if(k==='module') objOut[k] = v;
        else if(Array.isArray(v)) objOut[k] = v.slice(0,arrayLen);
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
        if(s.indexOf(fragments[i])!== -1) return true;
    }
    return false;
};

// get the parent Plotly plot of any element. Whoo jquery-free tree climbing!
lib.getPlotDiv = function(el) {
    for(; el && el.removeAttribute; el = el.parentNode) {
        if(lib.isPlotDiv(el)) return el;
    }
};

lib.isPlotDiv = function(el) {
    var el3 = d3.select(el);
    return el3.size() && el3.classed('js-plotly-plot');
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
        styleSheet.insertRule(selector+'{'+styleString+'}',0);
    }
    else if(styleSheet.addRule) {
        styleSheet.addRule(selector,styleString,0);
    }
    else console.warn('addStyleRule failed');
};

lib.isIE = function() {
    return typeof window.navigator.msSaveBlob !== 'undefined';
};
