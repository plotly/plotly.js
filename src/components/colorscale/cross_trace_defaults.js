/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var hasColorscale = require('./helpers').hasColorscale;

module.exports = function crossTraceDefaults(fullData) {
    function replace(cont, k) {
        var val = cont['_' + k];
        if(val !== undefined) {
            cont[k] = val;
        }
    }

    function relinkColorAtts(trace, cAttrs) {
        var cont = cAttrs.container ?
            Lib.nestedProperty(trace, cAttrs.container).get() :
            trace;

        if(cont) {
            var isAuto = cont.zauto || cont.cauto;
            var minAttr = cAttrs.min;
            var maxAttr = cAttrs.max;

            if(isAuto || cont[minAttr] === undefined) {
                replace(cont, minAttr);
            }
            if(isAuto || cont[maxAttr] === undefined) {
                replace(cont, maxAttr);
            }
            if(cont.autocolorscale) {
                replace(cont, 'colorscale');
            }
        }
    }

    for(var i = 0; i < fullData.length; i++) {
        var trace = fullData[i];
        var colorbar = trace._module.colorbar;

        if(colorbar) {
            if(Array.isArray(colorbar)) {
                for(var j = 0; j < colorbar.length; j++) {
                    relinkColorAtts(trace, colorbar[j]);
                }
            } else {
                relinkColorAtts(trace, colorbar);
            }
        }

        // TODO could generalize _module.colorscale and use it here?

        if(hasColorscale(trace, 'marker.line')) {
            relinkColorAtts(trace, {
                container: 'marker.line',
                min: 'cmin',
                max: 'cmax'
            });
        }

        if(hasColorscale(trace, 'line')) {
            relinkColorAtts(trace, {
                container: 'line',
                min: 'cmin',
                max: 'cmax'
            });
        }
    }
};
