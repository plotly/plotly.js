'use strict';

module.exports = {
    axisRefDescription: function(axisname, lower, upper) {
        return [
            'If set to a', axisname, 'axis id (e.g. *' + axisname + '* or',
            '*' + axisname + '2*), the `' + axisname + '` position refers to a',
            axisname, 'coordinate. If set to *paper*, the `' + axisname + '`',
            'position refers to the distance from the', lower, 'of the plotting',
            'area in normalized coordinates where *0* (*1*) corresponds to the',
            lower, '(' + upper + '). If set to a', axisname, 'axis ID followed by',
            '*domain* (separated by a space), the position behaves like for',
            '*paper*, but refers to the distance in fractions of the domain',
            'length from the', lower, 'of the domain of that axis: e.g.,',
            '*' + axisname + '2 domain* refers to the domain of the second',
            axisname, ' axis and a', axisname, 'position of 0.5 refers to the',
            'point between the', lower, 'and the', upper, 'of the domain of the',
            'second', axisname, 'axis.',
        ].join(' ');
    }
};
