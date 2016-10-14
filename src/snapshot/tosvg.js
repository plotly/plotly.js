/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var svgTextUtils = require('../lib/svg_text_utils');
var Drawing = require('../components/drawing');
var Color = require('../components/color');

var xmlnsNamespaces = require('../constants/xmlns_namespaces');


module.exports = function toSVG(gd, format) {
    var fullLayout = gd._fullLayout,
        svg = fullLayout._paper,
        toppaper = fullLayout._toppaper,
        i;

    // make background color a rect in the svg, then revert after scraping
    // all other alterations have been dealt with by properly preparing the svg
    // in the first place... like setting cursors with css classes so we don't
    // have to remove them, and providing the right namespaces in the svg to
    // begin with
    svg.insert('rect', ':first-child')
        .call(Drawing.setRect, 0, 0, fullLayout.width, fullLayout.height)
        .call(Color.fill, fullLayout.paper_bgcolor);

    // subplot-specific to-SVG methods
    // which notably add the contents of the gl-container
    // into the main svg node
    var basePlotModules = fullLayout._basePlotModules || [];
    for(i = 0; i < basePlotModules.length; i++) {
        var _module = basePlotModules[i];

        if(_module.toSVG) _module.toSVG(gd);
    }

    // add top items above them assumes everything in toppaper is either
    // a group or a defs, and if it's empty (like hoverlayer) we can ignore it.
    if(toppaper) {
        var nodes = toppaper.node().childNodes;

        // make copy of nodes as childNodes prop gets mutated in loop below
        var topGroups = Array.prototype.slice.call(nodes);

        for(i = 0; i < topGroups.length; i++) {
            var topGroup = topGroups[i];

            if(topGroup.childNodes.length) svg.node().appendChild(topGroup);
        }
    }

    // remove draglayer for Adobe Illustrator compatibility
    if(fullLayout._draggers) {
        fullLayout._draggers.remove();
    }

    // in case the svg element had an explicit background color, remove this
    // we want the rect to get the color so it's the right size; svg bg will
    // fill whatever container it's displayed in regardless of plot size.
    svg.node().style.background = '';

    svg.selectAll('text')
        .attr('data-unformatted', null)
        .each(function() {
            var txt = d3.select(this);

            // hidden text is pre-formatting mathjax,
            // the browser ignores it but it can still confuse batik
            if(txt.style('visibility') === 'hidden') {
                txt.remove();
                return;
            }
            else {
                // force other visibility value to export as visible
                // to not potentially confuse non-browser SVG implementations
                txt.style('visibility', 'visible');
            }

            // Font family styles break things because of quotation marks,
            // so we must remove them *after* the SVG DOM has been serialized
            // to a string (browsers convert singles back)
            var ff = txt.style('font-family');
            if(ff && ff.indexOf('"') !== -1) {
                txt.style('font-family', ff.replace(/"/g, 'TOBESTRIPPED'));
            }
        });

    if(format === 'pdf' || format === 'eps') {
        // these formats make the extra line MathJax adds around symbols look super thick in some cases
        // it looks better if this is removed entirely.
        svg.selectAll('#MathJax_SVG_glyphs path')
            .attr('stroke-width', 0);
    }

    // fix for IE namespacing quirk?
    // http://stackoverflow.com/questions/19610089/unwanted-namespaces-on-svg-markup-when-using-xmlserializer-in-javascript-with-ie
    svg.node().setAttributeNS(xmlnsNamespaces.xmlns, 'xmlns', xmlnsNamespaces.svg);
    svg.node().setAttributeNS(xmlnsNamespaces.xmlns, 'xmlns:xlink', xmlnsNamespaces.xlink);

    var s = new window.XMLSerializer().serializeToString(svg.node());
    s = svgTextUtils.html_entity_decode(s);
    s = svgTextUtils.xml_entity_encode(s);

    // Fix quotations around font strings
    s = s.replace(/("TOBESTRIPPED)|(TOBESTRIPPED")/g, '\'');

    return s;
};
