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
var ErrorBars = require('../../components/errorbars');


exports.name = 'cartesian';

exports.attr = ['xaxis', 'yaxis'];

exports.idRoot = ['x', 'y'];

exports.attributes = require('./attributes');

exports.idRegex = {
    x: /^x([2-9]|[1-9][0-9]+)?$/,
    y: /^y([2-9]|[1-9][0-9]+)?$/
};

exports.attrRegex = {
    x: /^xaxis([2-9]|[1-9][0-9]+)?$/,
    y: /^yaxis([2-9]|[1-9][0-9]+)?$/
};

exports.plot = function(gd) {
    var fullLayout = gd._fullLayout,
        subplots = Plots.getSubplotIds(fullLayout, 'cartesian'),
        calcdata = gd.calcdata,
        modules = gd._modules;

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
            cdSubplot = getCdSubplot(calcdata, subplot),
            cdError = [];

        // remove old traces, then redraw everything
        // TODO: use enter/exit appropriately in the plot functions
        // so we don't need this - should sometimes be a big speedup
        if(subplotInfo.plot) subplotInfo.plot.selectAll('g.trace').remove();

        for(var j = 0; j < modules.length; j++) {
            var _module = modules[j];

            // skip over non-cartesian trace modules
            if(_module.basePlotModule.name !== 'cartesian') continue;

            // skip over pies, there are drawn below
            if(_module.name === 'pie') continue;

            // plot all traces of this type on this subplot at once
            var cdModule = getCdModule(cdSubplot, _module);
            _module.plot(gd, subplotInfo, cdModule);
            Lib.markTime('done ' + (cdModule[0] && cdModule[0][0].trace.type));

            // collect the traces that may have error bars
            if(cdModule[0] && cdModule[0][0].trace && Plots.traceIs(cdModule[0][0].trace, 'errorBarsOK')) {
                cdError = cdError.concat(cdModule);
            }
        }

        // finally do all error bars at once
        ErrorBars.plot(gd, subplotInfo, cdError);
        Lib.markTime('done ErrorBars');
    }

    // now draw stuff not on subplots (ie, only pies at the moment)
    if(fullLayout._hasPie) {
        var Pie = Plots.getModule('pie');
        var cdPie = getCdModule(calcdata, Pie);

        if(cdPie.length) Pie.plot(gd, cdPie);
    }
};

exports.clean = function(newFullData, newFullLayout, oldFullData, oldFullLayout) {
    if(oldFullLayout._hasPie && !newFullLayout._hasPie) {
        oldFullLayout._pielayer.selectAll('g.trace').remove();
    }
};
