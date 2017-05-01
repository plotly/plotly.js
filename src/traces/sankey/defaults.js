/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var attributes = require('./attributes');
var colors = require('../../components/color/attributes').defaults;
var Color = require('../../components/color');
var tinycolor = require('tinycolor2');
var tarjan = require('strongly-connected-components');

function circularityPresent(nodeList, sources, targets) {

    var nodes = nodeList.map(function() {return [];});

    for(var i = 0; i < Math.min(sources.length, targets.length); i++) {
        nodes[sources[i]].push(targets[i]);
    }

    var scc = tarjan(nodes);

    // Tarján's strongly connected components algorithm coded by Mikola Lysenko
    // returns at least one non-singular component if there's circularity in the graph
    return scc.components.some(function(c) {
        return c.length > 1;
    });
}

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {

    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    coerce('node.label');

    var defaultNodePalette = function(i) {return colors[i % colors.length];};

    coerce('node.color', traceIn.node.label.map(function(d, i) {
        return Color.addOpacity(defaultNodePalette(i), 0.8);
    }));

    coerce('link.label');
    coerce('link.source');
    coerce('link.target');
    coerce('link.value');

    coerce('link.color', traceIn.link.value.map(function() {
        return tinycolor(layout.paper_bgcolor).getLuminance() < 0.333 ?
            'rgba(255, 255, 255, 0.6)' :
            'rgba(0, 0, 0, 0.2)';
    }));

    coerce('hoverinfo', layout._dataLength === 1 ? 'label+text+value+percent' : undefined);

    coerce('domain.x');
    coerce('domain.y');
    coerce('orientation');
    coerce('nodepad');
    coerce('nodethickness');
    coerce('valueformat');
    coerce('valuesuffix');
    coerce('arrangement');

    Lib.coerceFont(coerce, 'textfont', Lib.extendFlat({}, layout.font));

    var missing = function(n, i) {
        return traceIn.link.source.indexOf(i) === -1 &&
            traceIn.link.target.indexOf(i) === -1;
    };
    if(traceIn.node.label.some(missing)) {
        Lib.log('Some of the nodes are neither sources nor targets, please remove them.');
    }

    if(circularityPresent(traceOut.node.label, traceOut.link.source, traceOut.link.target)) {
        Lib.log('Circularity is present in the Sankey data. Removing all nodes and links.');
        traceOut.link.label = [];
        traceOut.link.source = [];
        traceOut.link.target = [];
        traceOut.link.value = [];
        traceOut.link.color = [];
        traceOut.node.label = [];
        traceOut.node.color = [];
    }
};
