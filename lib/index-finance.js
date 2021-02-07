'use strict';

var Plotly = require('./core');

Plotly.register([
    require('./bar'),
    require('./histogram'),
    require('./pie'),
    require('./funnelarea'),
    require('./ohlc'),
    require('./candlestick'),
    require('./funnel'),
    require('./waterfall'),
    require('./indicator')
]);

module.exports = require('./register_extra')(Plotly);
