/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var BADNUM = require('../../constants/numerical').BADNUM;

var isArrayOrTypedArray = Lib.isArrayOrTypedArray;
var isDateTime = Lib.isDateTime;
var cleanNumber = Lib.cleanNumber;
var round = Math.round;

module.exports = function autoType(array, calendar, opts) {
    var a = array;

    var noMultiCategory = opts.noMultiCategory;
    if(isArrayOrTypedArray(a) && !a.length) return '-';
    if(!noMultiCategory && multiCategory(a)) return 'multicategory';
    if(noMultiCategory && Array.isArray(a[0])) { // no need to flat typed arrays here
        var b = [];
        for(var i = 0; i < a.length; i++) {
            if(isArrayOrTypedArray(a[i])) {
                for(var j = 0; j < a[i].length; j++) {
                    b.push(a[i][j]);
                }
            }
        }
        a = b;
    }

    if(moreDates(a, calendar)) return 'date';

    var convertNumeric = opts.autotypenumbers !== 'strict'; // compare against strict, just in case autotypenumbers was not provided in opts
    if(category(a, convertNumeric)) return 'category';
    if(linearOK(a, convertNumeric)) return 'linear';

    return '-';
};

function hasTypeNumber(v, convertNumeric) {
    return convertNumeric ? isNumeric(v) : typeof v === 'number';
}

// is there at least one number in array? If not, we should leave
// ax.type empty so it can be autoset later
function linearOK(a, convertNumeric) {
    var len = a.length;

    for(var i = 0; i < len; i++) {
        if(hasTypeNumber(a[i], convertNumeric)) return true;
    }

    return false;
}

// does the array a have mostly dates rather than numbers?
// note: some values can be neither (such as blanks, text)
// 2- or 4-digit integers can be both, so require twice as many
// dates as non-dates, to exclude cases with mostly 2 & 4 digit
// numbers and a few dates
// as with categories, consider DISTINCT values only.
function moreDates(a, calendar) {
    var len = a.length;

    var inc = getIncrement(len);
    var dats = 0;
    var nums = 0;
    var seen = {};

    for(var f = 0; f < len; f += inc) {
        var i = round(f);
        var ai = a[i];
        var stri = String(ai);
        if(seen[stri]) continue;
        seen[stri] = 1;

        if(isDateTime(ai, calendar)) dats++;
        if(isNumeric(ai)) nums++;
    }

    return dats > nums * 2;
}

// return increment to test at most 1000 points, evenly spaced
function getIncrement(len) {
    return Math.max(1, (len - 1) / 1000);
}

// are the (x,y)-values in gd.data mostly text?
// require twice as many DISTINCT categories as distinct numbers
function category(a, convertNumeric) {
    var len = a.length;

    var inc = getIncrement(len);
    var nums = 0;
    var cats = 0;
    var seen = {};

    for(var f = 0; f < len; f += inc) {
        var i = round(f);
        var ai = a[i];
        var stri = String(ai);
        if(seen[stri]) continue;
        seen[stri] = 1;

        var t = typeof ai;
        if(t === 'boolean') cats++;
        else if(convertNumeric ? cleanNumber(ai) !== BADNUM : t === 'number') nums++;
        else if(t === 'string') cats++;
    }

    return cats > nums * 2;
}

// very-loose requirements for multicategory,
// trace modules that should never auto-type to multicategory
// should be declared with 'noMultiCategory'
function multiCategory(a) {
    return isArrayOrTypedArray(a[0]) && isArrayOrTypedArray(a[1]);
}
