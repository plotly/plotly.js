'use strict';

var Plotly = require('../plotly');

/**
 * Extends the plot config
 *
 * @param {object} configObj partial plot configuration object
 *      to extend the current plot configuration.
 *
 */
module.exports = function setPlotConfig(configObj) {
    return Plotly.Lib.extendFlat(Plotly.defaultConfig, configObj);
};
