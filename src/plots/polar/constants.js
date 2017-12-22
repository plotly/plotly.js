/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = {
    attr: 'subplot',
    name: 'polar',

    axisNames: ['angularaxis', 'radialaxis'],
    axisName2dataArray: {angularaxis: 'theta', radialaxis: 'r'},

    layerNames: [
        'draglayer',
        'plotbg',
        'backplot',
        'angular-grid',
        'radial-grid',
        'frontplot',
        'angular-axis',
        'radial-axis',
        'angular-line',
        'radial-line'
    ],

    radialDragBoxSize: 50,
    cornerLen: 25,
    cornerHalfWidth: 2,

    MINDRAG: 8,
    MINZOOM: 20
};
