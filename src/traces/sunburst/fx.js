'use strict';

var d3 = require('@plotly/d3');
var Registry = require('../../registry');
var appendArrayPointValue = require('../../components/fx/helpers').appendArrayPointValue;
var Fx = require('../../components/fx');
var Lib = require('../../lib');
var Events = require('../../lib/events');

var helpers = require('./helpers');
var pieHelpers = require('../pie/helpers');

var formatValue = pieHelpers.formatPieValue;

module.exports = function attachFxHandlers(sliceTop, entry, gd, cd, opts) {
    var cd0 = cd[0];
    var trace = cd0.trace;
    var hierarchy = cd0.hierarchy;

    var isSunburst = trace.type === 'sunburst';
    var isTreemapOrIcicle =
        trace.type === 'treemap' ||
        trace.type === 'icicle';

    // hover state vars
    // have we drawn a hover label, so it should be cleared later
    if(!('_hasHoverLabel' in trace)) trace._hasHoverLabel = false;
    // have we emitted a hover event, so later an unhover event should be emitted
    // note that click events do not depend on this - you can still get them
    // with hovermode: false or if you were earlier dragging, then clicked
    // in the same slice that you moused up in
    if(!('_hasHoverEvent' in trace)) trace._hasHoverEvent = false;

    var onMouseOver = function(pt) {
        var fullLayoutNow = gd._fullLayout;

        if(gd._dragging || fullLayoutNow.hovermode === false) return;

        var traceNow = gd._fullData[trace.index];
        var cdi = pt.data.data;
        var ptNumber = cdi.i;
        var isRoot = helpers.isHierarchyRoot(pt);
        var parent = helpers.getParent(hierarchy, pt);

        var val = helpers.getValue(pt);

        var _cast = function(astr) {
            return Lib.castOption(traceNow, ptNumber, astr);
        };

        var hovertemplate = _cast('hovertemplate');
        var hoverinfo = Fx.castHoverinfo(traceNow, fullLayoutNow, ptNumber);
        var separators = fullLayoutNow.separators;

        var eventData;

        if(hovertemplate || (hoverinfo && hoverinfo !== 'none' && hoverinfo !== 'skip')) {
            var hoverCenterX;
            var hoverCenterY;
            if(isSunburst) {
                hoverCenterX = cd0.cx + pt.pxmid[0] * (1 - pt.rInscribed);
                hoverCenterY = cd0.cy + pt.pxmid[1] * (1 - pt.rInscribed);
            }
            if(isTreemapOrIcicle) {
                hoverCenterX = pt._hoverX;
                hoverCenterY = pt._hoverY;
            }

            var hoverPt = {};
            var parts = [];
            var thisText = [];
            var hasFlag = function(flag) { return parts.indexOf(flag) !== -1; };

            if(hoverinfo) {
                parts = hoverinfo === 'all' ?
                    traceNow._module.attributes.hoverinfo.flags :
                    hoverinfo.split('+');
            }

            hoverPt.label = cdi.label;
            if(hasFlag('label') && hoverPt.label) thisText.push(hoverPt.label);

            if(cdi.hasOwnProperty('v')) {
                hoverPt.value = cdi.v;
                hoverPt.valueLabel = formatValue(hoverPt.value, separators);
                if(hasFlag('value')) thisText.push(hoverPt.valueLabel);
            }

            hoverPt.currentPath = pt.currentPath = helpers.getPath(pt.data);
            if(hasFlag('current path') && !isRoot) {
                thisText.push(hoverPt.currentPath);
            }

            var tx;
            var allPercents = [];
            var insertPercent = function() {
                if(allPercents.indexOf(tx) === -1) { // no need to add redundant info
                    thisText.push(tx);
                    allPercents.push(tx);
                }
            };

            hoverPt.percentParent = pt.percentParent = val / helpers.getValue(parent);
            hoverPt.parent = pt.parentString = helpers.getPtLabel(parent);
            if(hasFlag('percent parent')) {
                tx = helpers.formatPercent(hoverPt.percentParent, separators) + ' of ' + hoverPt.parent;
                insertPercent();
            }

            hoverPt.percentEntry = pt.percentEntry = val / helpers.getValue(entry);
            hoverPt.entry = pt.entry = helpers.getPtLabel(entry);
            if(hasFlag('percent entry') && !isRoot && !pt.onPathbar) {
                tx = helpers.formatPercent(hoverPt.percentEntry, separators) + ' of ' + hoverPt.entry;
                insertPercent();
            }

            hoverPt.percentRoot = pt.percentRoot = val / helpers.getValue(hierarchy);
            hoverPt.root = pt.root = helpers.getPtLabel(hierarchy);
            if(hasFlag('percent root') && !isRoot) {
                tx = helpers.formatPercent(hoverPt.percentRoot, separators) + ' of ' + hoverPt.root;
                insertPercent();
            }

            hoverPt.text = _cast('hovertext') || _cast('text');
            if(hasFlag('text')) {
                tx = hoverPt.text;
                if(Lib.isValidTextValue(tx)) thisText.push(tx);
            }

            eventData = [makeEventData(pt, traceNow, opts.eventDataKeys)];

            var hoverItems = {
                trace: traceNow,
                y: hoverCenterY,
                _x0: pt._x0,
                _x1: pt._x1,
                _y0: pt._y0,
                _y1: pt._y1,
                text: thisText.join('<br>'),
                name: (hovertemplate || hasFlag('name')) ? traceNow.name : undefined,
                color: _cast('hoverlabel.bgcolor') || cdi.color,
                borderColor: _cast('hoverlabel.bordercolor'),
                fontFamily: _cast('hoverlabel.font.family'),
                fontSize: _cast('hoverlabel.font.size'),
                fontColor: _cast('hoverlabel.font.color'),
                fontWeight: _cast('hoverlabel.font.weight'),
                fontStyle: _cast('hoverlabel.font.style'),
                fontVariant: _cast('hoverlabel.font.variant'),
                nameLength: _cast('hoverlabel.namelength'),
                textAlign: _cast('hoverlabel.align'),
                hovertemplate: hovertemplate,
                hovertemplateLabels: hoverPt,
                eventData: eventData
            };

            if(isSunburst) {
                hoverItems.x0 = hoverCenterX - pt.rInscribed * pt.rpx1;
                hoverItems.x1 = hoverCenterX + pt.rInscribed * pt.rpx1;
                hoverItems.idealAlign = pt.pxmid[0] < 0 ? 'left' : 'right';
            }
            if(isTreemapOrIcicle) {
                hoverItems.x = hoverCenterX;
                hoverItems.idealAlign = hoverCenterX < 0 ? 'left' : 'right';
            }

            var bbox = [];
            Fx.loneHover(hoverItems, {
                container: fullLayoutNow._hoverlayer.node(),
                outerContainer: fullLayoutNow._paper.node(),
                gd: gd,
                inOut_bbox: bbox
            });
            eventData[0].bbox = bbox[0];

            trace._hasHoverLabel = true;
        }

        if(isTreemapOrIcicle) {
            var slice = sliceTop.select('path.surface');
            opts.styleOne(slice, pt, traceNow, gd, {
                hovered: true
            });
        }

        trace._hasHoverEvent = true;
        gd.emit('plotly_hover', {
            points: eventData || [makeEventData(pt, traceNow, opts.eventDataKeys)],
            event: d3.event
        });
    };

    var onMouseOut = function(evt) {
        var fullLayoutNow = gd._fullLayout;
        var traceNow = gd._fullData[trace.index];
        var pt = d3.select(this).datum();

        if(trace._hasHoverEvent) {
            evt.originalEvent = d3.event;
            gd.emit('plotly_unhover', {
                points: [makeEventData(pt, traceNow, opts.eventDataKeys)],
                event: d3.event
            });
            trace._hasHoverEvent = false;
        }

        if(trace._hasHoverLabel) {
            Fx.loneUnhover(fullLayoutNow._hoverlayer.node());
            trace._hasHoverLabel = false;
        }

        if(isTreemapOrIcicle) {
            var slice = sliceTop.select('path.surface');
            opts.styleOne(slice, pt, traceNow, gd, {
                hovered: false
            });
        }
    };

    var onClick = function(pt) {
        // TODO: this does not support right-click. If we want to support it, we
        // would likely need to change pie to use dragElement instead of straight
        // map subplots event binding. Or perhaps better, make a simple wrapper with the
        // right mousedown, mousemove, and mouseup handlers just for a left/right click
        // map subplots would use this too.
        var fullLayoutNow = gd._fullLayout;
        var traceNow = gd._fullData[trace.index];

        var noTransition = isSunburst && (helpers.isHierarchyRoot(pt) || helpers.isLeaf(pt));

        var id = helpers.getPtId(pt);
        var nextEntry = helpers.isEntry(pt) ?
            helpers.findEntryWithChild(hierarchy, id) :
            helpers.findEntryWithLevel(hierarchy, id);
        var nextLevel = helpers.getPtId(nextEntry);

        var typeClickEvtData = {
            points: [makeEventData(pt, traceNow, opts.eventDataKeys)],
            event: d3.event
        };
        if(!noTransition) typeClickEvtData.nextLevel = nextLevel;

        var clickVal = Events.triggerHandler(gd, 'plotly_' + trace.type + 'click', typeClickEvtData);

        if(clickVal !== false && fullLayoutNow.hovermode) {
            gd._hoverdata = [makeEventData(pt, traceNow, opts.eventDataKeys)];
            Fx.click(gd, d3.event);
        }

        // if click does not trigger a transition, we're done!
        if(noTransition) return;

        // if custom handler returns false, we're done!
        if(clickVal === false) return;

        // skip if triggered from dragging a nearby cartesian subplot
        if(gd._dragging) return;

        // skip during transitions, to avoid potential bugs
        // we could remove this check later
        if(gd._transitioning) return;

        // store 'old' level in guiEdit stash, so that subsequent Plotly.react
        // calls with the same uirevision can start from the same entry
        Registry.call('_storeDirectGUIEdit', traceNow, fullLayoutNow._tracePreGUI[traceNow.uid], {
            level: traceNow.level
        });

        var frame = {
            data: [{level: nextLevel}],
            traces: [trace.index]
        };

        var animOpts = {
            frame: {
                redraw: false,
                duration: opts.transitionTime
            },
            transition: {
                duration: opts.transitionTime,
                easing: opts.transitionEasing
            },
            mode: 'immediate',
            fromcurrent: true
        };

        Fx.loneUnhover(fullLayoutNow._hoverlayer.node());
        Registry.call('animate', gd, frame, animOpts);
    };

    sliceTop.on('mouseover', onMouseOver);
    sliceTop.on('mouseout', onMouseOut);
    sliceTop.on('click', onClick);
};

function makeEventData(pt, trace, keys) {
    var cdi = pt.data.data;

    var out = {
        curveNumber: trace.index,
        pointNumber: cdi.i,
        data: trace._input,
        fullData: trace,

        // TODO more things like 'children', 'siblings', 'hierarchy?
    };

    for(var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if(key in pt) out[key] = pt[key];
    }
    // handle special case of parent
    if('parentString' in pt && !helpers.isHierarchyRoot(pt)) out.parent = pt.parentString;

    appendArrayPointValue(out, trace, cdi.i);

    return out;
}
