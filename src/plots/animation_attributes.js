/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = {
    immediate: {
        valType: 'boolean',
        role: 'info',
        dflt: false,
        description: [
            'If true, exisitng queued animation frames are discarded before beginning',
            'the next animation sequence. Promises for exising `Plotly.animate` calls',
            'are rejected and a `plotly_animateinterrupt` event is emitted.'
        ].join(' ')
    },
};
