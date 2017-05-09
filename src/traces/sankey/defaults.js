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

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {

    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    coerce('node.label');
    coerce('node.pad');
    coerce('node.thickness');
    coerce('node.line.color');
    coerce('node.line.width');

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

    coerce('hoverinfo', layout._dataLength === 1 ? 'label+text+value+percent' : undefined);

    coerce('domain.x');
    coerce('domain.y');
    coerce('orientation');
    coerce('valueformat');
    coerce('valuesuffix');
    coerce('arrangement');

    Lib.coerceFont(coerce, 'textfont', Lib.extendFlat({}, layout.font));

    var missing = function(n, i) {
        return traceOut.link.source.indexOf(i) === -1 &&
            traceOut.link.target.indexOf(i) === -1;
    };

    if(traceOut.node.label.some(missing)) {
        Lib.warn('Some of the nodes are neither sources nor targets, they will not be displayed.');
    }
};
