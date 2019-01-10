/**
* Copyright 2012-2019, Plotly, Inc.
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
    var nodeSpec = Lib.extendDeep({}, trace.node);
    var linkSpec = Lib.extendDeep({}, trace.link);

    var links = [];
    var hasLinkColorArray = isArrayOrTypedArray(linkSpec.color);
    var linkedNodes = {};
    var nodeCount = nodeSpec.label.length

    // Grouping


    var groups = trace.groups;
    var groupCount = groups.length;
    var groupLookup = {};
    groups.forEach(function(group, groupIndex) {
        // Create a node per group
        nodeSpec.label[nodeCount + groupIndex] = 'Grouped ' + groupIndex;

        // Build a lookup table to quickly find in which group a node is
        if(Array.isArray(group)) {
            group.forEach(function(nodeIndex) {
                groupLookup[nodeIndex] = nodeCount + groupIndex;
            });
        }
    });

    nodeCount = nodeSpec.label.length;

    var i;
    for(i = 0; i < linkSpec.value.length; i++) {
        var val = linkSpec.value[i];
        // remove negative values, but keep zeros with special treatment
        var source = linkSpec.source[i];
        var target = linkSpec.target[i];
        if(!(val > 0 && isIndex(source, nodeCount) && isIndex(target, nodeCount))) {
            continue;
        }

        // Remove links that are within the group
        // if(group.indexOf(source) !== -1 && group.indexOf(target) !== -1) {
        if(groupLookup.hasOwnProperty(source) && groupLookup.hasOwnProperty(target)) {
            continue;
        }

        // if link targets a node in the group
        // if(group.indexOf(target) !== -1) {
        if(groupLookup.hasOwnProperty(target)) {
            target = groupLookup[target];
        }

        // if link originates from a node in the group
        // if(group.indexOf(source) !== -1) {
        if(groupLookup.hasOwnProperty(source)) {
            source = groupLookup[source];
        }

        source = +source;
        target = +target;
        linkedNodes[source] = linkedNodes[target] = true;

        var label = '';
        if(linkSpec.label && linkSpec.label[i]) label = linkSpec.label[i];

        links.push({
            pointNumber: i,
            label: label,
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
        } else removedNodes = false;
    }

    // need to re-index links now, since we didn't put all the nodes in
    if(removedNodes) {
        for(i = 0; i < links.length; i++) {
            links[i].source = nodeIndices[links[i].source];
            links[i].target = nodeIndices[links[i].target];
        }
    }

    return {
        groups: groups,
        groupLookup: groupLookup,
        links: links,
        nodes: nodes
    };
};
