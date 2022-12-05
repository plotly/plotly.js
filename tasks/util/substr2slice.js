'use strict';

// Replace .substr(a, ?b) with .slice(a, (a)+b)
//
// String.prototype.substr() is deprecated!
// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/substr

module.exports = function substr2slice(str) {
    var i0 = 0;
    while(i0 !== -1) {
        // assuming there is no white space after substr
        i0 = str.indexOf('.substr(', i0);
        if(i0 === -1) return str;

        var args = [];
        var text = '';
        var k = 0;

        // step into the function
        var i = i0 + 7;
        var p = 1; // open parentheses
        while(p > 0) {
            i++;

            var c = str.charAt(i);
            if(!c) break;
            if(p === 1 && (
                c === ',' ||
                c === ')'
            )) {
                args[k++] = text;
                text = '';
            } else {
                text += c;
            }

            if(c === '(') p++;
            if(c === ')') p--;
        }

        // console.log(str.slice(i0, i + 1));
        // console.log(args);

        var startStr = args[0];
        var lengthStr = args[1];
        var out = '.slice(' + startStr;

        if(lengthStr !== undefined) {
            out += ',';
            if(+startStr !== 0) {
                out += '(' + startStr + ') + ';
            }
            out += lengthStr;
        }

        out += ')';

        // console.log(out)
        // console.log('__');

        str = str.slice(0, i0) + out + str.slice(i + 1);
    }

    return str;
};
