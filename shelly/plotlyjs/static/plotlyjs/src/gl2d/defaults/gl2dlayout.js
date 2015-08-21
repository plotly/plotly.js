'use strict';

var Plotly = require('../../plotly');

var Gl2dLayout = module.exports = {};

Gl2dLayout.layoutAttributes = {};

Gl2dLayout.supplyLayoutDefaults = function(layoutIn, layoutOut, fullData) {

    if (!layoutOut._hasGL2D) return;

    // until they play better together
    delete layoutOut.xaxis;
    delete layoutOut.yaxis;
};
