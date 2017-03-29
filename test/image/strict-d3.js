/*
 * strict-d3: wrap selection.style to prohibit specific incorrect style values
 * that are known to cause problems in IE (at least IE9)
 */

/* global Plotly:false */
(function() {
    'use strict';

    var selProto = Plotly.d3.selection.prototype;

    var originalSelStyle = selProto.style;

    selProto.style = function() {
        var sel = this,
            obj = arguments[0];

        if(sel.size()) {
            if(typeof obj === 'string') {
                checkVal(obj, arguments[1]);
            }
            else {
                Object.keys(obj).forEach(function(key) { checkVal(key, obj[key]); });
            }
        }

        return originalSelStyle.apply(sel, arguments);
    };

    function checkVal(key, val) {
        if(typeof val === 'string') {
            // in case of multipart styles (stroke-dasharray, margins, etc)
            // test each part separately
            val.split(/[, ]/g).forEach(function(valPart) {
                var pxSplit = valPart.length - 2;
                if(valPart.substr(pxSplit) === 'px' && !isNumeric(valPart.substr(0, pxSplit))) {
                    throw new Error('d3 selection.style called with value: ' + val);
                }
            });
        }

    }

    // below ripped from fast-isnumeric so I don't need to build this file

    function allBlankCharCodes(str) {
        var l = str.length,
            a;
        for(var i = 0; i < l; i++) {
            a = str.charCodeAt(i);
            if((a < 9 || a > 13) && (a !== 32) && (a !== 133) && (a !== 160) &&
                (a !== 5760) && (a !== 6158) && (a < 8192 || a > 8205) &&
                (a !== 8232) && (a !== 8233) && (a !== 8239) && (a !== 8287) &&
                (a !== 8288) && (a !== 12288) && (a !== 65279)) {
                return false;
            }
        }
        return true;
    }

    function isNumeric(n) {
        var type = typeof n;
        if(type === 'string') {
            var original = n;
            n = +n;
            // whitespace strings cast to zero - filter them out
            if(n === 0 && allBlankCharCodes(original)) return false;
        }
        else if(type !== 'number') return false;

        return n - n < 1;
    }

})();
