'use strict';

var Lib = require('../../lib');
var attributes = require('./attributes');
var Color = require('../../components/color');
var tinycolor = require('tinycolor2');
var handleDomainDefaults = require('../../plots/domain').defaults;
var handleHoverLabelDefaults = require('../../components/fx/hoverlabel_defaults');
var Template = require('../../plot_api/plot_template');
var handleArrayContainerDefaults = require('../../plots/array_container_defaults');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var hoverlabelDefault = Lib.extendDeep(layout.hoverlabel, traceIn.hoverlabel);

    // node attributes
    var nodeIn = traceIn.node;
    var nodeOut = Template.newContainer(traceOut, 'node');

    function coerceNode(attr, dflt) {
        return Lib.coerce(nodeIn, nodeOut, attributes.node, attr, dflt);
    }
    coerceNode('label');
    coerceNode('groups');
    coerceNode('x');
    coerceNode('y');
    coerceNode('pad');
    coerceNode('thickness');
    coerceNode('line.color');
    coerceNode('line.width');
    coerceNode('hoverinfo', traceIn.hoverinfo);
    handleHoverLabelDefaults(nodeIn, nodeOut, coerceNode, hoverlabelDefault);
    coerceNode('hovertemplate');
    coerceNode('align');

    var colors = layout.colorway;

    var defaultNodePalette = function(i) {return colors[i % colors.length];};

    coerceNode('color', nodeOut.label.map(function(d, i) {
        return Color.addOpacity(defaultNodePalette(i), 0.8);
    }));
    coerceNode('customdata');

    // link attributes
    var linkIn = traceIn.link || {};
    var linkOut = Template.newContainer(traceOut, 'link');

    function coerceLink(attr, dflt) {
        return Lib.coerce(linkIn, linkOut, attributes.link, attr, dflt);
    }
    coerceLink('label');
    coerceLink('arrowlen');
    coerceLink('source');
    coerceLink('target');
    coerceLink('value');
    coerceLink('line.color');
    coerceLink('line.width');
    coerceLink('hoverinfo', traceIn.hoverinfo);
    handleHoverLabelDefaults(linkIn, linkOut, coerceLink, hoverlabelDefault);
    coerceLink('hovertemplate');

    var darkBG = tinycolor(layout.paper_bgcolor).getLuminance() < 0.333;
    var defaultLinkColor = darkBG ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.2)';
    var linkColor = coerceLink('color', defaultLinkColor);

    function makeDefaultHoverColor(_linkColor) {
        var tc = tinycolor(_linkColor);
        if(!tc.isValid()) {
            // hopefully the user-specified color is valid, but if not that can be caught elsewhere
            return _linkColor;
        }
        var alpha = tc.getAlpha();
        if(alpha <= 0.8) {
            tc.setAlpha(alpha + 0.2);
        } else {
            tc = darkBG ? tc.brighten() : tc.darken();
        }
        return tc.toRgbString();
    }

    coerceLink('hovercolor', Array.isArray(linkColor) ?
        linkColor.map(makeDefaultHoverColor) :
        makeDefaultHoverColor(linkColor)
    );

    coerceLink('customdata');

    handleArrayContainerDefaults(linkIn, linkOut, {
        name: 'colorscales',
        handleItemDefaults: concentrationscalesDefaults
    });

    handleDomainDefaults(traceOut, layout, coerce);

    coerce('orientation');
    coerce('valueformat');
    coerce('valuesuffix');

    var dfltArrangement;
    if(nodeOut.x.length && nodeOut.y.length) {
        dfltArrangement = 'freeform';
    }
    coerce('arrangement', dfltArrangement);

    Lib.coerceFont(coerce, 'textfont', layout.font, { autoShadowDflt: true });

    // disable 1D transforms - arrays here are 1D but their lengths/meanings
    // don't match, between nodes and links
    traceOut._length = null;
};

function concentrationscalesDefaults(In, Out) {
    function coerce(attr, dflt) {
        return Lib.coerce(In, Out, attributes.link.colorscales, attr, dflt);
    }

    coerce('label');
    coerce('cmin');
    coerce('cmax');
    coerce('colorscale');
}
