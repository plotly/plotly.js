'use strict';

var Lib = require('../lib');

var toImage = require('../plot_api/to_image');

var fileSaver = require('./filesaver');
var helpers = require('./helpers');

/**
 * Plotly.downloadImage
 *
 * @param {object | string | HTML div} gd
 *   can either be a data/layout/config object
 *   or an existing graph <div>
 *   or an id to an existing graph <div>
 * @param {object} opts (see Plotly.toImage in ../plot_api/to_image)
 * @return {promise}
 */
function downloadImage(gd, opts) {
    var _gd;
    if(!Lib.isPlainObject(gd)) _gd = Lib.getGraphDiv(gd);

    opts = opts || {};
    opts.format = opts.format || 'png';
    opts.width = opts.width || null;
    opts.height = opts.height || null;
    opts.imageDataOnly = true;

    return new Promise(function(resolve, reject) {
        if(_gd && _gd._snapshotInProgress) {
            reject(new Error('Snapshotting already in progress.'));
        }

        if(_gd) _gd._snapshotInProgress = true;
        var promise = toImage(gd, opts);

        var filename = opts.filename || gd.fn || 'newplot';
        filename += '.' + opts.format.replace('-', '.');

        promise.then(function(result) {
            if(_gd) _gd._snapshotInProgress = false;
            return fileSaver(result, filename, opts.format);
        }).then(function(name) {
            resolve(name);
        }).catch(function(err) {
            if(_gd) _gd._snapshotInProgress = false;
            reject(err);
        });
    });
}

module.exports = downloadImage;
