'use strict';

var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var d3 = require('d3');
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
    d3.timer.flush();
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
        .catch(function() {
            Date.now = now;
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
    d3.selectAll(test[1]).each(function(d, i) {
        if(test[2] === 'style') cur[i] = this.style[test[3]];
        if(test[2] === 'attr') cur[i] = d3.select(this).attr(test[3]);
    });
    switch(test[3]) {
        case 'd':
            assertAttr(cur, test[4], round, msg);
            break;
        case 'transform':
            assertAttr(cur, test[4], round, msg);
            break;
        default:
            assertAttr(cur, test[4], Lib.identity, msg);
    }
    return Promise.resolve(true);
}

function assertAttr(A, B, cb, msg) {
    var a = cb(A);
    var b = cb(B);
    expect(a).withContext(msg + ' equal to ' + JSON.stringify(a)).toEqual(b);
}

function round(str) {
    return str.map(function(cur) {
        return cur.replace(reNumbers, function(match) {
            return Math.round(match);
        });
    });
}
