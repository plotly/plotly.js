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
var d3sankey = require('@plotly/d3-sankey').sankey;
var d3Force = require('d3-force');
var Lib = require('../../lib');

// basic data utilities

function keyFun(d) {return d.key;}
function repeat(d) {return [d];} // d3 data binding convention
function unwrap(d) {return d[0];} // plotly data structure convention

function persistOriginalPlace(nodes) {
    var i, distinctLayerPositions = [];
    for(i = 0; i < nodes.length; i++) {
        nodes[i].originalX = nodes[i].x;
        nodes[i].originalY = nodes[i].y;
        if(distinctLayerPositions.indexOf(nodes[i].x) === -1) {
            distinctLayerPositions.push(nodes[i].x);
        }
    }
    distinctLayerPositions.sort(function(a, b) {return a - b;});
    for(i = 0; i < nodes.length; i++) {
        nodes[i].originalLayerIndex = distinctLayerPositions.indexOf(nodes[i].originalX);
        nodes[i].originalLayer = nodes[i].originalLayerIndex / (distinctLayerPositions.length - 1);
    }
}

function saveCurrentDragPosition(d) {
    d.lastDraggedX = d.x;
    d.lastDraggedY = d.y;
}

function sameLayer(d) {
    return function(n) {return n.node.originalX === d.node.originalX;};
}

function switchToForceFormat(nodes) {
    // force uses x, y as centers
    for(var i = 0; i < nodes.length; i++) {
        nodes[i].y = nodes[i].y + nodes[i].dy / 2;
    }
}

function switchToSankeyFormat(nodes) {
    // sankey uses x, y as top left
    for(var i = 0; i < nodes.length; i++) {
        nodes[i].y = nodes[i].y - nodes[i].dy / 2;
    }
}

// view models

function sankeyModel(layout, d, i) {

    var trace = unwrap(d).trace,
        domain = trace.domain,
        nodeSpec = trace.node,
        linkSpec = trace.link,
        arrangement = trace.arrangement,
        horizontal = trace.orientation === 'h',
        nodePad = trace.node.pad,
        nodeThickness = trace.node.thickness,
        nodeLineColor = trace.node.line.color,
        nodeLineWidth = trace.node.line.width,
        linkLineColor = trace.link.line.color,
        linkLineWidth = trace.link.line.width,
        valueFormat = trace.valueformat,
        valueSuffix = trace.valuesuffix,
        textFont = trace.textfont;

    var width = layout.width * (domain.x[1] - domain.x[0]),
        height = layout.height * (domain.y[1] - domain.y[0]);

    var nodes = nodeSpec.label.map(function(l, i) {
        return {
            label: l,
            color: Lib.isArray(nodeSpec.color) ? nodeSpec.color[i] : nodeSpec.color
        };
    });

    var links = linkSpec.value.map(function(d, i) {
        return {
            label: linkSpec.label[i],
            color: Lib.isArray(linkSpec.color) ? linkSpec.color[i] : linkSpec.color,
            source: linkSpec.source[i],
            target: linkSpec.target[i],
            value: d
        };
    });

    var sankey = d3sankey()
        .size(horizontal ? [width, height] : [height, width])
        .nodeWidth(nodeThickness)
        .nodePadding(nodePad)
        .nodes(nodes)
        .links(links)
        .layout(c.sankeyIterations);

    var node, sankeyNodes = sankey.nodes();
    for(var n = 0; n < sankeyNodes.length; n++) {
        node = sankeyNodes[n];
        node.width = width;
        node.height = height;
        if(node.parallel) node.x = (horizontal ? width : height) * node.parallel;
        if(node.perpendicular) node.y = (horizontal ? height : width) * node.perpendicular;
    }

    switchToForceFormat(nodes);

    return {
        key: i,
        guid: Math.floor(1e12 * (1 + Math.random())),
        horizontal: horizontal,
        width: width,
        height: height,
        nodePad: nodePad,
        nodeLineColor: nodeLineColor,
        nodeLineWidth: nodeLineWidth,
        linkLineColor: linkLineColor,
        linkLineWidth: linkLineWidth,
        valueFormat: valueFormat,
        valueSuffix: valueSuffix,
        textFont: textFont,
        translateX: domain.x[0] * width + layout.margin.l,
        translateY: layout.height - domain.y[1] * layout.height + layout.margin.t,
        dragParallel: horizontal ? height : width,
        dragPerpendicular: horizontal ? width : height,
        nodes: nodes,
        links: links,
        arrangement: arrangement,
        sankey: sankey,
        forceLayouts: {},
        interactionState: {
            dragInProgress: false,
            hovered: false
        }
    };
}

function linkModel(uniqueKeys, d, l) {

    var tc = tinycolor(l.color);
    var basicKey = l.source.label + '|' + l.target.label;
    var foundKey = uniqueKeys[basicKey];
    uniqueKeys[basicKey] = (foundKey === void(0) ? foundKey : 0) + 1;
    var key = basicKey + (foundKey === void(0) ? '' : '__' + foundKey);

    return {
        key: key,
        traceId: d.key,
        link: l,
        tinyColorHue: Color.tinyRGB(tc),
        tinyColorAlpha: tc.getAlpha(),
        linkLineColor: d.linkLineColor,
        linkLineWidth: d.linkLineWidth,
        valueFormat: d.valueFormat,
        valueSuffix: d.valueSuffix,
        sankey: d.sankey,
        interactionState: d.interactionState
    };
}

function nodeModel(uniqueKeys, d, n) {

    var tc = tinycolor(n.color),
        zoneThicknessPad = c.nodePadAcross,
        zoneLengthPad = d.nodePad / 2,
        visibleThickness = n.dx + 0.5,
        visibleLength = n.dy - 0.5,
        zoneThickness = visibleThickness + 2 * zoneThicknessPad,
        zoneLength = visibleLength + 2 * zoneLengthPad;

    var basicKey = n.label;
    var foundKey = uniqueKeys[basicKey];
    uniqueKeys[basicKey] = (foundKey === void(0) ? foundKey : 0) + 1;
    var key = basicKey + (foundKey === void(0) ? '' : '__' + foundKey);

    return {
        key: key,
        traceId: d.key,
        node: n,
        nodePad: d.nodePad,
        nodeLineColor: d.nodeLineColor,
        nodeLineWidth: d.nodeLineWidth,
        textFont: d.textFont,
        size: d.horizontal ? d.height : d.width,
        visibleWidth: Math.ceil(d.horizontal ? visibleThickness : visibleLength),
        visibleHeight: Math.ceil(d.horizontal ? visibleLength : visibleThickness),
        zoneX: d.horizontal ? -zoneThicknessPad : -zoneLengthPad,
        zoneY: d.horizontal ? -zoneLengthPad : -zoneThicknessPad,
        zoneWidth: d.horizontal ? zoneThickness : zoneLength,
        zoneHeight: d.horizontal ? zoneLength : zoneThickness,
        labelY: d.horizontal ? n.dy / 2 + 1 : n.dx / 2 + 1,
        left: n.originalLayer === 1,
        sizeAcross: d.horizontal ? d.width : d.height,
        forceLayouts: d.forceLayouts,
        horizontal: d.horizontal,
        darkBackground: tc.getBrightness() <= 128,
        tinyColorHue: Color.tinyRGB(tc),
        tinyColorAlpha: tc.getAlpha(),
        valueFormat: d.valueFormat,
        valueSuffix: d.valueSuffix,
        sankey: d.sankey,
        arrangement: d.arrangement,
        uniqueNodeLabelPathId: [d.guid, d.key, key].join(' '),
        interactionState: d.interactionState
    };
}

// rendering snippets

function crispLinesOnEnd(sankeyNode) {
    d3.select(sankeyNode.node().parentElement).style('shape-rendering', 'crispEdges');
}

function updateNodePositions(sankeyNode) {
    sankeyNode
        .attr('transform', function(d) {
            return d.horizontal ?
                'translate(' + (d.node.x - 0.5) + ', ' + (d.node.y - d.node.dy / 2 + 0.5) + ')' :
                'translate(' + (d.node.y - d.node.dy / 2 - 0.5) + ', ' + (d.node.x + 0.5) + ')';
        });
}

function linkPath(d) {
    var nodes = d.sankey.nodes();
    switchToSankeyFormat(nodes);
    var result = d.sankey.link()(d.link);
    switchToForceFormat(nodes);
    return result;
}

function updateNodeShapes(sankeyNode) {
    d3.select(sankeyNode.node().parentElement).style('shape-rendering', 'optimizeSpeed');
    sankeyNode.call(updateNodePositions);
}

function updateShapes(sankeyNode, sankeyLink) {
    sankeyNode.call(updateNodeShapes);
    sankeyLink.attr('d', linkPath);
}

function sizeNode(rect) {
    rect.attr('width', function(d) {return d.visibleWidth;})
        .attr('height', function(d) {return d.visibleHeight;});
}

function salientEnough(d) {
    return d.link.dy > 1 || d.linkLineWidth > 0;
}

function linksTransform(d) {
    return d.horizontal ? 'matrix(1,0,0,1,0,0)' : 'matrix(0,1,1,0,0,0)';
}

function textGuidePath(d) {
    return d3.svg.line()([
        [d.horizontal ? (d.left ? -d.sizeAcross : d.visibleWidth + c.nodeTextOffsetHorizontal) : c.nodeTextOffsetHorizontal, d.labelY],
        [d.horizontal ? (d.left ? - c.nodeTextOffsetHorizontal : d.sizeAcross) : d.visibleWidth - c.nodeTextOffsetHorizontal, d.labelY]
    ]);}

// event handling

function attachPointerEvents(selection, sankey, eventSet) {
    selection
        .on('.basic', null) // remove any preexisting handlers
        .on('mouseover.basic', function(d) {
            if(!d.interactionState.dragInProgress) {
                eventSet.hover(this, d, sankey);
                d.interactionState.hovered = [this, d];
            }
        })
        .on('mousemove.basic', function(d) {
            if(!d.interactionState.dragInProgress) {
                eventSet.follow(this, d);
                d.interactionState.hovered = [this, d];
            }
        })
        .on('mouseout.basic', function(d) {
            if(!d.interactionState.dragInProgress) {
                eventSet.unhover(this, d, sankey);
                d.interactionState.hovered = false;
            }
        })
        .on('click.basic', function(d) {
            if(d.interactionState.hovered) {
                eventSet.unhover(this, d, sankey);
                d.interactionState.hovered = false;
            }
            if(!d.interactionState.dragInProgress) {
                eventSet.select(this, d, sankey);
            }
        });
}

function attachDragHandler(sankeyNode, sankeyLink, callbacks) {

    var dragBehavior = d3.behavior.drag()

        .origin(function(d) {return d.horizontal ? d.node : {x: d.node.y, y: d.node.x};})

        .on('dragstart', function(d) {
            if(d.arrangement === 'fixed') return;
            this.parentNode.appendChild(this); // bring element to top (painter's algo)
            d.interactionState.dragInProgress = d.node;
            saveCurrentDragPosition(d.node);
            if(d.interactionState.hovered) {
                callbacks.nodeEvents.unhover.apply(0, d.interactionState.hovered);
                d.interactionState.hovered = false;
            }
            if(d.arrangement === 'snap') {
                var forceKey = d.traceId + '|' + Math.floor(d.node.originalX);
                if(d.forceLayouts[forceKey]) {
                    d.forceLayouts[forceKey].alpha(1);
                } else { // make a forceLayout iff needed
                    attachForce(sankeyNode, forceKey, d);
                }
                startForce(sankeyNode, sankeyLink, d, forceKey);
            }
        })

        .on('drag', function(d) {
            if(d.arrangement === 'fixed') return;
            var x = d.horizontal ? d3.event.x : d3.event.y;
            var y = d.horizontal ? d3.event.y : d3.event.x;
            if(d.arrangement === 'snap') {
                d.node.x = x;
                d.node.y = y;
            } else {
                if(d.arrangement === 'freeform') {
                    d.node.x = x;
                }
                d.node.y = Math.max(d.node.dy / 2, Math.min(d.size - d.node.dy / 2, y));
            }
            saveCurrentDragPosition(d.node);
            if(d.arrangement !== 'snap') {
                d.sankey.relayout();
                updateShapes(sankeyNode.filter(sameLayer(d)), sankeyLink);
                sankeyNode.call(crispLinesOnEnd);
            }
        })

        .on('dragend', function(d) {
            d.interactionState.dragInProgress = false;
        });

    sankeyNode
        .on('.drag', null) // remove possible previous handlers
        .call(dragBehavior);
}

function attachForce(sankeyNode, forceKey, d) {
    var nodes = d.sankey.nodes().filter(function(n) {return n.originalX === d.node.originalX;});
    d.forceLayouts[forceKey] = d3Force.forceSimulation(nodes)
        .alphaDecay(0)
        .force('collide', d3Force.forceCollide()
            .radius(function(n) {return n.dy / 2 + d.nodePad / 2;})
            .strength(1)
            .iterations(c.forceIterations))
        .force('constrain', snappingForce(sankeyNode, forceKey, nodes, d))
        .stop();
}

function startForce(sankeyNode, sankeyLink, d, forceKey) {
    window.requestAnimationFrame(function faster() {
        for(var i = 0; i < c.forceTicksPerFrame; i++) {
            d.forceLayouts[forceKey].tick();
        }
        d.sankey.relayout();
        updateShapes(sankeyNode.filter(sameLayer(d)), sankeyLink);
        if(d.forceLayouts[forceKey].alpha() > 0) {
            window.requestAnimationFrame(faster);
        }
    });
}

function snappingForce(sankeyNode, forceKey, nodes, d) {
    return function _snappingForce() {
        var maxVelocity = 0;
        for(var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            if(n === d.interactionState.dragInProgress) { // constrain node position to the dragging pointer
                n.x = n.lastDraggedX;
                n.y = n.lastDraggedY;
            } else {
                n.vx = (n.originalX - n.x) / c.forceTicksPerFrame; // snap to layer
                n.y = Math.min(d.size - n.dy / 2, Math.max(n.dy / 2, n.y)); // constrain to extent
            }
            maxVelocity = Math.max(maxVelocity, Math.abs(n.vx), Math.abs(n.vy));
        }
        if(!d.interactionState.dragInProgress && maxVelocity < 0.1 && d.forceLayouts[forceKey].alpha() > 0) {
            d.forceLayouts[forceKey].alpha(0);
            window.setTimeout(function() {
                sankeyNode.call(crispLinesOnEnd);
            }, 30); // geome on move, crisp when static
        }
    };
}

// scene graph

module.exports = function(svg, styledData, layout, callbacks) {

    var sankey = svg.selectAll('.sankey')
        .data(styledData
                .filter(function(d) {return unwrap(d).trace.visible;})
                .map(sankeyModel.bind(null, layout)),
            keyFun);

    sankey.exit()
        .remove();

    sankey.enter()
        .append('g')
        .classed('sankey', true)
        .style('box-sizing', 'content-box')
        .style('position', 'absolute')
        .style('left', 0)
        .style('shape-rendering', 'geometricPrecision')
        .style('pointer-events', 'auto')
        .style('box-sizing', 'content-box');

    sankey
        .attr('transform', function(d) {return 'translate(' + d.translateX + ',' + d.translateY + ')';});

    var sankeyLinks = sankey.selectAll('.sankeyLinks')
        .data(repeat, keyFun);

    sankeyLinks.enter()
        .append('g')
        .classed('sankeyLinks', true)
        .style('fill', 'none')
        .style('transform', linksTransform);

    sankeyLinks.transition()
        .ease(c.ease).duration(c.duration)
        .style('transform', linksTransform);

    var sankeyLink = sankeyLinks.selectAll('.sankeyLink')
        .data(function(d) {
            var uniqueKeys = {};
            return d.sankey.links()
                .filter(function(l) {return l.value;})
                .map(linkModel.bind(null, uniqueKeys, d));
        }, keyFun);

    sankeyLink.enter()
        .append('path')
        .classed('sankeyLink', true)
        .attr('d', linkPath)
        .call(attachPointerEvents, sankey, callbacks.linkEvents);

    sankeyLink
        .style('stroke', function(d) {
            return salientEnough(d) ? Color.tinyRGB(tinycolor(d.linkLineColor)) : d.tinyColorHue;
        })
        .style('stroke-opacity', function(d) {
            return salientEnough(d) ? Color.opacity(d.linkLineColor) : d.tinyColorAlpha;
        })
        .style('stroke-width', function(d) {return salientEnough(d) ? d.linkLineWidth : 1;})
        .style('fill', function(d) {return d.tinyColorHue;})
        .style('fill-opacity', function(d) {return d.tinyColorAlpha;});

    sankeyLink.transition()
        .ease(c.ease).duration(c.duration)
        .attr('d', linkPath);

    sankeyLink.exit().transition()
        .ease(c.ease).duration(c.duration)
        .style('opacity', 0)
        .remove();

    var sankeyNodeSet = sankey.selectAll('.sankeyNodeSet')
        .data(repeat, keyFun);

    sankeyNodeSet.enter()
        .append('g')
        .style('shape-rendering', 'geometricPrecision')
        .classed('sankeyNodeSet', true);

    sankeyNodeSet
        .style('cursor', function(d) {
            switch(d.arrangement) {
                case 'fixed': return 'default';
                case 'perpendicular': return 'ns-resize';
                default: return 'move';
            }
        });

    var sankeyNode = sankeyNodeSet.selectAll('.sankeyNode')
        .data(function(d) {
            var nodes = d.sankey.nodes();
            var uniqueKeys = {};
            persistOriginalPlace(nodes);
            return nodes
                .filter(function(n) {return n.value;})
                .map(nodeModel.bind(null, uniqueKeys, d));
        }, keyFun);

    sankeyNode.enter()
        .append('g')
        .classed('sankeyNode', true)
        .call(updateNodePositions)
        .call(attachPointerEvents, sankey, callbacks.nodeEvents);

    sankeyNode
        .call(attachDragHandler, sankeyLink, callbacks); // has to be here as it binds sankeyLink

    sankeyNode.transition()
        .ease(c.ease).duration(c.duration)
        .call(updateNodePositions);

    sankeyNode.exit().transition()
        .ease(c.ease).duration(c.duration)
        .style('opacity', 0)
        .remove();

    var nodeRect = sankeyNode.selectAll('.nodeRect')
        .data(repeat);

    nodeRect.enter()
        .append('rect')
        .classed('nodeRect', true)
        .call(sizeNode);

    nodeRect
        .style('stroke-width', function(d) {return d.nodeLineWidth;})
        .style('stroke', function(d) {return Color.tinyRGB(tinycolor(d.nodeLineColor));})
        .style('stroke-opacity', function(d) {return Color.opacity(d.nodeLineColor);})
        .style('fill', function(d) {return d.tinyColorHue;})
        .style('fill-opacity', function(d) {return d.tinyColorAlpha;});

    nodeRect.transition()
        .ease(c.ease).duration(c.duration)
        .call(sizeNode);

    var nodeCapture = sankeyNode.selectAll('.nodeCapture')
        .data(repeat);

    nodeCapture.enter()
        .append('rect')
        .classed('nodeCapture', true)
        .style('fill-opacity', 0);

    nodeCapture
        .attr('x', function(d) {return d.zoneX;})
        .attr('y', function(d) {return d.zoneY;})
        .attr('width', function(d) {return d.zoneWidth;})
        .attr('height', function(d) {return d.zoneHeight;});

    var nodeLabelGuide = sankeyNode.selectAll('.nodeLabelGuide')
        .data(repeat);

    nodeLabelGuide.enter()
        .append('path')
        .classed('nodeLabelGuide', true)
        .attr('id', function(d) {return d.uniqueNodeLabelPathId;})
        .attr('d', textGuidePath);

    nodeLabelGuide
        .transition()
        .ease(c.ease).duration(c.duration)
        .attr('d', textGuidePath);

    var nodeLabel = sankeyNode.selectAll('.nodeLabel')
        .data(repeat);

    nodeLabel.enter()
        .append('text')
        .classed('nodeLabel', true)
        .style('user-select', 'none')
        .style('cursor', 'default')
        .style('fill', 'black');

    nodeLabel
        .style('text-shadow', function(d) {
            return d.horizontal ? '-1px 1px 1px #fff, 1px 1px 1px #fff, 1px -1px 1px #fff, -1px -1px 1px #fff' : 'none';
        })
        .each(function(d) {Drawing.font(nodeLabel, d.textFont);});

    var nodeLabelTextPath = nodeLabel.selectAll('.nodeLabelTextPath')
        .data(repeat);

    nodeLabelTextPath.enter()
        .append('textPath')
        .classed('nodeLabelTextPath', true)
        .attr('alignment-baseline', 'middle')
        .attr('xlink:href', function(d) {return '#' + d.uniqueNodeLabelPathId;});

    nodeLabelTextPath
        .text(function(d) {return d.horizontal || d.node.dy > 5 ? d.node.label : '';})
        .attr('startOffset', function(d) {return d.horizontal && d.left ? '100%' : '0%';})
        .style('text-anchor', function(d) {return d.horizontal && d.left ? 'end' : 'start';})
        .style('fill', function(d) {return d.darkBackground && !d.horizontal ? 'white' : 'black';});
};
