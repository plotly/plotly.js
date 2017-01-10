/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';


module.exports = {
    family: {
        valType: 'string',
        role: 'style',
        noBlank: true,
        strict: true,
        description: [
            'HTML font family - the typeface that will be applied by the web browser.',
            'The web browser will only be able to apply a font if it is available on the system',
            'which it operates. Provide multiple font families, separated by commas, to indicate',
            'the preference in which to apply fonts if they aren\'t available on the system.',
            'The plotly service (at https://plot.ly or on-premise) generates images on a server,',
            'where only a select number of',
            'fonts are installed and supported.',
            'These include *Arial*, *Balto*, *Courier New*, *Droid Sans*,, *Droid Serif*,',
            '*Droid Sans Mono*, *Gravitas One*, *Old Standard TT*, *Open Sans*, *Overpass*,',
            '*PT Sans Narrow*, *Raleway*, *Times New Roman*.'
        ].join(' ')
    },
    size: {
        valType: 'number',
        role: 'style',
        min: 1
    },
    color: {
        valType: 'color',
        role: 'style'
    }
};
