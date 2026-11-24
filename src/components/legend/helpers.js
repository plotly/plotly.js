'use strict';

exports.isGrouped = function isGrouped(legendLayout) {
    return (legendLayout.traceorder || '').indexOf('grouped') !== -1;
};

exports.isVertical = function isVertical(legendLayout) {
    return legendLayout.orientation !== 'h';
};

exports.isReversed = function isReversed(legendLayout) {
    return (legendLayout.traceorder || '').indexOf('reversed') !== -1;
};

exports.getId = function getId(legendObj) {
    return legendObj._id || 'legend';
};
