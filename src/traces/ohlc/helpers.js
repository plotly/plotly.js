/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';


exports.getFilterFn = function getFilterFn(direction) {
    switch(direction) {
        case 'increasing':
            return function(o, c) { return o <= c; };

        case 'decreasing':
            return function(o, c) { return o > c; };
    }
};

exports.addRangeSlider = function addRangeSlider(layout) {
    if(!layout.xaxis) layout.xaxis = {};
    if(!layout.xaxis.rangeslider) layout.xaxis.rangeslider = {};
};
