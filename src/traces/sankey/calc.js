/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var tarjan = require('strongly-connected-components');
var Lib = require('../../lib');
var wrap = require('../../lib/gup').wrap;

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

    if(circularityPresent(trace.node.label, trace.link.source, trace.link.target)) {
        Lib.error('Circularity is present in the Sankey data. Removing all nodes and links.');
        trace.link.label = [];
        trace.link.source = [];
        trace.link.target = [];
        trace.link.value = [];
        trace.link.color = [];
        trace.node.label = [];
        trace.node.color = [];
    }

    return wrap({
        link: trace.link,
        node: trace.node
    });
};
