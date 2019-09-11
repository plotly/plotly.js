/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/**
 * Determine the position anchor property of x/y xanchor/yanchor components.
 *
 * - values < 1/3 align the low side at that fraction,
 * - values [1/3, 2/3] align the center at that fraction,
 * - values > 2/3 align the right at that fraction.
 */

function isLeftAnchor(opts) {
    return (
      opts.xanchor === 'left' ||
      (opts.xanchor === 'auto' && opts.x <= 1 / 3)
    );
}

function isCenterAnchor(opts) {
    return (
        opts.xanchor === 'center' ||
        (opts.xanchor === 'auto' && opts.x > 1 / 3 && opts.x < 2 / 3)
    );
}

function isRightAnchor(opts) {
    return (
      opts.xanchor === 'right' ||
      (opts.xanchor === 'auto' && opts.x >= 2 / 3)
    );
}

function isTopAnchor(opts) {
    return (
        opts.yanchor === 'top' ||
        (opts.yanchor === 'auto' && opts.y >= 2 / 3)
    );
}

function isMiddleAnchor(opts) {
    return (
        opts.yanchor === 'middle' ||
        (opts.yanchor === 'auto' && opts.y > 1 / 3 && opts.y < 2 / 3)
    );
}

function isBottomAnchor(opts) {
    return (
      opts.yanchor === 'bottom' ||
      (opts.yanchor === 'auto' && opts.y <= 1 / 3)
    );
}

function getXanchor(opts) {
    return isRightAnchor(opts) ? 'right' :
        isCenterAnchor(opts) ? 'center' :
        'left';
}

function getYanchor(opts) {
    return isBottomAnchor(opts) ? 'bottom' :
        isMiddleAnchor(opts) ? 'middle' :
        'top';
}

module.exports = {
    isLeftAnchor: isLeftAnchor,
    isCenterAnchor: isCenterAnchor,
    isRightAnchor: isRightAnchor,
    getXanchor: getXanchor,
    isTopAnchor: isTopAnchor,
    isMiddleAnchor: isMiddleAnchor,
    isBottomAnchor: isBottomAnchor,
    getYanchor: getYanchor
};
