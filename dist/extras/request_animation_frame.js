/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

// This code adapted from:
//
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel

// MIT license

(function(){
    
    'use strict';

    if(!Date.now) {
        Date.now = function() { return (new Date()).getTime(); };
    }

    var vendors = ['webkit', 'moz'];
    var i = 0;
    var l = vendors.length;
    var vp;
    var lastTime = 0;

    for(; i < l && !window.requestAnimationFrame; ++i) {
        vp = vendors[i];
        window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = (window[vp + 'CancelAnimationFrame'] ||
                                       window[vp + 'CancelRequestAnimationFrame']);
    }

    if(/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || // iOS6 is buggy
        !window.requestAnimationFrame || !window.cancelAnimationFrame) {
        window.requestAnimationFrame = function(callback) {
            var now = Date.now();
            var nextTime = Math.max(lastTime + 16, now);
            return setTimeout(function() { callback(lastTime = nextTime); },
                              nextTime - now);
        };
        window.cancelAnimationFrame = clearTimeout;
    }

    vendors = null;
    i = null;
    l = null;
    vp = null;

}());
