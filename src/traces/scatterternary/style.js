/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var scatterStyle = require('../scatter/style');


module.exports = function style(graphDiv) {
    for(var i = 0; i < graphDiv._modules.length; i++) {
        // we're just going to call scatter style... if we already
        // called it, don't need to redo.
        // Later though we may want differences, or we may make style
        // more specific in its scope, then we can remove this.
        if(graphDiv._modules[i].name === 'scatter') return;
    }
    scatterStyle(graphDiv);
};
