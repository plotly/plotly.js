/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = {
    duration: {
        valType: 'number',
        role: 'info',
        dflt: 500,
        description: [
            'The duration of the transition, in milliseconds. If equal to zero,',
            'updates are synchronous.'
        ].join(' ')
    },
    ease: {
        valType: 'enumerated',
        dflt: 'cubic-in-out',
        values: [
            'linear',
            'quad',
            'cubic',
            'sin',
            'exp',
            'circle',
            'elastic',
            'back',
            'bounce',
            'linear-in',
            'quad-in',
            'cubic-in',
            'sin-in',
            'exp-in',
            'circle-in',
            'elastic-in',
            'back-in',
            'bounce-in',
            'linear-out',
            'quad-out',
            'cubic-out',
            'sin-out',
            'exp-out',
            'circle-out',
            'elastic-out',
            'back-out',
            'bounce-out',
            'linear-in-out',
            'quad-in-out',
            'cubic-in-out',
            'sin-in-out',
            'exp-in-out',
            'circle-in-out',
            'elastic-in-out',
            'back-in-out',
            'bounce-in-out'
        ],
        role: 'info',
        description: 'The easing function used for the transition'
    },
    delay: {
        valType: 'number',
        role: 'info',
        dflt: 0,
        description: [
            'The duration of the transition, in milliseconds. If equal to zero,',
            'updates are synchronous.'
        ].join(' ')
    },
    redraw: {
        valType: 'boolean',
        role: 'info',
        dflt: true,
        description: [
            'Redraw the plot at completion of the transition. This is desirable',
            'for transitions that include properties that cannot be transitioned,',
            'but may significantly slow down updates that do not require a full',
            'redraw of the plot'
        ].join(' ')
    },
};
