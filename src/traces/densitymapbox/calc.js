/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');

var isArrayOrTypedArray = require('../../lib').isArrayOrTypedArray;
var BADNUM = require('../../constants/numerical').BADNUM;

var colorscaleCalc = require('../../components/colorscale/calc');
var _ = require('../../lib')._;

module.exports = function calc(gd, trace) {
    var len = trace._length;
    var calcTrace = new Array(len);
    var z = trace.z;
    var hasZ = isArrayOrTypedArray(z) && z.length;

    for(var i = 0; i < len; i++) {
        var cdi = calcTrace[i] = {};

        var lon = trace.lon[i];
        var lat = trace.lat[i];

        cdi.lonlat = isNumeric(lon) && isNumeric(lat) ?
            [+lon, +lat] :
            [BADNUM, BADNUM];

        if(hasZ) {
            var zi = z[i];
            cdi.z = isNumeric(zi) ? zi : BADNUM;
        }
    }

    colorscaleCalc(gd, trace, {
        vals: hasZ ? z : [0, 1],
        containerStr: '',
        cLetter: 'z'
    });

    if(len) {
        calcTrace[0].t = {
            labels: {
                lat: _(gd, 'lat:') + ' ',
                lon: _(gd, 'lon:') + ' '
            }
        };
    }

    return calcTrace;
};
