/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');

var attributes = require('./attributes');
var handleXYDefaults = require('./xy_defaults');
var handleABDefaults = require('./ab_defaults');

module.exports = function supplyDefaults(traceIn, traceOut) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    traceIn.cheatersope = parseFloat(traceIn.cheaterslope);

    coerce('carpetid');
    coerce('cheaterslope');

    traceOut.cheaterslope = parseFloat(traceIn.cheaterslope);

    var len = handleXYDefaults(traceIn, traceOut, coerce);

    if(!len) {
        traceOut.visible = false;
        return;
    }

    handleABDefaults(traceIn, traceOut, coerce);

    handleAxisDefaults(traceIn, traceOut, 'a');
    handleAxisDefaults(traceIn, traceOut, 'b');

    if (traceOut.a.length < 3) {
        traceOut.aaxis.smoothing = 0;
    }

    if (traceOut.b.length < 3) {
        traceOut.baxis.smoothing = 0;
    }

};

function handleAxisDefaults(traceIn, traceOut, axis) {
    var ax = traceOut[axis + 'axis'] = traceOut[axis + 'axis'] || {};
    var i;

    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, axis + 'axis.' + attr, dflt);
    }

    coerce('smoothing');
    traceOut.smoothing = traceOut.smoothing ? 1 : 0;
    coerce('cheatertype');

    coerce('showlabels');
    coerce('labelprefix', axis + ' = ');
    coerce('labelsuffix');
    coerce('showlabelprefix');
    coerce('showlabelsuffix');

    coerce('tickmode');
    coerce('tick0');
    coerce('dtick');
    coerce('arraytick0');
    coerce('arraydtick');
    //coerce('gridoffset');
    //coerce('gridstep');

    coerce('gridwidth');
    coerce('gridcolor');

    coerce('startline');
    coerce('startlinewidth', traceOut.gridwidth);
    coerce('startlinecolor', traceOut.gridcolor);
    coerce('endline');
    coerce('endlinewidth', traceOut.gridwidth);
    coerce('endlinecolor', traceOut.gridwidth);

    coerce('minorgridcount');
    coerce('minorgridwidth');
    coerce('minorgridcolor');

    coerce('showstartlabel');
    coerce('showendlabel');

    coerce('labelpadding');

    Lib.coerceFont(coerce, 'labelfont', {size: 12});

    // Compute which labels to show. In a sense this is sort of a data computation
    // that should go in calc.js, but it's so minimal for any conceivable case that
    // I'll write it here for now:

    /*
    ax._gridIndices = [];
    for(i = ax.gridoffset; i < traceIn[axis].length; i += ax.gridstep) {
        ax._gridIndices.push(i);
    }

    // Ensure the first grid line shows up:
    if(ax._gridIndices[0] !== 0) {
        ax._gridIndices.unshift(0);
    }

    // Ensure the final grid line shows up:
    if(ax._gridIndices[ax._gridIndices.length - 1] !== traceIn[axis].length - 1) {
        ax._gridIndices.push(traceIn[axis].length - 1);
    }

    // Labels don't require first and last, so just use user-provided offset + step:
    ax._majorIndices = [];
    for(i = ax.gridoffset; i < traceIn[axis].length; i += ax.gridstep) {
        ax._majorIndices.push(i);
    }

    if(ax.showstartlabel) {
        // Ensure the first grid line shows up:
        if(ax._majorIndices[0] !== 0) {
            ax._majorIndices.unshift(0);
        }
    }

    if(ax.showendlabel) {
        // Ensure the final grid line shows up:
        if(ax._majorIndices[ax._majorIndices.length - 1] !== traceIn[axis].length - 1) {
            ax._majorIndices.push(traceIn[axis].length - 1);
        }
    }

    ax._minorGridIndices = [];
    for(i = ax.minorgridoffset; i < traceIn[axis].length; i += ax.minorgridstep) {
        if(ax._gridIndices.indexOf(i) === -1) {
            ax._minorGridIndices.push(i);
        }
    }
    */
}
