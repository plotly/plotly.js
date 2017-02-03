/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var Plots = require('../../plots/plots');
var Color = require('../color');
var Drawing = require('../drawing');
var svgTextUtils = require('../../lib/svg_text_utils');
var anchorUtils = require('../legend/anchor_utils');

var constants = require('./constants');
var ScrollBox = require('./scrollbox');

module.exports = function draw(gd) {
    var fullLayout = gd._fullLayout,
        menuData = makeMenuData(fullLayout);

    /* Update menu data is bound to the header-group.
     * The items in the header group are always present.
     *
     * Upon clicking on a header its corresponding button
     * data is bound to the button-group.
     *
     * We draw all headers in one group before all buttons
     * so that the buttons *always* appear above the headers.
     *
     * Note that only one set of buttons are visible at once.
     *
     * <g container />
     *
     *     <g header-group />
     *         <g item header />
     *         <text item header-arrow />
     *     <g header-group />
     *         <g item header />
     *         <text item header-arrow />
     *     ...
     *
     *     <g button-group />
     *         <g item button />
     *         <g item button />
     *         ...
     */

    // draw update menu container
    var menus = fullLayout._infolayer
        .selectAll('g.' + constants.containerClassName)
        .data(menuData.length > 0 ? [0] : []);

    menus.enter().append('g')
        .classed(constants.containerClassName, true)
        .style('cursor', 'pointer');

    menus.exit().remove();

    // remove push margin object(s)
    if(menus.exit().size()) clearPushMargins(gd);

    // return early if no update menus are visible
    if(menuData.length === 0) return;

    // join header group
    var headerGroups = menus.selectAll('g.' + constants.headerGroupClassName)
        .data(menuData, keyFunction);

    headerGroups.enter().append('g')
        .classed(constants.headerGroupClassName, true);

    // draw dropdown button container
    var gButton = menus.selectAll('g.' + constants.dropdownButtonGroupClassName)
        .data([0]);

    gButton.enter().append('g')
        .classed(constants.dropdownButtonGroupClassName, true)
        .style('pointer-events', 'all');

    // find dimensions before plotting anything (this mutates menuOpts)
    for(var i = 0; i < menuData.length; i++) {
        var menuOpts = menuData[i];
        findDimensions(gd, menuOpts);
    }

    // setup scrollbox
    var scrollBoxId = 'updatemenus' + fullLayout._uid,
        scrollBox = new ScrollBox(gd, gButton, scrollBoxId);

    // remove exiting header, remove dropped buttons and reset margins
    if(headerGroups.enter().size()) {
        gButton
            .call(removeAllButtons)
            .attr(constants.menuIndexAttrName, '-1');
    }

    headerGroups.exit().each(function(menuOpts) {
        d3.select(this).remove();

        gButton
            .call(removeAllButtons)
            .attr(constants.menuIndexAttrName, '-1');

        Plots.autoMargin(gd, constants.autoMarginIdRoot + menuOpts._index);
    });

    // draw headers!
    headerGroups.each(function(menuOpts) {
        var gHeader = d3.select(this);

        var _gButton = menuOpts.type === 'dropdown' ? gButton : null;
        Plots.manageCommandObserver(gd, menuOpts, menuOpts.buttons, function(data) {
            setActive(gd, menuOpts, menuOpts.buttons[data.index], gHeader, _gButton, scrollBox, data.index, true);
        });

        if(menuOpts.type === 'dropdown') {
            drawHeader(gd, gHeader, gButton, scrollBox, menuOpts);

            // if this menu is active, update the dropdown container
            if(isActive(gButton, menuOpts)) {
                drawButtons(gd, gHeader, gButton, scrollBox, menuOpts);
            }
        } else {
            drawButtons(gd, gHeader, null, null, menuOpts);
        }

    });
};

function makeMenuData(fullLayout) {
    var contOpts = fullLayout[constants.name],
        menuData = [];

    // Filter visible dropdowns and attach '_index' to each
    // fullLayout options object to be used for 'object constancy'
    // in the data join key function.

    for(var i = 0; i < contOpts.length; i++) {
        var item = contOpts[i];

        if(item.visible) menuData.push(item);
    }

    return menuData;
}

// Note that '_index' is set at the default step,
// it corresponds to the menu index in the user layout update menu container.
// Because a menu can b set invisible,
// this is a more 'consistent' field than the index in the menuData.
function keyFunction(menuOpts) {
    return menuOpts._index;
}

function isFolded(gButton) {
    return +gButton.attr(constants.menuIndexAttrName) === -1;
}

function isActive(gButton, menuOpts) {
    return +gButton.attr(constants.menuIndexAttrName) === menuOpts._index;
}

function setActive(gd, menuOpts, buttonOpts, gHeader, gButton, scrollBox, buttonIndex, isSilentUpdate) {
    // update 'active' attribute in menuOpts
    menuOpts._input.active = menuOpts.active = buttonIndex;

    if(menuOpts.type === 'buttons') {
        drawButtons(gd, gHeader, null, null, menuOpts);
    }
    else if(menuOpts.type === 'dropdown') {
        // fold up buttons and redraw header
        gButton.attr(constants.menuIndexAttrName, '-1');

        drawHeader(gd, gHeader, gButton, scrollBox, menuOpts);

        if(!isSilentUpdate) {
            drawButtons(gd, gHeader, gButton, scrollBox, menuOpts);
        }
    }
}

function drawHeader(gd, gHeader, gButton, scrollBox, menuOpts) {
    var header = gHeader.selectAll('g.' + constants.headerClassName)
        .data([0]);

    header.enter().append('g')
        .classed(constants.headerClassName, true)
        .style('pointer-events', 'all');

    var active = menuOpts.active,
        headerOpts = menuOpts.buttons[active] || constants.blankHeaderOpts,
        posOpts = { y: menuOpts.pad.t, yPad: 0, x: menuOpts.pad.l, xPad: 0, index: 0 },
        positionOverrides = {
            width: menuOpts.headerWidth,
            height: menuOpts.headerHeight
        };

    header
        .call(drawItem, menuOpts, headerOpts)
        .call(setItemPosition, menuOpts, posOpts, positionOverrides);

    // draw drop arrow at the right edge
    var arrow = gHeader.selectAll('text.' + constants.headerArrowClassName)
        .data([0]);

    arrow.enter().append('text')
        .classed(constants.headerArrowClassName, true)
        .classed('user-select-none', true)
        .attr('text-anchor', 'end')
        .call(Drawing.font, menuOpts.font)
        .text('▼');

    arrow.attr({
        x: menuOpts.headerWidth - constants.arrowOffsetX + menuOpts.pad.l,
        y: menuOpts.headerHeight / 2 + constants.textOffsetY + menuOpts.pad.t
    });

    header.on('click', function() {
        gButton.call(removeAllButtons);


        // if this menu is active, fold the dropdown container
        // otherwise, make this menu active
        gButton.attr(
            constants.menuIndexAttrName,
            isActive(gButton, menuOpts) ?
                -1 :
                String(menuOpts._index)
        );

        drawButtons(gd, gHeader, gButton, scrollBox, menuOpts);
    });

    header.on('mouseover', function() {
        header.call(styleOnMouseOver);
    });

    header.on('mouseout', function() {
        header.call(styleOnMouseOut, menuOpts);
    });

    // translate header group
    Drawing.setTranslate(gHeader, menuOpts.lx, menuOpts.ly);
}

function drawButtons(gd, gHeader, gButton, scrollBox, menuOpts) {
    // If this is a set of buttons, set pointer events = all since we play
    // some minor games with which container is which in order to simplify
    // the drawing of *either* buttons or menus
    if(!gButton) {
        gButton = gHeader;
        gButton.attr('pointer-events', 'all');
    }

    var buttonData = (!isFolded(gButton) || menuOpts.type === 'buttons') ?
        menuOpts.buttons :
        [];

    var klass = menuOpts.type === 'dropdown' ? constants.dropdownButtonClassName : constants.buttonClassName;

    var buttons = gButton.selectAll('g.' + klass)
        .data(buttonData);

    var enter = buttons.enter().append('g')
        .classed(klass, true);

    var exit = buttons.exit();

    if(menuOpts.type === 'dropdown') {
        enter.attr('opacity', '0')
            .transition()
            .attr('opacity', '1');

        exit.transition()
            .attr('opacity', '0')
            .remove();
    } else {
        exit.remove();
    }

    var x0 = 0;
    var y0 = 0;

    var isVertical = ['up', 'down'].indexOf(menuOpts.direction) !== -1;

    if(menuOpts.type === 'dropdown') {
        if(isVertical) {
            y0 = menuOpts.headerHeight + constants.gapButtonHeader;
        } else {
            x0 = menuOpts.headerWidth + constants.gapButtonHeader;
        }
    }

    if(menuOpts.type === 'dropdown' && menuOpts.direction === 'up') {
        y0 = -constants.gapButtonHeader + constants.gapButton - menuOpts.openHeight;
    }

    if(menuOpts.type === 'dropdown' && menuOpts.direction === 'left') {
        x0 = -constants.gapButtonHeader + constants.gapButton - menuOpts.openWidth;
    }

    var posOpts = {
        x: menuOpts.lx + x0 + menuOpts.pad.l,
        y: menuOpts.ly + y0 + menuOpts.pad.t,
        yPad: constants.gapButton,
        xPad: constants.gapButton,
        index: 0,
    };

    var scrollBoxPosition = {
        l: posOpts.x + menuOpts.borderwidth,
        t: posOpts.y + menuOpts.borderwidth
    };

    buttons.each(function(buttonOpts, buttonIndex) {
        var button = d3.select(this);

        button
            .call(drawItem, menuOpts, buttonOpts)
            .call(setItemPosition, menuOpts, posOpts);

        button.on('click', function() {
            // skip `dragend` events
            if(d3.event.defaultPrevented) return;

            setActive(gd, menuOpts, buttonOpts, gHeader, gButton, scrollBox, buttonIndex);

            Plots.executeAPICommand(gd, buttonOpts.method, buttonOpts.args);

            gd.emit('plotly_buttonclicked', {menu: menuOpts, button: buttonOpts, active: menuOpts.active});
        });

        button.on('mouseover', function() {
            button.call(styleOnMouseOver);
        });

        button.on('mouseout', function() {
            button.call(styleOnMouseOut, menuOpts);
            buttons.call(styleButtons, menuOpts);
        });
    });

    buttons.call(styleButtons, menuOpts);

    if(isVertical) {
        scrollBoxPosition.w = Math.max(menuOpts.openWidth, menuOpts.headerWidth);
        scrollBoxPosition.h = posOpts.y - scrollBoxPosition.t;
    }
    else {
        scrollBoxPosition.w = posOpts.x - scrollBoxPosition.l;
        scrollBoxPosition.h = Math.max(menuOpts.openHeight, menuOpts.headerHeight);
    }

    scrollBoxPosition.direction = menuOpts.direction;

    if(scrollBox) {
        if(buttons.size()) {
            drawScrollBox(gd, gHeader, gButton, scrollBox, menuOpts, scrollBoxPosition);
        }
        else {
            hideScrollBox(scrollBox);
        }
    }
}

function drawScrollBox(gd, gHeader, gButton, scrollBox, menuOpts, position) {
    // enable the scrollbox
    var direction = menuOpts.direction,
        isVertical = (direction === 'up' || direction === 'down');

    var active = menuOpts.active,
        translateX, translateY,
        i;
    if(isVertical) {
        translateY = 0;
        for(i = 0; i < active; i++) {
            translateY += menuOpts.heights[i] + constants.gapButton;
        }
    }
    else {
        translateX = 0;
        for(i = 0; i < active; i++) {
            translateX += menuOpts.widths[i] + constants.gapButton;
        }
    }

    scrollBox.enable(position, translateX, translateY);

    if(scrollBox.hbar) {
        scrollBox.hbar
            .attr('opacity', '0')
            .transition()
            .attr('opacity', '1');
    }

    if(scrollBox.vbar) {
        scrollBox.vbar
            .attr('opacity', '0')
            .transition()
            .attr('opacity', '1');
    }
}

function hideScrollBox(scrollBox) {
    var hasHBar = !!scrollBox.hbar,
        hasVBar = !!scrollBox.vbar;

    if(hasHBar) {
        scrollBox.hbar
            .transition()
            .attr('opacity', '0')
            .each('end', function() {
                hasHBar = false;
                if(!hasVBar) scrollBox.disable();
            });
    }

    if(hasVBar) {
        scrollBox.vbar
            .transition()
            .attr('opacity', '0')
            .each('end', function() {
                hasVBar = false;
                if(!hasHBar) scrollBox.disable();
            });
    }
}

function drawItem(item, menuOpts, itemOpts) {
    item.call(drawItemRect, menuOpts)
        .call(drawItemText, menuOpts, itemOpts);
}

function drawItemRect(item, menuOpts) {
    var rect = item.selectAll('rect')
        .data([0]);

    rect.enter().append('rect')
        .classed(constants.itemRectClassName, true)
        .attr({
            rx: constants.rx,
            ry: constants.ry,
            'shape-rendering': 'crispEdges'
        });

    rect.call(Color.stroke, menuOpts.bordercolor)
        .call(Color.fill, menuOpts.bgcolor)
        .style('stroke-width', menuOpts.borderwidth + 'px');
}

function drawItemText(item, menuOpts, itemOpts) {
    var text = item.selectAll('text')
        .data([0]);

    text.enter().append('text')
        .classed(constants.itemTextClassName, true)
        .classed('user-select-none', true)
        .attr('text-anchor', 'start');

    text.call(Drawing.font, menuOpts.font)
        .text(itemOpts.label)
        .call(svgTextUtils.convertToTspans);
}

function styleButtons(buttons, menuOpts) {
    var active = menuOpts.active;

    buttons.each(function(buttonOpts, i) {
        var button = d3.select(this);

        if(i === active && menuOpts.showactive) {
            button.select('rect.' + constants.itemRectClassName)
                .call(Color.fill, constants.activeColor);
        }
    });
}

function styleOnMouseOver(item) {
    item.select('rect.' + constants.itemRectClassName)
        .call(Color.fill, constants.hoverColor);
}

function styleOnMouseOut(item, menuOpts) {
    item.select('rect.' + constants.itemRectClassName)
        .call(Color.fill, menuOpts.bgcolor);
}

// find item dimensions (this mutates menuOpts)
function findDimensions(gd, menuOpts) {
    menuOpts.width1 = 0;
    menuOpts.height1 = 0;
    menuOpts.heights = [];
    menuOpts.widths = [];
    menuOpts.totalWidth = 0;
    menuOpts.totalHeight = 0;
    menuOpts.openWidth = 0;
    menuOpts.openHeight = 0;
    menuOpts.lx = 0;
    menuOpts.ly = 0;

    var fakeButtons = gd._tester.selectAll('g.' + constants.dropdownButtonClassName)
        .data(menuOpts.buttons);

    fakeButtons.enter().append('g')
        .classed(constants.dropdownButtonClassName, true);

    var isVertical = ['up', 'down'].indexOf(menuOpts.direction) !== -1;

    // loop over fake buttons to find width / height
    fakeButtons.each(function(buttonOpts, i) {
        var button = d3.select(this);

        button.call(drawItem, menuOpts, buttonOpts);

        var text = button.select('.' + constants.itemTextClassName),
            tspans = text.selectAll('tspan');

        // width is given by max width of all buttons
        var tWidth = text.node() && Drawing.bBox(text.node()).width,
            wEff = Math.max(tWidth + constants.textPadX, constants.minWidth);

        // height is determined by item text
        var tHeight = menuOpts.font.size * constants.fontSizeToHeight,
            tLines = tspans[0].length || 1,
            hEff = Math.max(tHeight * tLines, constants.minHeight) + constants.textOffsetY;

        hEff = Math.ceil(hEff);
        wEff = Math.ceil(wEff);

        // Store per-item sizes since a row of horizontal buttons, for example,
        // don't all need to be the same width:
        menuOpts.widths[i] = wEff;
        menuOpts.heights[i] = hEff;

        // Height and width of individual element:
        menuOpts.height1 = Math.max(menuOpts.height1, hEff);
        menuOpts.width1 = Math.max(menuOpts.width1, wEff);

        if(isVertical) {
            menuOpts.totalWidth = Math.max(menuOpts.totalWidth, wEff);
            menuOpts.openWidth = menuOpts.totalWidth;
            menuOpts.totalHeight += hEff + constants.gapButton;
            menuOpts.openHeight += hEff + constants.gapButton;
        } else {
            menuOpts.totalWidth += wEff + constants.gapButton;
            menuOpts.openWidth += wEff + constants.gapButton;
            menuOpts.totalHeight = Math.max(menuOpts.totalHeight, hEff);
            menuOpts.openHeight = menuOpts.totalHeight;
        }
    });

    if(isVertical) {
        menuOpts.totalHeight -= constants.gapButton;
    } else {
        menuOpts.totalWidth -= constants.gapButton;
    }


    menuOpts.headerWidth = menuOpts.width1 + constants.arrowPadX;
    menuOpts.headerHeight = menuOpts.height1;

    if(menuOpts.type === 'dropdown') {
        if(isVertical) {
            menuOpts.width1 += constants.arrowPadX;
            menuOpts.totalHeight = menuOpts.height1;
        } else {
            menuOpts.totalWidth = menuOpts.width1;
        }
        menuOpts.totalWidth += constants.arrowPadX;
    }

    fakeButtons.remove();

    var paddedWidth = menuOpts.totalWidth + menuOpts.pad.l + menuOpts.pad.r;
    var paddedHeight = menuOpts.totalHeight + menuOpts.pad.t + menuOpts.pad.b;

    var graphSize = gd._fullLayout._size;
    menuOpts.lx = graphSize.l + graphSize.w * menuOpts.x;
    menuOpts.ly = graphSize.t + graphSize.h * (1 - menuOpts.y);

    var xanchor = 'left';
    if(anchorUtils.isRightAnchor(menuOpts)) {
        menuOpts.lx -= paddedWidth;
        xanchor = 'right';
    }
    if(anchorUtils.isCenterAnchor(menuOpts)) {
        menuOpts.lx -= paddedWidth / 2;
        xanchor = 'center';
    }

    var yanchor = 'top';
    if(anchorUtils.isBottomAnchor(menuOpts)) {
        menuOpts.ly -= paddedHeight;
        yanchor = 'bottom';
    }
    if(anchorUtils.isMiddleAnchor(menuOpts)) {
        menuOpts.ly -= paddedHeight / 2;
        yanchor = 'middle';
    }

    menuOpts.totalWidth = Math.ceil(menuOpts.totalWidth);
    menuOpts.totalHeight = Math.ceil(menuOpts.totalHeight);
    menuOpts.lx = Math.round(menuOpts.lx);
    menuOpts.ly = Math.round(menuOpts.ly);

    Plots.autoMargin(gd, constants.autoMarginIdRoot + menuOpts._index, {
        x: menuOpts.x,
        y: menuOpts.y,
        l: paddedWidth * ({right: 1, center: 0.5}[xanchor] || 0),
        r: paddedWidth * ({left: 1, center: 0.5}[xanchor] || 0),
        b: paddedHeight * ({top: 1, middle: 0.5}[yanchor] || 0),
        t: paddedHeight * ({bottom: 1, middle: 0.5}[yanchor] || 0)
    });
}

// set item positions (mutates posOpts)
function setItemPosition(item, menuOpts, posOpts, overrideOpts) {
    overrideOpts = overrideOpts || {};
    var rect = item.select('.' + constants.itemRectClassName),
        text = item.select('.' + constants.itemTextClassName),
        tspans = text.selectAll('tspan'),
        borderWidth = menuOpts.borderwidth,
        index = posOpts.index;

    Drawing.setTranslate(item, borderWidth + posOpts.x, borderWidth + posOpts.y);

    var isVertical = ['up', 'down'].indexOf(menuOpts.direction) !== -1;

    rect.attr({
        x: 0,
        y: 0,
        width: overrideOpts.width || (isVertical ? menuOpts.width1 : menuOpts.widths[index]),
        height: overrideOpts.height || (isVertical ? menuOpts.heights[index] : menuOpts.height1)
    });

    var tHeight = menuOpts.font.size * constants.fontSizeToHeight,
        tLines = tspans[0].length || 1,
        spanOffset = ((tLines - 1) * tHeight / 4);

    var textAttrs = {
        x: constants.textOffsetX,
        y: menuOpts.heights[index] / 2 - spanOffset + constants.textOffsetY
    };

    text.attr(textAttrs);
    tspans.attr(textAttrs);

    if(isVertical) {
        posOpts.y += menuOpts.heights[index] + posOpts.yPad;
    } else {
        posOpts.x += menuOpts.widths[index] + posOpts.xPad;
    }

    posOpts.index++;
}

function removeAllButtons(gButton) {
    gButton.selectAll('g.' + constants.dropdownButtonClassName).remove();
}

function clearPushMargins(gd) {
    var pushMargins = gd._fullLayout._pushmargin || {},
        keys = Object.keys(pushMargins);

    for(var i = 0; i < keys.length; i++) {
        var k = keys[i];

        if(k.indexOf(constants.autoMarginIdRoot) !== -1) {
            Plots.autoMargin(gd, k);
        }
    }
}
