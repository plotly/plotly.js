/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Plotly = require('../plotly');
var Lib = require('../lib');

var helpers = require('../snapshot/helpers');
var toSVG = require('../snapshot/tosvg');
var svgToImg = require('../snapshot/svgtoimg');

var getGraphDiv = require('./helpers').getGraphDiv;

var attrs = {
    format: {
        valType: 'enumerated',
        values: ['png', 'jpeg', 'webp', 'svg'],
        dflt: 'png',
        description: 'Sets the format of exported image.'
    },
    width: {
        valType: 'number',
        min: 1,
        description: [
            'Sets the exported image width.',
            'Defaults to the value found in `layout.width`'
        ].join(' ')
    },
    height: {
        valType: 'number',
        min: 1,
        description: [
            'Sets the exported image height.',
            'Defaults to the value found in `layout.height`'
        ].join(' ')
    },
    setBackground: {
        valType: 'any',
        dflt: false,
        description: [
            'Sets the image background mode.',
            'By default, the image background is determined by `layout.paper_bgcolor`,',
            'the *transparent* mode.',
            'One might consider setting `setBackground` to *opaque*',
            'when exporting a *jpeg* image as JPEGs do not support opacity.'
        ].join(' ')
    },
    imageDataOnly: {
        valType: 'boolean',
        dflt: false,
        description: [
            'Determines whether or not the return value is prefixed by',
            'the image format\'s corresponding \'data:image;\' spec.'
        ].join(' ')
    }
};

var IMAGE_URL_PREFIX = /^data:image\/\w+;base64,/;

/** Plotly.toImage
 *
 * @param {object | string | HTML div} gd
 *   can either be a data/layout/config object
 *   or an existing graph <div>
 *   or an id to an existing graph <div>
 * @param {object} opts (see above)
 * @return {promise}
 */
function toImage(gd, opts) {
    opts = opts || {};

    var data;
    var layout;
    var config;

    if(Lib.isPlainObject(gd)) {
        data = gd.data || [];
        layout = gd.layout || {};
        config = gd.config || {};
    } else {
        gd = getGraphDiv(gd);
        data = Lib.extendDeep([], gd.data);
        layout = Lib.extendDeep({}, gd.layout);
        config = gd._context;
    }

    function isImpliedOrValid(attr) {
        return !(attr in opts) || Lib.validate(opts[attr], attrs[attr]);
    }

    if(!isImpliedOrValid('width') || !isImpliedOrValid('height')) {
        throw new Error('Height and width should be pixel values.');
    }

    if(!isImpliedOrValid('format')) {
        throw new Error('Image format is not jpeg, png, svg or webp.');
    }

    var fullOpts = {};

    function coerce(attr, dflt) {
        return Lib.coerce(opts, fullOpts, attrs, attr, dflt);
    }

    var format = coerce('format');
    var width = coerce('width');
    var height = coerce('height');
    var setBackground = coerce('setBackground');
    var imageDataOnly = coerce('imageDataOnly');

    // put the cloned div somewhere off screen before attaching to DOM
    var clonedGd = document.createElement('div');
    clonedGd.style.position = 'absolute';
    clonedGd.style.left = '-5000px';
    document.body.appendChild(clonedGd);

    // extend layout with image options
    var layoutImage = Lib.extendFlat({}, layout);
    if(width) layoutImage.width = width;
    if(height) layoutImage.height = height;

    // extend config for static plot
    var configImage = Lib.extendFlat({}, config, {
        staticPlot: true,
        plotGlPixelRatio: config.plotGlPixelRatio || 2,
        setBackground: setBackground
    });

    var redrawFunc = helpers.getRedrawFunc(clonedGd);

    function wait() {
        return new Promise(function(resolve) {
            setTimeout(resolve, helpers.getDelay(clonedGd._fullLayout));
        });
    }

    function convert() {
        return new Promise(function(resolve, reject) {
            var svg = toSVG(clonedGd);
            var width = clonedGd._fullLayout.width;
            var height = clonedGd._fullLayout.height;

            Plotly.purge(clonedGd);
            document.body.removeChild(clonedGd);

            if(format === 'svg') {
                if(imageDataOnly) {
                    return resolve(svg);
                } else {
                    return resolve('data:image/svg+xml,' + encodeURIComponent(svg));
                }
            }

            var canvas = document.createElement('canvas');
            canvas.id = Lib.randstr();

            svgToImg({
                format: format,
                width: width,
                height: height,
                canvas: canvas,
                svg: svg,
                // ask svgToImg to return a Promise
                //  rather than EventEmitter
                //  leave EventEmitter for backward
                //  compatibility
                promise: true
            })
            .then(resolve)
            .catch(reject);
        });
    }

    function urlToImageData(url) {
        if(imageDataOnly) {
            return url.replace(IMAGE_URL_PREFIX, '');
        } else {
            return url;
        }
    }

    return new Promise(function(resolve, reject) {
        Plotly.plot(clonedGd, data, layoutImage, configImage)
            .then(redrawFunc)
            .then(wait)
            .then(convert)
            .then(function(url) { resolve(urlToImageData(url)); })
            .catch(function(err) { reject(err); });
    });
}

module.exports = toImage;
