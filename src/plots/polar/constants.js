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

    // TODO should radial axis be above frontplot by default?
    layerNames: [
        'draglayer',
        'plotbg',
        'backplot',
        'grids',
        'axes',
        'lines',
        'frontplot'
    ],

    MINDRAG: 8,
    MINZOOM: 20,
};
