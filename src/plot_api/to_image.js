/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');

var Plotly = require('../plotly');
var Lib = require('../lib');

var helpers = require('../snapshot/helpers');
var clonePlot = require('../snapshot/cloneplot');
var toSVG = require('../snapshot/tosvg');
var svgToImg = require('../snapshot/svgtoimg');

/**
 * @param {object} gd figure Object
 * @param {object} opts option object
 * @param opts.format 'jpeg' | 'png' | 'webp' | 'svg'
 * @param opts.width width of snapshot in px
 * @param opts.height height of snapshot in px
 */
function toImage(gd, opts) {

    var promise = new Promise(function(resolve, reject) {
        // check for undefined opts
        opts = opts || {};
        // default to png
        opts.format = opts.format || 'png';

        var isSizeGood = function(size) {
            // undefined and null are valid options
            if(size === undefined || size === null) {
                return true;
            }

            if(isNumeric(size) && size > 1) {
                return true;
            }

            return false;
        };

        if(!isSizeGood(opts.width) || !isSizeGood(opts.height)) {
            reject(new Error('Height and width should be pixel values.'));
        }

        // first clone the GD so we can operate in a clean environment
        var clone = clonePlot(gd, {format: 'png', height: opts.height, width: opts.width});
        var clonedGd = clone.gd;

        // put the cloned div somewhere off screen before attaching to DOM
        clonedGd.style.position = 'absolute';
        clonedGd.style.left = '-5000px';
        document.body.appendChild(clonedGd);

        function wait() {
            var delay = helpers.getDelay(clonedGd._fullLayout);

            return new Promise(function(resolve, reject) {
                setTimeout(function() {
                    var svg = toSVG(clonedGd);

                    var canvas = document.createElement('canvas');
                    canvas.id = Lib.randstr();

                    svgToImg({
                        format: opts.format,
                        width: clonedGd._fullLayout.width,
                        height: clonedGd._fullLayout.height,
                        canvas: canvas,
                        svg: svg,
                        // ask svgToImg to return a Promise
                        //  rather than EventEmitter
                        //  leave EventEmitter for backward
                        //  compatibility
                        promise: true
                    }).then(function(url) {
                        if(clonedGd) document.body.removeChild(clonedGd);
                        resolve(url);
                    }).catch(function(err) {
                        reject(err);
                    });

                }, delay);
            });
        }

        var redrawFunc = helpers.getRedrawFunc(clonedGd);

        Plotly.plot(clonedGd, clone.data, clone.layout, clone.config)
            .then(redrawFunc)
            .then(wait)
            .then(function(url) { resolve(url); })
            .catch(function(err) {
                reject(err);
            });
    });

    return promise;
}

module.exports = toImage;
