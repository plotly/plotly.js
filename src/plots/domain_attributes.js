/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var extendFlat = require('../lib/extend').extendFlat;

/**
 * Make a xy domain attribute group
 *
 * @param {object} opts
 *   @param {string}
 *     opts.name: name to be inserted in the default description
 *   @param {boolean}
 *     opts.trace: set to true for trace containers
 *   @param {string}
 *     opts.editType: editType for all pieces
 *
 * @param {object} extra
 *   @param {string}
 *     extra.description: extra description. N.B we use
 *     a separate extra container to make it compatible with
 *     the compress_attributes transform.
 *
 * @return {object} attributes object containing {x,y} as specified
 */
module.exports = function(opts, extra) {
    opts = opts || {};
    extra = extra || {};

    var base = {
        valType: 'info_array',
        role: 'info',
        editType: opts.editType,
        items: [
            {valType: 'number', min: 0, max: 1},
            {valType: 'number', min: 0, max: 1}
        ],
        dflt: [0, 1]
    };

    var namePart = opts.name || '';
    var contPart = opts.trace ? 'trace' : 'subplot';

    return {
        x: extendFlat({}, base, {
            description: [
                'Sets the horizontal domain of this',
                namePart,
                contPart,
                '(in plot fraction).',
                extra.description
            ].join(' ')
        }),
        y: extendFlat({}, base, {
            description: [
                'Sets the vertical domain of this',
                namePart,
                contPart,
                '(in plot fraction).',
                extra.description
            ].join(' ')
        }),
        editType: opts.editType
    };
};
