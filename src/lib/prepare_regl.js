/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

// Note that this module should be ONLY required into
// files corresponding to regl trace modules
// so that bundles with non-regl only don't include
// regl and all its bytes.
var createRegl = require('regl');

/**
 * Idempotent version of createRegl. Create regl instances
 * in the correct canvases with the correct attributes and
 * options
 *
 * @param {DOM node or object} gd : graph div object
 * @param {array} extensions : list of extension to pass to createRegl
 */
module.exports = function prepareRegl(gd, extensions) {
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
