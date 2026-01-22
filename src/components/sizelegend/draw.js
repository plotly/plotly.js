'use strict';

var d3 = require('@plotly/d3');

var Lib = require('../../lib');
var Registry = require('../../registry');
var Plots = require('../../plots/plots');
var Drawing = require('../drawing');
var Color = require('../color');

var getSizelegendData = require('./get_data');
var constants = require('./constants');

var alignmentConstants = require('../../constants/alignment');
var FROM_TL = alignmentConstants.FROM_TL;
var FROM_BR = alignmentConstants.FROM_BR;

var SIZELEGEND_PATTERN = /^sizelegend([2-9]|[1-9][0-9]+)?$/;

module.exports = function draw(gd) {
    var fullLayout = gd._fullLayout;
    var sizelegendIds = fullLayout._sizelegends || [];

    // Remove old sizelegends that won't stay on the graph
    var oldSizelegends = fullLayout._infolayer.selectAll('[class^="sizelegend"]');
    oldSizelegends.each(function() {
        var el = d3.select(this);
        var classes = el.attr('class');
        var cls = classes.split(' ')[0];
        if(cls.match(SIZELEGEND_PATTERN) && sizelegendIds.indexOf(cls) === -1) {
            el.remove();
        }
    });

    // Draw each sizelegend
    for(var i = 0; i < sizelegendIds.length; i++) {
        var id = sizelegendIds[i];
        var opts = fullLayout[id];
        if(opts && opts.visible) {
            drawOne(gd, opts);
        }
    }
};

function drawOne(gd, opts) {
    var fullLayout = gd._fullLayout;
    var id = opts._id;

    // Get data
    var legendData = getSizelegendData(gd, id);
    if(!legendData || !legendData.length) {
        fullLayout._infolayer.selectAll('.' + id).remove();
        return;
    }

    // Create/update main group
    var legend = Lib.ensureSingle(fullLayout._infolayer, 'g', id);
    legend.attr('class', id + ' sizelegend')
        .style('overflow', 'visible');

    // Background rect
    var bg = Lib.ensureSingle(legend, 'rect', 'bg');
    bg.attr('shape-rendering', 'crispEdges');

    // Items container
    var itemsGroup = Lib.ensureSingle(legend, 'g', 'items');

    // Bind data and create items
    var items = itemsGroup.selectAll('g.sizelegend-item')
        .data(legendData, function(d) { return String(d.value); });

    // Exit old items
    items.exit().remove();

    // Enter new items
    items.enter().append('g')
        .attr('class', 'sizelegend-item')
        .style('cursor', opts.itemclick !== false ? 'pointer' : 'default');

    // Re-select all items (enter + update)
    items = itemsGroup.selectAll('g.sizelegend-item');

    // Layout configuration
    var isVertical = opts.orientation === 'v';
    var itemGap = constants.itemGap;
    var textGap = constants.textGap;
    var padding = constants.padding;
    var borderWidth = opts.borderwidth;

    // Find max display size for layout calculations
    var maxDisplaySize = 0;
    legendData.forEach(function(d) {
        maxDisplaySize = Math.max(maxDisplaySize, d.displaySize);
    });

    var maxTextWidth = 0;
    var totalHeight = 0;
    var totalWidth = 0;

    // Update items
    items.each(function(d, i) {
        var item = d3.select(this);
        var radius = d.displaySize / 2;

        // Circle symbol - centered in the allocated space
        var circle = Lib.ensureSingle(item, 'circle', 'symbol');
        circle
            .attr('cx', maxDisplaySize / 2)
            .attr('cy', maxDisplaySize / 2)
            .attr('r', radius);

        Color.fill(circle, opts.symbolcolor);
        Color.stroke(circle, opts.symboloutlinecolor);
        circle.style('stroke-width', opts.symboloutlinewidth + 'px');

        // Label text
        var label = Lib.ensureSingle(item, 'text', 'label');
        label
            .attr('x', maxDisplaySize + textGap)
            .attr('y', maxDisplaySize / 2)
            .attr('dy', '0.35em')
            .text(d.displayValue);

        Drawing.font(label, opts.font);

        // Measure text width
        var textBBox = label.node().getBBox();
        maxTextWidth = Math.max(maxTextWidth, textBBox.width);

        // Position item
        if(isVertical) {
            Drawing.setTranslate(item, 0, i * (maxDisplaySize + itemGap));
        } else {
            // Horizontal layout - will be repositioned after measuring
            item.attr('data-index', i);
        }

        // Store data for click handling
        item.datum(d);
    });

    // Calculate dimensions
    maxTextWidth = Math.max(maxTextWidth, 20);
    var totalItemWidth = maxDisplaySize + textGap + maxTextWidth;

    // Second pass: add click target rects now that we know dimensions
    var clickTargetWidth = totalItemWidth;
    items.each(function(d) {
        var item = d3.select(this);

        // Transparent click target rect - must cover entire item area
        var clickTarget = Lib.ensureSingle(item, 'rect', 'clicktarget');
        clickTarget
            .attr('width', clickTargetWidth)
            .attr('height', maxDisplaySize)
            .attr('x', 0)
            .attr('y', 0)
            .style('fill', 'transparent')
            .style('cursor', 'pointer')
            .attr('pointer-events', 'all');
    });

    if(isVertical) {
        totalWidth = totalItemWidth + padding * 2;
        totalHeight = legendData.length * (maxDisplaySize + itemGap) - itemGap + padding * 2;
    } else {
        // Horizontal: reposition items
        var offsetX = 0;
        items.each(function() {
            var item = d3.select(this);
            Drawing.setTranslate(item, offsetX, 0);
            offsetX += totalItemWidth + itemGap * 2;
        });
        totalWidth = offsetX - itemGap * 2 + padding * 2;
        totalHeight = maxDisplaySize + padding * 2;
    }

    // Handle title
    var titleHeight = 0;
    if(opts.title && opts.title.text) {
        var title = Lib.ensureSingle(legend, 'text', 'legendtitle');
        title
            .attr('class', 'legendtitle')
            .attr('x', padding)
            .attr('y', padding)
            .attr('dy', '1em')
            .text(opts.title.text);

        var titleFont = opts.title.font || opts.font;
        Drawing.font(title, titleFont);

        var titleBBox = title.node().getBBox();
        titleHeight = titleBBox.height + itemGap;
        totalHeight += titleHeight;

        // Ensure legend is wide enough for title
        totalWidth = Math.max(totalWidth, titleBBox.width + padding * 2);

        Drawing.setTranslate(itemsGroup, padding, padding + titleHeight);
    } else {
        legend.selectAll('.legendtitle').remove();
        Drawing.setTranslate(itemsGroup, padding, padding);
    }

    // Set background size and style
    bg.attr('width', totalWidth)
        .attr('height', totalHeight);

    Color.fill(bg, opts.bgcolor);
    Color.stroke(bg, opts.bordercolor);
    bg.style('stroke-width', borderWidth + 'px');

    // Store dimensions for positioning
    opts._width = totalWidth;
    opts._height = totalHeight;

    // Position legend and reserve margin space
    positionLegend(gd, legend, opts, totalWidth, totalHeight);
    computeAutoMargin(gd, opts);

    // Setup click handlers
    setupClickHandlers(gd, items, opts);
}

function computeAutoMargin(gd, opts) {
    var id = opts._id;
    var xanchor = opts.xanchor === 'auto' ?
        (opts.x < 0.5 ? 'left' : 'right') : opts.xanchor;
    var yanchor = opts.yanchor === 'auto' ?
        (opts.y < 0.5 ? 'bottom' : 'top') : opts.yanchor;

    // Only auto-margin when using paper reference
    if(opts.xref === 'paper' && opts.yref === 'paper') {
        Plots.autoMargin(gd, id, {
            x: opts.x,
            y: opts.y,
            l: opts._width * FROM_TL[xanchor],
            r: opts._width * FROM_BR[xanchor],
            b: opts._height * FROM_BR[yanchor],
            t: opts._height * FROM_TL[yanchor]
        });
    }
}

function positionLegend(gd, legend, opts, width, height) {
    var fullLayout = gd._fullLayout;
    var gs = fullLayout._size;

    var isPaperX = opts.xref === 'paper';
    var isPaperY = opts.yref === 'paper';

    // Calculate anchor multipliers
    var anchorX = getXAnchorFraction(opts);
    var anchorY = getYAnchorFraction(opts);

    var lx, ly;

    if(isPaperX) {
        lx = gs.l + gs.w * opts.x - anchorX * width;
    } else {
        lx = fullLayout.width * opts.x - anchorX * width;
    }

    if(isPaperY) {
        ly = gs.t + gs.h * (1 - opts.y) - anchorY * height;
    } else {
        ly = fullLayout.height * (1 - opts.y) - anchorY * height;
    }

    Drawing.setTranslate(legend, Math.round(lx), Math.round(ly));
}

function getXAnchorFraction(opts) {
    var xanchor = opts.xanchor;
    if(xanchor === 'auto') {
        // Auto anchor based on x position
        if(opts.x <= 0.33) return 0;  // left
        if(opts.x >= 0.67) return 1;  // right
        return 0.5;  // center
    }
    return {left: 0, center: 0.5, right: 1}[xanchor] || 0;
}

function getYAnchorFraction(opts) {
    var yanchor = opts.yanchor;
    if(yanchor === 'auto') {
        // Auto anchor based on y position
        if(opts.y <= 0.33) return 1;  // bottom
        if(opts.y >= 0.67) return 0;  // top
        return 0.5;  // middle
    }
    return {top: 0, middle: 0.5, bottom: 1}[yanchor] || 0;
}

function setupClickHandlers(gd, items, opts) {
    if(opts.itemclick === false && opts.itemdoubleclick === false) {
        items.style('cursor', 'default');
        items.on('mousedown', null);
        items.on('mouseup', null);
        items.on('click', null);
        return;
    }

    var doubleClickDelay = gd._context.doubleClickDelay || 300;
    var lastClickTime = 0;
    var clickCount = 0;

    items.on('mousedown', function() {
        var now = Date.now();
        if(now - lastClickTime < doubleClickDelay) {
            clickCount++;
        } else {
            clickCount = 1;
        }
        lastClickTime = now;
    });

    items.on('mouseup', function() {
        var d = d3.select(this).datum();
        var now = Date.now();
        if(now - lastClickTime > doubleClickDelay) {
            clickCount = Math.max(clickCount - 1, 1);
        }

        handleClick(gd, d, clickCount, opts);
    });
}

function handleClick(gd, itemData, numClicks, opts) {
    var action = numClicks === 2 ? opts.itemdoubleclick : opts.itemclick;
    if(!action) return;

    var fullLayout = gd._fullLayout;
    var hiddenSizes = fullLayout._hiddenSizelegendValues || {};
    var id = opts._id;

    if(!hiddenSizes[id]) {
        hiddenSizes[id] = [];
    }

    var valueKey = String(itemData.value);
    var isHidden = hiddenSizes[id].indexOf(valueKey) !== -1;

    if(action === 'toggle') {
        if(isHidden) {
            // Show this value
            hiddenSizes[id] = hiddenSizes[id].filter(function(v) { return v !== valueKey; });
        } else {
            // Hide this value
            hiddenSizes[id].push(valueKey);
        }
    } else if(action === 'toggleothers') {
        // Get all values for this legend
        var legendData = getSizelegendData(gd, id);
        var allValues = legendData.map(function(d) { return String(d.value); });

        if(isHidden && hiddenSizes[id].length === allValues.length - 1) {
            // Only this one showing, show all
            hiddenSizes[id] = [];
        } else {
            // Hide all except this one
            hiddenSizes[id] = allValues.filter(function(v) { return v !== valueKey; });
        }
    }

    fullLayout._hiddenSizelegendValues = hiddenSizes;

    // Trigger redraw via Registry
    Registry.call('_guiRelayout', gd, {});
}
