/**
* Copyright 2012-2021, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = {
    imageAttrs: {
        source: {
            dflt: '',
            valType: 'string',
            role: 'info',
            editType: 'none',
            arrayOk: true,
            description: 'A URL to specify the image shown on hover.'
        },
        width: {
            dflt: 0,
            valType: 'integer',
            role: 'info',
            editType: 'none',
            arrayOk: true,
            description: ['Hover image width. Optional if image dimensions can be determined',
                'synchronously from image data URL, otherwise must be specified up-front',
                'for asynchronously loaded images'
            ].join(' ')
        },
        height: {
            dflt: 0,
            valType: 'integer',
            role: 'info',
            editType: 'none',
            arrayOk: true,
            description: ['Hover image height. Optional if image dimensions can be determined',
                'synchronously from image data URL, otherwise must be specified up-front',
                'for asynchronously loaded images'
            ].join(' ')
        },
        editType: 'none'
    }
};
