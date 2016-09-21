/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = {

    // attribute container name
    name: 'rangeslider',

    // class names

    containerClassName: 'rangeslider-container',
    bgClassName: 'rangeslider-bg',
    rangePlotClassName: 'rangeslider-rangeplot',

    maskMinClassName: 'rangeslider-mask-min',
    maskMaxClassName: 'rangeslider-mask-max',
    slideBoxClassName: 'rangeslider-slidebox',

    grabberMinClassName: 'rangeslider-grabber-min',
    grabAreaMinClassName: 'rangeslider-grabarea-min',
    handleMinClassName: 'rangeslider-handle-min',

    grabberMaxClassName: 'rangeslider-grabber-max',
    grabAreaMaxClassName: 'rangeslider-grabarea-max',
    handleMaxClassName: 'rangeslider-handle-max',

    // style constants

    maskColor: 'rgba(0,0,0,0.4)',

    slideBoxFill: 'transparent',
    slideBoxCursor: 'ew-resize',

    grabAreaFill: 'transparent',
    grabAreaCursor: 'col-resize',
    grabAreaWidth: 10,
    grabAreaMinOffset: -6,
    grabAreaMaxOffset: -2,

    handleWidth: 2,
    handleRadius: 1,
    handleFill: '#fff',
    handleStroke: '#666',
};
