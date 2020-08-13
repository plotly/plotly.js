/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = function alignPeriod(trace, axLetter, vals) {
    var periodAlignment = trace[axLetter + 'periodalignment'];
    if(!periodAlignment || periodAlignment === 'start') return vals;

    var delta = (periodAlignment === 'end' ? 1 : 0.5) * trace[axLetter + 'period'];
    for(var i = 0; i < vals.length; i++) {
        vals[i] += delta;
    }
    return vals;
};
