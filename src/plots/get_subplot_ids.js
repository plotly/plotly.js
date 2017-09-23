/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';


var Registry = require('../registry');

/**
 * Get the ids of the current subplots.
 *
 * @param {object} layout plotly full layout object.
 * @param {string} type subplot type to look for.
 *
 * @return {array} list of ordered subplot ids (strings).
 *
 */
module.exports = function getSubplotIds(layout, type) {
    var _module = Registry.subplotsRegistry[type];

    if(!_module) return [];

    // layout must be 'fullLayout' here
    if(type === 'cartesian' && (!layout._has || !layout._has('cartesian'))) return [];
    if(type === 'gl2d' && (!layout._has || !layout._has('gl2d'))) return [];
    if(type === 'cartesian' || type === 'gl2d') {
        return Object.keys(layout._plots || {});
    }

    var attrRegex = _module.attrRegex,
        layoutKeys = Object.keys(layout),
        subplotIds = [];

    for(var i = 0; i < layoutKeys.length; i++) {
        var layoutKey = layoutKeys[i];

        if(attrRegex.test(layoutKey)) subplotIds.push(layoutKey);
    }

    // order the ids
    var idLen = _module.idRoot.length;
    subplotIds.sort(function(a, b) {
        var aNum = +(a.substr(idLen) || 1),
            bNum = +(b.substr(idLen) || 1);
        return aNum - bNum;
    });

    return subplotIds;
};
