/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');

module.exports = function clean2dArray(zOld, transpose) {
    var rowlen, collen, getCollen, old2new, i, j;

    function cleanZvalue(v) {
        if(!isNumeric(v)) return undefined;
        return +v;
    }

    if(transpose) {
        rowlen = 0;
        for(i = 0; i < zOld.length; i++) rowlen = Math.max(rowlen, zOld[i].length);
        if(rowlen === 0) return false;
        getCollen = function(zOld) { return zOld.length; };
        old2new = function(zOld, i, j) { return zOld[j][i]; };
    }
    else {
        rowlen = zOld.length;
        getCollen = function(zOld, i) { return zOld[i].length; };
        old2new = function(zOld, i, j) { return zOld[i][j]; };
    }

    var zNew = new Array(rowlen);

    for(i = 0; i < rowlen; i++) {
        collen = getCollen(zOld, i);
        zNew[i] = new Array(collen);
        for(j = 0; j < collen; j++) zNew[i][j] = cleanZvalue(old2new(zOld, i, j));
    }

    return zNew;
};
