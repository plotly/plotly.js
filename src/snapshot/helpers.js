'use strict';

var Registry = require('../registry');

exports.getDelay = function(fullLayout) {
    if(!fullLayout._has) return 0;

    return (
        fullLayout._has('gl3d') ||
        fullLayout._has('map')
    ) ? 500 : 0;
};

exports.getRedrawFunc = function(gd) {
    return function() {
        Registry.getComponentMethod('colorbar', 'draw')(gd);
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

/**
 * Get the resolved plot title to derive a filename from, or undefined if there
 * is none. We try to read _fullLayout, which reflects the title after applying
 * layout.template, but since title.text falls back to the editable-mode placeholder
 * when unset, a value equal to that placeholder is treated as no title.
 * For an un-rendered figure object (no _fullLayout) we fall back to the input layout
 * (gd.layout).
 */
exports.getPlotTitle = function(gd) {
    var fullLayout = gd._fullLayout;
    if(fullLayout) {
        var title = fullLayout.title?.text;
        return title === fullLayout._dfltTitle?.plot ? undefined : title;
    }
    return gd.layout?.title?.text;
};

/**
 * Get the resolved plot subtitle, or undefined if there is none.
 */
exports.getPlotSubtitle = function(gd) {
    var fullLayout = gd._fullLayout;
    if(fullLayout) {
        var subtitle = fullLayout.title?.subtitle?.text;
        return subtitle === fullLayout._dfltTitle?.subtitle ? undefined : subtitle;
    }
    return gd.layout?.title?.subtitle?.text;
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
