var Plotly = require('../../plotly');

var scatterAttrs = Plotly.Scatter.attributes,
    scatterMarkerAttrs = scatterAttrs.marker;

module.exports = {
    r: scatterAttrs.r,
    t: scatterAttrs.t,
    marker: {
        color: scatterMarkerAttrs.color,
        size: scatterMarkerAttrs.size,
        symbol: scatterMarkerAttrs.symbol,
        opacity: scatterAttrs.opacity
    }
};
