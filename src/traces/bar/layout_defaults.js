'use strict';

var Registry = require('../../registry');
var Axes = require('../../plots/cartesian/axes');
var Lib = require('../../lib');

var layoutAttributes = require('./layout_attributes');
var validateCornerradius = require('./defaults').validateCornerradius;


module.exports = function(layoutIn, layoutOut, fullData) {
    function coerce(attr, dflt) {
        return Lib.coerce(layoutIn, layoutOut, layoutAttributes, attr, dflt);
    }

    var hasBars = false;
    var shouldBeGapless = false;
    var gappedAnyway = false;
    var usedSubplots = {};

    var mode = coerce('barmode');
    var isGroup = mode === 'group';

    for(var i = 0; i < fullData.length; i++) {
        var trace = fullData[i];
        if(Registry.traceIs(trace, 'bar') && trace.visible) hasBars = true;
        else continue;

        // if we have at least 2 grouped bar traces on the same subplot,
        // we should default to a gap anyway, even if the data is histograms
        var subploti = trace.xaxis + trace.yaxis;
        if(isGroup) {
            // with barmode group, bars are grouped next to each other when sharing the same axes
            if(usedSubplots[subploti]) gappedAnyway = true;
            usedSubplots[subploti] = true;
        } else {
            // with other barmodes bars are grouped next to each other when sharing the same axes
            // and using different offsetgroups
            subploti += trace._input.offsetgroup;
            if(usedSubplots.length > 0 && !usedSubplots[subploti]) gappedAnyway = true;
            usedSubplots[subploti] = true;
        }

        if(trace.visible && trace.type === 'histogram') {
            var pa = Axes.getFromId({_fullLayout: layoutOut},
                        trace[trace.orientation === 'v' ? 'xaxis' : 'yaxis']);
            if(pa.type !== 'category') shouldBeGapless = true;
        }
    }

    if(!hasBars) {
        delete layoutOut.barmode;
        return;
    }

    if(mode !== 'overlay') coerce('barnorm');

    coerce('bargap', (shouldBeGapless && !gappedAnyway) ? 0 : 0.2);
    coerce('bargroupgap');
    var r = coerce('barcornerradius');
    layoutOut.barcornerradius = validateCornerradius(r);
};
