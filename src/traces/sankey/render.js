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

function persistOriginalX(nodes) {
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].originalX = nodes[i].x;
    }
}

function toForceFormat(nodes) {
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].y = nodes[i].y + nodes[i].dy / 2;
    }
}

function toSankeyFormat(nodes) {
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].y = nodes[i].y - nodes[i].dy / 2;
    }
}

function viewModel(layout, d, i) {
    var trace = unwrap(d).trace,
        domain = trace.domain,
        nodes = trace.nodes,
        links = trace.links,
        horizontal = trace.orientation === 'h';

    var width = layout.width * (domain.x[1] - domain.x[0]);
    var height = layout.height * (domain.y[1] - domain.y[0]);

    var sankey = d3sankey()
        .size(horizontal ? [width, height] : [height, width])
        .nodeWidth(c.nodeWidth)
        .nodePadding(c.nodePadding)
        .nodes(nodes)
        .links(links)
        .layout(c.sankeyIterations);
    toForceFormat(nodes);
    return {
        key: i,
        horizontal: horizontal,
        width: width,
        height: height,
        translateX: domain.x[0] * width + layout.margin.l,
        translateY: layout.height - domain.y[1] * layout.height + layout.margin.t,
        dragParallel: horizontal ? height : width,
        dragPerpendicular: horizontal ? width : height,
        nodes: nodes,
        links: links,
        sankey: sankey
    };
}

function constrainDraggedItem(d) {
    d.lastDraggedX = d.x
    d.lastDraggedY = d.y
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
        toSankeyFormat(nodes);
        var result = d.sankey.link()(d.link);
        toForceFormat(nodes);
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
        .style('transform', function(d) {return d.horizontal ? 'matrix(1,0,0,1,0,0)' : 'matrix(0,1,1,0,0,0)'})
        .style('fill', 'none');

    var sankeyLink = sankeyLinks.selectAll('.sankeyPath')
        .data(function(d) {
            return d.sankey.links().map(function(l) {
                var tc = tinycolor(l.color);
                return {
                    link: l,
                    tinyColorHue: Color.tinyRGB(tc),
                    tinyColorAlpha: tc.getAlpha(),
                    sankey: d.sankey
                };
            });
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
        .data(function(d) {

            var nodes = d.nodes;
            var s = d.horizontal ? d.height : d.width;

            function constrain() {
                for(var i = 0; i < nodes.length; i++) {
                    var d = nodes[i];
                    if(d === dragInProgress) { // constrain node position to the dragging pointer
                        d.x = d.lastDraggedX;
                        d.y = d.lastDraggedY;
                    } else {
                        d.vx = (d.vx + 4 * (d.originalX - d.x)) / 5; // snap to layer
                        d.y = Math.min(s - d.dy / 2, Math.max(d.dy / 2, d.y)); // constrain to extent
                    }
                }
            }

            d.forceLayout = d3Force.forceSimulation(nodes)
                .velocityDecay(0.2)
                .force('collide', d3Force.forceCollide()
                    .strength(1)
                    .iterations(5)
                    .radius(function(d) {return d.dy / 2 + c.nodePadding / 2;}))
                .force('constrain', constrain)
                .on('tick', updatePositionsOnTick)
                .on('end', crispLinesOnEnd);

            return [d];

        }, keyFun);

    sankeyNodes.enter()
        .append('g')
        .style('shape-rendering', 'geometricPrecision')
        .classed('sankeyNodes', true);

    function positionSankeyNode(sankeyNode) {
        sankeyNodes.style('shape-rendering', 'optimizeSpeed');
        sankeyNode
            .style('transform', function(d) {
                return d.model.horizontal
                    ? 'translate(' + (d.node.x - 0.5) + 'px, ' + (d.node.y - d.node.dy / 2 + 0.5) + 'px)'
                    : 'translate(' + (d.node.y - d.node.dy / 2 - 0.5) + 'px, ' + (d.node.x + 0.5) + 'px)'
            })
    }

    function updatePositionsOnTick() {
        sankeyLink.attr('d', linkPath);
        sankeyNode.call(positionSankeyNode);
    }

    function crispLinesOnEnd() {
        sankeyNode.style('shape-rendering', 'crispEdges');
    }

    var sankeyNode = sankeyNodes.selectAll('.sankeyNode')
        .data(function(d) {
            var nodes = d.sankey.nodes();
            persistOriginalX(nodes);
            return d.sankey.nodes().map(function(n) {
                var tc = tinycolor(n.color);
                return {
                    node: n,
                    tinyColorHue: Color.tinyRGB(tc),
                    tinyColorAlpha: tc.getAlpha(),
                    sankey: d.sankey,
                    forceLayout: d.forceLayout,
                    model: d
                };
            });
        });

    sankeyNode.enter()
        .append('g')
        .classed('sankeyNode', true)
        .call(attachPointerEvents, callbacks.nodeEvents)
        .call(d3.behavior.drag()
            .origin(function(d) {return d.model.horizontal ? d.node : {x: d.node['y'], y: d.node['x']};})
            .on('dragstart', function(d) {
                this.parentNode.appendChild(this);
                dragInProgress = d.node;
                constrainDraggedItem(d.node);
                if(hovered) {
                    callbacks.nodeEvents.unhover.apply(0, hovered);
                    hovered = false;
                }
                d.forceLayout.alphaDecay(0).alpha(1).restart();
            })
            .on('drag', function(d) {
                d.node.x = d.model.horizontal ? d3.event.x : d3.event.y;
                d.node.y = d.model.horizontal ? d3.event.y : d3.event.x;
                constrainDraggedItem(d.node);
                d.sankey.relayout();
            })
            .on('dragend', function(d) {
                dragInProgress = false;
                d.forceLayout.alphaDecay(c.alphaDecay);
            }));

    var nodeCapture = sankeyNode.selectAll('.nodeCapture')
        .data(repeat);

    nodeCapture.enter()
        .append('rect')
        .classed('nodeCapture', true)
        .style('fill-opacity', 0);

    nodeCapture
        .attr('width', function(d) {return d.model.horizontal ? Math.ceil(d.node.dx + 0.5) : Math.ceil(d.node.dy - 0.5 + c.nodePadding);})
        .attr('height', function(d) {return d.model.horizontal ? Math.ceil(d.node.dy - 0.5 + c.nodePadding) : Math.ceil(d.node.dx + 0.5);})
        .attr('x', function(d) {return d.model.horizontal ? 0 : - c.nodePadding / 2;})
        .attr('y', function(d) {return d.model.horizontal ? -c.nodePadding / 2: 0;});

    var nodeRect = sankeyNode.selectAll('.nodeRect')
        .data(repeat);

    nodeRect.enter()
        .append('rect')
        .classed('nodeRect', true)
        .style('stroke-width', 0.5)
        .call(Color.stroke, 'rgba(0, 0, 0, 1)');

    nodeRect // ceil, +/-0.5 and crispEdges is needed for consistent border width on all 4 sides
        .style('fill', function(d) {return d.tinyColorHue;})
        .style('fill-opacity', function(d) {return d.tinyColorAlpha;})
        .attr('width', function(d) {return d.model.horizontal ? Math.ceil(d.node.dx + 0.5) : Math.ceil(d.node.dy - 0.5);})
        .attr('height', function(d) {return d.model.horizontal ? Math.ceil(d.node.dy - 0.5) : Math.ceil(d.node.dx + 0.5);});

    var nodeLabel = sankeyNode.selectAll('.nodeLabel')
        .data(repeat);

    nodeLabel.enter()
        .append('text')
        .classed('nodeLabel', true);

    nodeLabel
        .attr('x', function(d) {return d.model.horizontal ? d.node.dx + c.nodeTextOffset : d.node.dy / 2;})
        .attr('y', function(d) {return d.model.horizontal ? d.node.dy / 2 : d.node.dx / 2;})
        .text(function(d) {return d.node.label;})
        .attr('alignment-baseline', 'middle')
        .attr('text-anchor', function(d) {return d.model.horizontal ? 'start' : 'middle';})
        .style('font-family', 'sans-serif')
        .style('font-size', '10px');
};
