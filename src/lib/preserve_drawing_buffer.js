/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');
var isMobileOrTablet = require('is-mobile');

module.exports = function getPreserveDrawingBuffer() {
    var ua = getUserAgent();
    if(typeof ua !== 'string') return true;

    var hasDrawingBuffer = isMobileOrTablet({
        ua: ua,
        tablet: true,
        featureDetect: true
    });

    if(!hasDrawingBuffer) {
        var allParts = ua.split(' ');
        for(var i = 1; i < allParts.length; i++) {
            var part = allParts[i];
            if(part.indexOf('Safari') !== -1) {
                // find Safari version
                var prevPart = allParts[i - 1];
                if(prevPart.substr(0, 8) === 'Version/') {
                    var v = prevPart.substr(8).split('.')[0];

                    if(isNumeric(v)) v = +v;

                    // to fix https://github.com/plotly/plotly.js/issues/5158
                    if(v >= 14) return true;
                }
            }
        }
    }

    return hasDrawingBuffer;
};

function getUserAgent() {
    // similar to https://github.com/juliangruber/is-mobile/blob/91ca39ccdd4cfc5edfb5391e2515b923a730fbea/index.js#L14-L17
    var ua;
    if(typeof navigator !== 'undefined') {
        ua = navigator.userAgent;
    }

    if(
        ua &&
        ua.headers &&
        typeof ua.headers['user-agent'] === 'string'
    ) {
        ua = ua.headers['user-agent'];
    }

    return ua;
}
