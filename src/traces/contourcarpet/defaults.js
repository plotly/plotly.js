/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');

var handleXYZDefaults = require('../heatmap/xyz_defaults');
var attributes = require('./attributes');
var handleStyleDefaults = require('../contour/style_defaults');
var handleFillColorDefaults = require('../scatter/fillcolor_defaults');
var plotAttributes = require('../../plots/attributes');
var supplyConstraintDefaults = require('./constraint_value_defaults');
var addOpacity = require('../../components/color').addOpacity;

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
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
        var contourSize, contourStart, contourEnd, missingEnd, autoContour;

        var len = handleXYZDefaults(traceIn, traceOut, coerce, layout, 'a', 'b');

        if(!len) {
            traceOut.visible = false;
            return;
        }

        coerce('text');
        coerce('contours.type');

        var contours = traceOut.contours;

        // Unimplemented:
        // coerce('connectgaps', hasColumns(traceOut));

        if(contours.type === 'constraint') {
            coerce('contours.operation');

            supplyConstraintDefaults(coerce, contours);

            // Override the trace-level showlegend default with a default that takes
            // into account whether this is a constraint or level contours:
            Lib.coerce(traceIn, traceOut, plotAttributes, 'showlegend', true);

            // Override the above defaults with constraint-aware tweaks:
            coerce('contours.coloring', contours.operation === '=' ? 'lines' : 'fill');
            coerce('contours.showlines', true);

            if(contours.operation === '=') {
                contours.coloring = 'lines';
            }
            handleFillColorDefaults(traceIn, traceOut, defaultColor, coerce);

            // If there's a fill color, use it at full opacity for the line color
            var lineDfltColor = traceOut.fillcolor ? addOpacity(traceOut.fillcolor, 1) : defaultColor;

            handleStyleDefaults(traceIn, traceOut, coerce, layout, lineDfltColor, 2);

            if(contours.operation === '=') {
                coerce('line.color', defaultColor);

                if(contours.coloring === 'fill') {
                    contours.coloring = 'lines';
                }

                if(contours.coloring === 'lines') {
                    delete traceOut.fillcolor;
                }
            }

            delete traceOut.showscale;
            delete traceOut.autocontour;
            delete traceOut.autocolorscale;
            delete traceOut.colorscale;
            delete traceOut.ncontours;
            delete traceOut.colorbar;

            if(traceOut.line) {
                delete traceOut.line.autocolorscale;
                delete traceOut.line.colorscale;
                delete traceOut.line.mincolor;
                delete traceOut.line.maxcolor;
            }

            // TODO: These shouldb e deleted in accordance with toolpanel convention, but
            // we can't becuase we require them so that it magically makes the contour
            // parts of the code happy:
            // delete traceOut.contours.start;
            // delete traceOut.contours.end;
            // delete traceOut.contours.size;
        } else {
            // Override the trace-level showlegend default with a default that takes
            // into account whether this is a constraint or level contours:
            Lib.coerce(traceIn, traceOut, plotAttributes, 'showlegend', false);

            contourStart = Lib.coerce2(traceIn, traceOut, attributes, 'contours.start');
            contourEnd = Lib.coerce2(traceIn, traceOut, attributes, 'contours.end');

                // normally we only need size if autocontour is off. But contour.calc
                // pushes its calculated contour size back to the input trace, so for
                // things like restyle that can call supplyDefaults without calc
                // after the initial draw, we can just reuse the previous calculation
            contourSize = coerce('contours.size');
            coerce('contours.coloring');

            missingEnd = (contourStart === false) || (contourEnd === false);

            if(missingEnd) {
                autoContour = traceOut.autocontour = true;
            } else {
                autoContour = coerce('autocontour', false);
            }

            if(autoContour || !contourSize) {
                coerce('ncontours');
            }

            handleStyleDefaults(traceIn, traceOut, coerce, layout);

            delete traceOut.value;
            delete traceOut.operation;
        }
    } else {
        traceOut._defaultColor = defaultColor;
    }
};
