'use strict';

var Registry = require('../../registry');
var Lib = require('../../lib');
var pushUnique = Lib.pushUnique;

var SHOWISOLATETIP = true;

module.exports = function handleClick(g, gd, numClicks) {
    var fullLayout = gd._fullLayout;

    if(gd._dragged || gd._editing) return;

    var itemClick = fullLayout.legend.itemclick;
    var itemDoubleClick = fullLayout.legend.itemdoubleclick;
    var groupClick = fullLayout.legend.groupclick;

    if(numClicks === 1 && itemClick === 'toggle' && itemDoubleClick === 'toggleothers' &&
        SHOWISOLATETIP && gd.data && gd._context.showTips
    ) {
        Lib.notifier(Lib._(gd, 'Double-click on legend to isolate one trace'), 'long');
        SHOWISOLATETIP = false;
    } else {
        SHOWISOLATETIP = false;
    }

    var mode;
    if(numClicks === 1) mode = itemClick;
    else if(numClicks === 2) mode = itemDoubleClick;
    if(!mode) return;

    var toggleGroup = groupClick === 'togglegroup';

    var hiddenSlices = fullLayout.hiddenlabels ?
        fullLayout.hiddenlabels.slice() :
        [];

    var legendItem = g.data()[0][0];
    if(legendItem.groupTitle && legendItem.noClick) return;

    var fullData = gd._fullData;
    var shapesWithLegend = (fullLayout.shapes || []).filter(function(d) { return d.showlegend; });
    var allLegendItems = fullData.concat(shapesWithLegend);

    var fullTrace = legendItem.trace;
    if(fullTrace._isShape) {
        fullTrace = fullTrace._fullInput;
    }

    var legendgroup = fullTrace.legendgroup;

    var i, j, kcont, key, keys, val;
    var dataUpdate = {};
    var dataIndices = [];
    var carrs = [];
    var carrIdx = [];

    function insertDataUpdate(traceIndex, value) {
        var attrIndex = dataIndices.indexOf(traceIndex);
        var valueArray = dataUpdate.visible;
        if(!valueArray) {
            valueArray = dataUpdate.visible = [];
        }

        if(dataIndices.indexOf(traceIndex) === -1) {
            dataIndices.push(traceIndex);
            attrIndex = dataIndices.length - 1;
        }

        valueArray[attrIndex] = value;

        return attrIndex;
    }

    var updatedShapes = (fullLayout.shapes || []).map(function(d) {
        return d._input;
    });

    var shapesUpdated = false;

    function insertShapesUpdate(shapeIndex, value) {
        updatedShapes[shapeIndex].visible = value;
        shapesUpdated = true;
    }

    function setVisibility(fullTrace, visibility) {
        if(legendItem.groupTitle && !toggleGroup) return;

        var fullInput = fullTrace._fullInput || fullTrace;
        var isShape = fullInput._isShape;
        var index = fullInput.index;
        if(index === undefined) index = fullInput._index;

        // false -> false (not possible since will not be visible in legend)
        // true -> legendonly
        // legendonly -> true
        var nextVisibility = fullInput.visible === false ? false : visibility;

        if(isShape) {
            insertShapesUpdate(index, nextVisibility);
        } else {
            insertDataUpdate(index, nextVisibility);
        }
    }

    var thisLegend = fullTrace.legend;

    var fullInput = fullTrace._fullInput;
    var isShape = fullInput && fullInput._isShape;

    if(!isShape && Registry.traceIs(fullTrace, 'pie-like')) {
        var thisLabel = legendItem.label;
        var thisLabelIndex = hiddenSlices.indexOf(thisLabel);

        if(mode === 'toggle') {
            if(thisLabelIndex === -1) hiddenSlices.push(thisLabel);
            else hiddenSlices.splice(thisLabelIndex, 1);
        } else if(mode === 'toggleothers') {
            var changed = thisLabelIndex !== -1;
            var unhideList = [];
            for(i = 0; i < gd.calcdata.length; i++) {
                var cdi = gd.calcdata[i];
                for(j = 0; j < cdi.length; j++) {
                    var d = cdi[j];
                    var dLabel = d.label;

                    // ensure we toggle slices that are in this legend)
                    if(thisLegend === cdi[0].trace.legend) {
                        if(thisLabel !== dLabel) {
                            if(hiddenSlices.indexOf(dLabel) === -1) changed = true;
                            pushUnique(hiddenSlices, dLabel);
                            unhideList.push(dLabel);
                        }
                    }
                }
            }

            if(!changed) {
                for(var q = 0; q < unhideList.length; q++) {
                    var pos = hiddenSlices.indexOf(unhideList[q]);
                    if(pos !== -1) {
                        hiddenSlices.splice(pos, 1);
                    }
                }
            }
        }

        Registry.call('_guiRelayout', gd, 'hiddenlabels', hiddenSlices);
    } else {
        var hasLegendgroup = legendgroup && legendgroup.length;
        var traceIndicesInGroup = [];
        var tracei;
        if(hasLegendgroup) {
            for(i = 0; i < allLegendItems.length; i++) {
                tracei = allLegendItems[i];
                if(!tracei.visible) continue;
                if(tracei.legendgroup === legendgroup) {
                    traceIndicesInGroup.push(i);
                }
            }
        }

        if(mode === 'toggle') {
            var nextVisibility;

            switch(fullTrace.visible) {
                case true:
                    nextVisibility = 'legendonly';
                    break;
                case false:
                    nextVisibility = false;
                    break;
                case 'legendonly':
                    nextVisibility = true;
                    break;
            }

            if(hasLegendgroup) {
                if(toggleGroup) {
                    for(i = 0; i < allLegendItems.length; i++) {
                        var item = allLegendItems[i];
                        if(item.visible !== false && item.legendgroup === legendgroup) {
                            setVisibility(item, nextVisibility);
                        }
                    }
                } else {
                    setVisibility(fullTrace, nextVisibility);
                }
            } else {
                setVisibility(fullTrace, nextVisibility);
            }
        } else if(mode === 'toggleothers') {
            // Compute the clicked index. expandedIndex does what we want for expanded traces
            // but also culls hidden traces. That means we have some work to do.
            var isClicked, isInGroup, notInLegend, otherState, _item;
            var isIsolated = true;
            for(i = 0; i < allLegendItems.length; i++) {
                _item = allLegendItems[i];
                isClicked = _item === fullTrace;
                notInLegend = _item.showlegend !== true;
                if(isClicked || notInLegend) continue;

                isInGroup = (hasLegendgroup && _item.legendgroup === legendgroup);

                if(!isInGroup && _item.legend === thisLegend && _item.visible === true && !Registry.traceIs(_item, 'notLegendIsolatable')) {
                    isIsolated = false;
                    break;
                }
            }

            for(i = 0; i < allLegendItems.length; i++) {
                _item = allLegendItems[i];

                // False is sticky; we don't change it. Also ensure we don't change states of itmes in other legend
                if(_item.visible === false || _item.legend !== thisLegend) continue;

                if(Registry.traceIs(_item, 'notLegendIsolatable')) {
                    continue;
                }

                switch(fullTrace.visible) {
                    case 'legendonly':
                        setVisibility(_item, true);
                        break;
                    case true:
                        otherState = isIsolated ? true : 'legendonly';
                        isClicked = _item === fullTrace;
                        // N.B. consider traces that have a set legendgroup as toggleable
                        notInLegend = (_item.showlegend !== true && !_item.legendgroup);
                        isInGroup = isClicked || (hasLegendgroup && _item.legendgroup === legendgroup);
                        setVisibility(_item, (isInGroup || notInLegend) ? true : otherState);
                        break;
                }
            }
        }

        for(i = 0; i < carrs.length; i++) {
            kcont = carrs[i];
            if(!kcont) continue;
            var update = kcont.constructUpdate();

            var updateKeys = Object.keys(update);
            for(j = 0; j < updateKeys.length; j++) {
                key = updateKeys[j];
                val = dataUpdate[key] = dataUpdate[key] || [];
                val[carrIdx[i]] = update[key];
            }
        }

        // The length of the value arrays should be equal and any unspecified
        // values should be explicitly undefined for them to get properly culled
        // as updates and not accidentally reset to the default value. This fills
        // out sparse arrays with the required number of undefined values:
        keys = Object.keys(dataUpdate);
        for(i = 0; i < keys.length; i++) {
            key = keys[i];
            for(j = 0; j < dataIndices.length; j++) {
                // Use hasOwnProperty to protect against falsy values:
                if(!dataUpdate[key].hasOwnProperty(j)) {
                    dataUpdate[key][j] = undefined;
                }
            }
        }

        if(shapesUpdated) {
            Registry.call('_guiUpdate', gd, dataUpdate, {shapes: updatedShapes}, dataIndices);
        } else {
            Registry.call('_guiRestyle', gd, dataUpdate, dataIndices);
        }
    }
};
