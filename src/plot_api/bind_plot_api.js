/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';


module.exports = function bindPlotAPI(gd, Plotly) {
    var i;

    if(gd._plotAPI) return;

    gd._plotAPI = {};
    var methods = [
        'plot', 'newPlot', 'restyle', 'relayout', 'redraw',
        'update', 'extendTraces', 'prependTraces', 'addTraces',
        'deleteTraces', 'moveTraces', 'purge', 'addFrames',
        'deleteFrames', 'animate'
    ];

    function bindMethod(method) {
        return function() {
            var i;
            var args = [gd];
            for(i = 0; i < arguments.length; i++) {
                args[i + 1] = arguments[i];
            }
            return method.apply(null, args);
        };
    }

    for(i = 0; i < methods.length; i++) {
        gd._plotAPI[methods[i]] = bindMethod(Plotly[methods[i]]);
    }

    // This is needed for snapshot/toimage, which needs to plot to a *different* gd.
    // In other words, it's just regular Plotly plot:
    gd._plotAPI.plotWithGd = Plotly.plot;
};
