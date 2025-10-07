'use strict';

var makeFillcolorAttr = require('../scatter/fillcolor_attribute');
var scatterAttrs = require('../scatter/attributes');
var barAttrs = require('../bar/attributes');
var colorAttrs = require('../../components/color/attributes');
var axisHoverFormat = require('../../plots/cartesian/axis_format_attributes').axisHoverFormat;
const { hovertemplateAttrs, templatefallbackAttrs } = require('../../plots/template_attributes');
var extendFlat = require('../../lib/extend').extendFlat;

var scatterMarkerAttrs = scatterAttrs.marker;
var scatterMarkerLineAttrs = scatterMarkerAttrs.line;

module.exports = {
    y: {
        valType: 'data_array',
        editType: 'calc+clearAxisTypes',
        description: 'Sets the y sample data or coordinates. See overview for more info.'
    },
    x: {
        valType: 'data_array',
        editType: 'calc+clearAxisTypes',
        description: 'Sets the x sample data or coordinates. See overview for more info.'
    },
    x0: {
        valType: 'any',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the x coordinate for single-box traces',
            'or the starting coordinate for multi-box traces',
            'set using q1/median/q3.',
            'See overview for more info.'
        ].join(' ')
    },
    y0: {
        valType: 'any',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the y coordinate for single-box traces',
            'or the starting coordinate for multi-box traces',
            'set using q1/median/q3.',
            'See overview for more info.'
        ].join(' ')
    },

    dx: {
        valType: 'number',
        editType: 'calc',
        description: 'Sets the x coordinate step for multi-box traces set using q1/median/q3.'
    },
    dy: {
        valType: 'number',
        editType: 'calc',
        description: 'Sets the y coordinate step for multi-box traces set using q1/median/q3.'
    },

    xperiod: scatterAttrs.xperiod,
    yperiod: scatterAttrs.yperiod,
    xperiod0: scatterAttrs.xperiod0,
    yperiod0: scatterAttrs.yperiod0,
    xperiodalignment: scatterAttrs.xperiodalignment,
    yperiodalignment: scatterAttrs.yperiodalignment,
    xhoverformat: axisHoverFormat('x'),
    yhoverformat: axisHoverFormat('y'),

    name: {
        valType: 'string',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the trace name.',
            'The trace name appears as the legend item and on hover.',
            'For box traces, the name will also be used for the position',
            'coordinate, if `x` and `x0` (`y` and `y0` if horizontal) are',
            'missing and the position axis is categorical'
        ].join(' ')
    },

    q1: {
        valType: 'data_array',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the Quartile 1 values.',
            'There should be as many items as the number of boxes desired.'
        ].join(' ')
    },
    median: {
        valType: 'data_array',
        editType: 'calc+clearAxisTypes',
        description: 'Sets the median values. There should be as many items as the number of boxes desired.'
    },
    q3: {
        valType: 'data_array',
        editType: 'calc+clearAxisTypes',
        description: 'Sets the Quartile 3 values. There should be as many items as the number of boxes desired.'
    },
    lowerfence: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Sets the lower fence values.',
            'There should be as many items as the number of boxes desired.',
            'This attribute has effect only under the q1/median/q3 signature.',
            'If `lowerfence` is not provided but a sample (in `y` or `x`) is set,',
            'we compute the lower as the last sample point below 1.5 times the IQR.'
        ].join(' ')
    },
    upperfence: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Sets the upper fence values.',
            'There should be as many items as the number of boxes desired.',
            'This attribute has effect only under the q1/median/q3 signature.',
            'If `upperfence` is not provided but a sample (in `y` or `x`) is set,',
            'we compute the upper as the last sample point above 1.5 times the IQR.'
        ].join(' ')
    },

    notched: {
        valType: 'boolean',
        editType: 'calc',
        description: [
            'Determines whether or not notches are drawn.',
            'Notches displays a confidence interval around the median.',
            'We compute the confidence interval as median +/- 1.57 * IQR / sqrt(N),',
            'where IQR is the interquartile range and N is the sample size.',
            "If two boxes' notches do not overlap there is 95% confidence their medians differ.",
            'See https://sites.google.com/site/davidsstatistics/home/notched-box-plots for more info.',
            'Defaults to *false* unless `notchwidth` or `notchspan` is set.'
        ].join(' ')
    },
    notchwidth: {
        valType: 'number',
        min: 0,
        max: 0.5,
        dflt: 0.25,
        editType: 'calc',
        description: [
            'Sets the width of the notches relative to',
            'the box width.',
            'For example, with 0, the notches are as wide as the box(es).'
        ].join(' ')
    },
    notchspan: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            "Sets the notch span from the boxes' `median` values.",
            'There should be as many items as the number of boxes desired.',
            'This attribute has effect only under the q1/median/q3 signature.',
            'If `notchspan` is not provided but a sample (in `y` or `x`) is set,',
            'we compute it as 1.57 * IQR / sqrt(N),',
            'where N is the sample size.'
        ].join(' ')
    },

    // TODO
    // maybe add
    // - loweroutlierbound / upperoutlierbound
    // - lowersuspectedoutlierbound / uppersuspectedoutlierbound

    boxpoints: {
        valType: 'enumerated',
        values: ['all', 'outliers', 'suspectedoutliers', false],
        editType: 'calc',
        description: [
            'If *outliers*, only the sample points lying outside the whiskers',
            'are shown',
            'If *suspectedoutliers*, the outlier points are shown and',
            'points either less than 4*Q1-3*Q3 or greater than 4*Q3-3*Q1',
            'are highlighted (see `outliercolor`)',
            'If *all*, all sample points are shown',
            'If *false*, only the box(es) are shown with no sample points',
            'Defaults to *suspectedoutliers* when `marker.outliercolor` or',
            '`marker.line.outliercolor` is set.',
            'Defaults to *all* under the q1/median/q3 signature.',
            'Otherwise defaults to *outliers*.'
        ].join(' ')
    },
    jitter: {
        valType: 'number',
        min: 0,
        max: 1,
        editType: 'calc',
        description: [
            'Sets the amount of jitter in the sample points drawn.',
            'If *0*, the sample points align along the distribution axis.',
            'If *1*, the sample points are drawn in a random jitter of width',
            'equal to the width of the box(es).'
        ].join(' ')
    },
    pointpos: {
        valType: 'number',
        min: -2,
        max: 2,
        editType: 'calc',
        description: [
            'Sets the position of the sample points in relation to the box(es).',
            'If *0*, the sample points are places over the center of the box(es).',
            'Positive (negative) values correspond to positions to the',
            'right (left) for vertical boxes and above (below) for horizontal boxes'
        ].join(' ')
    },
    sdmultiple: {
        valType: 'number',
        min: 0,
        editType: 'calc',
        dflt: 1,
        description: [
            'Scales the box size when sizemode=sd',
            'Allowing boxes to be drawn across any stddev range',
            'For example 1-stddev, 3-stddev, 5-stddev'
        ].join(' ')
    },
    sizemode: {
        valType: 'enumerated',
        values: ['quartiles', 'sd'],
        editType: 'calc',
        dflt: 'quartiles',
        description: [
            'Sets the upper and lower bound for the boxes',
            'quartiles means box is drawn between Q1 and Q3',
            'SD means the box is drawn between Mean +- Standard Deviation',
            'Argument sdmultiple (default 1) to scale the box size',
            'So it could be drawn 1-stddev, 3-stddev etc'
        ].join(' ')
    },
    boxmean: {
        valType: 'enumerated',
        values: [true, 'sd', false],
        editType: 'calc',
        description: [
            "If *true*, the mean of the box(es)' underlying distribution is",
            'drawn as a dashed line inside the box(es).',
            'If *sd* the standard deviation is also drawn.',
            'Defaults to *true* when `mean` is set.',
            'Defaults to *sd* when `sd` is set',
            'Otherwise defaults to *false*.'
        ].join(' ')
    },
    mean: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Sets the mean values.',
            'There should be as many items as the number of boxes desired.',
            'This attribute has effect only under the q1/median/q3 signature.',
            'If `mean` is not provided but a sample (in `y` or `x`) is set,',
            'we compute the mean for each box using the sample values.'
        ].join(' ')
    },
    sd: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Sets the standard deviation values.',
            'There should be as many items as the number of boxes desired.',
            'This attribute has effect only under the q1/median/q3 signature.',
            'If `sd` is not provided but a sample (in `y` or `x`) is set,',
            'we compute the standard deviation for each box using the sample values.'
        ].join(' ')
    },

    orientation: {
        valType: 'enumerated',
        values: ['v', 'h'],
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the orientation of the box(es).',
            'If *v* (*h*), the distribution is visualized along',
            'the vertical (horizontal).'
        ].join(' ')
    },

    quartilemethod: {
        valType: 'enumerated',
        values: ['linear', 'exclusive', 'inclusive'],
        dflt: 'linear',
        editType: 'calc',
        description: [
            "Sets the method used to compute the sample's Q1 and Q3 quartiles.",

            'The *linear* method uses the 25th percentile for Q1 and 75th percentile for Q3',
            'as computed using method #10 (listed on http://jse.amstat.org/v14n3/langford.html).',

            'The *exclusive* method uses the median to divide the ordered dataset into two halves',
            'if the sample is odd, it does not include the median in either half -',
            'Q1 is then the median of the lower half and',
            'Q3 the median of the upper half.',

            'The *inclusive* method also uses the median to divide the ordered dataset into two halves',
            'but if the sample is odd, it includes the median in both halves -',
            'Q1 is then the median of the lower half and',
            'Q3 the median of the upper half.'
        ].join(' ')
    },

    width: {
        valType: 'number',
        min: 0,
        dflt: 0,
        editType: 'calc',
        description: [
            'Sets the width of the box in data coordinate',
            'If *0* (default value) the width is automatically selected based on the positions',
            'of other box traces in the same subplot.'
        ].join(' ')
    },

    marker: {
        outliercolor: {
            valType: 'color',
            dflt: 'rgba(0, 0, 0, 0)',
            editType: 'style',
            description: 'Sets the color of the outlier sample points.'
        },
        symbol: extendFlat({}, scatterMarkerAttrs.symbol, { arrayOk: false, editType: 'plot' }),
        opacity: extendFlat({}, scatterMarkerAttrs.opacity, { arrayOk: false, dflt: 1, editType: 'style' }),
        angle: extendFlat({}, scatterMarkerAttrs.angle, { arrayOk: false, editType: 'calc' }),
        size: extendFlat({}, scatterMarkerAttrs.size, { arrayOk: false, editType: 'calc' }),
        color: extendFlat({}, scatterMarkerAttrs.color, { arrayOk: false, editType: 'style' }),
        line: {
            color: extendFlat({}, scatterMarkerLineAttrs.color, {
                arrayOk: false,
                dflt: colorAttrs.defaultLine,
                editType: 'style'
            }),
            width: extendFlat({}, scatterMarkerLineAttrs.width, { arrayOk: false, dflt: 0, editType: 'style' }),
            outliercolor: {
                valType: 'color',
                editType: 'style',
                description: [
                    'Sets the border line color of the outlier sample points.',
                    'Defaults to marker.color'
                ].join(' ')
            },
            outlierwidth: {
                valType: 'number',
                min: 0,
                dflt: 1,
                editType: 'style',
                description: 'Sets the border line width (in px) of the outlier sample points.'
            },
            editType: 'style'
        },
        editType: 'plot'
    },

    line: {
        color: {
            valType: 'color',
            editType: 'style',
            description: 'Sets the color of line bounding the box(es).'
        },
        width: {
            valType: 'number',
            min: 0,
            dflt: 2,
            editType: 'style',
            description: 'Sets the width (in px) of line bounding the box(es).'
        },
        editType: 'plot'
    },

    fillcolor: makeFillcolorAttr(),

    whiskerwidth: {
        valType: 'number',
        min: 0,
        max: 1,
        dflt: 0.5,
        editType: 'calc',
        description: [
            'Sets the width of the whiskers relative to',
            'the box width.',
            'For example, with 1, the whiskers are as wide as the box(es).'
        ].join(' ')
    },

    showwhiskers: {
        valType: 'boolean',
        editType: 'calc',
        description: [
            'Determines whether or not whiskers are visible.',
            'Defaults to true for `sizemode` *quartiles*, false for *sd*.'
        ].join(' ')
    },

    offsetgroup: barAttrs.offsetgroup,
    alignmentgroup: barAttrs.alignmentgroup,

    selected: {
        marker: scatterAttrs.selected.marker,
        editType: 'style'
    },
    unselected: {
        marker: scatterAttrs.unselected.marker,
        editType: 'style'
    },

    text: extendFlat({}, scatterAttrs.text, {
        description: [
            'Sets the text elements associated with each sample value.',
            'If a single string, the same string appears over',
            'all the data points.',
            'If an array of string, the items are mapped in order to the',
            "this trace's (x,y) coordinates.",
            'To be seen, trace `hoverinfo` must contain a *text* flag.'
        ].join(' ')
    }),
    hovertext: extendFlat({}, scatterAttrs.hovertext, { description: 'Same as `text`.' }),
    hovertemplate: hovertemplateAttrs({ description: 'N.B. This only has an effect when hovering on points.' }),
    hovertemplatefallback: templatefallbackAttrs(),

    hoveron: {
        valType: 'flaglist',
        flags: ['boxes', 'points'],
        dflt: 'boxes+points',
        editType: 'style',
        description: 'Do the hover effects highlight individual boxes or sample points or both?'
    },
    zorder: scatterAttrs.zorder
};
