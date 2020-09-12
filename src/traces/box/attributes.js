/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var scatterAttrs = require('../scatter/attributes');
var barAttrs = require('../bar/attributes');
var colorAttrs = require('../../components/color/attributes');
var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var extendFlat = require('../../lib/extend').extendFlat;

var scatterMarkerAttrs = scatterAttrs.marker;
var scatterMarkerLineAttrs = scatterMarkerAttrs.line;

module.exports = {
    y: {
        valType: 'data_array',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the y sample data or coordinates.',
            'See overview for more info.'
        ].join(' ')
    },
    x: {
        valType: 'data_array',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the x sample data or coordinates.',
            'See overview for more info.'
        ].join(' ')
    },
    x0: {
        valType: 'any',
        role: 'info',
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
        role: 'info',
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
        role: 'info',
        editType: 'calc',
        description: [
            'Sets the x coordinate step for multi-box traces',
            'set using q1/median/q3.'
        ].join(' ')
    },
    dy: {
        valType: 'number',
        role: 'info',
        editType: 'calc',
        description: [
            'Sets the y coordinate step for multi-box traces',
            'set using q1/median/q3.'
        ].join(' ')
    },

    xperiod: scatterAttrs.xperiod,
    yperiod: scatterAttrs.yperiod,
    xperiod0: scatterAttrs.xperiod0,
    yperiod0: scatterAttrs.yperiod0,
    xperiodalignment: scatterAttrs.xperiodalignment,
    yperiodalignment: scatterAttrs.yperiodalignment,

    name: {
        valType: 'string',
        role: 'info',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the trace name.',
            'The trace name appear as the legend item and on hover.',
            'For box traces, the name will also be used for the position',
            'coordinate, if `x` and `x0` (`y` and `y0` if horizontal) are',
            'missing and the position axis is categorical'
        ].join(' ')
    },

    q1: {
        valType: 'data_array',
        role: 'info',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the Quartile 1 values.',
            'There should be as many items as the number of boxes desired.',
        ].join(' ')
    },
    median: {
        valType: 'data_array',
        role: 'info',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the median values.',
            'There should be as many items as the number of boxes desired.',
        ].join(' ')
    },
    q3: {
        valType: 'data_array',
        role: 'info',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the Quartile 3 values.',
            'There should be as many items as the number of boxes desired.',
        ].join(' ')
    },
    lowerfence: {
        valType: 'data_array',
        role: 'info',
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
        role: 'info',
        editType: 'calc',
        description: [
            'Sets the upper fence values.',
            'There should be as many items as the number of boxes desired.',
            'This attribute has effect only under the q1/median/q3 signature.',
            'If `upperfence` is not provided but a sample (in `y` or `x`) is set,',
            'we compute the lower as the last sample point above 1.5 times the IQR.'
        ].join(' ')
    },

    notched: {
        valType: 'boolean',
        role: 'info',
        editType: 'calc',
        description: [
            'Determines whether or not notches are drawn.',
            'Notches displays a confidence interval around the median.',
            'We compute the confidence interval as median +/- 1.57 * IQR / sqrt(N),',
            'where IQR is the interquartile range and N is the sample size.',
            'If two boxes\' notches do not overlap there is 95% confidence their medians differ.',
            'See https://sites.google.com/site/davidsstatistics/home/notched-box-plots for more info.',
            'Defaults to *false* unless `notchwidth` or `notchspan` is set.'
        ].join(' ')
    },
    notchwidth: {
        valType: 'number',
        min: 0,
        max: 0.5,
        dflt: 0.25,
        role: 'style',
        editType: 'calc',
        description: [
            'Sets the width of the notches relative to',
            'the box\' width.',
            'For example, with 0, the notches are as wide as the box(es).'
        ].join(' ')
    },
    notchspan: {
        valType: 'data_array',
        role: 'info',
        editType: 'calc',
        description: [
            'Sets the notch span from the boxes\' `median` values.',
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
        role: 'style',
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
            'Otherwise defaults to *outliers*.',
        ].join(' ')
    },
    jitter: {
        valType: 'number',
        min: 0,
        max: 1,
        role: 'style',
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
        role: 'style',
        editType: 'calc',
        description: [
            'Sets the position of the sample points in relation to the box(es).',
            'If *0*, the sample points are places over the center of the box(es).',
            'Positive (negative) values correspond to positions to the',
            'right (left) for vertical boxes and above (below) for horizontal boxes'
        ].join(' ')
    },

    boxmean: {
        valType: 'enumerated',
        values: [true, 'sd', false],
        role: 'style',
        editType: 'calc',
        description: [
            'If *true*, the mean of the box(es)\' underlying distribution is',
            'drawn as a dashed line inside the box(es).',
            'If *sd* the standard deviation is also drawn.',
            'Defaults to *true* when `mean` is set.',
            'Defaults to *sd* when `sd` is set',
            'Otherwise defaults to *false*.'
        ].join(' ')
    },
    mean: {
        valType: 'data_array',
        role: 'info',
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
        role: 'info',
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
        role: 'style',
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
        role: 'info',
        editType: 'calc',
        description: [
            'Sets the method used to compute the sample\'s Q1 and Q3 quartiles.',

            'The *linear* method uses the 25th percentile for Q1 and 75th percentile for Q3',
            'as computed using method #10 (listed on http://www.amstat.org/publications/jse/v14n3/langford.html).',

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
        role: 'info',
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
            role: 'style',
            editType: 'style',
            description: 'Sets the color of the outlier sample points.'
        },
        symbol: extendFlat({}, scatterMarkerAttrs.symbol,
            {arrayOk: false, editType: 'plot'}),
        opacity: extendFlat({}, scatterMarkerAttrs.opacity,
            {arrayOk: false, dflt: 1, editType: 'style'}),
        size: extendFlat({}, scatterMarkerAttrs.size,
            {arrayOk: false, editType: 'calc'}),
        color: extendFlat({}, scatterMarkerAttrs.color,
            {arrayOk: false, editType: 'style'}),
        line: {
            color: extendFlat({}, scatterMarkerLineAttrs.color,
                {arrayOk: false, dflt: colorAttrs.defaultLine, editType: 'style'}
            ),
            width: extendFlat({}, scatterMarkerLineAttrs.width,
                {arrayOk: false, dflt: 0, editType: 'style'}
            ),
            outliercolor: {
                valType: 'color',
                role: 'style',
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
                role: 'style',
                editType: 'style',
                description: [
                    'Sets the border line width (in px) of the outlier sample points.'
                ].join(' ')
            },
            editType: 'style'
        },
        editType: 'plot'
    },

    line: {
        color: {
            valType: 'color',
            role: 'style',
            editType: 'style',
            description: 'Sets the color of line bounding the box(es).'
        },
        width: {
            valType: 'number',
            role: 'style',
            min: 0,
            dflt: 2,
            editType: 'style',
            description: 'Sets the width (in px) of line bounding the box(es).'
        },
        editType: 'plot'
    },

    fillcolor: scatterAttrs.fillcolor,

    whiskerwidth: {
        valType: 'number',
        min: 0,
        max: 1,
        dflt: 0.5,
        role: 'style',
        editType: 'calc',
        description: [
            'Sets the width of the whiskers relative to',
            'the box\' width.',
            'For example, with 1, the whiskers are as wide as the box(es).'
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
            'this trace\'s (x,y) coordinates.',
            'To be seen, trace `hoverinfo` must contain a *text* flag.'
        ].join(' ')
    }),
    hovertext: extendFlat({}, scatterAttrs.hovertext, {
        description: 'Same as `text`.'
    }),
    hovertemplate: hovertemplateAttrs({
        description: [
            'N.B. This only has an effect when hovering on points.'
        ].join(' ')
    }),

    hoveron: {
        valType: 'flaglist',
        flags: ['boxes', 'points'],
        dflt: 'boxes+points',
        role: 'info',
        editType: 'style',
        description: [
            'Do the hover effects highlight individual boxes ',
            'or sample points or both?'
        ].join(' ')
    }
};
