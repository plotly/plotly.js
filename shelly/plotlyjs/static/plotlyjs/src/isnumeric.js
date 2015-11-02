/**
 * inspired by is-number <https://github.com/jonschlinkert/is-number>
 * but significantly simplified and sped up by ignoring number and string constructors
 * ie these return false:
 *   new Number(1)
 *   new String('1')
 */

'use strict';

/**
 * Is this string all whitespace?
 * This solution kind of makes my brain hurt, but it's significantly faster
 * than !str.trim() or any other solution I could find.
 *
 * whitespace codes from: http://en.wikipedia.org/wiki/Whitespace_character
 * and verified with:
 *
 *  for(var i = 0; i < 65536; i++) {
 *      var s = String.fromCharCode(i);
 *      if(+s===0 && !s.trim()) console.log(i, s);
 *  }
 *
 * which counts a couple of these as *not* whitespace, but finds nothing else
 * that *is* whitespace. Note that charCodeAt stops at 16 bits, but it appears
 * that there are no whitespace characters above this, and code points above
 * this do not map onto white space characters.
 */
function allBlankCharCodes(str){
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

module.exports = function(n) {
    var type = typeof n;
    if(type === 'string') {
        var original = n;
        n = +n;
        // whitespace strings cast to zero - filter them out
        if(n===0 && allBlankCharCodes(original)) return false;
    }
    else if(type !== 'number') return false;

    return n - n < 1;
};
