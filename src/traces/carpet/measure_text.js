/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Drawing = require('../../components/drawing');

module.exports = function measureText(tester, text, font) {
    var dummyText = tester.append('text')
        .text(text)
        .call(Drawing.font, font);

    return Drawing.bBox(dummyText.node());
};
