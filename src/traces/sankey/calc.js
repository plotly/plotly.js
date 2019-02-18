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

var isArrayOrTypedArray = Lib.isArrayOrTypedArray;
var isIndex = Lib.isIndex;
var Colorscale = require('../../components/colorscale');

function convertToD3Sankey(trace) {
    var nodeSpec = trace.node;
    var linkSpec = trace.link;

    var links = [];
    var hasLinkColorArray = isArrayOrTypedArray(linkSpec.color);
    var linkedNodes = {};

    var components = {};
    var componentCount = linkSpec.colorscales.length;
    var i;
    for(i = 0; i < componentCount; i++) {
        var cscale = linkSpec.colorscales[i];
        var specs = Colorscale.extractScale(cscale, {cLetter: 'c'});
        var scale = Colorscale.makeColorScaleFunc(specs);
        components[cscale.label] = scale;
    }

    var nodeCount = nodeSpec.label.length;
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

        var label = '';
        if(linkSpec.label && linkSpec.label[i]) label = linkSpec.label[i];

        var concentrationscale = null;
        if(label && components.hasOwnProperty(label)) concentrationscale = components[label];

        links.push({
            pointNumber: i,
            label: label,
            color: hasLinkColorArray ? linkSpec.color[i] : linkSpec.color,
            concentrationscale: concentrationscale,
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
}

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
