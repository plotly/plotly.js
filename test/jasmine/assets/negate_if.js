'use strict';

/**
 * Helpers that can negate an expectation given a condition
 *
 * @param {boolean OR function} condition
 * @param {jasmine expect return} expectation
 * @returns {jasmine expect return}
 *
 * Example:
 *
 * negateIf(myCondition, expect(actual)).toBe(expected);
 *
 */
function negateIf(condition, expectation) {
    return (typeof condition === 'function' ? condition() : condition) ?
        expectation.not :
        expectation;
}

module.exports = negateIf;
