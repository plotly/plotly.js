/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var render = require('./render');
var Fx = require('../../plots/cartesian/graph_interact');
var d3 = require('d3');

module.exports = function plot(gd, calcData) {

    var fullLayout = gd._fullLayout;
    var svg = fullLayout._paper;
    var hasHoverData = false;

    var size = fullLayout._size;

    var linkSelect = function(d) {
        console.log('select link', d.link);
        gd._hoverdata = [d.link];
        gd._hoverdata.trace = calcData.trace;
        Fx.click(gd, { target: true });
    };

    var linkHover = function(element, d) {
        d3.select(element)
            .style('stroke-opacity', 0.5)
            //.style('stroke', 'magenta');
        console.log('hover link', d.link);

        Fx.loneHover({}, {
            container: fullLayout._hoverlayer.node(),
            outerContainer: fullLayout._paper.node()
        });

        Fx.hover(gd, d.link, 'pie');

        hasHoverData = true;
    };

    var linkUnhover = function(element, d) {
        d3.select(element)
            .style('stroke-opacity', 0.25)
            //.style('stroke', 'black');
        console.log('unhover link', d.link);
        gd.emit('plotly_unhover', {
            points: [d.link]
        });

        if(hasHoverData) {
            Fx.loneUnhover(fullLayout._hoverlayer.node());
            hasHoverData = false;
        }
    };

    var nodeSelect = function(element, d) {
        console.log('select node', d.node);
        gd._hoverdata = [d.node];
        gd._hoverdata.trace = calcData.trace;
        Fx.click(gd, { target: true });
    };

    var nodeHover = function(element, d) {
        d3.select(element)
            //.style('stroke-opacity', 1)
            .style('stroke-width', 4)
            .style('stroke', 'magenta');
        console.log('hover node', d.node);

        Fx.loneHover({}, {
            container: fullLayout._hoverlayer.node(),
            outerContainer: fullLayout._paper.node()
        });

        Fx.hover(gd, d.node, 'pie');

        hasHoverData = true;
    };

    var nodeUnhover = function(element, d) {
        d3.select(element)
            //.style('stroke-opacity', 0.25)
            .style('stroke-width', 1)
            .style('stroke', 'black');
        console.log('unhover node', d.node);
        gd.emit('plotly_unhover', {
            points: [d.node]
        });

        if(hasHoverData) {
            Fx.loneUnhover(fullLayout._hoverlayer.node());
            hasHoverData = false;
        }
    };


    render(
        svg,
        calcData,
        {
            width: size.w,
            height: size.h,
            margin: {
                t: size.t,
                r: size.r,
                b: size.b,
                l: size.l
            }
        },
        {
            linkEvents: {
                hover: linkHover,
                unhover: linkUnhover,
                select: linkSelect
            },
            nodeEvents: {
                hover: nodeHover,
                unhover: nodeUnhover,
                select: nodeSelect
            }
        }
);
};
