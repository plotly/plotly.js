/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var toImage = require('../plot_api/to_image');
var Lib = require('../lib'); // for isIE
var fileSaver = require('./filesaver');

/**
 * @param {object} gd figure Object
 * @param {object} opts option object
 * @param opts.format 'jpeg' | 'png' | 'webp' | 'svg'
 * @param opts.width width of snapshot in px
 * @param opts.height height of snapshot in px
 * @param opts.filename name of file excluding extension
 */
function downloadImage(gd, opts) {

    // check for undefined opts
    opts = opts || {};

    // default to png
    opts.format = opts.format || 'png';

    return new Promise(function(resolve, reject) {
        if(gd._snapshotInProgress) {
            reject(new Error('Snapshotting already in progress.'));
        }

        // see comments within svgtoimg for additional
        //   discussion of problems with IE
        //   can now draw to canvas, but CORS tainted canvas
        //   does not allow toDataURL
        //   svg format will work though
        if(Lib.isIE() && opts.format !== 'svg') {
            reject(new Error('Sorry IE does not support downloading from canvas. Try {format:\'svg\'} instead.'));
        }

        gd._snapshotInProgress = true;
        var promise = toImage(gd, opts);

        var filename = opts.filename || gd.fn || 'newplot';
        filename += '.' + opts.format;

        promise.then(function(result) {
            gd._snapshotInProgress = false;
            return fileSaver(result, filename);
        }).then(function(name) {
            resolve(name);
        }).catch(function(err) {
            gd._snapshotInProgress = false;
            reject(err);
        });
    });
}

module.exports = downloadImage;
