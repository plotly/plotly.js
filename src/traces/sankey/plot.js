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
        d3.select(element).style('stroke-opacity', 0.66);
        console.log('hover link', d.link);

        var hoverCenterX = d3.event.clientX;
        var hoverCenterY = d3.event.clientY;

        Fx.loneHover({
            x: hoverCenterX,
            y: hoverCenterY,
            name: d.link.value + '',
            text: [
                d.link.label,
                ['Source:', d.link.source.name].join(' '),
                ['Target:', d.link.target.name].join(' ')
            ].join('<br>'),
            color: 'blue',
            idealAlign: 'left'
        }, {
            container: fullLayout._hoverlayer.node(),
            outerContainer: fullLayout._paper.node()
        });

        Fx.hover(gd, d.link, 'sankey');

        hasHoverData = true;
    };

    var linkUnhover = function(element, d) {
        d3.select(element).style('stroke-opacity', function(d) {return d.tinyColorAlpha;});
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
            .style('stroke-width', 2)
            .style('stroke', 'black');
        console.log('hover node', d.node);

        var hoverCenterX = d3.event.clientX;
        var hoverCenterY = d3.event.clientY;

        Fx.loneHover({
            x: hoverCenterX,
            y: hoverCenterY,
            name: d.node.value + '',
            text: [
                d.node.name,
                ['Source count:', d.node.sourceLinks.length].join(' '),
                ['Target count:', d.node.targetLinks.length].join(' ')
            ].join('<br>'),
            color: 'blue',
            idealAlign: 'left'
        }, {
            container: fullLayout._hoverlayer.node(),
            outerContainer: fullLayout._paper.node()
        });


        Fx.hover(gd, d.node, 'sankey');

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
