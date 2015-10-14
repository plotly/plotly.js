// common library functions, mostly for plotting but used elsewhere too
'use strict';
// TODO: can use camelcase after fixing showSources
/* jshint camelcase: false */

// ---global functions not yet namespaced
/* global pullf:false */

// ---external global dependencies
/* global d3:false */

var lib = module.exports = {},
    Plotly = require('./plotly'),
    tinycolor = require('tinycolor2'),
    isNumeric = require('./isnumeric');

/**
 * dateTime2ms - turn a date object or string s of the form
 * YYYY-mm-dd HH:MM:SS.sss into milliseconds (relative to 1970-01-01,
 * per javascript standard)
 * may truncate after any full field, and sss can be any length
 * even >3 digits, though javascript dates truncate to milliseconds
 * returns false if it doesn't find a date
 *
 * 2-digit to 4-digit year conversion, where to cut off?
 * from http://support.microsoft.com/kb/244664:
 *   1930-2029 (the most retro of all...)
 * but in my mac chrome from eg. d=new Date(Date.parse('8/19/50')):
 *   1950-2049
 * by Java, from http://stackoverflow.com/questions/2024273/:
 *   now-80 - now+20
 * or FileMaker Pro, from
 *      http://www.filemaker.com/12help/html/add_view_data.4.21.html:
 *   now-70 - now+30
 * but python strptime etc, via
 *      http://docs.python.org/py3k/library/time.html:
 *   1969-2068 (super forward-looking, but static, not sliding!)
 *
 * lets go with now-70 to now+30, and if anyone runs into this problem
 * they can learn the hard way not to use 2-digit years, as no choice we
 * make now will cover all possibilities. mostly this will all be taken
 * care of in initial parsing, should only be an issue for hand-entered data
 * currently (2012) this range is:
 *   1942-2041
 */

lib.dateTime2ms = function(s) {
    // first check if s is a date object
    try {
        if (s.getTime) return +s;
    }
    catch(e) {
        return false;
    }

    var y, m, d, h;
    // split date and time parts
    var datetime = String(s).split(' ');
    if (datetime.length > 2) return false;

    var p = datetime[0].split('-'); // date part
    if (p.length > 3 || (p.length !== 3 && datetime[1])) return false;

    // year
    if (p[0].length === 4) y = Number(p[0]);
    else if (p[0].length === 2) {
        var yNow = new Date().getFullYear();
        y = ((Number(p[0]) - yNow + 70)%100 + 200)%100 + yNow - 70;
    }
    else return false;
    if (!isNumeric(y)) return false;
    if (p.length === 1) return new Date(y,0,1).getTime(); // year only

    // month
    m = Number(p[1]) - 1; // new Date() uses zero-based months
    if (p[1].length > 2 || !(m >= 0 && m <= 11)) return false;
    if (p.length === 2) return new Date(y, m, 1).getTime(); // year-month

    // day
    d = Number(p[2]);
    if (p[2].length > 2 || !(d >= 1 && d <= 31)) return false;

    // now save the date part
    d = new Date(y, m, d).getTime();
    if (!datetime[1]) return d; // year-month-day
    p = datetime[1].split(':');
    if (p.length > 3) return false;

    // hour
    h = Number(p[0]);
    if (p[0].length > 2 || !(h >= 0 && h <= 23)) return false;
    d += 3600000*h;
    if (p.length === 1) return d;

    // minute
    m = Number(p[1]);
    if (p[1].length > 2 || !(m >= 0 && m <= 59)) return false;
    d += 60000*m;
    if (p.length === 2) return d;

    // second
    s = Number(p[2]);
    if (!(s >= 0 && s < 60)) return false;
    return d+s*1000;
};

// is string s a date? (see above)
lib.isDateTime = function(s) {
    return (lib.dateTime2ms(s) !== false);
};

/**
 * Turn ms into string of the form YYYY-mm-dd HH:MM:SS.sss
 * Crop any trailing zeros in time, but always leave full date
 * (we could choose to crop '-01' from date too)...
 * Optional range r is the data range that applies, also in ms.
 * If rng is big, the later parts of time will be omitted
 */
lib.ms2DateTime = function(ms,r) {
    if(typeof(d3)==='undefined'){
        console.log('d3 is not defined');
        return;
    }

    if(!r) r=0;
    var d = new Date(ms),
        s = d3.time.format('%Y-%m-%d')(d);
    if(r<7776000000) {
        // <90 days: add hours
        s+=' '+lib.lpad(d.getHours(),2);
        if(r<432000000) {
            // <5 days: add minutes
            s+=':'+lib.lpad(d.getMinutes(),2);
            if(r<10800000) {
                // <3 hours: add seconds
                s+=':'+lib.lpad(d.getSeconds(),2);
                if(r<300000) {
                    // <5 minutes: add ms
                    s+='.'+lib.lpad(d.getMilliseconds(),3);
                }
            }
        }
        // strip trailing zeros
        return s.replace(/([:\s]00)*\.?[0]*$/,'');
    }
    return s;
};

/**
 * Plotly.Lib.parseDate: forgiving attempt to turn any date string
 * into a javascript date object
 *
 * first collate all the date formats we want to support, precompiled
 * to d3 format objects see below for the string cleaning that happens
 * before this separate out 2-digit (y) and 4-digit-year (Y) formats,
 * formats with month names (b), and formats with am/pm (I) or no time (D)
 * (also includes hour only, as the test is really for a colon) so we can
 * cut down the number of tests we need to run for any given string
 * (right now all are between 15 and 32 tests)
 */

// TODO: this is way out of date vs. the server-side version
var timeFormats = {
    // 24 hour
    H:['%H:%M:%S~%L', '%H:%M:%S', '%H:%M'],
    // with am/pm
    I:['%I:%M:%S~%L%p', '%I:%M:%S%p', '%I:%M%p'],
    // no colon, ie only date or date with hour (could also support eg 12h34m?)
    D:['%H', '%I%p', '%Hh']
};
var dateFormats = {
    Y:[
        '%Y~%m~%d',
        '%Y%m%d',
        '%y%m%d', // YYMMDD, has 6 digits together so will match Y, not y
        '%m~%d~%Y', // MM/DD/YYYY has first precedence
        '%d~%m~%Y' // then DD/MM/YYYY
    ],
    Yb:[
        '%b~%d~%Y', // eg nov 21 2013
        '%d~%b~%Y', // eg 21 nov 2013
        '%Y~%d~%b', // eg 2013 21 nov (or 2013 q3, after replacement)
        '%Y~%b~%d' // eg 2013 nov 21
    ],
    /**
     * the two-digit year cases have so many potential ambiguities
     * it's not even funny, but we'll try them anyway.
     */
    y:[
        '%m~%d~%y',
        '%d~%m~%y',
        '%y~%m~%d'
    ],
    yb:[
        '%b~%d~%y',
        '%d~%b~%y',
        '%y~%d~%b',
        '%y~%b~%d'
    ]
};

// use utc formatter since we're ignoring timezone info
var formatter = d3.time.format.utc;

/**
 * ISO8601 and YYYYMMDDHHMMSS are the only ones where date and time
 * are not separated by a space, so they get inserted specially here.
 * Also a couple formats with no day (so time makes no sense)
 */
var dateTimeFormats = {
    Y: {
        H: ['%Y~%m~%dT%H:%M:%S', '%Y~%m~%dT%H:%M:%S~%L'].map(formatter),
        I: [],
        D: ['%Y%m%d%H%M%S', '%Y~%m', '%m~%Y'].map(formatter)
    },
    Yb: {H: [], I: [], D: ['%Y~%b', '%b~%Y'].map(formatter)},
    y: {H: [], I: [], D: []},
    yb: {H: [], I: [], D: []}
};
// all others get inserted in all possible combinations from dateFormats and timeFormats
['Y', 'Yb', 'y', 'yb'].forEach(function(dateType) {
    dateFormats[dateType].forEach(function(dateFormat) {
        // just a date (don't do just a time)
        dateTimeFormats[dateType].D.push(formatter(dateFormat));
        ['H', 'I', 'D'].forEach(function(timeType) {
            timeFormats[timeType].forEach(function(timeFormat) {
            var a = dateTimeFormats[dateType][timeType];
            // 'date time', then 'time date'
                a.push(formatter(dateFormat+'~'+timeFormat));
                a.push(formatter(timeFormat+'~'+dateFormat));
            });
        });
    });
});

// precompiled regexps for performance
var matchword = /[a-z]*/g,
    shortenword = function(m) { return m.substr(0,3); },
    weekdaymatch = /(mon|tue|wed|thu|fri|sat|sun|the|of|st|nd|rd|th)/g,
    separatormatch = /[\s,\/\-\.\(\)]+/g,
    ampmmatch = /~?([ap])~?m(~|$)/,
    replaceampm = function(m,ap) { return ap+'m '; },
    match4Y = /\d\d\d\d/,
    matchMonthName = /(^|~)[a-z]{3}/,
    matchAMPM = /[ap]m/,
    matchcolon = /:/,
    matchquarter = /q([1-4])/,
    quarters = ['31~mar','30~jun','30~sep','31~dec'],
    replacequarter = function(m,n) { return quarters[n-1]; },
    matchTZ = / ?([+\-]\d\d:?\d\d|Z)$/;

function getDateType(v) {
    var dateType;
    dateType = (match4Y.test(v) ? 'Y' : 'y');
    dateType = dateType + (matchMonthName.test(v) ? 'b' : '');
    return dateType;
}

function getTimeType(v) {
    var timeType;
    timeType = matchcolon.test(v) ? (matchAMPM.test(v) ? 'I' : 'H') : 'D';
    return timeType;
}

lib.parseDate = function(v) {
    // is it already a date? just return it
    if (v.getTime) return v;
    /**
     * otherwise, if it's not a string, return nothing
     * the case of numbers that just have years will get
     * dealt with elsewhere.
     */
    if (typeof v !== 'string') return false;

    // first clean up the string a bit to reduce the number of formats we have to test
    v = v.toLowerCase()
        /**
         * cut all words down to 3 characters - this will result in
         * some spurious matches, ie whenever the first three characters
         * of a word match a month or weekday but that seems more likely
         * to fix typos than to make dates where they shouldn't be...
         * and then we can omit the long form of months from our testing
         */
        .replace(matchword, shortenword)
        /**
         * remove weekday names, as they get overridden anyway if they're
         * inconsistent also removes a few more words
         * (ie "tuesday the 26th of november")
         * TODO: language support?
         * for months too, but these seem to be built into d3
         */
        .replace(weekdaymatch, '')
        /**
         * collapse all separators one ~ at a time, except : which seems
         * pretty consistent for the time part use ~ instead of space or
         * something since d3 can eat a space as padding on 1-digit numbers
         */
        .replace(separatormatch, '~')
        // in case of a.m. or p.m. (also take off any space before am/pm)
        .replace(ampmmatch, replaceampm)
        // turn quarters Q1-4 into dates (quarter ends)
        .replace(matchquarter, replacequarter)
        .trim()
        // also try to ignore timezone info, at least for now
        .replace(matchTZ, '');

    // now test against the various formats that might match
    var out = null,
        dateType = getDateType(v),
        timeType = getTimeType(v),
        formatList,
        len;

    formatList = dateTimeFormats[dateType][timeType];
    len = formatList.length;

    for (var i = 0; i < len; i++) {
        out = formatList[i].parse(v);
        if (out) break;
    }

    // If not an instance of Date at this point, just return it.
    if (!(out instanceof Date)) return false;
    // parse() method interprets arguments with local time zone.
    var tzoff = out.getTimezoneOffset();
    // In general (default) this is not what we want, so force into UTC:
    out.setTime(out.getTime() + tzoff * 60 * 1000);
    return out;
};

/**
 * findBin - find the bin for val - note that it can return outside the
 * bin range any pos. or neg. integer for linear bins, or -1 or
 * bins.length-1 for explicit.
 * bins is either an object {start,size,end} or an array length #bins+1
 * bins can be either increasing or decreasing but must be monotonic
 * for linear bins, we can just calculate. For listed bins, run a binary
 * search linelow (truthy) says the bin boundary should be attributed to
 * the lower bin rather than the default upper bin
 */
lib.findBin = function(val, bins, linelow) {
    if(isNumeric(bins.start)) {
        return linelow ?
            Math.ceil((val - bins.start) / bins.size) - 1 :
            Math.floor((val - bins.start) / bins.size);
    }
    else {
        var n1 = 0,
            n2 = bins.length,
            c = 0,
            n,
            test;
        if(bins[bins.length - 1] > bins[0]) {
            test = linelow ? lessThan : lessOrEqual;
        } else {
            test = linelow ? greaterOrEqual : greaterThan;
        }
        // c is just to avoid infinite loops if there's an error
        while(n1 < n2 && c++ < 100){
            n = Math.floor((n1 + n2) / 2);
            if(test(bins[n], val)) n1 = n + 1;
            else n2 = n;
        }
        if(c > 90) console.log('Long binary search...');
        return n1 - 1;
    }
};

function lessThan(a, b) { return a < b; }
function lessOrEqual(a, b) { return a <= b; }
function greaterThan(a, b) { return a > b; }
function greaterOrEqual(a, b) { return a >= b; }

lib.sorterAsc = function(a, b) { return a - b; };

/**
 * find distinct values in an array, lumping together ones that appear to
 * just be off by a rounding error
 * return the distinct values and the minimum difference between any two
 */
lib.distinctVals = function(valsIn) {
    var vals = valsIn.slice();  // otherwise we sort the original array...
    vals.sort(lib.sorterAsc);

    var l = vals.length - 1,
        minDiff = (vals[l] - vals[0]) || 1,
        errDiff = minDiff / (l || 1) / 10000,
        v2 = [vals[0]];

    for(var i = 0; i < l; i++) {
        // make sure values aren't just off by a rounding error
        if(vals[i + 1] > vals[i] + errDiff) {
            minDiff = Math.min(minDiff, vals[i + 1] - vals[i]);
            v2.push(vals[i + 1]);
        }
    }

    return {vals: v2, minDiff: minDiff};
};

/**
 * return the smallest element from (sorted) array arrayIn that's bigger than val,
 * or (reverse) the largest element smaller than val
 * used to find the best tick given the minimum (non-rounded) tick
 * particularly useful for date/time where things are not powers of 10
 * binary search is probably overkill here...
 */
lib.roundUp = function(val, arrayIn, reverse){
    var low = 0,
        high = arrayIn.length - 1,
        mid,
        c = 0,
        dlow = reverse ? 0 : 1,
        dhigh = reverse ? 1 : 0,
        rounded = reverse ? Math.ceil : Math.floor;
    // c is just to avoid infinite loops if there's an error
    while(low < high && c++ < 100){
        mid = rounded((low + high) / 2);
        if(arrayIn[mid] <= val) low = mid + dlow;
        else high = mid - dhigh;
    }
    return arrayIn[low];
};

/**
 * convert a string s (such as 'xaxis.range[0]')
 * representing a property of nested object into set and get methods
 * also return the string and object so we don't have to keep track of them
 * allows [-1] for an array index, to set a property inside all elements
 * of an array
 * eg if obj = {arr: [{a: 1}, {a: 2}]}
 * you can do p = nestedProperty(obj, 'arr[-1].a')
 * but you cannot set the array itself this way, to do that
 * just set the whole array.
 * eg if obj = {arr: [1, 2, 3]}
 * you can't do nestedProperty(obj, 'arr[-1]').set(5)
 * but you can do nestedProperty(obj, 'arr').set([5, 5, 5])
 */
lib.nestedProperty = function(container, propStr) {
    if(isNumeric(propStr)) propStr = String(propStr);
    else if(typeof propStr !== 'string' ||
            propStr.substr(propStr.length - 4) === '[-1]') {
        throw 'bad property string';
    }

    var j = 0,
        propParts = propStr.split('.'),
        indexed,
        indices,
        i;

    // check for parts of the nesting hierarchy that are numbers (ie array elements)
    while(j < propParts.length) {
        // look for non-bracket chars, then any number of [##] blocks
        indexed = String(propParts[j]).match(/^([^\[\]]*)((\[\-?[0-9]*\])+)$/);
        if(indexed) {
            if(indexed[1]) propParts[j] = indexed[1];
            // allow propStr to start with bracketed array indices
            else if(j === 0) propParts.splice(0,1);
            else throw 'bad property string';

            indices = indexed[2]
                .substr(1,indexed[2].length-2)
                .split('][');

            for(i=0; i<indices.length; i++) {
                j++;
                propParts.splice(j,0,Number(indices[i]));
            }
        }
        j++;
    }

    if(typeof container !== 'object') {
        return badContainer(container, propStr, propParts);
    }

    return {
        set: npSet(container, propParts),
        get: npGet(container, propParts),
        astr: propStr,
        parts: propParts,
        obj: container
    };
};

function npGet(cont, parts) {
    return function() {
        var curCont = cont,
            curPart,
            allSame,
            out,
            i,
            j;

        for(i = 0; i < parts.length - 1; i++) {
            curPart = parts[i];
            if(curPart===-1) {
                allSame = true;
                out = [];
                for(j = 0; j < curCont.length; j++) {
                    out[j] = npGet(curCont[j], parts.slice(i + 1))();
                    if(out[j]!==out[0]) allSame = false;
                }
                return allSame ? out[0] : out;
            }
            if(typeof curPart === 'number' && !Array.isArray(curCont)) {
                return undefined;
            }
            curCont = curCont[curPart];
            if(typeof curCont !== 'object' || curCont === null) {
                return undefined;
            }
        }

        // only hit this if parts.length === 1
        if(typeof curCont !== 'object' || curCont === null) return undefined;

        out = curCont[parts[i]];
        if(out === null) return undefined;
        return out;
    };
}

/*
 * Check known non-data-array arrays (containers). Data arrays only contain scalars,
 * so parts[end] values, such as -1 or n, indicate we are not dealing with a dataArray.
 * The ONLY case we are looking for is where the entire array is selected, parts[end] === 'x'
 * AND the replacement value is an array.
 */
function isDataArray(val, key) {

    var containers = ['annotations', 'shapes', 'range', 'domain'],
        isNotAContainer = containers.indexOf(key) === -1;

    return Array.isArray(val) && isNotAContainer;
}

function npSet(cont, parts) {
    return function(val) {
        var curCont = cont,
            containerLevels = [cont],
            toDelete = emptyObj(val)  && !isDataArray(val, parts[parts.length-1]),
            curPart,
            i;

        for(i = 0; i < parts.length - 1; i++) {
            curPart = parts[i];

            if(typeof curPart === 'number' && !Array.isArray(curCont)) {
                throw 'array index but container is not an array';
            }

            // handle special -1 array index
            if(curPart===-1) {
                toDelete = !setArrayAll(curCont, parts.slice(i + 1), val);
                if(toDelete) break;
                else return;
            }

            if(!checkNewContainer(curCont, curPart, parts[i + 1], toDelete)) {
                break;
            }

            curCont = curCont[curPart];

            if(typeof curCont !== 'object' || curCont === null) {
                throw 'container is not an object';
            }

            containerLevels.push(curCont);
        }

        if(toDelete) {
            if(i === parts.length - 1) delete curCont[parts[i]];
            pruneContainers(containerLevels);
        }
        else curCont[parts[i]] = val;
    };
}

// handle special -1 array index
function setArrayAll(containerArray, innerParts, val) {
    var arrayVal = Array.isArray(val),
        allSet = true,
        thisVal = val,
        deleteThis = arrayVal ? false : emptyObj(val),
        firstPart = innerParts[0],
        i;

    for(i = 0; i < containerArray.length; i++) {
        if(arrayVal) {
            thisVal = val[i % val.length];
            deleteThis = emptyObj(thisVal);
        }
        if(deleteThis) allSet = false;
        if(!checkNewContainer(containerArray, i, firstPart, deleteThis)) {
            continue;
        }
        npSet(containerArray[i], innerParts)(thisVal);
    }
    return allSet;
}

/**
 * make new sub-container as needed.
 * returns false if there's no container and none is needed
 * because we're only deleting an attribute
 */
function checkNewContainer(container, part, nextPart, toDelete) {
    if(container[part] === undefined) {
        if(toDelete) return false;

        if(typeof nextPart === 'number') container[part] = [];
        else container[part] = {};
    }
    return true;
}

function pruneContainers(containerLevels) {
    var i,
        j,
        curCont,
        keys,
        remainingKeys;
    for(i = containerLevels.length - 1; i >= 0; i--) {
        curCont = containerLevels[i];
        remainingKeys = false;
        if(Array.isArray(curCont)) {
            for(j = curCont.length - 1; j >= 0; j--) {
                if(emptyObj(curCont[j])) {
                    if(remainingKeys) curCont[j] = undefined;
                    else curCont.pop();
                }
                else remainingKeys = true;
            }
        }
        else if(typeof curCont === 'object' && curCont !== null)  {
            keys = Object.keys(curCont);
            remainingKeys = false;
            for(j = keys.length - 1; j >= 0; j--) {
                if(emptyObj(curCont[keys[j]]) && !isDataArray(curCont[keys[j]], keys[j])) delete curCont[keys[j]];
                else remainingKeys = true;
            }
        }
        if(remainingKeys) return;
    }
}

function emptyObj(obj) {
    if(obj===undefined || obj===null) return true;
    if(typeof obj !== 'object') return false; // any plain value
    if(Array.isArray(obj)) return !obj.length; // []
    return !Object.keys(obj).length; // {}
}

function badContainer(container, propStr, propParts) {
    return {
        set: function() { throw 'bad container'; },
        get: function() {},
        astr: propStr,
        parts: propParts,
        obj: container
    };
}

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
lib.pauseEvent = function(e){
    if(e.stopPropagation) e.stopPropagation();
    if(e.preventDefault) e.preventDefault();
    e.cancelBubble = true;
    return false;
};

// pad a number with zeroes, to given # of digits before the decimal point
lib.lpad = function(val, digits){
    return String(val + Math.pow(10, digits)).substr(1);
};

// STATISTICS FUNCTIONS

/**
 * aggNums() returns the result of an aggregate function applied to an array of
 * values, where non-numerical values have been tossed out.
 *
 * @param {function} f - aggregation function (e.g., Math.min)
 * @param {Number} v - initial value (continuing from previous calls)
 *      if there's no continuing value, use null for selector-type
 *      functions (max,min), or 0 for summations
 * @param {Array} a - array to aggregate (may be nested, we will recurse,
 *                    but all elements must have the same dimension)
 * @param {Number} len - maximum length of a to aggregate
 * @return {Number} - result of f applied to a starting from v
 */
lib.aggNums = function(f, v, a, len) {
    var i,
        b;
    if (!len) len = a.length;
    if (!isNumeric(v)) v = false;
    if (Array.isArray(a[0])) {
        b = new Array(len);
        for(i = 0; i < len; i++) b[i] = lib.aggNums(f, v, a[i]);
        a = b;
    }

    for (i = 0; i < len; i++) {
        if (!isNumeric(v)) v = a[i];
        else if (isNumeric(a[i])) v = f(+v, +a[i]);
    }
    return v;
};

/**
 * mean & std dev functions using aggNums, so it handles non-numerics nicely
 * even need to use aggNums instead of .length, to toss out non-numerics
 */
lib.len = function(data) {
    return lib.aggNums(function(a){ return a + 1; }, 0, data);
};

lib.mean = function(data, len) {
    if(!len) len = lib.len(data);
    return lib.aggNums(function(a, b){ return a + b; }, 0, data) / len;
};

lib.variance = function(data, len, mean) {
    if (!len) len = lib.len(data);
    if (!isNumeric(mean)) mean = lib.mean(data, len);

    return lib.aggNums(function(a, b) {
        return a + Math.pow(b - mean, 2);
    }, 0, data)/len;
};

lib.stdev = function(data, len, mean) {
    return Math.sqrt(lib.variance(data, len, mean));
};

/**
 * interp() computes a percentile (quantile) for a given distribution.
 * We interpolate the distribution (to compute quantiles, we follow method #10 here:
 * http://www.amstat.org/publications/jse/v14n3/langford.html).
 * Typically the index or rank (n * arr.length) may be non-integer.
 * For reference: ends are clipped to the extreme values in the array;
 * For box plots: index you get is half a point too high (see
 * http://en.wikipedia.org/wiki/Percentile#Nearest_rank) but note that this definition
 * indexes from 1 rather than 0, so we subtract 1/2 (instead of add).
 *
 * @param {Array} arr - This array contains the values that make up the distribution.
 * @param {Number} n - Between 0 and 1, n = p/100 is such that we compute the p^th percentile.
 * For example, the 50th percentile (or median) corresponds to n = 0.5
 * @return {Number} - percentile
 */
lib.interp = function(arr, n) {
    if (!isNumeric(n)) throw 'n should be a finite number';
    n = n * arr.length - 0.5;
    if (n < 0) return arr[0];
    if (n > arr.length - 1) return arr[arr.length - 1];
    var frac = n % 1;
    return frac * arr[Math.ceil(n)] + (1 - frac) * arr[Math.floor(n)];
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
lib.log = function(){
    if(lib.VERBOSE) console.log.apply(console, arguments);
};

/**
 * markTime - for debugging, mark the number of milliseconds
 * since the previous call to markTime and log arbitrary info too
 */
lib.markTime = function(v){
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
 * notifier
 * @param {String} text The person's user name
 * @param {Number} [delay=1000] The delay time in milliseconds
 *          or 'long' which provides 2000 ms delay time.
 * @return {undefined} this function does not return a value
 */
var NOTEDATA = [];
lib.notifier = function(text, displayLength) {

    if(NOTEDATA.indexOf(text) !== -1) return;

    NOTEDATA.push(text);

    var ts = 1000;
    if (isNumeric(displayLength)) ts = displayLength;
    else if (displayLength === 'long') ts = 3000;

    var notifierContainer = d3.select('body')
        .selectAll('.plotly-notifier')
        .data([0]);
    notifierContainer.enter()
        .append('div')
        .classed('plotly-notifier', true);

    var notes = notifierContainer.selectAll('.notifier-note').data(NOTEDATA);

    function killNote(transition) {
        transition
            .duration(700)
            .style('opacity', 0)
            .each('end', function(thisText) {
                var thisIndex = NOTEDATA.indexOf(thisText);
                if(thisIndex !== -1) NOTEDATA.splice(thisIndex, 1);
                d3.select(this).remove();
            });
    }

    notes.enter().append('div')
        .classed('notifier-note', true)
        .style('opacity', 0)
        .each(function(thisText) {
            var note = d3.select(this);

            note.append('button')
                .classed('notifier-close', true)
                .html('&times;')
                .on('click', function() {
                    note.transition().call(killNote);
                });

            note.append('p').html(thisText);

            note.transition()
                    .duration(700)
                    .style('opacity', 1)
                .transition()
                    .delay(ts)
                    .call(killNote);
        });
};

/**
 * do two bounding boxes from getBoundingClientRect,
 * ie {left,right,top,bottom,width,height}, overlap?
 * takes optional padding pixels
 */
lib.bBoxIntersect = function(a, b, pad){
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
    if (!base) base = 16;
    if (bits === undefined) bits = 24;
    if (bits <= 0) return '0';

    var digits = Math.log(Math.pow(2, bits)) / Math.log(base),
        res = '',
        i,
        b,
        x;

    for (i = 2; digits === Infinity; i *= 2) {
        digits = Math.log(Math.pow(2, bits / i)) / Math.log(base) * i;
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
    if ( (existing && (existing.indexOf(res) > -1)) ||
         (parsed !== Infinity && parsed >= Math.pow(2, bits)) ) {
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
    if (!opt) opt = {};
    if (!optname) optname = 'opt';

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

lib.getSources = function(td) {
    var extrarefs = (td.ref_fids || []).join(',');
    if(!td.fid && !extrarefs) return;
    if(!window.PLOTLYENV || !window.PLOTLYENV.DOMAIN_WEBAPP) return;

    $.get('/getsources', {fid: td.fid, extrarefs:extrarefs}, function(res) {
        td.sourcelist = JSON.parse(res);
        if(!Array.isArray(td.sourcelist)) {
            console.log('sourcelist error',td.sourcelist);
            td.sourcelist = [];
        }
        lib.showSources(td);
    });
};

lib.showSources = function(td) {
    if(td._context && td._context.staticPlot) return;
    // show the sources of data in the active tab
    var allsources = td.sourcelist;
    if(!allsources) {
        lib.getSources(td);
        return;
    }
    var container = d3.select(td).select('.js-sourcelinks'),
        extsources = allsources.filter(function(v){
            return isNumeric(v.ref_fid);
        }),
        firstsource = extsources[0] || allsources[0];
    container.text('');
    td.shouldshowsources = false;
    // no sources at all? quit
    if(!firstsource) return;

    // find number of unique internal and external sources
    var extobj = {}, plotlyobj = {};
    extsources.forEach(function(v){ extobj[v.url] = 1; });
    allsources.forEach(function(v){
        if(!isNumeric(v.ref_fid)) plotlyobj[v.ref_fid] = 1;
    });

    var fidparts = String(firstsource.ref_fid).split(':'),
        isplot = lib.isPlotDiv(td),
        workspace = !isplot || td._context.workspace,
        mainlink,
        extraslink;

    if(isplot) { // svg version for plots
        // only sources from the same user? also quit, if we're on a plot
        var thisuser = firstsource.fid.split(':')[0];
        if(allsources.every(function(v){
                return String(v.ref_fid).split(':')[0]===thisuser;
            })) {
            return;
        }
        td.shouldshowsources = true;

        /**
         * in case someone REALLY doesn't want to show sources
         * they can hide them...
         * but you can always see them by going to the grid
         */
        if(td.layout.hidesources) return;
        container.append('tspan').text('Source: ');
        mainlink = container.append('a').attr({'xlink:xlink:href':'#'});
        if(isNumeric(firstsource.ref_fid)) {
            mainlink.attr({
                'xlink:xlink:show':'new',
                'xlink:xlink:href':firstsource.ref_url
            });
        }
        else if(!workspace){
            mainlink.attr({
                'xlink:xlink:show':'new',
                'xlink:xlink:href':'/'+fidparts[1]+'/~'+fidparts[0]
            });
        }

        if(allsources.length>1) {
            container.append('tspan').text(' - ');
            extraslink = container.append('a')
                .attr({'xlink:xlink:href':'#'});
        }
    }
    else { // html version for grids (and scripts?)
        if(!container.node()) {
            container = d3.select(td).select('.grid-container')
                .append('div')
                    .attr('class', 'grid-sourcelinks js-sourcelinks');
        }
        container.append('span').text('Source: ');
        mainlink = container.append('a').attr({
            'href':'#',
            'class': 'link--impt'
        });
        if(isNumeric(firstsource.ref_fid)) {
            mainlink.attr({
                'target':'_blank',
                'href':firstsource.ref_url
            });
        }

        if(allsources.length>1) {
            container.append('span').text(' - ');
            extraslink = container.append('a')
                .attr({href: '#'})
                .classed('link--impt', true);
        }
    }

    mainlink.text(firstsource.ref_filename);

    function pullSource(){
        pullf({fid: firstsource.ref_fid});
        return false;
    }

    function fullSourcing(){
        var sourceModal = $('#sourceModal'),
            sourceViewer = sourceModal.find('#source-viewer').empty();

        sourceViewer.data('jsontree', '')
            .jsontree(JSON.stringify(sourceObj),
                {terminators: false, collapsibleOuter: false})
            .show();
        if(workspace) {
            sourceModal.find('[data-fid]').click(function(){
                sourceModal.modal('hide');
                pullf({fid:$(this).attr('data-fid')});
                return false;
            });
        }
        else {
            sourceModal.find('[data-fid]').each(function(){
                fidparts = $(this).attr('data-fid').split(':');
                $(this).attr({href:'/~'+fidparts[0]+'/'+fidparts[1]});
            });
            if(window.self !== window.top) {
                // in an iframe: basically fill the frame
                sourceModal.css({
                    left: '10px',
                    right: '10px',
                    bottom: '10px',
                    width: 'auto',
                    height: 'auto',
                    margin: 0
                });
            }
        }
        sourceModal.modal('show');

        sourceModal.find('.close')
            .off('click')
            .on('click', function(){
                sourceModal.modal('hide');
                return false;
            });
        return false;
    }

    if(!isplot || workspace) mainlink.on('click', pullSource);

    if(extraslink) extraslink.text('Full list').on('click', fullSourcing);

    function makeSourceObj(container, refByUid) {
        if(cnt < 0) {
            console.log('infinite loop?');
            return container;
        }
        cnt--;

        allsources.forEach(function(src){
            if(src.ref_by_uid === refByUid) {
                var linkval;
                if(isNumeric(src.ref_fid)) {
                    linkval = '<a href="' + src.ref_url + '" target="_blank">' +
                        src.ref_filename + '</a>';
                }
                else {
                    var refUser = src.ref_fid.split(':')[0],
                        fn = (refUser !== window.user ? refUser + ': ' : '') +
                            src.ref_filename;
                    linkval = '<a href="#" data-fid="' + src.ref_fid + '">'+
                        fn + '</a>';
                }
                container[linkval] = makeSourceObj({}, src.uid);
            }
        });
        return container;
    }

    var cnt = allsources.length,
        sourceObj = makeSourceObj({}, null);
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

    function continueAsync(){
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

lib.init2dArray = function(rowLength, colLength) {
    var array = new Array(rowLength);
    for(var i = 0; i < rowLength; i++) array[i] = new Array(colLength);
    return array;
};

/**
 * transpose a (possibly ragged) 2d array z. inspired by
 * http://stackoverflow.com/questions/17428587/
 * transposing-a-2d-array-in-javascript
 */
lib.transposeRagged = function(z) {
    var maxlen = 0,
        zlen = z.length,
        i,
        j;
    // Maximum row length:
    for (i = 0; i < zlen; i++) maxlen = Math.max(maxlen, z[i].length);

    var t = new Array(maxlen);
    for (i = 0; i < maxlen; i++) {
        t[i] = new Array(zlen);
        for (j = 0; j < zlen; j++) t[i][j] = z[j][i];
    }

    return t;
};

// our own dot function so that we don't need to include numeric
lib.dot = function(x, y) {
    if (!(x.length && y.length) || x.length !== y.length) return null;

    var len = x.length,
        out,
        i;

    if(x[0].length) {
        // mat-vec or mat-mat
        out = new Array(len);
        for(i = 0; i < len; i++) out[i] = lib.dot(x[i], y);
    }
    else if(y[0].length) {
        // vec-mat
        var yTranspose = lib.transposeRagged(y);
        out = new Array(yTranspose.length);
        for(i = 0; i < yTranspose.length; i++) out[i] = lib.dot(x, yTranspose[i]);
    }
    else {
        // vec-vec
        out = 0;
        for(i = 0; i < len; i++) out += x[i] * y[i];
    }

    return out;
};


// Functions to manipulate 2D transformation matrices

// translate by (x,y)
lib.translationMatrix = function (x, y) {
    return [[1, 0, x], [0, 1, y], [0, 0, 1]];
};

// rotate by alpha around (0,0)
lib.rotationMatrix = function (alpha) {
    var a = alpha*Math.PI/180;
    return [[Math.cos(a), -Math.sin(a), 0],
            [Math.sin(a), Math.cos(a), 0],
            [0, 0, 1]];
};

// rotate by alpha around (x,y)
lib.rotationXYMatrix = function(a, x, y) {
    return lib.dot(
        lib.dot(lib.translationMatrix(x, y),
                    lib.rotationMatrix(a)),
        lib.translationMatrix(-x, -y));
};

// applies a 2D transformation matrix to either x and y params or an [x,y] array
lib.apply2DTransform = function(transform) {
    return function() {
        var args = arguments;
        if (args.length === 3) {
            args = args[0];
        }//from map
        var xy = arguments.length === 1 ? args[0] : [args[0], args[1]];
        return lib.dot(transform, [xy[0], xy[1], 1]).slice(0, 2);
    };
};

// applies a 2D transformation matrix to an [x1,y1,x2,y2] array (to transform a segment)
lib.apply2DTransform2 = function(transform) {
    var at = lib.apply2DTransform(transform);
    return function(xys) {
        return at(xys.slice(0, 2)).concat(at(xys.slice(2, 4)));
    };
};

/**
 * Helper to strip trailing slash, from
 * http://stackoverflow.com/questions/6680825/return-string-without-trailing-slash
 */
lib.stripTrailingSlash = function (str) {
    if (str.substr(-1) === '/') return str.substr(0, str.length - 1);
    return str;
};

var colorscaleNames = Object.keys(require('./colorscale').scales);

lib.valObjects = {
    data_array: {
        // You can use *dflt=[] to force said array to exist though.
        description: [
            'An {array} of data.',
            'The value MUST be an {array}, or we ignore it.'
        ].join(' '),
        requiredOpts: [],
        otherOpts: ['dflt'],
        coerceFunction: function(v, propOut, dflt) {
            if(Array.isArray(v)) propOut.set(v);
            else if(dflt!==undefined) propOut.set(dflt);
        }
    },
    enumerated: {
        description: [
            'Enumerated value type. The available values are listed',
            'in `values`.'
        ].join(' '),
        requiredOpts: ['values'],
        otherOpts: ['dflt', 'coerceNumber', 'arrayOk'],
        coerceFunction: function(v, propOut, dflt, opts) {
            if(opts.coerceNumber) v = +v;
            if(opts.values.indexOf(v)===-1) propOut.set(dflt);
            else propOut.set(v);
        }
    },
    'boolean': {
        description: 'A boolean (true/false) value.',
        requiredOpts: [],
        otherOpts: ['dflt'],
        coerceFunction: function(v, propOut, dflt) {
            if(v===true || v===false) propOut.set(v);
            else propOut.set(dflt);
        }
    },
    number: {
        description: [
            'A number or a numeric value',
            '(e.g. a number inside a string).',
            'When applicable, values greater (less) than `max` (`min`)',
            'are coerced to the `dflt`.'
        ].join(' '),
        requiredOpts: [],
        otherOpts: ['dflt', 'min', 'max', 'arrayOk'],
        coerceFunction: function(v, propOut, dflt, opts) {
            if(!isNumeric(v) ||
                    (opts.min!==undefined && v<opts.min) ||
                    (opts.max!==undefined && v>opts.max)) {
                propOut.set(dflt);
            }
            else propOut.set(+v);
        }
    },
    integer: {
        description: [
            'An integer or an integer inside a string.',
            'When applicable, values greater (less) than `max` (`min`)',
            'are coerced to the `dflt`.'
        ].join(' '),
        requiredOpts: [],
        otherOpts: ['dflt', 'min', 'max'],
        coerceFunction: function(v, propOut, dflt, opts) {
            if(v%1 || !isNumeric(v) ||
                    (opts.min!==undefined && v<opts.min) ||
                    (opts.max!==undefined && v>opts.max)) {
                propOut.set(dflt);
            }
            else propOut.set(+v);
        }
    },
    string: {
        description: [
            'A string value.',
            'Numbers are converted to strings except for attributes with',
            '`strict` set to true.'
        ].join(' '),
        requiredOpts: [],
        // TODO 'values shouldn't be in there (edge case: 'dash' in Scatter)
        otherOpts: ['dflt', 'noBlank', 'strict', 'arrayOk', 'values'],
        coerceFunction: function(v, propOut, dflt, opts) {
            if(opts.strict===true && typeof v !== 'string') {
                propOut.set(dflt);
                return;
            }

            var s = String(v);
            if(v===undefined || (opts.noBlank===true && !s)) {
                propOut.set(dflt);
            }
            else propOut.set(s);
        }
    },
    color: {
        description: [
            'A string describing color.',
            'Supported formats:',
            '- hex (e.g. \'#d3d3d3\')',
            '- rgb (e.g. \'rgb(255, 0, 0)\')',
            '- rgba (e.g. \'rgb(255, 0, 0, 0.5)\')',
            '- hsl (e.g. \'hsl(0, 100%, 50%)\')',
            '- hsv (e.g. \'hsv(0, 100%, 100%)\')',
            '- named colors (full list: http://www.w3.org/TR/css3-color/#svg-color)'
        ].join(' '),
        requiredOpts: [],
        otherOpts: ['dflt', 'arrayOk'],
        coerceFunction: function(v, propOut, dflt) {
            if(tinycolor(v).isValid()) propOut.set(v);
            else propOut.set(dflt);
        }
    },
    colorscale: {
        description: [
            'A Plotly colorscale either picked by a name:',
            '(any of', colorscaleNames.join(', '), ')',
            'customized as an {array} of 2-element {arrays} where',
            'the first element is the normalized color level value',
            '(starting at *0* and ending at *1*),',
            'and the second item is a valid color string.'
        ].join(' '),
        requiredOpts: [],
        otherOpts: ['dflt'],
        coerceFunction: function(v, propOut, dflt) {
            propOut.set(Plotly.Colorscale.getScale(v, dflt));
        }
    },
    angle: {
        description: [
            'A number (in degree) between -180 and 180.'
        ].join(' '),
        requiredOpts: [],
        otherOpts: ['dflt'],
        coerceFunction: function(v, propOut, dflt) {
            if(v==='auto') propOut.set('auto');
            else if(!isNumeric(v)) propOut.set(dflt);
            else {
                if(Math.abs(v)>180) v -= Math.round(v/360)*360;
                propOut.set(+v);
            }
        }
    },
    axisid: {
        description: [
            'An axis id string (e.g. \'x\', \'x2\', \'x3\', ...).'
        ].join(' '),
        requiredOpts: [],
        otherOpts: ['dflt'],
        coerceFunction: function(v, propOut, dflt) {
            if(typeof v === 'string' && v.charAt(0)===dflt) {
                var axnum = Number(v.substr(1));
                if(axnum%1 === 0 && axnum>1) {
                    propOut.set(v);
                    return;
                }
            }
            propOut.set(dflt);
        }
    },
    sceneid: {
        description: [
            'A scene id string (e.g. \'scene\', \'scene2\', \'scene3\', ...).'
        ].join(' '),
        requiredOpts: [],
        otherOpts: ['dflt'],
        coerceFunction: function(v, propOut, dflt) {
            if(typeof v === 'string' && v.substr(0,5)===dflt) {
                var scenenum = Number(v.substr(5));
                if(scenenum%1 === 0 && scenenum>1) {
                    propOut.set(v);
                    return;
                }
            }
            propOut.set(dflt);
        }
    },
    geoid: {
        description: [
            'A geo id string (e.g. \'geo\', \'geo2\', \'geo3\', ...).'
        ].join(' '),
        requiredOpts: [],
        otherOpts: ['dflt'],
        coerceFunction: function(v, propOut, dflt) {
            if(typeof v === 'string' && v.substr(0,3)===dflt) {
                var geonum = Number(v.substr(3));
                if(geonum%1 === 0 && geonum>1) {
                    propOut.set(v);
                    return;
                }
            }
            propOut.set(dflt);
        }
    },
    flaglist: {
        description: [
            'A string representing a combination of flags',
            '(order does not matter here).',
            'Combine any of the available `flags` with *+*.',
            '(e.g. (\'lines+markers\')).',
            'Values in `extras` cannot be combined.'
        ].join(' '),
        requiredOpts: ['flags'],
        otherOpts: ['dflt', 'extras'],
        coerceFunction: function(v, propOut, dflt, opts) {
            if(typeof v !== 'string') {
                propOut.set(dflt);
                return;
            }
            if(opts.extras.indexOf(v)!==-1) {
                propOut.set(v);
                return;
            }
            var vParts = v.split('+'),
                i = 0;
            while(i<vParts.length) {
                var vi = vParts[i];
                if(opts.flags.indexOf(vi)===-1 || vParts.indexOf(vi)<i) {
                    vParts.splice(i,1);
                }
                else i++;
            }
            if(!vParts.length) propOut.set(dflt);
            else propOut.set(vParts.join('+'));
        }
    },
    any: {
        description: 'Any type.',
        requiredOpts: [],
        otherOpts: ['dflt'],
        coerceFunction: function(v, propOut, dflt) {
            if(v===undefined) propOut.set(dflt);
            else propOut.set(v);
        }
    },
    info_array: {
        description: [
            'An {array} of plot information.'
        ].join(' '),
        requiredOpts: ['items'],
        otherOpts: ['dflt'],
        coerceFunction: function(v, propOut, dflt, opts) {
            if(!Array.isArray(v)) {
                propOut.set(dflt);
                return;
            }

            var items = opts.items,
                vOut = [];
            dflt = Array.isArray(dflt) ? dflt : [];

            for(var i = 0; i < items.length; i++) {
                lib.coerce(v, vOut, items, '[' + i + ']', dflt[i]);
            }

            propOut.set(vOut);
        }
    }
};

lib.coerce = function(containerIn, containerOut, attributes, attribute, dflt) {
    /**
     * ensures that container[attribute] has a valid value
     * attributes[attribute] is an object with possible keys:
     * - valType: data_array, enumerated, boolean, number, integer, string, color, colorscale, any
     * - values: (enumerated only) array of allowed vals
     * - min, max: (number, integer only) inclusive bounds on allowed vals
     *      either or both may be omitted
     * - dflt: if attribute is invalid or missing, use this default
     *      if dflt is provided as an argument to lib.coerce it takes precedence
     * as a convenience, returns the value it finally set
     */

    var opts = lib.nestedProperty(attributes, attribute).get(),
        propIn = lib.nestedProperty(containerIn, attribute),
        propOut = lib.nestedProperty(containerOut, attribute),
        v = propIn.get();

    if(dflt===undefined) dflt = opts.dflt;

    /**
     * arrayOk: value MAY be an array, then we do no value checking
     * at this point, because it can be more complicated than the
     * individual form (eg. some array vals can be numbers, even if the
     * single values must be color strings)
     */
    if(opts.arrayOk && Array.isArray(v)) {
        propOut.set(v);
        return v;
    }

    lib.valObjects[opts.valType].coerceFunction(v, propOut, dflt, opts);

    return propOut.get();
};

// use coerce to get attibute value if user input is valid, return attribute default
// if user input it not valud or retun false if there is no user input.  
lib.coerce2 = function(containerIn, containerOut, attributes, attribute, dflt) {
    var propIn = lib.nestedProperty(containerIn, attribute),
        propOut = lib.coerce(containerIn, containerOut, attributes, attribute, dflt);
    return propIn.get() ? propOut : false;
};

// shortcut to coerce the three font attributes
// 'coerce' is a lib.coerce wrapper with implied first three arguments
lib.coerceFont = function(coerce, attr, dfltObj) {
    var out = {};

    dfltObj = dfltObj || {};

    out.family = coerce(attr + '.family', dfltObj.family);
    out.size = coerce(attr + '.size', dfltObj.size);
    out.color = coerce(attr + '.color', dfltObj.color);

    return out;
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
 * modified version of $.extend to strip out private objs and functions,
 * and cut arrays down to first <arraylen> or 1 elements
 * because $.extend is hella slow
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

// Flat extend function (only copies values of first level keys)
lib.extendFlat = function extendFlat(obj1, obj2) {
    var objOut = {};

    function copyToOut(obj) {
        var keys = Object.keys(obj);
        for(var i = 0; i < keys.length; i++) {
            objOut[keys[i]] = obj[keys[i]];
        }
    }
    if(typeof obj1 === 'object') copyToOut(obj1);
    if(typeof obj2 === 'object') copyToOut(obj2);

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

// more info: http://stackoverflow.com/questions/18531624/isplainobject-thing
lib.isPlainObject = function(obj) {
    return (
        Object.prototype.toString.call(obj) === "[object Object]" &&
        Object.getPrototypeOf(obj) === Object.prototype
    );
};
