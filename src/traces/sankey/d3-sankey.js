/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

/**
Copyright 2015, Mike Bostock
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of the author nor the names of contributors may be used to
  endorse or promote products derived from this software without specific prior
  written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/

/**
The following is a fork of https://github.com/plotly/d3-sankey which itself
was a fork of https://github.com/d3/d3-sankey from Mike Bostock.
*/

'use strict';

var d3array = require('d3-array');
var ascending = d3array.ascending;
var min = d3array.min;
var sum = d3array.sum;
var max = d3array.max;
var nest = require('d3-collection').nest;
var interpolateNumber = require('d3-interpolate').interpolateNumber;

// sort links' breadth (ie top to bottom in a column), based on their source nodes' breadths
function ascendingSourceDepth(a, b) {
    return ascendingBreadth(a.source, b.source) || (a.originalIndex - b.originalIndex);
}

// sort links' breadth (ie top to bottom in a column), based on their target nodes' breadths
function ascendingTargetDepth(a, b) {
    return ascendingBreadth(a.target, b.target) || (a.originalIndex - b.originalIndex);
}

function ascendingBreadth(a, b) {
    return a.y - b.y;
}

function value(d) {
    return d.value;
}

function nodeCenter(node) {
    return node.y + node.dy / 2;
}

function weightedSource(link) {
    return nodeCenter(link.source) * link.value;
}

function weightedTarget(link) {
    return nodeCenter(link.target) * link.value;
}

module.exports = function() {
    var sankey = {},
        dx = 24, // nodeWidth
        py = 8, // nodePadding
        size = [1, 1],
        nodes = [],
        links = [],
        maxPaddedSpace = 2 / 3; // Defined as a fraction of the total available space

    sankey.nodeWidth = function(_) {
        if(!arguments.length) return dx;
        dx = +_;
        return sankey;
    };

    sankey.nodePadding = function(_) {
        if(!arguments.length) return py;
        py = +_;
        return sankey;
    };

    sankey.nodes = function(_) {
        if(!arguments.length) return nodes;
        nodes = _;
        return sankey;
    };

    sankey.links = function(_) {
        if(!arguments.length) return links;
        links = _;
        return sankey;
    };

    sankey.size = function(_) {
        if(!arguments.length) return size;
        size = _;
        return sankey;
    };

    sankey.layout = function(iterations) {
        computeNodeLinks();
        computeNodeValues();
        computeNodeDepths();
        computeNodeBreadths(iterations);
        computeLinkBreadths();
        return sankey;
    };

    sankey.relayout = function() {
        computeLinkBreadths();
        return sankey;
    };

    sankey.link = function() {
        var curvature = 0.5;

        function link(d) {
            var x0 = d.source.x + d.source.dx,
                x1 = d.target.x,
                xi = interpolateNumber(x0, x1),
                x2 = xi(curvature),
                x3 = xi(1 - curvature),
                y0a = d.source.y + d.sy,
                y0b = y0a + d.dy,
                y1a = d.target.y + d.ty,
                y1b = y1a + d.dy;
            return 'M' + x0 + ',' + y0a +
           'C' + x2 + ',' + y0a +
           ' ' + x3 + ',' + y1a +
           ' ' + x1 + ',' + y1a +
           'L' + x1 + ',' + y1b +
           'C' + x3 + ',' + y1b +
           ' ' + x2 + ',' + y0b +
           ' ' + x0 + ',' + y0b +
           'Z';
        }

        link.curvature = function(_) {
            if(!arguments.length) return curvature;
            curvature = +_;
            return link;
        };

        return link;
    };

  // Populate the sourceLinks and targetLinks for each node.
  // Also, if the source and target are not objects, assume they are indices.
    function computeNodeLinks() {
        nodes.forEach(function(node) {
            node.sourceLinks = [];
            node.targetLinks = [];
        });
        links.forEach(function(link, i) {
            var source = link.source,
                target = link.target;
            if(typeof source === 'number') source = link.source = nodes[link.source];
            if(typeof target === 'number') target = link.target = nodes[link.target];
            link.originalIndex = i;
            source.sourceLinks.push(link);
            target.targetLinks.push(link);
        });
    }

  // Compute the value (size) of each node by summing the associated links.
    function computeNodeValues() {
        nodes.forEach(function(node) {
            node.value = Math.max(
        sum(node.sourceLinks, value),
        sum(node.targetLinks, value)
      );
        });
    }

  // Iteratively assign the breadth (x-position) for each node.
  // Nodes are assigned the maximum breadth of incoming neighbors plus one;
  // nodes with no incoming links are assigned breadth zero, while
  // nodes with no outgoing links are assigned the maximum breadth.
    function computeNodeDepths() {
        var remainingNodes = nodes,
            nextNodes,
            x = 0;

        function processNode(node) {
            node.depth = x;
            node.x = x;
            node.dx = dx;
            node.sourceLinks.forEach(function(link) {
                if(nextNodes.indexOf(link.target) < 0) {
                    nextNodes.push(link.target);
                }
            });
        }

        while(remainingNodes.length) {
            nextNodes = [];
            remainingNodes.forEach(processNode);
            remainingNodes = nextNodes;
            ++x;
        }

    //
        moveSinksRight(x);
        scaleNodeBreadths((size[0] - dx) / (x - 1));
    }

  // function moveSourcesRight() {
  //   nodes.forEach(function(node) {
  //     if (!node.targetLinks.length) {
  //       node.x = min(node.sourceLinks, function(d) { return d.target.x; }) - 1;
  //     }
  //   });
  // }

    function moveSinksRight(x) {
        nodes.forEach(function(node) {
            if(!node.sourceLinks.length) {
                node.depth = x - 1;
                node.x = x - 1;
            }
        });
    }

    function scaleNodeBreadths(kx) {
        nodes.forEach(function(node) {
            node.x *= kx;
        });
    }

    function computeNodeBreadths(iterations) {
        var nodesByBreadth = nest()
        .key(function(d) { return d.x; })
        .sortKeys(ascending)
        .entries(nodes)
        .map(function(d) { return d.values; });

    //
        initializeNodeDepth();
        resolveCollisions();
        for(var alpha = 1; iterations > 0; --iterations) {
            relaxRightToLeft(alpha *= 0.99);
            resolveCollisions();
            relaxLeftToRight(alpha);
            resolveCollisions();
        }

        function initializeNodeDepth() {
            var L = max(nodesByBreadth, function(nodes) {
                return nodes.length;
            });
            var maxNodePadding = maxPaddedSpace * size[1] / (L - 1);
            if(py > maxNodePadding) py = maxNodePadding;
            var ky = min(nodesByBreadth, function(nodes) {
                return (size[1] - (nodes.length - 1) * py) / sum(nodes, value);
            });

            nodesByBreadth.forEach(function(nodes) {
                nodes.forEach(function(node, i) {
                    node.y = i;
                    node.dy = node.value * ky;
                });
            });

            links.forEach(function(link) {
                link.dy = link.value * ky;
            });
        }

        function relaxLeftToRight(alpha) {
            nodesByBreadth.forEach(function(nodes) {
                nodes.forEach(function(node) {
                    if(node.targetLinks.length) {
                        var y = sum(node.targetLinks, weightedSource) / sum(node.targetLinks, value);
                        node.y += (y - nodeCenter(node)) * alpha;
                    }
                });
            });
        }

        function relaxRightToLeft(alpha) {
            nodesByBreadth.slice().reverse().forEach(function(nodes) {
                nodes.forEach(function(node) {
                    if(node.sourceLinks.length) {
                        var y = sum(node.sourceLinks, weightedTarget) / sum(node.sourceLinks, value);
                        node.y += (y - nodeCenter(node)) * alpha;
                    }
                });
            });
        }

        function resolveCollisions() {
            nodesByBreadth.forEach(function(nodes) {
                var node,
                    dy,
                    y0 = 0,
                    n = nodes.length,
                    i;

        // Push any overlapping nodes down.
                nodes.sort(ascendingDepth);
                for(i = 0; i < n; ++i) {
                    node = nodes[i];
                    dy = y0 - node.y;
                    if(dy > 0) node.y += dy;
                    y0 = node.y + node.dy + py;
                }

        // If the bottommost node goes outside the bounds, push it back up.
                dy = y0 - py - size[1];
                if(dy > 0) {
                    y0 = node.y -= dy;

          // Push any overlapping nodes back up.
                    for(i = n - 2; i >= 0; --i) {
                        node = nodes[i];
                        dy = node.y + node.dy + py - y0;
                        if(dy > 0) node.y -= dy;
                        y0 = node.y;
                    }
                }
            });
        }

        function ascendingDepth(a, b) {
            return a.y - b.y;
        }
    }

    function computeLinkBreadths() {
        nodes.forEach(function(node) {
            node.sourceLinks.sort(ascendingTargetDepth);
            node.targetLinks.sort(ascendingSourceDepth);
        });
        nodes.forEach(function(node) {
            var sy = 0, ty = 0;
            node.sourceLinks.forEach(function(link) {
                link.sy = sy;
                sy += link.dy;
            });
            node.targetLinks.forEach(function(link) {
                link.ty = ty;
                ty += link.dy;
            });
        });
    }

    return sankey;
};
