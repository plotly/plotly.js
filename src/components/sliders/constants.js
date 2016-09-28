/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';


module.exports = {

    // layout attribute names
    name: 'sliders',
    itemName: 'slider',

    // class names
    containerClassName: 'slider-container',
    groupClassName: 'slider-group',
    inputAreaClass: 'slider-input-area',
    railRectClass: 'slider-rail-rect',
    railTouchRectClass: 'slider-rail-touch-rect',
    gripRectClass: 'slider-grip-rect',
    tickRectClass: 'slider-tick-rect',
    inputProxyClass: 'slider-input-proxy',
    labelsClass: 'slider-labels',
    labelGroupClass: 'slider-label-group',
    labelClass: 'slider-label',

    railHeight: 5,

    // DOM attribute name in button group keeping track
    // of active update menu
    menuIndexAttrName: 'slider-active-index',

    // id root pass to Plots.autoMargin
    autoMarginIdRoot: 'slider-',

    // min item width / height
    minWidth: 30,
    minHeight: 30,

    // padding around item text
    textPadX: 40,

    // font size to height scale
    fontSizeToHeight: 1.3,

    // item rect radii
    rx: 2,
    ry: 2,

    // item  text x offset off left edge
    textOffsetX: 12,

    // item  text y offset (w.r.t. middle)
    textOffsetY: 3,

    // arrow offset off right edge
    arrowOffsetX: 4,

    railRadius: 2,
    railWidth: 5,
    railBorder: 4,
    railBorderColor: '#bec8d9',
    railBgColor: '#ebedf0',

    gripRadius: 10,
    gripWidth: 20,
    gripHeight: 20,
    gripBorder: 20,
    gripBorderWidth: 1,
    gripBorderColor: '#bec8d9',
    gripBgColor: '#ebedf0',
    gripBgActiveColor: '#dbdde0',

    // Padding in the direction perpendicular to the length of the rail:
    // (which, at the moment is always vertical, but for the sake of the future...)
    widthPadding: 10,

    labelPadding: 4,
    tickWidth: 1,
    tickColor: '#333',
    tickOffset: 25,
    tickLength: 7,
    minorTickColor: '#333',
    minorTickLength: 4,
};
