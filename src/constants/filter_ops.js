'use strict';

module.exports = {
    COMPARISON_OPS: ['=', '!=', '<', '>=', '>', '<='],
    COMPARISON_OPS2: ['=', '<', '>=', '>', '<='],
    INTERVAL_OPS: ['[]', '()', '[)', '(]', '][', ')(', '](', ')['],
    SET_OPS: ['{}', '}{'],
    CONSTRAINT_REDUCTION: {
        // for contour constraints, open/closed endpoints are equivalent
        '=': '=',

        '<': '<',
        '<=': '<',

        '>': '>',
        '>=': '>',

        '[]': '[]',
        '()': '[]',
        '[)': '[]',
        '(]': '[]',

        '][': '][',
        ')(': '][',
        '](': '][',
        ')[': ']['
    }
};
