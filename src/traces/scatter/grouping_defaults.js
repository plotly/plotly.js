'use strict';

var getAxisGroup = require('../../plots/cartesian/constraints').getAxisGroup;

module.exports = function handleGroupingDefaults(traceIn, traceOut, fullLayout, coerce, barmode) {
    var orientation = traceOut.orientation;
    // N.B. grouping is done across all trace types that support it
    var posAxId = traceOut[{v: 'x', h: 'y'}[orientation] + 'axis'];
    var groupId = getAxisGroup(fullLayout, posAxId) + orientation;

    var alignmentOpts = fullLayout._alignmentOpts || {};
    var alignmentgroup = coerce('alignmentgroup');

    var alignmentGroups = alignmentOpts[groupId];
    if(!alignmentGroups) alignmentGroups = alignmentOpts[groupId] = {};

    var alignmentGroupOpts = alignmentGroups[alignmentgroup];

    if(alignmentGroupOpts) {
        alignmentGroupOpts.traces.push(traceOut);
    } else {
        alignmentGroupOpts = alignmentGroups[alignmentgroup] = {
            traces: [traceOut],
            alignmentIndex: Object.keys(alignmentGroups).length,
            offsetGroups: {}
        };
    }

    var offsetgroup = coerce('offsetgroup') || '';
    var offsetGroups = alignmentGroupOpts.offsetGroups;
    var offsetGroupOpts = offsetGroups[offsetgroup];
    // in barmode 'group', traces without offsetgroup receive their own offsetgroup
    // in other barmodes, traces without offsetgroup are assigned to the same offset group
    traceOut._offsetIndex = 0;
    if(barmode !== 'group' || offsetgroup) {
        if(!offsetGroupOpts) {
            offsetGroupOpts = offsetGroups[offsetgroup] = {
                offsetIndex: Object.keys(offsetGroups).length
            };
        }

        traceOut._offsetIndex = offsetGroupOpts.offsetIndex;
    }
};
