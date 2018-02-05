/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

exports.legendGetsTrace = function legendGetsTrace(trace) {
    // traceIs(trace, 'showLegend') is not sufficient anymore, due to contour(carpet)?
    // which are legend-eligible only if type: constraint. Otherwise, showlegend gets deleted.

    // Note that we explicitly include showlegend: false, so a trace that *could* be
    // in the legend but is not shown still counts toward the two traces you need to
    // ensure the legend is shown by default, because this can still help disambiguate.
    return trace.visible && (trace.showlegend !== undefined);
};

exports.isGrouped = function isGrouped(legendLayout) {
    return (legendLayout.traceorder || '').indexOf('grouped') !== -1;
};

exports.isVertical = function isVertical(legendLayout) {
    return legendLayout.orientation !== 'h';
};

exports.isReversed = function isReversed(legendLayout) {
    return (legendLayout.traceorder || '').indexOf('reversed') !== -1;
};
