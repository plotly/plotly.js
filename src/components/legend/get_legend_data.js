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
            lgroupToTraces[uniqueGroup] = [[legendItem]];
            lgroupi++;
        } else if(lgroups.indexOf(legendGroup) === -1) {
            lgroups.push(legendGroup);
            hasOneNonBlankGroup = true;
            lgroupToTraces[legendGroup] = [[legendItem]];
        } else {
            lgroupToTraces[legendGroup].push([legendItem]);
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

    // rearrange lgroupToTraces into a d3-friendly array of arrays
    var lgroupsLength = lgroups.length;
    var legendData;

    // sort considering trace.legendrank and legend.traceorder
    var dir = helpers.isReversed(opts) ? -1 : 1;
    var orderFn = function(a, b) {
        var A = a[0].trace;
        var B = b[0].trace;
        var delta = A.legendrank - B.legendrank;
        if(!delta) delta = A.index - B.index;
        if(!delta) delta = a[0]._initID - b[0]._initID;

        return dir * delta;
    };

    if(hasOneNonBlankGroup && helpers.isGrouped(opts)) {
        legendData = [];
        for(i = 0; i < lgroupsLength; i++) {
            legendData.push(
                lgroupToTraces[lgroups[i]]
            );
        }
    } else {
        // collapse all groups into one if all groups are blank
        legendData = [[]];
        for(i = 0; i < lgroupsLength; i++) {
            legendData[0].push(
                lgroupToTraces[lgroups[i]][0]
            );
        }
        lgroupsLength = 1;
    }

    for(i = 0; i < lgroupsLength; i++) {
        legendData[i] = legendData[i].sort(orderFn);
    }

    // number of legend groups - needed in legend/draw.js
    opts._lgroupsLength = lgroupsLength;
    // maximum name/label length - needed in legend/draw.js
    opts._maxNameLength = maxNameLength;

    return legendData;
};
