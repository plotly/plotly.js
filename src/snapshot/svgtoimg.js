/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../lib');
var EventEmitter = require('events').EventEmitter;

function svgToImg(opts) {

    var ev = opts.emitter || new EventEmitter();

    var promise = new Promise(function(resolve, reject) {

        var Image = window.Image;

        var svg = opts.svg;
        var format = opts.format || 'png';

        // IE is very strict, so we will need to clean
        //  svg with the following regex
        //  yes this is messy, but do not know a better way
        // Even with this IE will not work due to tainted canvas
        //  see https://github.com/kangax/fabric.js/issues/1957
        //      http://stackoverflow.com/questions/18112047/canvas-todataurl-working-in-all-browsers-except-ie10
        // Leave here just in case the CORS/tainted IE issue gets resolved
        if(Lib.isIE()) {
            // replace double quote with single quote
            svg = svg.replace(/"/gi, '\'');
            // url in svg are single quoted
            //   since we changed double to single
            //   we'll need to change these to double-quoted
            svg = svg.replace(/(\('#)(.*)('\))/gi, '(\"$2\")');
            // font names with spaces will be escaped single-quoted
            //   we'll need to change these to double-quoted
            svg = svg.replace(/(\\')/gi, '\"');
            // IE only support svg
            if(format !== 'svg') {
                var ieSvgError = new Error('Sorry IE does not support downloading from canvas. Try {format:\'svg\'} instead.');
                reject(ieSvgError);
                // eventually remove the ev
                //  in favor of promises
                if(!opts.promise) {
                    return ev.emit('error', ieSvgError);
                } else {
                    return promise;
                }
            }
        }

        var canvas = opts.canvas;

        var ctx = canvas.getContext('2d');
        var img = new Image();

        // for Safari support, eliminate createObjectURL
        //  this decision could cause problems if content
        //  is not restricted to svg
        var url = 'data:image/svg+xml,' + encodeURIComponent(svg);

        canvas.height = opts.height || 150;
        canvas.width = opts.width || 300;

        img.onload = function() {
            var imgData;

            // don't need to draw to canvas if svg
            //  save some time and also avoid failure on IE
            if(format !== 'svg') {
                ctx.drawImage(img, 0, 0);
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
                    reject(new Error('Image format is not jpeg, png or svg'));
                    // eventually remove the ev
                    //  in favor of promises
                    if(!opts.promise) {
                        return ev.emit('error', 'Image format is not jpeg, png or svg');
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
