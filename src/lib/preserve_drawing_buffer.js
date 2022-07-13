'use strict';

var isNumeric = require('fast-isnumeric');
var isMobileOrTablet = require('is-mobile');

module.exports = function preserveDrawingBuffer(opts) {
    var ua;

    if(opts && opts.hasOwnProperty('userAgent')) {
        ua = opts.userAgent;
    } else {
        ua = getUserAgent();
    }

    if(typeof ua !== 'string') return true;

    var enable = isMobileOrTablet({
        ua: { headers: {'user-agent': ua }},
        tablet: true,
        featureDetect: false
    });

    if(!enable) {
        var allParts = ua.split(' ');
        for(var i = 1; i < allParts.length; i++) {
            var part = allParts[i];
            if(part.indexOf('Safari') !== -1) {
                // find Safari version
                for(var k = i - 1; k > -1; k--) {
                    var prevPart = allParts[k];
                    if(prevPart.substr(0, 8) === 'Version/') {
                        var v = prevPart.substr(8).split('.')[0];
                        if(isNumeric(v)) v = +v;
                        if(v >= 13) return true;
                    }
                }
            }
        }
    }

    return enable;
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
