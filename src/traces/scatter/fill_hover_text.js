/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');

/** Fill hover 'pointData' container with 'correct' hover text value
 *
 * - If trace hoverinfo contains a 'text' flag and hovertext is not set,
 *   the text elements will be seen in the hover labels.
 *
 * - If trace hoverinfo contains a 'text' flag and hovertext is set,
 *   hovertext takes precedence over text
 *   i.e. the hoverinfo elements will be seen in the hover labels
 *
 *  @param {object} calcPt
 *  @param {object} trace
 *  @param {object || array} contOut (mutated here)
 */
module.exports = function fillHoverText(calcPt, trace, contOut) {
    var fill = Array.isArray(contOut) ?
        function(v) { contOut.push(v); } :
        function(v) { contOut.text = v; };

    var htx = Lib.extractOption(calcPt, trace, 'htx', 'hovertext');
    if(isValid(htx)) return fill(htx);

    var tx = Lib.extractOption(calcPt, trace, 'tx', 'text');
    if(isValid(tx)) return fill(tx);
};

// accept all truthy values and 0 (which gets cast to '0' in the hover labels)
function isValid(v) {
    return v || v === 0;
}
