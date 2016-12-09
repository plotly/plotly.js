/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var BADNUM = require('../../constants/numerical').BADNUM;

module.exports = function autoType(array, calendar) {
    if(moreDates(array, calendar)) return 'date';
    if(category(array)) return 'category';
    if(linearOK(array)) return 'linear';
    else return '-';
};

// is there at least one number in array? If not, we should leave
// ax.type empty so it can be autoset later
function linearOK(array) {
    if(!array) return false;

    for(var i = 0; i < array.length; i++) {
        if(isNumeric(array[i])) return true;
    }

    return false;
}

// does the array a have mostly dates rather than numbers?
// note: some values can be neither (such as blanks, text)
// 2- or 4-digit integers can be both, so require twice as many
// dates as non-dates, to exclude cases with mostly 2 & 4 digit
// numbers and a few dates
function moreDates(a, calendar) {
    var dcnt = 0,
        ncnt = 0,
        // test at most 1000 points, evenly spaced
        inc = Math.max(1, (a.length - 1) / 1000),
        ai;

    for(var i = 0; i < a.length; i += inc) {
        ai = a[Math.round(i)];
        if(Lib.isDateTime(ai, calendar)) dcnt += 1;
        if(isNumeric(ai)) ncnt += 1;
    }

    return (dcnt > ncnt * 2);
}

// are the (x,y)-values in gd.data mostly text?
// require twice as many categories as numbers
function category(a) {
    // test at most 1000 points
    var inc = Math.max(1, (a.length - 1) / 1000),
        curvenums = 0,
        curvecats = 0,
        ai;

    for(var i = 0; i < a.length; i += inc) {
        ai = a[Math.round(i)];
        if(Lib.cleanNumber(ai) !== BADNUM) curvenums++;
        else if(typeof ai === 'string' && ai !== '' && ai !== 'None') curvecats++;
    }

    return curvecats > curvenums * 2;
}
