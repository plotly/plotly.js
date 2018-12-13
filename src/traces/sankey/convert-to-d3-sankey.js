/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var isArrayOrTypedArray = Lib.isArrayOrTypedArray;
var isIndex = Lib.isIndex;

module.exports = function(trace) {
    var nodeSpec = trace.node;
    var linkSpec = trace.link;

    var links = [];
    var hasLinkColorArray = isArrayOrTypedArray(linkSpec.color);
    var linkedNodes = {};

    var nodeCount = nodeSpec.label.length;
    var i;
    for(i = 0; i < linkSpec.value.length; i++) {
        var val = linkSpec.value[i];
        // remove negative values, but keep zeros with special treatment
        var source = linkSpec.source[i];
        var target = linkSpec.target[i];
        if(!(val > 0 && isIndex(source, nodeCount) && isIndex(target, nodeCount))) {
            continue;
        }

        source = +source;
        target = +target;
        linkedNodes[source] = linkedNodes[target] = true;

        links.push({
            pointNumber: i,
            label: linkSpec.label[i],
            color: hasLinkColorArray ? linkSpec.color[i] : linkSpec.color,
            source: source,
            target: target,
            value: +val
        });
    }

    var hasNodeColorArray = isArrayOrTypedArray(nodeSpec.color);
    var nodes = [];
    var removedNodes = false;
    var nodeIndices = {};

    for(i = 0; i < nodeCount; i++) {
        if(linkedNodes[i]) {
            var l = nodeSpec.label[i];
            nodeIndices[i] = nodes.length;
            nodes.push({
                pointNumber: i,
                label: l,
                color: hasNodeColorArray ? nodeSpec.color[i] : nodeSpec.color
            });
        } else removedNodes = true;
    }

    // need to re-index links now, since we didn't put all the nodes in
    if(removedNodes) {
        for(i = 0; i < links.length; i++) {
            links[i].source = nodeIndices[links[i].source];
            links[i].target = nodeIndices[links[i].target];
        }
    }

    return {
        links: links,
        nodes: nodes
    };
};
