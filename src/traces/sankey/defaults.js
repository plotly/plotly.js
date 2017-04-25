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
var d3 = require('d3');


function linksDefaults(traceIn, traceOut, layout) {
    var linksIn = traceIn.links || [],
        linksOut = traceOut.links = [];

    var linkIn, linkOut, i;

    function coerce(attr, dflt) {
        return Lib.coerce(linkIn, linkOut, attributes.links, attr, dflt);
    }

    for(i = 0; i < linksIn.length; i++) {
        linkIn = linksIn[i];
        linkOut = {};

        if(!Lib.isPlainObject(linkIn)) {
            continue;
        }

        var visible = coerce('visible');

        if(visible) {
            coerce('label');
            coerce('value');
            coerce('source');
            coerce('target');
            if(layout.paper_bgcolor) {
                coerce('color', 'rgba(255, 255, 255, 0.5)');
            } else {
                coerce('color');
            }
        }

        linkOut._index = i;
        linksOut.push(linkOut);
    }
}

function nodesDefaults(traceIn, traceOut) {
    var nodesIn = traceIn.nodes || [],
        nodesOut = traceOut.nodes = [];

    var nodeIn, nodeOut, i, j, link, foundUse, visible,
        usedNodeCount = 0,
        indexMap = [];

    var defaultPalette = function(i) {return colors[i % colors.length];};

    function coerce(attr, dflt) {
        return Lib.coerce(nodeIn, nodeOut, attributes.nodes, attr, dflt);
    }

    for(i = 0; i < nodesIn.length; i++) {
        nodeIn = nodesIn[i];

        foundUse = false;
        for(j = 0; j < traceOut.links.length && !foundUse; j++) {
            link = traceOut.links[j];
            foundUse = link.source === i || link.target === i;
        }

        indexMap.push(foundUse ? usedNodeCount : null);

        if(!foundUse)
            continue;

        if(!Lib.isPlainObject(nodeIn)) {
            continue;
        }

        nodeOut = {};

        visible = coerce('visible');

        if(visible) {
            coerce('label');
            coerce('parallel');
            coerce('perpendicular');
            if(nodeIn.color) {
                coerce('color');
            } else {
                coerce('color', Color.addOpacity(defaultPalette(i), 0.8));
            }
        }

        nodeOut._index = usedNodeCount;
        nodesOut.push(nodeOut);
        usedNodeCount++;
    }

    // since nodes were removed, update indices to nodes in links to reflect new reality
    for(j = 0; j < traceOut.links.length; j++) {
        link = traceOut.links[j];
        link.source = indexMap[link.source];
        link.target = indexMap[link.target];
    }

    return nodesOut;
}




module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    linksDefaults(traceIn, traceOut, layout);
    nodesDefaults(traceIn, traceOut);

    coerce('hoverinfo', layout._dataLength === 1 ? 'label+text+value+percent' : undefined);

    coerce('domain.x');
    coerce('domain.y');
    coerce('orientation');
    coerce('nodepad');
    coerce('nodethickness');
    coerce('valueformat');
    coerce('valuesuffix');
    coerce('followmouse');
    coerce('arrangement');

    // Prefer Sankey-specific font spec e.g. with smaller default size
    var sankeyFontSpec = Lib.coerceFont(coerce, 'textfont');
    Lib.coerceFont(coerce, 'textfont', Lib.extendFlat({}, layout.font, sankeyFontSpec));
};
