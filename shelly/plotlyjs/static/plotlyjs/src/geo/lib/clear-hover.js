'use strict';

var Plotly = require('../../plotly');

function clearHover(framework) {
    return function() {
        Plotly.Fx.loneHover(
            {x: 1e20, y: 1e20}, {container: framework[0][0]}
        );
    }
}

module.exports = clearHover;
