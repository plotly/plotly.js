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

function nodesDefaults(traceIn, traceOut) {
    var nodesIn = traceIn.nodes || [],
        nodesOut = traceOut.nodes = [];

    var nodeIn, nodeOut, i;

    function coerce(attr, dflt) {
        return Lib.coerce(nodeIn, nodeOut, attributes.nodes, attr, dflt);
    }

    for(i = 0; i < nodesIn.length; i++) {
        nodeIn = nodesIn[i];
        nodeOut = {};

        if(!Lib.isPlainObject(nodeIn)) {
            continue;
        }

        var visible = coerce('visible');

        if(visible) {
            coerce('label');
        }

        nodeOut._index = i;
        nodesOut.push(nodeOut);
    }

    return nodesOut;
}

function linksDefaults(traceIn, traceOut) {
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
            coerce('color');
        }

        linkOut._index = i;
        linksOut.push(linkOut);
    }
}


module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    nodesDefaults(traceIn, traceOut);
    linksDefaults(traceIn, traceOut);

    coerce('hoverinfo', layout._dataLength === 1 ? 'label+text+value+percent' : undefined);

    coerce('domain.x');
    coerce('domain.y');
};
