'use strict';

var isNumeric = require('fast-isnumeric');

var plotApi = require('./plot_api');
var plots = require('../plots/plots');
var Lib = require('../lib');

var helpers = require('../snapshot/helpers');
var toSVG = require('../snapshot/tosvg');
var svgToImg = require('../snapshot/svgtoimg');
var version = require('../version').version;
const attrs = require('./to_image_attributes').default;

/** Plotly.toImage
 *
 * @param {object | string | HTML div} gd
 *   can either be a data/layout/config object
 *   or an existing graph <div>
 *   or an id to an existing graph <div>
 * @param {object} opts (see ./to_image_attributes)
 * @return {promise}
 */
function toImage(gd, opts) {
    opts = opts || {};

    var data;
    var layout;
    var config;
    var fullLayout;

    if(Lib.isPlainObject(gd)) {
        data = gd.data || [];
        layout = gd.layout || {};
        config = gd.config || {};
        fullLayout = {};
    } else {
        gd = Lib.getGraphDiv(gd);
        data = Lib.extendDeep([], gd.data);
        layout = Lib.extendDeep({}, gd.layout);
        config = gd._context;
        fullLayout = gd._fullLayout || {};
    }

    function isImpliedOrValid(attr) {
        return !(attr in opts) || Lib.validate(opts[attr], attrs[attr]);
    }

    if((!isImpliedOrValid('width') && opts.width !== null) ||
        (!isImpliedOrValid('height') && opts.height !== null)) {
        throw new Error('Height and width should be pixel values.');
    }

    if(!isImpliedOrValid('format')) {
        throw new Error('Export format is not ' + Lib.join2(attrs.format.values, ', ', ' or ') + '.');
    }

    var fullOpts = {};

    function coerce(attr, dflt) {
        return Lib.coerce(opts, fullOpts, attrs, attr, dflt);
    }

    var format = coerce('format');
    var width = coerce('width');
    var height = coerce('height');
    var scale = coerce('scale');
    var setBackground = coerce('setBackground');
    var imageDataOnly = coerce('imageDataOnly');

    // put the cloned div somewhere off screen before attaching to DOM
    var clonedGd = document.createElement('div');
    clonedGd.style.position = 'absolute';
    clonedGd.style.left = '-5000px';
    document.body.appendChild(clonedGd);

    // extend layout with image options
    var layoutImage = Lib.extendFlat({}, layout);
    if(width) {
        layoutImage.width = width;
    } else if(opts.width === null && isNumeric(fullLayout.width)) {
        layoutImage.width = fullLayout.width;
    }
    if(height) {
        layoutImage.height = height;
    } else if(opts.height === null && isNumeric(fullLayout.height)) {
        layoutImage.height = fullLayout.height;
    }

    // extend config for static plot
    var configImage = Lib.extendFlat({}, config, {
        _exportedPlot: true,
        staticPlot: true,
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
            var svg = toSVG(clonedGd, format, scale);
            var width = clonedGd._fullLayout.width;
            var height = clonedGd._fullLayout.height;

            function cleanup() {
                plotApi.purge(clonedGd);
                document.body.removeChild(clonedGd);
            }

            if(format === 'full-json') {
                var json = plots.graphJson(clonedGd, false, 'object', true, true);
                json.version = version;
                json = JSON.stringify(json);
                cleanup();
                if(imageDataOnly) {
                    return resolve(json);
                } else {
                    return resolve(helpers.encodeJSON(json));
                }
            }

            cleanup();

            if(format === 'svg') {
                if(imageDataOnly) {
                    return resolve(svg);
                } else {
                    return resolve(helpers.encodeSVG(svg));
                }
            }

            var canvas = document.createElement('canvas');
            canvas.id = Lib.randstr();

            svgToImg({
                format: format,
                width: width,
                height: height,
                scale: scale,
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
            return url.replace(helpers.IMAGE_URL_PREFIX, '');
        } else {
            return url;
        }
    }

    return new Promise(function(resolve, reject) {
        plotApi.newPlot(clonedGd, data, layoutImage, configImage)
            .then(redrawFunc)
            .then(wait)
            .then(convert)
            .then(function(url) { resolve(urlToImageData(url)); })
            .catch(function(err) { reject(err); });
    });
}

module.exports = toImage;
