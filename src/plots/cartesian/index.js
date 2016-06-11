/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plots = require('../plots');

var d3 = require('d3');

var constants = require('./constants');

exports.name = 'cartesian';

exports.attr = ['xaxis', 'yaxis'];

exports.idRoot = ['x', 'y'];

exports.idRegex = constants.idRegex;

exports.attrRegex = constants.attrRegex;

exports.attributes = require('./attributes');

exports.plot = function(gd, transitionOpts) {
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

    function keyFunc (d) {
        return d[0].trace.uid;
    }

    for(var i = 0; i < subplots.length; i++) {
        var subplot = subplots[i],
            subplotInfo = fullLayout._plots[subplot],
            cdSubplot = getCdSubplot(calcdata, subplot);

        for(var j = 0; j < modules.length; j++) {
            var _module = modules[j];

            if(_module.setPositions) _module.setPositions(gd, subplotInfo);

            // skip over non-cartesian trace modules
            if(_module.basePlotModule.name !== 'cartesian') continue;

            // plot all traces of this type on this subplot at once
            var cdModule = getCdModule(cdSubplot, _module);

            var tracelayer = subplotInfo.plot.select('g.' + _module.name + 'layer');
            var subplotJoin = tracelayer.selectAll('g.trace').data(cdModule, keyFunc);

            subplotJoin.enter()
                .append('g')
                    .classed('trace', true)
                    .classed(_module.name, true)
                    .each(function(d) {
                        d[0].trace._module.plot(gd, subplotInfo, d, this)
                    });

            subplotJoin.transition()
                .each(function(d) {
                    d[0].trace._module.plot(gd, subplotInfo, d, this, transitionOpts)
                });


            subplotJoin.exit()
                .remove()
        }
    }
};
