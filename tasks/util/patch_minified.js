var PATTERN = /require\("\+(\w)\((\w)\)\+"\)/;
var NEW_SUBSTR = 'require("+ $1($2) +")';

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
    return minifiedCode.replace(PATTERN, NEW_SUBSTR);
};
