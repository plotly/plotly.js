/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var Plots = require('../plots');

var constants = require('./constants');

exports.name = 'cartesian';

exports.attr = ['xaxis', 'yaxis'];

exports.idRoot = ['x', 'y'];

exports.idRegex = constants.idRegex;

exports.attrRegex = constants.attrRegex;

exports.attributes = require('./attributes');

exports.plot = function(gd) {
    var fullLayout = gd._fullLayout,
        subplots = Plots.getSubplotIds(fullLayout, 'cartesian'),
        calcdata = gd.calcdata,
        modules = fullLayout._modules;

    function getCdSubplot(calcdata, subplot) {
        var cdSubplot = [];

        for(var i = 0; i < calcdata.length; i++) {
            var cd = calcdata[i];
            var trace = cd[0].trace;

            if(trace.xaxis + trace.yaxis === subplot) {
                cdSubplot.push(cd);
            }
        }

        return cdSubplot;
    }

    function getCdModule(cdSubplot, _module) {
        var cdModule = [];

        for(var i = 0; i < cdSubplot.length; i++) {
            var cd = cdSubplot[i];
            var trace = cd[0].trace;

            if((trace._module === _module) && (trace.visible === true)) {
                cdModule.push(cd);
            }
        }

        return cdModule;
    }

    for(var i = 0; i < subplots.length; i++) {
        var subplot = subplots[i],
            subplotInfo = fullLayout._plots[subplot],
            cdSubplot = getCdSubplot(calcdata, subplot);

        // remove old traces, then redraw everything
        // TODO: use enter/exit appropriately in the plot functions
        // so we don't need this - should sometimes be a big speedup
        if(subplotInfo.plot) subplotInfo.plot.selectAll('g.trace').remove();

        for(var j = 0; j < modules.length; j++) {
            var _module = modules[j];

            // skip over non-cartesian trace modules
            if(_module.basePlotModule.name !== 'cartesian') continue;

            // plot all traces of this type on this subplot at once
            var cdModule = getCdModule(cdSubplot, _module);
            _module.plot(gd, subplotInfo, cdModule);

            Lib.markTime('done ' + (cdModule[0] && cdModule[0][0].trace.type));
        }
    }
};
