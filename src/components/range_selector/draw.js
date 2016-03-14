/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var Plotly = require('../../plotly');
var axisIds = require('../../plots/cartesian/axis_ids');

var width1 = 50;
var height1 = 40;


module.exports = function draw(gd) {
    var fullLayout = gd._fullLayout;

    var selectors = fullLayout._infolayer.selectAll('.rangeselector')
        .data(makeSelectorData(gd), function(d) { return d._id; });

    selectors.enter().append('g')
        .classed('rangeselector', true);

    selectors.exit().remove();

    selectors.style({
        'pointer-events': 'all',
        'cursor': 'pointer'
    });

//     selector.attr({ 'translate': });

    selectors.each(function(d) {
        var selector = d3.select(this),
            axisLayout = d,
            selectorLayout = axisLayout.rangeselector;

        var buttons = selector.selectAll('g.button')
            .data(selectorLayout.buttons);

        buttons.enter().append('g')
            .classed('button', true);

        buttons.exit().remove();

        buttons.each(function(d, i) {
            var button = d3.select(this);

            button.append('rect')
                .attr({
                    x: width1 * (0.5 + i),
                    width: width1,
                    height: height1
                })
                .style({
                    fill: 'none',
                    stroke: '#000',
                    'stroke-width': 2
                });

            button.append('text')
                .attr({
                    x: width1 * (1 + i),
                    y: height1 / 2,
                    'text-anchor': 'middle'
                })
                .text(d.label || d.count + ' ' + d.step.charAt(0));

            button.on('click', function() {
                var update;

                if(d.step === 'all') {
                    update = {
                        'xaxis.autorange': true,
                        'xaxis.range': null
                    };
                }
                else {
                    var xrange = getXRange(axisLayout, d);

                    update = {
                        'xaxis.range[0]': xrange[0],
                        'xaxis.range[1]': xrange[1]
                    };
                }

                Plotly.relayout(gd, update);
            });


        });

    });

};

function makeSelectorData(gd) {
    var axes = axisIds.list(gd, 'x', true);
    var data = [];

    for(var i = 0; i < axes.length; i++) {
        var axis = axes[i];

        if(axis.rangeselector && axis.rangeselector.visible) {
            data.push(axis);
        }
    }

    return data;
}

function getXRange(axisLayout, opts) {
    var currentRange = axisLayout.range;
    var base = new Date(currentRange[1]);

    var range0, range1;

    switch(opts.stepmode) {
        case 'backward':
            range1 = currentRange[1];
            range0 = d3.time[opts.step].offset(base, -opts.count).getTime();
            break;

        case 'to day':
            range1 = currentRange[1];
            range0 = d3.time[opts.step].floor(base).getTime();
            break;
    }

    return [range0, range1];
}
