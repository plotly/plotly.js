/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';


module.exports = {
    geo: {
        valType: 'subplotid',
        role: 'info',
        dflt: 'geo',
        description: [
            'Sets a reference between this trace\'s geospatial coordinates and',
            'a geographic map.',
            'If *geo* (the default value), the geospatial coordinates refer to',
            '`layout.geo`.',
            'If *geo2*, the geospatial coordinates refer to `layout.geo2`,',
            'and so on.'
        ].join(' ')
    }
};
