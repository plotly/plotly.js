var ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');
var FRONT = 'require("+';
var BACK = '+");';

/* Uber hacky in-house fix to
 *
 * https://github.com/substack/webworkify/issues/29
 *
 * so that plotly.min.js loads in Jupyter NBs, more info here:
 *
 * - https://github.com/plotly/plotly.py/pull/545
 * - https://github.com/plotly/plotly.js/pull/914
 * - https://github.com/plotly/plotly.js/pull/1094
 *
 * For example, this routine replaces
 *  'require("+o(s)+")' -> 'require("+ o(s) +")'
 *
 * But works for any 1-letter variable that uglify-js may output.
 *
 */
module.exports = function patchMinified(minifiedCode) {
    for(var i = 0; i < ALPHABET.length; i++) {
        var li = ALPHABET[i];

        for(var j = 0; j < ALPHABET.length; j++) {
            var lj = ALPHABET[j];

            var MIDDLE = li + '(' + lj + ')';

            var strOld = FRONT + MIDDLE + BACK,
                strNew = FRONT + ' ' + MIDDLE + ' ' + BACK;

            minifiedCode = minifiedCode.replace(strOld, strNew);
        }
    }

    return minifiedCode;
};
