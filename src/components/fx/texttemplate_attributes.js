/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var FORMAT_LINK = require('../../constants/docs').FORMAT_LINK;

module.exports = function(opts, extra) {
    opts = opts || {};
    extra = extra || {};

    var descPart = extra.description ? ' ' + extra.description : '';
    var keys = extra.keys || [];
    if(keys.length > 0) {
        var quotedKeys = [];
        for(var i = 0; i < keys.length; i++) {
            quotedKeys[i] = '`' + keys[i] + '`';
        }
        descPart = descPart + 'Finally, the template string has access to ';
        if(keys.length === 1) {
            descPart = 'variable ' + quotedKeys[0];
        } else {
            descPart = 'variables ' + quotedKeys.slice(0, -1).join(', ') + ' and ' + quotedKeys.slice(-1) + '.';
        }
    }

    var texttemplate = {
        valType: 'string',
        role: 'info',
        dflt: '',
        editType: opts.editType || 'calc',
        description: [
            'Template string used for rendering the information that appear on points.',
            'Note that this will override `textinfo`.',
            'Variables are inserted using %{variable}, for example "y: %{y}".',
            'Numbers are formatted using d3-format\'s syntax %{variable:d3-format}, for example "Price: %{y:$.2f}".',
            FORMAT_LINK,
            'for details on the formatting syntax.',
            'Every attributes that can be specified per-point (the ones that are `arrayOk: true`) are available.',
            descPart
        ].join(' ')
    };

    if(opts.arrayOk !== false) {
        texttemplate.arrayOk = true;
    }
    return texttemplate;
};
