/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../lib');
var EventEmitter = require('events').EventEmitter;

var helpers = require('./helpers');

function svgToImg(opts) {
    var ev = opts.emitter || new EventEmitter();

    var promise = new Promise(function(resolve, reject) {
        var Image = window.Image;
        var svg = opts.svg;
        var format = opts.format || 'png';

        // IE only support svg
        if(Lib.isIE() && format !== 'svg') {
            var ieSvgError = new Error(helpers.MSG_IE_BAD_FORMAT);
            reject(ieSvgError);
            // eventually remove the ev
            //  in favor of promises
            if(!opts.promise) {
                return ev.emit('error', ieSvgError);
            } else {
                return promise;
            }
        }

        var canvas = opts.canvas;
        var scale = opts.scale || 1;
        var w0 = opts.width || 300;
        var h0 = opts.height || 150;
        var w1 = scale * w0;
        var h1 = scale * h0;

        var ctx = canvas.getContext('2d');
        var img = new Image();
        var svgBlob, url;

        if(format === 'svg' || Lib.isIE9orBelow() || Lib.isSafari()) {
            url = helpers.encodeSVG(svg);
        } else {
            svgBlob = helpers.createBlob(svg, 'svg');
            url = helpers.createObjectURL(svgBlob);
        }

        canvas.width = w1;
        canvas.height = h1;

        img.onload = function() {
            var imgData;

            svgBlob = null;
            helpers.revokeObjectURL(url);

            // don't need to draw to canvas if svg
            //  save some time and also avoid failure on IE
            if(format !== 'svg') {
                ctx.drawImage(img, 0, 0, w1, h1);
            }

            switch(format) {
                case 'jpeg':
                    imgData = canvas.toDataURL('image/jpeg');
                    break;
                case 'png':
                    imgData = canvas.toDataURL('image/png');
                    break;
                case 'webp':
                    imgData = canvas.toDataURL('image/webp');
                    break;
                case 'svg':
                    imgData = url;
                    break;
                default:
                    var errorMsg = 'Image format is not jpeg, png, svg or webp.';
                    reject(new Error(errorMsg));
                    // eventually remove the ev
                    //  in favor of promises
                    if(!opts.promise) {
                        return ev.emit('error', errorMsg);
                    }
            }
            resolve(imgData);
            // eventually remove the ev
            //  in favor of promises
            if(!opts.promise) {
                ev.emit('success', imgData);
            }
        };

        img.onerror = function(err) {
            svgBlob = null;
            helpers.revokeObjectURL(url);

            reject(err);
            // eventually remove the ev
            //  in favor of promises
            if(!opts.promise) {
                return ev.emit('error', err);
            }
        };

        img.src = url;
    });

    // temporary for backward compatibility
    //  move to only Promise in 2.0.0
    //  and eliminate the EventEmitter
    if(opts.promise) {
        return promise;
    }

    return ev;
}

module.exports = svgToImg;
