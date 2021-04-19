'use strict';

var Registry = require('../../registry');
var helpers = require('./helpers');

module.exports = function getLegendData(calcdata, opts) {
    var lgroupToTraces = {};
    var lgroups = [];
    var hasOneNonBlankGroup = false;
    var slicesShown = {};
    var lgroupi = 0;
    var maxNameLength = 0;
    var i, j;
    var initID = 0;
    function addOneItem(legendGroup, legendItem) {
        legendItem._initID = initID++;

        // each '' legend group is treated as a separate group
        if(legendGroup === '' || !helpers.isGrouped(opts)) {
            // TODO: check this against fullData legendgroups?
            var uniqueGroup = '~~i' + lgroupi;
            lgroups.push(uniqueGroup);
            lgroupToTraces[uniqueGroup] = [legendItem];
            lgroupi++;
        } else if(lgroups.indexOf(legendGroup) === -1) {
            lgroups.push(legendGroup);
            hasOneNonBlankGroup = true;
            lgroupToTraces[legendGroup] = [legendItem];
        } else {
            lgroupToTraces[legendGroup].push(legendItem);
        }
    }

    // build an { legendgroup: [cd0, cd0], ... } object
    for(i = 0; i < calcdata.length; i++) {
        var cd = calcdata[i];
        var cd0 = cd[0];
        var trace = cd0.trace;
        var lgroup = trace.legendgroup;

        if(!opts._inHover && (!trace.visible || !trace.showlegend)) continue;

        if(Registry.traceIs(trace, 'pie-like')) {
            if(!slicesShown[lgroup]) slicesShown[lgroup] = {};

            for(j = 0; j < cd.length; j++) {
                var labelj = cd[j].label;

                if(!slicesShown[lgroup][labelj]) {
                    addOneItem(lgroup, {
                        label: labelj,
                        color: cd[j].color,
                        i: cd[j].i,
                        trace: trace,
                        pts: cd[j].pts
                    });

                    slicesShown[lgroup][labelj] = true;
                    maxNameLength = Math.max(maxNameLength, (labelj || '').length);
                }
            }
        } else {
            addOneItem(lgroup, cd0);
            maxNameLength = Math.max(maxNameLength, (trace.name || '').length);
        }
    }

    // won't draw a legend in this case
    if(!lgroups.length) return [];

    // collapse all groups into one if all groups are blank
    var shouldCollapse = !hasOneNonBlankGroup || !helpers.isGrouped(opts);

    // rearrange lgroupToTraces into a d3-friendly array of arrays
    var legendData;

    legendData = [];
    for(i = 0; i < lgroups.length; i++) {
        var t = lgroupToTraces[lgroups[i]];
        if(shouldCollapse) {
            legendData.push(t[0]);
        } else {
            legendData.push(t);
        }
    }
    if(shouldCollapse) legendData = [legendData];

    // sort considering trace.legendrank and legend.traceorder
    var orderFn = function(a, b) {
        var A = a.trace;
        var B = b.trace;
        var delta = A.legendrank - B.legendrank;
        if(!delta) delta = A._initID - B._initID;

        return delta;
    };
    var rev = helpers.isReversed(opts);
    for(i = 0; i < legendData.length; i++) {
        legendData[i].sort(orderFn);
        if(rev) legendData[i].reverse();
    }

    var arr = [];
    for(i = 0; i < legendData.length; i++) {
        arr[i] = [];
        for(j = 0; j < legendData[i].length; j++) {
            arr[i][j] = [legendData[i][j]];
        }
    }
    legendData = arr;

    // number of legend groups - needed in legend/draw.js
    opts._lgroupsLength = legendData.length;
    // maximum name/label length - needed in legend/draw.js
    opts._maxNameLength = maxNameLength;

    return legendData;
};
