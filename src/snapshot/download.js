'use strict';

var Lib = require('../lib');
var svgTextUtils = require('../lib/svg_text_utils');

var toImage = require('../plot_api/to_image');

var fileSaver = require('./filesaver');
var helpers = require('./helpers');

// Maximum length of filename (without extension) when deriving filename from plot title.
// 40 is somewhat arbitrary, just trying to strike a balance between being informative
// while still generating a reasonable-length filename.
// Technically, this is actually the number of code points rather than characters, which only differs
// from character count in the case of certain emojis or special characters containing multiple code points
const MAX_FILENAME_LENGTH_CHARS = 40;

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
            reject(new Error('Image capture already in progress.'));
        }

        if(_gd) _gd._snapshotInProgress = true;
        var promise = toImage(gd, opts);

        var potentialFilename = opts.filename || gd.fn;
        if (!potentialFilename) {
            const plotTitle = helpers.getPlotTitle(gd);
            // Trying to slugify a LaTeX string can result in weird ugly filenames,
            // so ignore the title entirely if it contains LaTeX markup
            if (plotTitle && !svgTextUtils.matchTex(plotTitle)) {
                potentialFilename = Lib.slugify(plotTitle, MAX_FILENAME_LENGTH_CHARS);
            } else {
                // If the title is empty or contains LaTeX, fall back to subtitle
                const plotSubtitle = helpers.getPlotSubtitle(gd);
                if (plotSubtitle && !svgTextUtils.matchTex(plotSubtitle)) {
                    potentialFilename = Lib.slugify(plotSubtitle, MAX_FILENAME_LENGTH_CHARS);
                }
            }
        }

        var filename = potentialFilename || 'plot-image';
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
