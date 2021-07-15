'use strict';

exports.isGrouped = function isGrouped(legendLayout) {
    return (legendLayout.traceorder || '').indexOf('grouped') !== -1;
};

exports.isVertical = function isVertical(legendLayout) {
    return legendLayout.orientation !== 'h';
};

exports.hSpacing = function hSpacing(legendLayout) {
    return legendLayout.grouporientation === 'h' ? 20 : 0;
};

exports.isReversed = function isReversed(legendLayout) {
    return (legendLayout.traceorder || '').indexOf('reversed') !== -1;
};
