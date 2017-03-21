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
var hasColumns = require('../heatmap/has_columns');
var handleStyleDefaults = require('../contour/style_defaults');
var constraintMapping = require('./constraint_mapping');
//var tinycolor = require('tinycolor2');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    coerce('carpetid');

    // If either a or b is not present, then it's not a valid trace *unless* the carpet
    // axis has the a or b valeus we're looking for. So if these are not found, just defer
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
        var contourSize, contourStart, contourEnd, missingEnd, autoContour, map;

        var len = handleXYZDefaults(traceIn, traceOut, coerce, layout, 'a', 'b');

        if(!len) {
            traceOut.visible = false;
            return;
        }

        coerce('text');
        coerce('connectgaps', hasColumns(traceOut));

        coerce('contours.type');

        if(traceOut.contours.type === 'constraint') {
            coerce('contours.operation');
            coerce('contours.value');

            map = constraintMapping[traceOut.contours.operation](traceOut.contours.value);

            traceOut.contours.start = map.start;
            traceOut.contours.end = map.end;
            traceOut.contours.size = map.size;

        } else {
            contourStart = Lib.coerce2(traceIn, traceOut, attributes, 'contours.start');
            contourEnd = Lib.coerce2(traceIn, traceOut, attributes, 'contours.end');

                // normally we only need size if autocontour is off. But contour.calc
                // pushes its calculated contour size back to the input trace, so for
                // things like restyle that can call supplyDefaults without calc
                // after the initial draw, we can just reuse the previous calculation
            contourSize = coerce('contours.size');
        }

        missingEnd = (contourStart === false) || (contourEnd === false);
        autoContour;

        if(missingEnd) {
            autoContour = traceOut.autocontour = true;
        } else {
            autoContour = coerce('autocontour', false);
        }

        if(autoContour || !contourSize) {
            coerce('ncontours');
        }

        handleStyleDefaults(traceIn, traceOut, coerce, layout);

        if(traceOut.contours.type === 'constraint' && traceOut.contours.operation === '=') {
            traceOut.contours.coloring = 'none';
        }
    }
};
