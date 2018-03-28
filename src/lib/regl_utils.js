/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var createRegl = require('regl');

/**
 * Idempotent version of createRegl. Create regl instances
 * in the correct canvases with the correct attributes and
 * options
 *
 * @param {DOM node or object} gd : graph div object
 * @param {array} extensions : list of extension to pass to createRegl
 */
exports.prepare = function prepare(gd, extensions) {
    gd._fullLayout._glcanvas.each(function(d) {
        if(d.regl) return;

        d.regl = createRegl({
            canvas: this,
            attributes: {
                antialias: !d.pick,
                preserveDrawingBuffer: true
            },
            pixelRatio: gd._context.plotGlPixelRatio || global.devicePixelRatio,
            extensions: extensions || []
        });
    });
};

/**
 * Clear gl frame (if any). This is a common pattern as
 * we usually set `preserveDrawingBuffer: true` during
 * gl context creation (e.g. via `reglUtils.prepare`).
 *
 * @param {DOM node or object} gd : graph div object
 */
exports.clear = function clear(gd) {
    var fullLayout = gd._fullLayout;

    if(fullLayout._glcanvas && fullLayout._glcanvas.size()) {
        fullLayout._glcanvas.each(function(d) {
            if(d.regl) d.regl.clear({color: true});
        });
    }
};
