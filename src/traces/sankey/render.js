/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var c = require('./constants');
var d3 = require('d3');
var tinycolor = require('tinycolor2');
var Color = require('../../components/color');
var d3sankey = require('./sankey');
var d3Force = require('d3-force');


function keyFun(d) {return d.key;}

function repeat(d) {return [d];}

function visible(dimension) {return !('visible' in dimension) || dimension.visible;}

function unwrap(d) {
    return d[0]; // plotly data structure convention
}

function viewModel(layout, d, i) {
    var trace = unwrap(d).trace,
        domain = trace.domain,
        nodes = trace.nodes,
        links = trace.links;

    var width = layout.width * (domain.x[1] - domain.x[0]);
    var height = layout.height * (domain.y[1] - domain.y[0]);

    var sankey = d3sankey()
        .size(c.vertical ? [height, width]: [width, height])
        .nodeWidth(c.nodeWidth)
        .nodePadding(c.nodePadding)
        .nodes(nodes)
        .links(links);
    sankey
        .layout(c.sankeyIterations);
    for(var i = 0; i < nodes.length; i++) {
        nodes[i].y = nodes[i].y + nodes[i].dy / 2;
    }

    return {
        key: i,
        translateX: domain.x[0] * width + layout.margin.l,
        translateY: layout.height - domain.y[1] * layout.height + layout.margin.t,
        dragParallel: c.vertical ? width : height,
        dragPerpendicular: c.vertical ? height : width,
        nodes: nodes,
        links: links,
        sankey: sankey
    };
}

module.exports = function(svg, styledData, layout, callbacks) {

    var dragInProgress = false;
    var hovered = false;

    function attachPointerEvents(selection, eventSet) {
        selection
            .on('mouseover', function (d) {
                if (!dragInProgress) {
                    eventSet.hover(this, d);
                    hovered = [this, d];
                }
            })
            .on('mouseout', function (d) {
                if (!dragInProgress) {
                    eventSet.unhover(this, d);
                    hovered = false;
                }
            })
            .on('click', function (d) {
                if (hovered) {
                    eventSet.unhover(this, d);
                    hovered = false;
                }
                if (!dragInProgress) {
                    eventSet.select(this, d);
                }
            });
    }

    function linkPath(d) {


        var nodes = d.sankey.nodes();
        for(var i = 0; i < nodes.length; i++) {
            nodes[i].y = nodes[i].y - nodes[i].dy / 2;
        }
        var result = d.sankey.link()(d.link);
        for(var i = 0; i < nodes.length; i++) {
            nodes[i].y = nodes[i].y + nodes[i].dy / 2;
        }


        return result;
    }

    var sankey = svg.selectAll('.sankey')
        .data(
            styledData
                .filter(function(d) {return unwrap(d).trace.visible;})
                .map(viewModel.bind(0, layout)),
            keyFun
        );

    sankey.exit().remove();

    sankey.enter()
        .append('g')
        .classed('sankey', true)
        .attr('overflow', 'visible')
        .style('box-sizing', 'content-box')
        .style('position', 'absolute')
        .style('left', 0)
        .style('overflow', 'visible')
        .style('shape-rendering', 'geometricPrecision')
        .style('pointer-events', 'auto')
        .style('box-sizing', 'content-box');

    sankey
        .attr('transform', function(d) {
            return 'translate(' + d.translateX + ',' + d.translateY + ')';
        });

    var sankeyLinks = sankey.selectAll('.sankeyLinks')
        .data(repeat, keyFun);

    sankeyLinks.enter()
        .append('g')
        .classed('sankeyLinks', true)
        .style('transform', c.vertical ? 'matrix(0,1,1,0,0,0)' : 'matrix(1,0,0,1,0,0)')
        .style('fill', 'none');

    var sankeyLink = sankeyLinks.selectAll('.sankeyPath')
        .data(function(d) {
            var nodes = d.sankey.nodes();
            /*for(var i = 0; i < nodes.length; i++) {
                nodes[i].y = nodes[i].y + nodes[i].dy / 2;
            }
            */var result = d.sankey.links().map(function(l) {
                var tc = tinycolor(l.color);
                return {
                    link: l,
                    tinyColorHue: Color.tinyRGB(tc),
                    tinyColorAlpha: tc.getAlpha(),
                    sankey: d.sankey
                };
            });
            /*for(var i = 0; i < nodes.length; i++) {
                nodes[i].y = nodes[i].y - nodes[i].dy / 2;
            }
            */return result;
        });

    sankeyLink.enter()
        .append('path')
        .classed('sankeyPath', true)
        .call(attachPointerEvents, callbacks.linkEvents);

    sankeyLink
        .attr('d', linkPath)
        .style('stroke', function(d) {return d.tinyColorHue;})
        .style('stroke-opacity', function(d) {return d.tinyColorAlpha;})
        .style('stroke-width', function(d) {return Math.max(1, d.link.dy);});

    var sankeyNodes = sankey.selectAll('.sankeyNodes')
        .data(repeat, keyFun);

    sankeyNodes.enter()
        .append('g')
        .each(function(d) {

            var things = d.nodes;

            var width = 800,
                height = 500;

            var margin = {
                l: 20,
                t: 20,
                r: 20,
                b: 20
            };

            var thingWidth = 20;
            var rMin = 1;
            var rMax = 100;
            var msStopSimulation = 10000;

            var x = d3.scale.linear().range([margin.l, width - margin.r]);
            var y = d3.scale.linear().range([margin.b, height - margin.t]);
            var r = d3.scale.linear().range([rMin, rMax]);
            var med = x(0.5);

            function constrain() {
                for(var i = 0; i < things.length; i++) {
                    var d = things[i];
                    if(false /*d === currentDragged*/) { // constrain to dragging
                        d.vx = 0;
                        d.x = d.lastDraggedX;
                        d.y = d.lastDraggedY;
                    } else {
                        //d.y = Math.min(y(1) - d.r, Math.max(y(0) + d.r, d.y)); // constrain to extent
                        //d.vx = (med - d.x) / Math.max(1, (d.r * d.r / 1000)); // constrain to 1D
                    }
                }
            }

            var forceLayout = d3Force.forceSimulation(things)
                .alphaDecay(0)
                //.velocityDecay(0.3)
                .force('constrain', constrain)
                .force('collide', d3Force.forceCollide()
                    .radius(function(d) {return d.dy / 2 + c.nodePadding / 2;})
                    .strength(0.3)
                    .iterations(10))
                .on('tick', updatePositionsOnTick);

        })
        .style('shape-rendering', 'crispEdges')
        .classed('sankeyNodes', true);

    function positionSankeyNode(sankeyNode) {
        sankeyNode
            .style('transform', c.vertical ?
                function(d) {return 'translate(' + (Math.floor(d.node.y) - 0.5) + 'px, ' + (Math.floor(d.node.x) + 0.5) + 'px)';} :
                function(d) {return 'translate(' + (Math.floor(d.node.x) - 0.5) + 'px, ' + (Math.floor(d.node.y - d.node.dy / 2) + 0.5) + 'px)';})
    }

    function updatePositionsOnTick() {
        sankeyNode.call(positionSankeyNode);
    }

    var sankeyNode = sankeyNodes.selectAll('.sankeyPath')
        .data(function(d) {
            return d.sankey.nodes().map(function(n) {
                var tc = tinycolor(n.color);
                return {
                    node: n,
                    tinyColorHue: Color.tinyRGB(tc),
                    tinyColorAlpha: tc.getAlpha(),
                    sankey: d.sankey,
                    model: d
                };
            });
        });

    sankeyNode.enter()
        .append('g')
        .classed('sankeyNode', true)
        .call(d3.behavior.drag()
            .origin(function(d) {return c.vertical ? {x: d.node.y, y: d.node.x} : d.node;})
            .on('dragstart', function(d) {
                this.parentNode.appendChild(this);
                dragInProgress = true;
                if(hovered) {
                    callbacks.nodeEvents.unhover.apply(0, hovered);
                    hovered = false;
                }
            })
            .on('drag', function(d) {
                if(c.vertical) {
                    d.node.y = Math.max(0, Math.min(d.model.dragParallel - d.node.dy, d3.event.x));
                    d.node.x = Math.max(0, Math.min(d.model.dragPerpendicular - d.node.dx, d3.event.y));
                    d3.select(this).style('transform', 'translate(' + d.node.y + 'px,' + d.node.x + 'px)');
                } else {
                    d.node.x = Math.max(0, Math.min(d.model.dragPerpendicular - d.node.dx, d3.event.x));
                    d.node.y = Math.max(d.node.dy / 2, Math.min(d.model.dragParallel - d.node.dy / 2, d3.event.y));
                    d3.select(this).style('transform', 'translate(' + d.node.x + 'px,' + d.node.y + 'px)');
                }
                d.sankey.relayout();
                sankeyLink.attr('d', linkPath);

            })
            .on('dragend', function() {
                dragInProgress = false;
            }));

    var nodeRect = sankeyNode.selectAll('.nodeRect')
        .data(repeat);

    nodeRect.enter()
        .append('rect')
        .classed('nodeRect', true)
        .style('shape-rendering', 'crispEdges')
        .style('stroke-width', 0.5)
        .call(Color.stroke, 'rgba(0, 0, 0, 1)')
        .call(attachPointerEvents, callbacks.nodeEvents);

    nodeRect // ceil, +/-0.5 and crispEdges is wizardry for consistent border width on all 4 sides
        .style('fill', function(d) {return d.tinyColorHue;})
        .style('fill-opacity', function(d) {return d.tinyColorAlpha;})
        .attr(c.vertical ? 'height' : 'width', function(d) {return Math.ceil(d.node.dx + 0.5);})
        .attr(c.vertical ? 'width' : 'height', function(d) {return Math.ceil(d.node.dy - 0.5);});

    var nodeLabel = sankeyNode.selectAll('.nodeLabel')
        .data(repeat);

    nodeLabel.enter()
        .append('text')
        .classed('nodeLabel', true);

    nodeLabel
        .attr('x', function(d) {return c.vertical ? d.node.dy / 2 : d.node.dx + c.nodeTextOffset;})
        .attr('y', function(d) {return c.vertical ? d.node.dx / 2 : d.node.dy / 2;})
        .text(function(d) {return d.node.label;})
        .attr('alignment-baseline', 'middle')
        .attr('text-anchor', c.vertical ? 'middle' : 'start')
        .style('font-family', 'sans-serif')
        .style('font-size', '10px');
};
