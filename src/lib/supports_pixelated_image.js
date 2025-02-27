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

    _supportsPixelated = false;

    // @see https://github.com/plotly/plotly.js/issues/6604
    var unsupportedBrowser = Lib.isSafari() || Lib.isIOS();

    if(window.navigator.userAgent && !unsupportedBrowser) {
        var declarations = Array.from(constants.CSS_DECLARATIONS).reverse();

        var supports = (window.CSS && window.CSS.supports) || window.supportsCSS;
        if(typeof supports === 'function') {
            _supportsPixelated = declarations.some(function(d) {
                return supports.apply(null, d);
            });
        } else {
            var image3 = Drawing.tester.append('image')
                .attr('style', constants.STYLE);

            var cStyles = window.getComputedStyle(image3.node());
            var imageRendering = cStyles.imageRendering;

            _supportsPixelated = declarations.some(function(d) {
                var value = d[1];
                return (
                    imageRendering === value ||
                    imageRendering === value.toLowerCase()
                );
            });

            image3.remove();
        }
    }

    return _supportsPixelated;
}

module.exports = supportsPixelatedImage;
