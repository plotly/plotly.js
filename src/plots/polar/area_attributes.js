var scatterAttrs = require('../../traces/scatter/attributes');
var scatterMarkerAttrs = scatterAttrs.marker;

module.exports = {
    r: scatterAttrs.r,
    t: scatterAttrs.t,
    marker: {
        color: scatterMarkerAttrs.color,
        size: scatterMarkerAttrs.size,
        symbol: scatterMarkerAttrs.symbol,
        opacity: scatterMarkerAttrs.opacity
    }
};
