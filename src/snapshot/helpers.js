/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Registry = require('../registry');

exports.getDelay = function(fullLayout) {
    if(!fullLayout._has) return 0;

    return (
        fullLayout._has('gl3d') ||
        fullLayout._has('gl2d') ||
        fullLayout._has('mapbox')
    ) ? 500 : 0;
};

exports.getRedrawFunc = function(gd) {
    return function() {
        var fullLayout = gd._fullLayout || {};
        var hasPolar = fullLayout._has && fullLayout._has('polar');
        var hasLegacyPolar = !hasPolar && gd.data && gd.data[0] && gd.data[0].r;

        if(!hasLegacyPolar) {
            Registry.getComponentMethod('colorbar', 'draw')(gd);
        }
    };
};

exports.encodeSVG = function(svg) {
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
};

exports.encodeJSON = function(json) {
    return 'data:application/json,' + encodeURIComponent(json);
};

var DOM_URL = window.URL || window.webkitURL;

exports.createObjectURL = function(blob) {
    return DOM_URL.createObjectURL(blob);
};

exports.revokeObjectURL = function(url) {
    return DOM_URL.revokeObjectURL(url);
};

exports.createBlob = function(url, format) {
    if(format === 'svg') {
        return new window.Blob([url], {type: 'image/svg+xml;charset=utf-8'});
    } else if(format === 'full-json') {
        return new window.Blob([url], {type: 'application/json;charset=utf-8'});
    } else {
        var binary = fixBinary(window.atob(url));
        return new window.Blob([binary], {type: 'image/' + format});
    }
};

exports.octetStream = function(s) {
    document.location.href = 'data:application/octet-stream' + s;
};

// Taken from https://bl.ocks.org/nolanlawson/0eac306e4dac2114c752
function fixBinary(b) {
    var len = b.length;
    var buf = new ArrayBuffer(len);
    var arr = new Uint8Array(buf);
    for(var i = 0; i < len; i++) {
        arr[i] = b.charCodeAt(i);
    }
    return buf;
}

exports.IMAGE_URL_PREFIX = /^data:image\/\w+;base64,/;

exports.MSG_IE_BAD_FORMAT = 'Sorry IE does not support downloading from canvas. Try {format:\'svg\'} instead.';
