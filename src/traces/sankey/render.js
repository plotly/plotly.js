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
var Drawing = require('../../components/drawing');
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
        horizontal = trace.orientation === 'h',
        nodePad = trace.nodepad,
        textFont = trace.textfont;

    var width = layout.width * (domain.x[1] - domain.x[0]);
    var height = layout.height * (domain.y[1] - domain.y[0]);

    var sankey = d3sankey()
        .size(horizontal ? [width, height] : [height, width])
        .nodeWidth(c.nodeWidth)
        .nodePadding(nodePad)
        .nodes(nodes)
        .links(links)
        .layout(c.sankeyIterations);
    toForceFormat(nodes);
    return {
        key: i,
        horizontal: horizontal,
        width: width,
        height: height,
        nodePad: nodePad,
        textFont: textFont,
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

function layerNode(d) {
    return function(n) {
        return n.node.originalX === d.node.originalX;
    };
}

function layerLink(d) {
    return function(l) {
        return l.link.source.originalX === d.node.originalX
            || l.link.target.originalX === d.node.originalX;
    };
}

function updateNodePositions(sankeyNode) {
    sankeyNode
        .attr('transform', function(d) {
            return d.horizontal
                ? 'translate(' + (d.node.x - 0.5) + ', ' + (d.node.y - d.node.dy / 2 + 0.5) + ')'
                : 'translate(' + (d.node.y - d.node.dy / 2 - 0.5) + ', ' + (d.node.x + 0.5) + ')'
        })
}

module.exports = function(svg, styledData, layout, callbacks) {

    var dragInProgress = false;
    var hovered = false;

    function attachPointerEvents(selection, eventSet) {
        selection
            .on('mouseover', function (d) {
                if (!dragInProgress) {
                    eventSet.hover(this, d, sankey);
                    hovered = [this, d];
                }
            })
            .on('mousemove', function (d) {
                if (!dragInProgress) {
                    eventSet.follow(this, d, sankey);
                    hovered = [this, d];
                }
            })
            .on('mouseout', function (d) {
                if (!dragInProgress) {
                    eventSet.unhover(this, d, sankey);
                    hovered = false;
                }
            })
            .on('click', function (d) {
                if (hovered) {
                    eventSet.unhover(this, d, sankey);
                    hovered = false;
                }
                if (!dragInProgress) {
                    eventSet.select(this, d, sankey);
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

    var sankeyLink = sankeyLinks.selectAll('.sankeyLink')
        .data(function(d) {
            return d.sankey.links()
                .filter(function(l) {return l.visible && l.value;})
                .map(function(l) {
                    var tc = tinycolor(l.color);
                    return {
                        key: l.source.label + '|' + l.target.label,
                        traceId: d.key,
                        link: l,
                        tinyColorHue: Color.tinyRGB(tc),
                        tinyColorAlpha: tc.getAlpha(),
                        sankey: d.sankey
                    };
                });
        }, keyFun);

    sankeyLink.enter()
        .append('path')
        .classed('sankeyLink', true)
        .attr('d', linkPath)
        .style('stroke-width', function(d) {return Math.max(1, d.link.dy);})
        .style('opacity', 0)
        .call(attachPointerEvents, callbacks.linkEvents);

    sankeyLink
        .style('stroke', function(d) {return d.tinyColorHue;})
        .style('stroke-opacity', function(d) {return d.tinyColorAlpha;});

    sankeyLink
        .transition().ease(c.ease).duration(c.duration)
        .style('opacity', 1)
        .attr('d', linkPath)
        .style('stroke-width', function(d) {return Math.max(1, d.link.dy);});

    sankeyLink.exit()
        .transition().ease(c.ease).duration(c.duration)
        .style('opacity', 0)
        .remove();

    var sankeyNodes = sankey.selectAll('.sankeyNodes')
        .data(repeat, keyFun);

    sankeyNodes.enter()
        .append('g')
        .style('shape-rendering', 'geometricPrecision')
        .classed('sankeyNodes', true);

    sankeyNodes
        .each(function(d) {Drawing.font(sankeyNodes, d.textFont);});

    function updateNodeShapes(sankeyNode) {
        sankeyNodes.style('shape-rendering', 'optimizeSpeed');
        sankeyNode.call(updateNodePositions);
    }

    function updateShapes(sankeyNode, sankeyLink) {
        return function() {
            sankeyNode.call(updateNodeShapes);
            sankeyLink.attr('d', linkPath);
        }
    }

    function crispLinesOnEnd() {
        sankeyNode.style('shape-rendering', 'crispEdges');
    }

    var sankeyNode = sankeyNodes.selectAll('.sankeyNode')
        .data(function(d) {
            var nodes = d.sankey.nodes();
            var forceLayouts = {};
            persistOriginalX(nodes);
            return d.sankey.nodes()
                .filter(function(n) {return n.visible && n.value;})
                .map(function(n) {
                    var tc = tinycolor(n.color);
                    return {
                        key: n.label,
                        traceId: d.key,
                        node: n,
                        nodePad: d.nodePad,
                        textFont: d.textFont,
                        size: d.horizontal ? d.height : d.width,
                        sizeAcross: d.horizontal ? d.width : d.height,
                        forceLayouts: forceLayouts,
                        horizontal: d.horizontal,
                        tinyColorHue: Color.tinyRGB(tc),
                        tinyColorAlpha: tc.getAlpha(),
                        sankey: d.sankey
                    };
                });
        }, keyFun);

    sankeyNode.enter()
        .append('g')
        .classed('sankeyNode', true)
        .style('opacity', 0)
        .call(updateNodePositions)
        .call(attachPointerEvents, callbacks.nodeEvents)
        .call(d3.behavior.drag()

            .origin(function(d) {return d.horizontal ? d.node : {x: d.node['y'], y: d.node['x']};})

            .on('dragstart', function(d) {
                if(!c.movable) return;
                this.parentNode.appendChild(this);
                dragInProgress = d.node;
                constrainDraggedItem(d.node);
                if(hovered) {
                    callbacks.nodeEvents.unhover.apply(0, hovered);
                    hovered = false;
                }
                if(c.useForceSnap) {
                    var forceKey = d.traceId + '|' + Math.floor(d.node.originalX);
                    if (d.forceLayouts[forceKey]) { // make a forceLayout iff needed

                        d.forceLayouts[forceKey].restart();

                    } else {

                        var nodes = d.sankey.nodes().filter(function(n) {return n.originalX === d.node.originalX;});
                        var snap = function () {
                            var maxVelocity = 0;
                            for (var i = 0; i < nodes.length; i++) {
                                var n = nodes[i];
                                if (n === dragInProgress) { // constrain node position to the dragging pointer
                                    n.x = n.lastDraggedX;
                                    n.y = n.lastDraggedY;
                                } else {
                                    n.vx = (n.vx + 4 * (n.originalX - n.x)) / 5; // snap to layer
                                    n.y = Math.min(d.size - n.dy / 2, Math.max(n.dy / 2, n.y)); // constrain to extent
                                }
                                maxVelocity = Math.max(maxVelocity, Math.abs(n.vx), Math.abs(n.vy));
                            }
                            if(!dragInProgress && maxVelocity < 0.1) {
                                d.forceLayouts[forceKey].stop();
                                crispLinesOnEnd();
                            }
                        }

                        d.forceLayouts[forceKey] = d3Force.forceSimulation(nodes)
                            .alphaDecay(0)
                            .velocityDecay(0.3)
                            .force('collide', d3Force.forceCollide()
                                .radius(function (n) {return n.dy / 2 + d.nodePad / 2;})
                                .strength(1)
                                .iterations(c.forceIterations))
                            .force('constrain', snap)
                            .on('tick', updateShapes(sankeyNode.filter(layerNode(d)), sankeyLink.filter(layerLink(d))));
                    }
                }
            })

            .on('drag', function(d) {
                if(!c.movable) return;
                var x = d.horizontal ? d3.event.x : d3.event.y;
                var y = d.horizontal ? d3.event.y : d3.event.x;
                if(c.useForceSnap) {
                    d.node.x = x;
                    d.node.y = y;
                } else {
                    if(c.sideways) {
                        d.node.x = x;
                    }
                    d.node.y = Math.max(d.node.dy / 2, Math.min(d.size - d.node.dy / 2, y));
                }
                constrainDraggedItem(d.node);
                d.sankey.relayout();
                if(!c.useForceSnap) {
                    updateShapes(sankeyNode.filter(layerNode(d)), sankeyLink.filter(layerLink(d)))();
                    crispLinesOnEnd();
                }
            })

            .on('dragend', function() {dragInProgress = false;})
        );

    sankeyNode
        .transition().ease(c.ease).duration(c.duration)
        .style('opacity', 1)
        .call(updateNodePositions);

    sankeyNode.exit()
        .transition().ease(c.ease).duration(c.duration)
        .style('opacity', 0)
        .remove();

    var nodeRect = sankeyNode.selectAll('.nodeRect')
        .data(repeat);

    function rectWidth(d) {return d.horizontal ? Math.ceil(d.node.dx + 0.5) : Math.ceil(d.node.dy - 0.5);}
    function rectHeight(d) {return d.horizontal ? Math.ceil(d.node.dy - 0.5) : Math.ceil(d.node.dx + 0.5);}

    nodeRect.enter()
        .append('rect')
        .classed('nodeRect', true)
        .style('stroke-width', 0.5)
        .attr('width', rectWidth)
        .attr('height', rectHeight)
        .call(Color.stroke, 'rgba(0, 0, 0, 1)');

    nodeRect // ceil, +/-0.5 and crispEdges is needed for consistent border width on all 4 sides
        .style('fill', function(d) {return d.tinyColorHue;})
        .style('fill-opacity', function(d) {return d.tinyColorAlpha;});

    nodeRect.transition().ease(c.ease).duration(c.duration)
        .attr('width', rectWidth)
        .attr('height', rectHeight);

    var nodeCapture = sankeyNode.selectAll('.nodeCapture')
        .data(repeat);

    nodeCapture.enter()
        .append('rect')
        .classed('nodeCapture', true)
        .style('fill-opacity', 0);

    nodeCapture
        .attr('width', function(d) {return Math.ceil(d.horizontal ? d.node.dx + 0.5 : d.node.dy - 0.5 + d.nodePad);})
        .attr('height', function(d) {return Math.ceil(d.horizontal ? d.node.dy - 0.5 + d.nodePad : d.node.dx + 0.5);})
        .attr('x', function(d) {return d.horizontal ? 0 : - d.nodePad / 2;})
        .attr('y', function(d) {return d.horizontal ? -d.nodePad / 2: 0;});

    var nodeLabel = sankeyNode.selectAll('.nodeLabel')
        .data(repeat);

    function labelX(d) {return d.horizontal ? d.node.dx + c.nodeTextOffset : d.node.dy / 2;}
    function labelY(d) {return d.horizontal ? d.node.dy / 2 : d.node.dx / 2;}

    nodeLabel.enter()
        .append('text')
        .classed('nodeLabel', true)
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('alignment-baseline', 'middle')
        .style('user-select', 'none')
        .style('pointer-events', 'none')
        .style('cursor', 'default');

    nodeLabel
        .text(function(d) {return d.node.label;})
        .attr('text-anchor', function(d) {return d.horizontal ? 'start' : 'middle';});

    nodeLabel.transition().ease(c.ease).duration(c.duration)
        .attr('x', labelX)
        .attr('y', labelY);
};
