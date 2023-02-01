'use strict';

var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');
var d3Timer = require('../../strict-d3').timer;
var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var delay = require('./delay.js');

var reNumbers = /([\d\.]+)/gm;

function promiseSerial(funcs, wait) {
    return funcs.reduce(function(promise, func) {
        return promise.then(function(result) {
            return func().then(Array.prototype.concat.bind(result)).then(delay(wait));
        });
    }, Promise.resolve([]));
}

function clockTick(currentNow, milliseconds) {
    Date.now = function() {
        return currentNow + milliseconds;
    };
    d3Timer.flush();
}

// Using the methodology from http://eng.wealthfront.com/2017/10/26/testing-d3-transitions/
module.exports = function checkTransition(gd, mock, animateOpts, transitionOpts, tests) {
    if(!transitionOpts) {
        transitionOpts = {
            transition: {
                duration: 500,
                easing: 'linear'
            },
            frame: {
                duration: 500
            }
        };
    }
    // Prepare chain
    var now = Date.now;
    var startTime;
    var currentTime;
    var p = [
        function() {
            return Plotly.newPlot(gd, mock)
            .then(function() {
                // Check initial states if present
                for(var i = 0; i < tests.length; i++) {
                    if(tests[i][0] === 0) assert(tests[i]);
                }
            });
        },
        function() {
            // Hijack Date.now
            startTime = Date.now();
            currentTime = 0;
            clockTick(startTime, 0);
            Plotly.animate(gd, animateOpts, transitionOpts);
            return Promise.resolve(true);
        }
    ];

    var checkTests = tests.map(function(test) {
        return function() {
            if(test[0] === 0) return Promise.resolve(true);
            if(test[0] !== currentTime) {
                clockTick(startTime, test[0]);
                currentTime = test[0];
            }
            return assert(test);
        };
    });

    // Run all tasks
    return promiseSerial(p.concat(checkTests))
        .catch(function(err) {
            Date.now = now;
            return Promise.reject(err);
        })
        .then(function() {
            Date.now = now;
        });
};

// A test array is made of
// [ms since start of transition, selector, (attr|style), name of attribute, array of values to be found]
// Ex.: [0, '.point path', 'style', 'fill', ['rgb(31, 119, 180)', 'rgb(31, 119, 180)', 'rgb(31, 119, 180)']]
function assert(test) {
    var msg = 'at ' + test[0] + 'ms, selection ' + test[1] + ' has ' + test[3];
    var cur = [];
    d3SelectAll(test[1]).each(function(d, i) {
        if(test[2] === 'style') cur[i] = this.style[test[3]];
        else if(test[2] === 'attr') cur[i] = d3Select(this).attr(test[3]);
        else if(test[2] === 'datum') {
            cur[i] = d3Select(this).datum()[test[3]];
        }
    });
    switch(test[3]) {
        case 'd':
            assertEqual(cur, test[4], round, msg);
            break;
        case 'transform':
            assertCloseTo(cur, test[4], 3, extractNumbers, msg);
            break;
        default:
            assertEqual(cur, test[4], Lib.identity, msg);
    }
    return Promise.resolve(true);
}

function assertEqual(A, B, cb, msg) {
    var a = cb(A);
    var b = cb(B);
    expect(a).withContext(msg + ' equal to ' + JSON.stringify(a)).toEqual(b);
}

function assertCloseTo(A, B, tolerance, cb, msg) {
    var a = cb(A).flat();
    var b = cb(B).flat();
    expect(a).withContext(msg + ' equal to ' + JSON.stringify(A)).toBeWithinArray(b, tolerance);
}

function extractNumbers(array) {
    return array.map(function(d) {
        return d.match(reNumbers).map(function(n) {
            return parseFloat(n);
        });
    });
}

function round(array) {
    return array.map(function(cur) {
        return cur.replace(reNumbers, function(match) {
            return Math.round(match);
        });
    });
}
