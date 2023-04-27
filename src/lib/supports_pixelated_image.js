'use strict';

var constants = require('../constants/pixelated_image');
var Drawing = require('../components/drawing');
var Lib = require('../lib');

var _supportsPixelated = null;

/**
 * Check browser support for pixelated image rendering
 *
 * @return {boolean}
 */
function supportsPixelatedImage() {
    if(_supportsPixelated !== null) { // only run the feature detection once
        return _supportsPixelated;
    }
    if(Lib.isIE()) {
        _supportsPixelated = false;
    } else {
        var declarations = Array.from(constants.CSS_DECLARATIONS).reverse();
        var supports = window.CSS && window.CSS.supports || window.supportsCSS;
        if(typeof supports === 'function') {
            _supportsPixelated = declarations.some(function(d) {
                return supports.apply(null, d);
            });
        } else {
            var image3 = Drawing.tester.append('image');
            var cStyles = window.getComputedStyle(image3.node());
            image3.attr('style', constants.STYLE);
            _supportsPixelated = declarations.some(function(d) {
                var value = d[1];
                return cStyles.imageRendering === value ||
                       cStyles.imageRendering === value.toLowerCase();
            });
            image3.remove();
        }
    }
    return _supportsPixelated;
}

module.exports = supportsPixelatedImage;
