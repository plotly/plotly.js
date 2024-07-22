'use strict';

var axisIds = require('../../plots/cartesian/axis_ids');
var scatterSubTypes = require('../../traces/scatter/subtypes');
var Registry = require('../../registry');
var isUnifiedHover = require('../fx/helpers').isUnifiedHover;

var createModeBar = require('./modebar');
var modeBarButtons = require('./buttons');
var DRAW_MODES = require('./constants').DRAW_MODES;
var extendDeep = require('../../lib').extendDeep;

/**
 * ModeBar wrapper around 'create' and 'update',
 * chooses buttons to pass to ModeBar constructor based on
 * plot type and plot config.
 *
 * @param {object} gd main plot object
 *
 */
module.exports = function manageModeBar(gd) {
    var fullLayout = gd._fullLayout;
    var context = gd._context;
    var modeBar = fullLayout._modeBar;

    if(!context.displayModeBar && !context.watermark) {
        if(modeBar) {
            modeBar.destroy();
            delete fullLayout._modeBar;
        }
        return;
    }

    if(!Array.isArray(context.modeBarButtonsToRemove)) {
        throw new Error([
            '*modeBarButtonsToRemove* configuration options',
            'must be an array.'
        ].join(' '));
    }

    if(!Array.isArray(context.modeBarButtonsToAdd)) {
        throw new Error([
            '*modeBarButtonsToAdd* configuration options',
            'must be an array.'
        ].join(' '));
    }

    var customButtons = context.modeBarButtons;
    var buttonGroups;

    if(Array.isArray(customButtons) && customButtons.length) {
        buttonGroups = fillCustomButton(customButtons);
    } else if(!context.displayModeBar && context.watermark) {
        buttonGroups = [];
    } else {
        buttonGroups = getButtonGroups(gd);
    }

    if(modeBar) modeBar.update(gd, buttonGroups);
    else fullLayout._modeBar = createModeBar(gd, buttonGroups);
};

// logic behind which buttons are displayed by default
function getButtonGroups(gd) {
    var fullLayout = gd._fullLayout;
    var fullData = gd._fullData;
    var context = gd._context;

    function match(name, B) {
        if(typeof B === 'string') {
            if(B.toLowerCase() === name.toLowerCase()) return true;
        } else {
            var v0 = B.name;
            var v1 = (B._cat || B.name);

            if(v0 === name || v1 === name.toLowerCase()) return true;
        }
        return false;
    }

    var layoutAdd = fullLayout.modebar.add;
    if(typeof layoutAdd === 'string') layoutAdd = [layoutAdd];

    var layoutRemove = fullLayout.modebar.remove;
    if(typeof layoutRemove === 'string') layoutRemove = [layoutRemove];

    var buttonsToAdd = context.modeBarButtonsToAdd.concat(
        layoutAdd.filter(function(e) {
            for(var i = 0; i < context.modeBarButtonsToRemove.length; i++) {
                if(match(e, context.modeBarButtonsToRemove[i])) return false;
            }
            return true;
        })
    );

    var buttonsToRemove = context.modeBarButtonsToRemove.concat(
        layoutRemove.filter(function(e) {
            for(var i = 0; i < context.modeBarButtonsToAdd.length; i++) {
                if(match(e, context.modeBarButtonsToAdd[i])) return false;
            }
            return true;
        })
    );

    var hasCartesian = fullLayout._has('cartesian');
    var hasGL3D = fullLayout._has('gl3d');
    var hasGeo = fullLayout._has('geo');
    var hasPie = fullLayout._has('pie');
    var hasFunnelarea = fullLayout._has('funnelarea');
    var hasGL2D = fullLayout._has('gl2d');
    var hasTernary = fullLayout._has('ternary');
    var hasMapbox = fullLayout._has('mapbox');
    var hasMap = fullLayout._has('map');
    var hasPolar = fullLayout._has('polar');
    var hasSmith = fullLayout._has('smith');
    var hasSankey = fullLayout._has('sankey');
    var allAxesFixed = areAllAxesFixed(fullLayout);
    var hasUnifiedHoverLabel = isUnifiedHover(fullLayout.hovermode);

    var groups = [];

    function addGroup(newGroup) {
        if(!newGroup.length) return;

        var out = [];

        for(var i = 0; i < newGroup.length; i++) {
            var name = newGroup[i];
            var B = modeBarButtons[name];
            var v0 = B.name.toLowerCase();
            var v1 = (B._cat || B.name).toLowerCase();
            var found = false;
            for(var q = 0; q < buttonsToRemove.length; q++) {
                var t = buttonsToRemove[q].toLowerCase();
                if(t === v0 || t === v1) {
                    found = true;
                    break;
                }
            }
            if(found) continue;
            out.push(modeBarButtons[name]);
        }

        groups.push(out);
    }

    // buttons common to all plot types
    var commonGroup = ['toImage'];
    if(context.showEditInChartStudio) commonGroup.push('editInChartStudio');
    else if(context.showSendToCloud) commonGroup.push('sendDataToCloud');
    addGroup(commonGroup);

    var zoomGroup = [];
    var hoverGroup = [];
    var resetGroup = [];
    var dragModeGroup = [];

    if((hasCartesian || hasGL2D || hasPie || hasFunnelarea || hasTernary) + hasGeo + hasGL3D + hasMapbox + hasMap + hasPolar + hasSmith > 1) {
        // graphs with more than one plot types get 'union buttons'
        // which reset the view or toggle hover labels across all subplots.
        hoverGroup = ['toggleHover'];
        resetGroup = ['resetViews'];
    } else if(hasGeo) {
        zoomGroup = ['zoomInGeo', 'zoomOutGeo'];
        hoverGroup = ['hoverClosestGeo'];
        resetGroup = ['resetGeo'];
    } else if(hasGL3D) {
        hoverGroup = ['hoverClosest3d'];
        resetGroup = ['resetCameraDefault3d', 'resetCameraLastSave3d'];
    } else if(hasMapbox) {
        zoomGroup = ['zoomInMapbox', 'zoomOutMapbox'];
        hoverGroup = ['toggleHover'];
        resetGroup = ['resetViewMapbox'];
    } else if(hasMap) {
        zoomGroup = ['zoomInMap', 'zoomOutMap'];
        hoverGroup = ['toggleHover'];
        resetGroup = ['resetViewMap'];
    } else if(hasGL2D) {
        hoverGroup = ['hoverClosestGl2d'];
    } else if(hasPie) {
        hoverGroup = ['hoverClosestPie'];
    } else if(hasSankey) {
        hoverGroup = ['hoverClosestCartesian', 'hoverCompareCartesian'];
        resetGroup = ['resetViewSankey'];
    } else { // hasPolar, hasSmith, hasTernary
        // always show at least one hover icon.
        hoverGroup = ['toggleHover'];
    }
    // if we have cartesian, allow switching between closest and compare
    // regardless of what other types are on the plot, since they'll all
    // just treat any truthy hovermode as 'closest'
    if(hasCartesian) {
        hoverGroup.push('toggleSpikelines', 'hoverClosestCartesian', 'hoverCompareCartesian');
    }
    if(hasNoHover(fullData) || hasUnifiedHoverLabel) {
        hoverGroup = [];
    }

    if((hasCartesian || hasGL2D) && !allAxesFixed) {
        zoomGroup = ['zoomIn2d', 'zoomOut2d', 'autoScale2d'];
        if(resetGroup[0] !== 'resetViews') resetGroup = ['resetScale2d'];
    }

    if(hasGL3D) {
        dragModeGroup = ['zoom3d', 'pan3d', 'orbitRotation', 'tableRotation'];
    } else if(((hasCartesian || hasGL2D) && !allAxesFixed) || hasTernary) {
        dragModeGroup = ['zoom2d', 'pan2d'];
    } else if(hasMapbox || hasMap || hasGeo) {
        dragModeGroup = ['pan2d'];
    } else if(hasPolar) {
        dragModeGroup = ['zoom2d'];
    }
    if(isSelectable(fullData)) {
        dragModeGroup.push('select2d', 'lasso2d');
    }

    var enabledHoverGroup = [];
    var enableHover = function(a) {
        // return if already added
        if(enabledHoverGroup.indexOf(a) !== -1) return;
        // should be in hoverGroup
        if(hoverGroup.indexOf(a) !== -1) {
            enabledHoverGroup.push(a);
        }
    };
    if(Array.isArray(buttonsToAdd)) {
        var newList = [];
        for(var i = 0; i < buttonsToAdd.length; i++) {
            var b = buttonsToAdd[i];
            if(typeof b === 'string') {
                b = b.toLowerCase();

                if(DRAW_MODES.indexOf(b) !== -1) {
                    // accept pre-defined drag modes i.e. shape drawing features as string
                    if(
                        fullLayout._has('mapbox') || fullLayout._has('map') || // draw shapes in paper coordinate (could be improved in future to support data coordinate, when there is no pitch)
                        fullLayout._has('cartesian') // draw shapes in data coordinate
                    ) {
                        dragModeGroup.push(b);
                    }
                } else if(b === 'togglespikelines') {
                    enableHover('toggleSpikelines');
                } else if(b === 'togglehover') {
                    enableHover('toggleHover');
                } else if(b === 'hovercompare') {
                    enableHover('hoverCompareCartesian');
                } else if(b === 'hoverclosest') {
                    enableHover('hoverClosestCartesian');
                    enableHover('hoverClosestGeo');
                    enableHover('hoverClosest3d');
                    enableHover('hoverClosestGl2d');
                    enableHover('hoverClosestPie');
                } else if(b === 'v1hovermode') {
                    enableHover('hoverClosestCartesian');
                    enableHover('hoverCompareCartesian');
                    enableHover('hoverClosestGeo');
                    enableHover('hoverClosest3d');
                    enableHover('hoverClosestGl2d');
                    enableHover('hoverClosestPie');
                }
            } else newList.push(b);
        }
        buttonsToAdd = newList;
    }

    addGroup(dragModeGroup);
    addGroup(zoomGroup.concat(resetGroup));
    addGroup(enabledHoverGroup);

    return appendButtonsToGroups(groups, buttonsToAdd);
}

function areAllAxesFixed(fullLayout) {
    var axList = axisIds.list({_fullLayout: fullLayout}, null, true);

    for(var i = 0; i < axList.length; i++) {
        if(!axList[i].fixedrange) {
            return false;
        }
    }

    return true;
}

// look for traces that support selection
// to be updated as we add more selectPoints handlers
function isSelectable(fullData) {
    var selectable = false;

    for(var i = 0; i < fullData.length; i++) {
        if(selectable) break;

        var trace = fullData[i];

        if(!trace._module || !trace._module.selectPoints) continue;

        if(Registry.traceIs(trace, 'scatter-like')) {
            if(scatterSubTypes.hasMarkers(trace) || scatterSubTypes.hasText(trace)) {
                selectable = true;
            }
        } else if(Registry.traceIs(trace, 'box-violin')) {
            if(trace.boxpoints === 'all' || trace.points === 'all') {
                selectable = true;
            }
        } else {
            // assume that in general if the trace module has selectPoints,
            // then it's selectable. Scatter is an exception to this because it must
            // have markers or text, not just be a scatter type.

            selectable = true;
        }
    }

    return selectable;
}

// check whether all trace are 'noHover'
function hasNoHover(fullData) {
    for(var i = 0; i < fullData.length; i++) {
        if(!Registry.traceIs(fullData[i], 'noHover')) return false;
    }
    return true;
}

function appendButtonsToGroups(groups, buttons) {
    if(buttons.length) {
        if(Array.isArray(buttons[0])) {
            for(var i = 0; i < buttons.length; i++) {
                groups.push(buttons[i]);
            }
        } else groups.push(buttons);
    }

    return groups;
}

// fill in custom buttons referring to default mode bar buttons
function fillCustomButton(originalModeBarButtons) {
    var customButtons = extendDeep([], originalModeBarButtons);

    for(var i = 0; i < customButtons.length; i++) {
        var buttonGroup = customButtons[i];

        for(var j = 0; j < buttonGroup.length; j++) {
            var button = buttonGroup[j];

            if(typeof button === 'string') {
                if(modeBarButtons[button] !== undefined) {
                    customButtons[i][j] = modeBarButtons[button];
                } else {
                    throw new Error([
                        '*modeBarButtons* configuration options',
                        'invalid button name'
                    ].join(' '));
                }
            }
        }
    }

    return customButtons;
}
