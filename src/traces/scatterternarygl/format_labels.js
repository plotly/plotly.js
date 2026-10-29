'use strict';

const scatterTernaryFormatLabels = require('../scatterternary/format_labels');

module.exports = function (cdi, trace, fullLayout) {
    const i = cdi.i;

    if (!('a' in cdi)) cdi.a = trace._a[i];
    if (!('b' in cdi)) cdi.b = trace._b[i];
    if (!('c' in cdi)) cdi.c = trace._c[i];

    return scatterTernaryFormatLabels(cdi, trace, fullLayout);
};
