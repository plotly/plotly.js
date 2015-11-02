'use strict';

var Plotly = require('../plotly');

module.exports = function updateStyle() {
    Plotly.Color.defaults = [
        '#CC0000', '#5E6A71', '#BBDDE7', '#55aab2', '#a4b0b7'
    ];

    Plotly.Plots.layoutAttributes.font.family.dflt = '"Overpass", verdana, arial, sans-serif';

    Plotly.Plots.fontWeight = 900;
};
