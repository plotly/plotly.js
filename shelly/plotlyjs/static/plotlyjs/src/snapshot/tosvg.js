'use strict';
var Plotly = require('../plotly');

module.exports = function toSVG(gd, format) {

    // make background color a rect in the svg, then revert after scraping
    // all other alterations have been dealt with by properly preparing the svg
    // in the first place... like setting cursors with css classes so we don't
    // have to remove them, and providing the right namespaces in the svg to
    // begin with
    var fullLayout = gd._fullLayout,
        svg = fullLayout._paper,
        size = fullLayout._size,
        domain,
        i;

    svg.insert('rect', ':first-child')
        .call(Plotly.Drawing.setRect, 0, 0, fullLayout.width, fullLayout.height)
        .call(Plotly.Color.fill, fullLayout.paper_bgcolor);

    /* Grab the 3d scenes and rasterize em. Calculate their positions,
     * then insert them into the SVG element as images */
    var sceneIds = Plotly.Plots.getSubplotIds(fullLayout, 'gl3d'),
        scene,
        imageData;

    for(i = 0; i < sceneIds.length; i++) {
        scene = fullLayout[sceneIds[i]];
        imageData = scene._scene.toImage('png'); // Grab dem pixels!
        domain = scene.domain;

        fullLayout._glimages.append('svg:image')
            .attr({
                xmlns:'http://www.w3.org/2000/svg',
                'xlink:xlink:href': imageData, // odd d3 quirk, need namespace twice
                height: size.h * (domain.y[1] - domain.y[0]),
                width: size.w * (domain.x[1] - domain.x[0]),
                x: size.l + size.w * domain.x[0],
                y: size.t + size.h * (1 - domain.y[1]),
                preserveAspectRatio: 'none'
            });

        scene._scene.destroy();
    }

    // Grab the geos off the geo-container and place them in geoimages
    var geoIds = Plotly.Plots.getSubplotIds(fullLayout, 'geo'),
        geoLayout,
        geoFramework;

    for(i = 0; i < geoIds.length; i++) {
        geoLayout = fullLayout[geoIds[i]];
        domain = geoLayout.domain;
        geoFramework = geoLayout._geo.framework;

        geoFramework.attr('style', null);
        geoFramework
            .attr({
                x: size.l + size.w * domain.x[0] + geoLayout._marginX,
                y: size.t + size.h * (1 - domain.y[1]) + geoLayout._marginY,
                width: geoLayout._width,
                height: geoLayout._height
            });

        fullLayout._geoimages.node()
            .appendChild(geoFramework.node());
    }

    // now that we've got the 3d images in the right layer, add top items above them
    // assumes everything in toppaper is a group, and if it's empty (like hoverlayer)
    // we can ignore it
    if(fullLayout._toppaper) {
        var topGroups = fullLayout._toppaper.node().childNodes,
            topGroup;
        for(i = 0; i < topGroups.length; i++) {
            topGroup = topGroups[i];
            if(topGroup.childNodes.length) svg.node().appendChild(topGroup);
        }
    }

    // in case the svg element had an explicit background color, remove this
    // we want the rect to get the color so it's the right size; svg bg will
    // fill whatever container it's displayed in regardless of plot size.
    svg.node().style.background = '';

    svg.selectAll('text')
        .attr({'data-unformatted': null})
        .each(function() {
            // hidden text is pre-formatting mathjax, the browser ignores it but it can still confuse batik
            var txt = window.d3.select(this);
            if(txt.style('visibility') === 'hidden') {
                txt.remove();
                return;
            }

            // I've seen font-family styles with non-escaped double quotes in them - breaks the
            // serialized svg because the style attribute itself is double-quoted!
            // Is this an IE thing? Any other attributes or style elements that can have quotes in them?
            // TODO: this looks like a noop right now - what happened to it?
            var ff = txt.style('font-family');
            if(ff && ff.indexOf('"') !== -1) txt.style('font-family', ff.replace(/"/g, '"'));
        });

    if(format === 'pdf' || format === 'eps') {
        // these formats make the extra line MathJax adds around symbols look super thick in some cases
        // it looks better if this is removed entirely.
        svg.selectAll('#MathJax_SVG_glyphs path')
            .attr('stroke-width', 0);
    }

    // fix for IE namespacing quirk?
    // http://stackoverflow.com/questions/19610089/unwanted-namespaces-on-svg-markup-when-using-xmlserializer-in-javascript-with-ie
    svg.node().setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns', 'http://www.w3.org/2000/svg');
    svg.node().setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink');

    var s = new window.XMLSerializer().serializeToString(svg.node());
    s = Plotly.util.html_entity_decode(s);
    s = Plotly.util.xml_entity_encode(s);

    return s;
};
