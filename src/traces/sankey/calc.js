/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var tarjan = require('strongly-connected-components');
var Lib = require('../../lib');
var wrap = require('../../lib/gup').wrap;

var convertToD3Sankey = require('./convert-to-d3-sankey');

function circularityPresent(nodeList, sources, targets) {

    var nodeLen = nodeList.length;
    var nodes = Lib.init2dArray(nodeLen, 0);

    for(var i = 0; i < Math.min(sources.length, targets.length); i++) {
        if(Lib.isIndex(sources[i], nodeLen) && Lib.isIndex(targets[i], nodeLen)) {
            if(sources[i] === targets[i]) {
                return true; // self-link which is also a scc of one
            }
            nodes[sources[i]].push(targets[i]);
        }
    }

    var scc = tarjan(nodes);

    // Tarján's strongly connected components algorithm coded by Mikola Lysenko
    // returns at least one non-singular component if there's circularity in the graph
    return scc.components.some(function(c) {
        return c.length > 1;
    });
}

module.exports = function calc(gd, trace) {
    var circular = false;
    if(circularityPresent(trace.node.label, trace.link.source, trace.link.target)) {
        circular = true;
    }

    var result = convertToD3Sankey(trace);

    return wrap({
        circular: circular,
        _nodes: result.nodes,
        _links: result.links
    });
};
