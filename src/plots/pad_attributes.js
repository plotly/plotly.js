/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

// This is used exclusively by components inside component arrays,
// hence the 'arraydraw' editType. If this ever gets used elsewhere
// we could generalize it as a function ala font_attributes
module.exports = {
    t: {
        valType: 'number',
        dflt: 0,
        role: 'style',
        editType: 'arraydraw',
        description: 'The amount of padding (in px) along the top of the component.'
    },
    r: {
        valType: 'number',
        dflt: 0,
        role: 'style',
        editType: 'arraydraw',
        description: 'The amount of padding (in px) on the right side of the component.'
    },
    b: {
        valType: 'number',
        dflt: 0,
        role: 'style',
        editType: 'arraydraw',
        description: 'The amount of padding (in px) along the bottom of the component.'
    },
    l: {
        valType: 'number',
        dflt: 0,
        role: 'style',
        editType: 'arraydraw',
        description: 'The amount of padding (in px) on the left side of the component.'
    },
    editType: 'arraydraw'
};
