'use strict';

/**
 * Clear responsive handlers (if any).
 *
 * @param {DOM node or object} gd : graph div object
 */
module.exports = function clearResponsive(gd) {
    if(gd._responsiveChartHandler) {
        window.removeEventListener('resize', gd._responsiveChartHandler);
        delete gd._responsiveChartHandler;
    }
};
