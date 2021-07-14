'use strict';

/**
 * Clear gl frame (if any). This is a common pattern as
 * we usually set `preserveDrawingBuffer: true` during
 * gl context creation (e.g. via `reglUtils.prepare`).
 *
 * @param {DOM node or object} gd : graph div object
 */
module.exports = function clearGlCanvases(gd) {
    var fullLayout = gd._fullLayout;

    if(fullLayout._glcanvas && fullLayout._glcanvas.size()) {
        fullLayout._glcanvas.each(function(d) {
            if(d.regl) d.regl.clear({color: true, depth: true});
        });
    }
};
