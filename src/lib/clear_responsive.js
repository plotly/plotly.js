'use strict';

/**
 * Clear responsive handlers (if any).
 *
 * @param {DOM node or object} gd : graph div object
 */
module.exports = function clearResponsive(gd) {
    if (gd._clearResponsive) {
        gd._clearResponsive();
        delete gd._clearResponsive;
    }
};
