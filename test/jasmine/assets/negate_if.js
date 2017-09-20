'use strict';

/**
 * Conditionally negate an expectation:
 *
 *   negateIf(expect(x), xIsSomethingElse).toBe(0);
 *
 * is equivalent to:
 *
 *   if(xIsSomethingElse) expect(x).not.toBe(0);
 *   else expect(x).toBe(0);
 */
module.exports = function negateIf(expectation, negate) {
    if(negate) return expectation.not;
    return expectation;
};
