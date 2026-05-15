'use strict';

var colorMix = require('tinycolor2').mix;
var colorAttrs = require('../../components/color/attributes');
var Lib = require('../../lib');

/**
 * @param {object} opts :
 *   - dfltColor {string} : default axis color
 *   - bgColor {string} : combined subplot bg color
 *   - blend {number, optional} : blend percentage (to compute dflt grid color)
 *   - showLine {boolean} : show line by default
 *   - showGrid {boolean} : show grid by default
 *   - noZeroLine {boolean} : don't coerce zeroline* attributes
 *   - attributes {object} : attribute object associated with input containers
 */
module.exports = function handleLineGridDefaults(containerIn, containerOut, coerce, opts) {
    opts = opts || {};

    var dfltColor = opts.dfltColor;

    function coerce2(attr, dflt) {
        return Lib.coerce2(containerIn, containerOut, opts.attributes, attr, dflt);
    }

    var lineColor = coerce2('linecolor', dfltColor);
    var lineWidth = coerce2('linewidth');
    var showLine = coerce('showline', opts.showLine || !!lineColor || !!lineWidth);

    if(!showLine) {
        delete containerOut.linecolor;
        delete containerOut.linewidth;
    }

    var gridColorDflt = colorMix(dfltColor, opts.bgColor, opts.blend || colorAttrs.lightFraction).toRgbString();
    var gridColor = coerce2('gridcolor', gridColorDflt);
    var gridWidth = coerce2('gridwidth');
    var gridDash = coerce2('griddash');
    var showGridLines = coerce('showgrid', opts.showGrid ||
        !!gridColor ||
        !!gridWidth ||
        !!gridDash
    );

    if(!showGridLines) {
        delete containerOut.gridcolor;
        delete containerOut.gridwidth;
        delete containerOut.griddash;
    }

    if(opts.hasMinor) {
        var minorGridColorDflt = colorMix(containerOut.gridcolor, opts.bgColor, 67).toRgbString();
        var minorGridColor = coerce2('minor.gridcolor', minorGridColorDflt);
        var minorGridWidth = coerce2('minor.gridwidth', containerOut.gridwidth || 1);
        var minorGridDash = coerce2('minor.griddash', containerOut.griddash || 'solid');
        var minorShowGridLines = coerce('minor.showgrid',
            !!minorGridColor ||
            !!minorGridWidth ||
            !!minorGridDash
        );

        if(!minorShowGridLines) {
            delete containerOut.minor.gridcolor;
            delete containerOut.minor.gridwidth;
            delete containerOut.minor.griddash;
        }
    }

    if(!opts.noZeroLine) {
        var zeroLineLayer = coerce2('zerolinelayer');
        var zeroLineColor = coerce2('zerolinecolor', dfltColor);
        var zeroLineWidth = coerce2('zerolinewidth');
        var showZeroLine = coerce('zeroline', opts.showGrid || !!zeroLineColor || !!zeroLineWidth);

        if(!showZeroLine) {
            delete containerOut.zerolinelayer;
            delete containerOut.zerolinecolor;
            delete containerOut.zerolinewidth;
        }
    }
};
