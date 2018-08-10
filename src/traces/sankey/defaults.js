/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var attributes = require('./attributes');
var Color = require('../../components/color');
var tinycolor = require('tinycolor2');
var handleDomainDefaults = require('../../plots/domain').defaults;

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    coerce('node.label');
    coerce('node.pad');
    coerce('node.thickness');
    coerce('node.line.color');
    coerce('node.line.width');

    var colors = layout.colorway;

    var defaultNodePalette = function(i) {return colors[i % colors.length];};

    coerce('node.color', traceOut.node.label.map(function(d, i) {
        return Color.addOpacity(defaultNodePalette(i), 0.8);
    }));

    coerce('link.label');
    coerce('link.source');
    coerce('link.target');
    coerce('link.value');
    coerce('link.line.color');
    coerce('link.line.width');

    coerce('link.color', traceOut.link.value.map(function() {
        return tinycolor(layout.paper_bgcolor).getLuminance() < 0.333 ?
            'rgba(255, 255, 255, 0.6)' :
            'rgba(0, 0, 0, 0.2)';
    }));

    handleDomainDefaults(traceOut, layout, coerce);

    coerce('orientation');
    coerce('valueformat');
    coerce('valuesuffix');
    coerce('arrangement');

    Lib.coerceFont(coerce, 'textfont', Lib.extendFlat({}, layout.font));

    // disable 1D transforms - arrays here are 1D but their lengths/meanings
    // don't match, between nodes and links
    traceOut._length = null;
};
