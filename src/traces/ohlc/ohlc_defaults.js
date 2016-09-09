/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

module.exports = function handleOHLC(traceIn, traceOut, coerce) {
    var len;

    var t = coerce('t'),
        open = coerce('open'),
        high = coerce('high'),
        low = coerce('low'),
        close = coerce('close');

    len = Math.min(open.length, high.length, low.length, close.length);

    if(t) {
        len = Math.min(len, t.length);
        t.slice(0, len);
    }

    open = open.slice(0, len);
    high = high.slice(0, len);
    low = low.slice(0, len);
    close = close.slice(0, len);

    return len;
};
