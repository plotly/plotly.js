/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';


module.exports = {
    subplot: {
        valType: 'subplotid',
        role: 'info',
        dflt: 'ternary',
        description: [
            'Sets a reference between this trace\'s data coordinates and',
            'a ternary subplot.',
            'If *ternary* (the default value), the data refer to `layout.ternary`.',
            'If *ternary2*, the data refer to `layout.ternary2`, and so on.'
        ].join(' ')
    }
};
