/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';


module.exports = {
    maxDimensionCount: 60, // this cannot be increased without WebGL code refactoring
    overdrag: 45,
    verticalPadding: 2, // otherwise, horizontal lines on top or bottom are of lower width
    tickDistance: 50,
    canvasPixelRatio: 1,
    blockLineCount: 5000,
    scatter: false,
    layers: ['contextLineLayer', 'focusLineLayer', 'pickLineLayer'],
    axisTitleOffset: 28,
    axisExtentOffset: 10,
    bar: {
        width: 4, // Visible width of the filter bar
        capturewidth: 10, // Mouse-sensitive width for interaction (Fitts law)
        fillcolor: 'magenta', // Color of the filter bar fill
        fillopacity: 1, // Filter bar fill opacity
        strokecolor: 'white', // Color of the filter bar side lines
        strokeopacity: 1, // Filter bar side stroke opacity
        strokewidth: 1, // Filter bar side stroke width in pixels
        handleheight: 16, // Height of the filter bar vertical resize areas on top and bottom
        handleopacity: 1, // Opacity of the filter bar vertical resize areas on top and bottom
        handleoverlap: 0 // A larger than 0 value causes overlaps with the filter bar, represented as pixels.'
    }
};
