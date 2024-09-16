'use strict';

var Registry = require('../../registry');
var Lib = require('../../lib');
var Template = require('../../plot_api/plot_template');

var plotsAttrs = require('../../plots/attributes');
var attributes = require('./attributes');
var basePlotLayoutAttributes = require('../../plots/layout_attributes');
var helpers = require('./helpers');

function groupDefaults(legendId, layoutIn, layoutOut, fullData) {
    var containerIn = layoutIn[legendId] || {};
    var containerOut = Template.newContainer(layoutOut, legendId);

    function coerce(attr, dflt) {
        return Lib.coerce(containerIn, containerOut, attributes, attr, dflt);
    }

    // N.B. unified hover needs to inherit from font, bgcolor & bordercolor even when legend.visible is false
    var itemFont = Lib.coerceFont(coerce, 'font', layoutOut.font);
    coerce('bgcolor', layoutOut.paper_bgcolor);
    coerce('bordercolor');

    var visible = coerce('visible');
    if(!visible) return;

    var trace;
    var traceCoerce = function(attr, dflt) {
        var traceIn = trace._input;
        var traceOut = trace;
        return Lib.coerce(traceIn, traceOut, plotsAttrs, attr, dflt);
    };

    var globalFont = layoutOut.font || {};
    var grouptitlefont = Lib.coerceFont(coerce, 'grouptitlefont', globalFont, { overrideDflt: {
        size: Math.round(globalFont.size * 1.1)
    }});

    var legendTraceCount = 0;
    var legendReallyHasATrace = false;
    var defaultOrder = 'normal';

    var shapesWithLegend = (layoutOut.shapes || []).filter(function(d) { return d.showlegend; });

    var allLegendItems = fullData.concat(shapesWithLegend).filter(function(d) {
        return legendId === (d.legend || 'legend');
    });

    for(var i = 0; i < allLegendItems.length; i++) {
        trace = allLegendItems[i];

        if(!trace.visible) continue;

        var isShape = trace._isShape;

        // Note that we explicitly count any trace that is either shown or
        // *would* be shown by default, toward the two traces you need to
        // ensure the legend is shown by default, because this can still help
        // disambiguate.
        if(trace.showlegend || (
            trace._dfltShowLegend && !(
                trace._module &&
                trace._module.attributes &&
                trace._module.attributes.showlegend &&
                trace._module.attributes.showlegend.dflt === false
            )
        )) {
            legendTraceCount++;
            if(trace.showlegend) {
                legendReallyHasATrace = true;
                // Always show the legend by default if there's a pie,
                // or if there's only one trace but it's explicitly shown
                if(!isShape && Registry.traceIs(trace, 'pie-like') ||
                    trace._input.showlegend === true
                ) {
                    legendTraceCount++;
                }
            }

            Lib.coerceFont(traceCoerce, 'legendgrouptitle.font', grouptitlefont);
        }

        if((!isShape && Registry.traceIs(trace, 'bar') && layoutOut.barmode === 'stack') ||
                ['tonextx', 'tonexty'].indexOf(trace.fill) !== -1) {
            defaultOrder = helpers.isGrouped({traceorder: defaultOrder}) ?
                'grouped+reversed' : 'reversed';
        }

        if(trace.legendgroup !== undefined && trace.legendgroup !== '') {
            defaultOrder = helpers.isReversed({traceorder: defaultOrder}) ?
                'reversed+grouped' : 'grouped';
        }
    }

    var showLegend = Lib.coerce(layoutIn, layoutOut,
        basePlotLayoutAttributes, 'showlegend',
        legendReallyHasATrace && (legendTraceCount > (legendId === 'legend' ? 1 : 0)));

    // delete legend
    if(showLegend === false) layoutOut[legendId] = undefined;

    if(showLegend === false && !containerIn.uirevision) return;

    coerce('uirevision', layoutOut.uirevision);

    if(showLegend === false) return;

    coerce('borderwidth');

    var orientation = coerce('orientation');

    var yref = coerce('yref');
    var xref = coerce('xref');

    var isHorizontal = orientation === 'h';
    var isPaperY = yref === 'paper';
    var isPaperX = xref === 'paper';
    var defaultX, defaultY, defaultYAnchor;
    var defaultXAnchor = 'left';

    if(isHorizontal) {
        defaultX = 0;

        if(Registry.getComponentMethod('rangeslider', 'isVisible')(layoutIn.xaxis)) {
            if(isPaperY) {
                defaultY = 1.1;
                defaultYAnchor = 'bottom';
            } else {
                defaultY = 1;
                defaultYAnchor = 'top';
            }
        } else {
            // maybe use y=1.1 / yanchor=bottom as above
            //   to avoid https://github.com/plotly/plotly.js/issues/1199
            //   in v3
            if(isPaperY) {
                defaultY = -0.1;
                defaultYAnchor = 'top';
            } else {
                defaultY = 0;
                defaultYAnchor = 'bottom';
            }
        }
    } else {
        defaultY = 1;
        defaultYAnchor = 'auto';
        if(isPaperX) {
            defaultX = 1.02;
        } else {
            defaultX = 1;
            defaultXAnchor = 'right';
        }
    }

    Lib.coerce(containerIn, containerOut, {
        x: {
            valType: 'number',
            editType: 'legend',
            min: isPaperX ? -2 : 0,
            max: isPaperX ? 3 : 1,
            dflt: defaultX,
        }
    }, 'x');

    Lib.coerce(containerIn, containerOut, {
        y: {
            valType: 'number',
            editType: 'legend',
            min: isPaperY ? -2 : 0,
            max: isPaperY ? 3 : 1,
            dflt: defaultY,
        }
    }, 'y');

    coerce('traceorder', defaultOrder);
    if(helpers.isGrouped(layoutOut[legendId])) coerce('tracegroupgap');

    coerce('entrywidth');
    coerce('entrywidthmode');
    coerce('indentation');
    coerce('itemsizing');
    coerce('itemwidth');

    coerce('itemclick');
    coerce('itemdoubleclick');
    coerce('groupclick');

    coerce('xanchor', defaultXAnchor);
    coerce('yanchor', defaultYAnchor);
    coerce('valign');
    Lib.noneOrAll(containerIn, containerOut, ['x', 'y']);

    var titleText = coerce('title.text');
    if(titleText) {
        coerce('title.side', isHorizontal ? 'left' : 'top');
        var dfltTitleFont = Lib.extendFlat({}, itemFont, {
            size: Lib.bigFont(itemFont.size)
        });

        Lib.coerceFont(coerce, 'title.font', dfltTitleFont);
    }
}

module.exports = function legendDefaults(layoutIn, layoutOut, fullData) {
    var i;

    var allLegendsData = fullData.slice();

    // shapes could also show up in legends
    var shapes = layoutOut.shapes;
    if(shapes) {
        for(i = 0; i < shapes.length; i++) {
            var shape = shapes[i];
            if(!shape.showlegend) continue;

            var mockTrace = {
                _input: shape._input,
                visible: shape.visible,
                showlegend: shape.showlegend,
                legend: shape.legend
            };

            allLegendsData.push(mockTrace);
        }
    }

    var legends = ['legend'];
    for(i = 0; i < allLegendsData.length; i++) {
        Lib.pushUnique(legends, allLegendsData[i].legend);
    }

    layoutOut._legends = [];
    for(i = 0; i < legends.length; i++) {
        var legendId = legends[i];

        groupDefaults(legendId, layoutIn, layoutOut, allLegendsData);

        if(
            layoutOut[legendId] &&
            layoutOut[legendId].visible
        ) {
            layoutOut[legendId]._id = legendId;
        }

        layoutOut._legends.push(legendId);
    }
};
