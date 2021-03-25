'use strict';

var d3 = require('@plotly/d3');

var helpers = require('../sunburst/helpers');

var Lib = require('../../lib');
var TEXTPAD = require('../bar/constants').TEXTPAD;
var barPlot = require('../bar/plot');
var toMoveInsideBar = barPlot.toMoveInsideBar;

var treemapPlot = require('../treemap/plot');
var getKey = treemapPlot.getKey;
var plotOne = treemapPlot.plotOne;

var uniformText = require('../bar/uniform_text');
var recordMinTextSize = uniformText.recordMinTextSize;
var clearMinTextSize = uniformText.clearMinTextSize;
var resizeText = require('../bar/style').resizeText;
var constants = require('./constants');
var drawDescendants = require('./draw_descendants');
var drawAncestors = require('../treemap/draw_ancestors');

module.exports = function(gd, cdmodule, transitionOpts, makeOnCompleteCallback) {
    var fullLayout = gd._fullLayout;
    var layer = fullLayout._iciclelayer;
    var join, onComplete;

    // If transition config is provided, then it is only a partial replot and traces not
    // updated are removed.
    var isFullReplot = !transitionOpts;

    clearMinTextSize('icicle', fullLayout);

    join = layer.selectAll('g.trace.icicle')
        .data(cdmodule, function(cd) { return cd[0].trace.uid; });

    join.enter().append('g')
        .classed('trace', true)
        .classed('icicle', true);

    join.order();

    if(!fullLayout.uniformtext.mode && helpers.hasTransition(transitionOpts)) {
        if(makeOnCompleteCallback) {
            // If it was passed a callback to register completion, make a callback. If
            // this is created, then it must be executed on completion, otherwise the
            // pos-transition redraw will not execute:
            onComplete = makeOnCompleteCallback();
        }

        var transition = d3.transition()
            .duration(transitionOpts.duration)
            .ease(transitionOpts.easing)
            .each('end', function() { onComplete && onComplete(); })
            .each('interrupt', function() { onComplete && onComplete(); });

        transition.each(function() {
            // Must run the selection again since otherwise enters/updates get grouped together
            // and these get executed out of order. Except we need them in order!
            layer.selectAll('g.trace').each(function(cd) {
                plotOne(gd, cd, this, transitionOpts, 'icicle');
            });
        });
    } else {
        join.each(function(cd) {
            plotOne(gd, cd, this, transitionOpts, 'icicle');
        });

        if(fullLayout.uniformtext.mode) {
            resizeText(gd, fullLayout._iciclelayer.selectAll('.trace'), 'icicle');
        }
    }

    if(isFullReplot) {
        join.exit().remove();
    }
};
