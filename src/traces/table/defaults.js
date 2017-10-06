/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var attributes = require('./attributes');

function defaultColumnOrder(traceIn, coerce) {
    var specifiedColumnOrder = traceIn.columnorder || [];
    var commonLength = traceIn.header.values.length;
    var truncated = specifiedColumnOrder.slice(0, commonLength);
    var sorted = truncated.slice().sort(function(a, b) {return a - b;});
    var oneStepped = truncated.map(function(d) {return sorted.indexOf(d);});
    for(var i = oneStepped.length; i < commonLength; i++) {
        oneStepped.push(i);
    }
    coerce('columnorder', oneStepped);
}

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var fontDflt = {
        family: layout.font.family,
        size: layout.font.size,
        color: layout.font.color
    };

    coerce('domain.x');
    coerce('domain.y');

    coerce('columnwidth');
    defaultColumnOrder(traceIn, coerce);

    coerce('cells.values');
    coerce('cells.format');
    coerce('cells.align');
    coerce('cells.prefix');
    coerce('cells.suffix');
    coerce('cells.height');
    coerce('cells.line.width');
    coerce('cells.line.color');
    coerce('cells.fill.color');
    Lib.coerceFont(coerce, 'cells.font', fontDflt);

    coerce('header.values');
    coerce('header.format');
    coerce('header.align');

    coerce('header.prefix');
    coerce('header.suffix');
    coerce('header.height');
    coerce('header.line.width');
    coerce('header.line.color');
    coerce('header.fill.color');
    Lib.coerceFont(coerce, 'header.font', fontDflt);
};
