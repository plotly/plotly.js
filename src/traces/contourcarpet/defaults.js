/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');

var handleXYZDefaults = require('../heatmap/xyz_defaults');
var attributes = require('./attributes');
var handleContoursDefaults = require('../contour/contours_defaults');
var handleStyleDefaults = require('../contour/style_defaults');
// var handleFillColorDefaults = require('../scatter/fillcolor_defaults');
var plotAttributes = require('../../plots/attributes');
var supplyConstraintDefaults = require('./constraint_value_defaults');
var Color = require('../../components/color');
var addOpacity = Color.addOpacity;
var opacity = Color.opacity;

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    function coerce2(attr) {
        return Lib.coerce2(traceIn, traceOut, attributes, attr);
    }

    coerce('carpet');

    // If either a or b is not present, then it's not a valid trace *unless* the carpet
    // axis has the a or b values we're looking for. So if these are not found, just defer
    // that decision until the calc step.
    //
    // NB: the calc step will modify the original data input by assigning whichever of
    // a or b are missing. This is necessary because panning goes right from supplyDefaults
    // to plot (skipping calc). That means on subsequent updates, this *will* need to be
    // able to find a and b.
    //
    // The long-term proper fix is that this should perhaps use underscored attributes to
    // at least modify the user input to a slightly lesser extent. Fully removing the
    // input mutation is challenging. The underscore approach is not currently taken since
    // it requires modification to all of the functions below that expect the coerced
    // attribute name to match the property name -- except '_a' !== 'a' so that is not
    // straightforward.
    if(traceIn.a && traceIn.b) {
        var showLines, lineColor, fillColor;

        var len = handleXYZDefaults(traceIn, traceOut, coerce, layout, 'a', 'b');

        if(!len) {
            traceOut.visible = false;
            return;
        }

        coerce('text');
        var isConstraint = (coerce('contours.type') === 'constraint');

        var contours = traceOut.contours;

        // Unimplemented:
        // coerce('connectgaps', hasColumns(traceOut));

        // Override the trace-level showlegend default with a default that takes
        // into account whether this is a constraint or level contours:
        Lib.coerce(traceIn, traceOut, plotAttributes, 'showlegend', isConstraint);

        if(isConstraint) {
            var operation = coerce('contours.operation');

            supplyConstraintDefaults(coerce, contours);

            if(operation === '=') {
                showLines = contours.showlines = true;
                lineColor = coerce('line.color', defaultColor);
                coerce('line.width', 2);
                coerce('line.dash');
            }
            else {
                showLines = coerce('contours.showlines');
                fillColor = coerce('fillcolor', addOpacity(
                    (traceIn.line || {}).color || defaultColor, 0.5
                ));
            }

            coerce('line.smoothing');

            var showLabels = coerce('contours.showlabels');
            if(showLabels) {
                var globalFont = layout.font;
                Lib.coerceFont(coerce, 'contours.labelfont', {
                    family: globalFont.family,
                    size: globalFont.size,
                    color: lineColor
                });
                coerce('contours.labelformat');
            }

            if(showLines) {
                var lineDfltColor = fillColor && opacity(fillColor) ?
                    addOpacity(traceOut.fillcolor, 1) :
                    defaultColor;
                lineColor = coerce('line.color', lineDfltColor);
                coerce('line.width', 2);
                coerce('line.dash');
            }

            // TODO: These should be deleted in accordance with toolpanel convention, but
            // we can't because we require them so that it magically makes the contour
            // parts of the code happy:
            // delete traceOut.contours.start;
            // delete traceOut.contours.end;
            // delete traceOut.contours.size;
        } else {
            handleContoursDefaults(traceIn, traceOut, coerce, coerce2);
            handleStyleDefaults(traceIn, traceOut, coerce, layout, {hasHover: false});
        }
    } else {
        traceOut._defaultColor = defaultColor;
    }
};
