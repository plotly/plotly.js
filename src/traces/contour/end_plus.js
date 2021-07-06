'use strict';

/*
 * tiny helper to move the end of the contours a little to prevent
 * losing the last contour to rounding errors
 */
module.exports = function endPlus(contours) {
    return contours.end + contours.size / 1e6;
};
