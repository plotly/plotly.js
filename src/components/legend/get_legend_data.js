'use strict';

var Registry = require('../../registry');
var helpers = require('./helpers');

module.exports = function getLegendData(calcdata, opts) {
    var grouped = helpers.isGrouped(opts);
    var reversed = helpers.isReversed(opts);

    var lgroupToTraces = {};
    var lgroups = [];
    var hasOneNonBlankGroup = false;
    var slicesShown = {};
    var lgroupi = 0;
    var maxNameLength = 0;
    var i, j;

    function addOneItem(legendGroup, legendItem) {
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
    var shouldCollapse = !hasOneNonBlankGroup || !grouped;

    var legendData = [];
    for(i = 0; i < lgroups.length; i++) {
        var t = lgroupToTraces[lgroups[i]];
        if(shouldCollapse) {
            legendData.push(t[0]);
        } else {
            legendData.push(t);
        }
    }
    if(shouldCollapse) legendData = [legendData];

    for(i = 0; i < legendData.length; i++) {
        // find minimum rank within group
        var groupMinRank = Infinity;
        for(j = 0; j < legendData[i].length; j++) {
            var rank = legendData[i][j].trace.legendrank;
            if(groupMinRank > rank) groupMinRank = rank;
        }

        // record on first group element
        legendData[i][0]._groupMinRank = groupMinRank;
        legendData[i][0]._preGroupSort = i;
    }

    var orderFn1 = function(a, b) {
        return (
            (a[0]._groupMinRank - b[0]._groupMinRank) ||
            (a[0]._preGroupSort - b[0]._preGroupSort) // fallback for old Chrome < 70 https://bugs.chromium.org/p/v8/issues/detail?id=90
        );
    };

    var orderFn2 = function(a, b) {
        return (
            (a.trace.legendrank - b.trace.legendrank) ||
            (a._preSort - b._preSort) // fallback for old Chrome < 70 https://bugs.chromium.org/p/v8/issues/detail?id=90
        );
    };

    // sort considering minimum group legendrank
    legendData.forEach(function(a, k) { a[0]._preGroupSort = k; });
    legendData.sort(orderFn1);
    for(i = 0; i < legendData.length; i++) {
        // sort considering trace.legendrank and legend.traceorder
        legendData[i].forEach(function(a, k) { a._preSort = k; });
        legendData[i].sort(orderFn2);

        var firstItem = legendData[i][0];

        var groupTitle = null;
        // get group title text
        for(j = 0; j < legendData[i].length; j++) {
            var gt = legendData[i][j].trace.legendgrouptitle;
            if(gt && gt.text) {
                groupTitle = gt;
                break;
            }
        }

        // reverse order
        if(reversed) legendData[i].reverse();

        if(groupTitle) {
            // set group title text
            legendData[i].unshift({
                i: -1,
                groupTitle: groupTitle,
                trace: {
                    showlegend: firstItem.trace.showlegend
                }
            });
        }

        // rearrange lgroupToTraces into a d3-friendly array of arrays
        for(j = 0; j < legendData[i].length; j++) {
            legendData[i][j] = [
                legendData[i][j]
            ];
        }
    }

    // number of legend groups - needed in legend/draw.js
    opts._lgroupsLength = legendData.length;
    // maximum name/label length - needed in legend/draw.js
    opts._maxNameLength = maxNameLength;

    return legendData;
};
