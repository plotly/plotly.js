/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';


module.exports = function cleanData(fullData) {
    var i,
        tracei,
        filli,
        j,
        tracej;

    // remove opacity for any trace that has a fill or is filled to
    for(i = 0; i < fullData.length; i++) {
        tracei = fullData[i];
        filli = tracei.fill;
        if((filli === 'none') || (tracei.type !== 'scatter')) continue;
        tracei.opacity = undefined;

        if(filli === 'tonexty' || filli === 'tonextx') {
            for(j = i - 1; j >= 0; j--) {
                tracej = fullData[j];
                if((tracej.type === 'scatter') &&
                        (tracej.xaxis === tracei.xaxis) &&
                        (tracej.yaxis === tracei.yaxis)) {
                    tracej.opacity = undefined;
                    break;
                }
            }
        }
    }
};
