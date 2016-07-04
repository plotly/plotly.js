/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';


module.exports = {
    styleUrlPrefix: 'mapbox://styles/mapbox/',
    styleUrlSuffix: 'v9',

    controlContainerClassName: 'mapboxgl-control-container',

    noAccessTokenErrorMsg: [
        'Missing Mapbox access token.',
        'Mapbox trace type require a Mapbox access token to be registered.',
        'For example:',
        '  Plotly.plot(gd, data, layout, { mapboxAccessToken: \'my-access-token\' });',
        'More info here: https://www.mapbox.com/help/define-access-token/'
    ].join('\n'),

    mapOnErrorMsg: 'Mapbox error.'
};
