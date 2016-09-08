var STR_TO_REPLACE = 'require("+a(r)+");';
var STR_NEW = 'require("+ a(r) +");';

/* Uber hacky in-house fix to
 *
 * https://github.com/substack/webworkify/issues/29
 *
 * so that plotly.min.js loads in Jupyter NBs, more info here:
 *
 * https://github.com/plotly/plotly.py/pull/545
 *
 */
module.exports = function patchMinified(minifiedCode) {
    return minifiedCode.replace(STR_TO_REPLACE, STR_NEW);
};
