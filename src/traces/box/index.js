'use strict';

module.exports = {
    attributes: require('./attributes'),
    layoutAttributes: require('./layout_attributes'),
    supplyDefaults: require('./defaults').supplyDefaults,
    crossTraceDefaults: require('./defaults').crossTraceDefaults,
    supplyLayoutDefaults: require('./layout_defaults').supplyLayoutDefaults,
    calc: require('./calc'),
    crossTraceCalc: require('./cross_trace_calc').crossTraceCalc,
    plot: require('./plot').plot,
    style: require('./style').style,
    styleOnSelect: require('./style').styleOnSelect,
    hoverPoints: require('./hover').hoverPoints,
    eventData: require('./event_data'),
    selectPoints: require('./select'),

    moduleType: 'trace',
    name: 'box',
    basePlotModule: require('../../plots/cartesian'),
    categories: ['cartesian', 'svg', 'symbols', 'oriented', 'box-violin', 'showLegend', 'boxLayout', 'zoomScale'],
    meta: {
        description: [
            'Each box spans from quartile 1 (Q1) to quartile 3 (Q3).',
            'The second quartile (Q2, i.e. the median) is marked by a line inside the box.',
            'The fences grow outward from the boxes\' edges,',
            'by default they span +/- 1.5 times the interquartile range (IQR: Q3-Q1),',
            'The sample mean and standard deviation as well as notches and',
            'the sample, outlier and suspected outliers points can be optionally',
            'added to the box plot.',

            'The values and positions corresponding to each boxes can be input',
            'using two signatures.',

            'The first signature expects users to supply the sample values in the `y`',
            'data array for vertical boxes (`x` for horizontal boxes).',
            'By supplying an `x` (`y`) array, one box per distinct `x` (`y`) value is drawn',
            'If no `x` (`y`) {array} is provided, a single box is drawn.',
            'In this case, the box is positioned with the trace `name` or with `x0` (`y0`) if provided.',

            'The second signature expects users to supply the boxes corresponding Q1, median and Q3',
            'statistics in the `q1`, `median` and `q3` data arrays respectively.',
            'Other box features relying on statistics namely `lowerfence`, `upperfence`, `notchspan`',
            'can be set directly by the users.',
            'To have plotly compute them or to show sample points besides the boxes,',
            'users can set the `y` data array for vertical boxes (`x` for horizontal boxes)',
            'to a 2D array with the outer length corresponding',
            'to the number of boxes in the traces and the inner length corresponding the sample size.'
        ].join(' ')
    }
};
