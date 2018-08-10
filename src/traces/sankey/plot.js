/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');
var render = require('./render');
var Fx = require('../../components/fx');
var Color = require('../../components/color');
var Lib = require('../../lib');
var cn = require('./constants').cn;

var _ = Lib._;

function renderableValuePresent(d) {return d !== '';}

function ownTrace(selection, d) {
    return selection.filter(function(s) {return s.key === d.traceId;});
}

function makeTranslucent(element, alpha) {
    d3.select(element)
        .select('path')
        .style('fill-opacity', alpha);
    d3.select(element)
        .select('rect')
        .style('fill-opacity', alpha);
}

function makeTextContrasty(element) {
    d3.select(element)
        .select('text.name')
        .style('fill', 'black');
}

function relatedLinks(d) {
    return function(l) {
        return d.node.sourceLinks.indexOf(l.link) !== -1 || d.node.targetLinks.indexOf(l.link) !== -1;
    };
}

function relatedNodes(l) {
    return function(d) {
        return d.node.sourceLinks.indexOf(l.link) !== -1 || d.node.targetLinks.indexOf(l.link) !== -1;
    };
}

function nodeHoveredStyle(sankeyNode, d, sankey) {
    if(d && sankey) {
        ownTrace(sankey, d)
            .selectAll('.' + cn.sankeyLink)
            .filter(relatedLinks(d))
            .call(linkHoveredStyle.bind(0, d, sankey, false));
    }
}

function nodeNonHoveredStyle(sankeyNode, d, sankey) {
    if(d && sankey) {
        ownTrace(sankey, d)
            .selectAll('.' + cn.sankeyLink)
            .filter(relatedLinks(d))
            .call(linkNonHoveredStyle.bind(0, d, sankey, false));
    }
}

function linkHoveredStyle(d, sankey, visitNodes, sankeyLink) {

    var label = sankeyLink.datum().link.label;

    sankeyLink.style('fill-opacity', 0.4);

    if(label) {
        ownTrace(sankey, d)
            .selectAll('.' + cn.sankeyLink)
            .filter(function(l) {return l.link.label === label;})
            .style('fill-opacity', 0.4);
    }

    if(visitNodes) {
        ownTrace(sankey, d)
            .selectAll('.' + cn.sankeyNode)
            .filter(relatedNodes(d))
            .call(nodeHoveredStyle);
    }
}

function linkNonHoveredStyle(d, sankey, visitNodes, sankeyLink) {

    var label = sankeyLink.datum().link.label;

    sankeyLink.style('fill-opacity', function(d) {return d.tinyColorAlpha;});

    if(label) {
        ownTrace(sankey, d)
            .selectAll('.' + cn.sankeyLink)
            .filter(function(l) {return l.link.label === label;})
            .style('fill-opacity', function(d) {return d.tinyColorAlpha;});
    }

    if(visitNodes) {
        ownTrace(sankey, d)
            .selectAll(cn.sankeyNode)
            .filter(relatedNodes(d))
            .call(nodeNonHoveredStyle);
    }
}

// does not support array values for now
function castHoverOption(trace, attr) {
    var labelOpts = trace.hoverlabel || {};
    var val = Lib.nestedProperty(labelOpts, attr).get();
    return Array.isArray(val) ? false : val;
}

module.exports = function plot(gd, calcData) {
    var fullLayout = gd._fullLayout;
    var svg = fullLayout._paper;
    var size = fullLayout._size;

    var linkSelect = function(element, d) {
        var evt = d.link;
        evt.originalEvent = d3.event;
        gd._hoverdata = [evt];
        Fx.click(gd, { target: true });
    };

    var linkHover = function(element, d, sankey) {
        d3.select(element).call(linkHoveredStyle.bind(0, d, sankey, true));
        gd.emit('plotly_hover', {
            event: d3.event,
            points: [d.link]
        });
    };

    var sourceLabel = _(gd, 'source:') + ' ';
    var targetLabel = _(gd, 'target:') + ' ';
    var incomingLabel = _(gd, 'incoming flow count:') + ' ';
    var outgoingLabel = _(gd, 'outgoing flow count:') + ' ';

    var linkHoverFollow = function(element, d) {
        var trace = d.link.trace;
        var rootBBox = gd._fullLayout._paperdiv.node().getBoundingClientRect();
        var boundingBox = element.getBoundingClientRect();
        var hoverCenterX = boundingBox.left + boundingBox.width / 2;
        var hoverCenterY = boundingBox.top + boundingBox.height / 2;

        var tooltip = Fx.loneHover({
            x: hoverCenterX - rootBBox.left,
            y: hoverCenterY - rootBBox.top,
            name: d3.format(d.valueFormat)(d.link.value) + d.valueSuffix,
            text: [
                d.link.label || '',
                sourceLabel + d.link.source.label,
                targetLabel + d.link.target.label
            ].filter(renderableValuePresent).join('<br>'),
            color: castHoverOption(trace, 'bgcolor') || Color.addOpacity(d.tinyColorHue, 1),
            borderColor: castHoverOption(trace, 'bordercolor'),
            fontFamily: castHoverOption(trace, 'font.family'),
            fontSize: castHoverOption(trace, 'font.size'),
            fontColor: castHoverOption(trace, 'font.color'),
            idealAlign: d3.event.x < hoverCenterX ? 'right' : 'left'
        }, {
            container: fullLayout._hoverlayer.node(),
            outerContainer: fullLayout._paper.node(),
            gd: gd
        });

        makeTranslucent(tooltip, 0.65);
        makeTextContrasty(tooltip);
    };

    var linkUnhover = function(element, d, sankey) {
        d3.select(element).call(linkNonHoveredStyle.bind(0, d, sankey, true));
        gd.emit('plotly_unhover', {
            event: d3.event,
            points: [d.link]
        });

        Fx.loneUnhover(fullLayout._hoverlayer.node());
    };

    var nodeSelect = function(element, d, sankey) {
        var evt = d.node;
        evt.originalEvent = d3.event;
        gd._hoverdata = [evt];
        d3.select(element).call(nodeNonHoveredStyle, d, sankey);
        Fx.click(gd, { target: true });
    };

    var nodeHover = function(element, d, sankey) {
        d3.select(element).call(nodeHoveredStyle, d, sankey);
        gd.emit('plotly_hover', {
            event: d3.event,
            points: [d.node]
        });
    };

    var nodeHoverFollow = function(element, d) {
        var trace = d.node.trace;
        var nodeRect = d3.select(element).select('.' + cn.nodeRect);
        var rootBBox = gd._fullLayout._paperdiv.node().getBoundingClientRect();
        var boundingBox = nodeRect.node().getBoundingClientRect();
        var hoverCenterX0 = boundingBox.left - 2 - rootBBox.left;
        var hoverCenterX1 = boundingBox.right + 2 - rootBBox.left;
        var hoverCenterY = boundingBox.top + boundingBox.height / 4 - rootBBox.top;

        var tooltip = Fx.loneHover({
            x0: hoverCenterX0,
            x1: hoverCenterX1,
            y: hoverCenterY,
            name: d3.format(d.valueFormat)(d.node.value) + d.valueSuffix,
            text: [
                d.node.label,
                incomingLabel + d.node.targetLinks.length,
                outgoingLabel + d.node.sourceLinks.length
            ].filter(renderableValuePresent).join('<br>'),
            color: castHoverOption(trace, 'bgcolor') || d.tinyColorHue,
            borderColor: castHoverOption(trace, 'bordercolor'),
            fontFamily: castHoverOption(trace, 'font.family'),
            fontSize: castHoverOption(trace, 'font.size'),
            fontColor: castHoverOption(trace, 'font.color'),
            idealAlign: 'left'
        }, {
            container: fullLayout._hoverlayer.node(),
            outerContainer: fullLayout._paper.node(),
            gd: gd
        });

        makeTranslucent(tooltip, 0.85);
        makeTextContrasty(tooltip);
    };

    var nodeUnhover = function(element, d, sankey) {
        d3.select(element).call(nodeNonHoveredStyle, d, sankey);
        gd.emit('plotly_unhover', {
            event: d3.event,
            points: [d.node]
        });

        Fx.loneUnhover(fullLayout._hoverlayer.node());
    };

    render(
        svg,
        calcData,
        {
            width: size.w,
            height: size.h,
            margin: {
                t: size.t,
                r: size.r,
                b: size.b,
                l: size.l
            }
        },
        {
            linkEvents: {
                hover: linkHover,
                follow: linkHoverFollow,
                unhover: linkUnhover,
                select: linkSelect
            },
            nodeEvents: {
                hover: nodeHover,
                follow: nodeHoverFollow,
                unhover: nodeUnhover,
                select: nodeSelect
            }
        }
    );
};
