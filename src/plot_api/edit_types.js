/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../lib');
var extendFlat = Lib.extendFlat;
var isPlainObject = Lib.isPlainObject;

module.exports = {
    /*
     * default (all false) edit flags for restyle (traces)
     * creates a new object each call, so the caller can mutate freely
     */
    traces: function() {
        return {
            calc: false,
            calcIfAutorange: false,
            plot: false,
            style: false,
            colorbars: false,
            autorangeOn: false,
            clearCalc: false,
            fullReplot: false
        };
    },

    /*
     * default (all false) edit flags for relayout
     * creates a new object each call, so the caller can mutate freely
     */
    layout: function() {
        return {
            legend: false,
            ticks: false,
            layoutstyle: false,
            plot: false,
            calc: false,
            calcIfAutorange: false,
            modebar: false,
            camera: false,
            arraydraw: false,
            layoutReplot: false
        };
    },

    /*
     * update `flags` with the `editType` values found in `attr`
     */
    update: function(flags, attr) {
        var editType = attr.editType;
        if(editType && editType !== 'none') {
            var editTypeParts = editType.split('+');
            for(var i = 0; i < editTypeParts.length; i++) {
                flags[editTypeParts[i]] = true;
            }
        }
    },

    overrideAll: overrideAll
};

/**
 * For attributes that are largely copied from elsewhere into a plot type that doesn't
 * support partial redraws - overrides the editType field of all attributes in the object
 *
 * @param {object} attrs: the attributes to override. Will not be mutated.
 * @param {string} editTypeOverride: the new editType to use
 * @param {'nested'|'from-root'} overrideContainers:
 *   - 'nested' will override editType for nested containers but not the root.
 *   - 'from-root' will also override editType of the root container.
 *   Containers below the absolute top level (trace or layout root) DO need an
 *   editType even if they are not `valObject`s themselves (eg `scatter.marker`)
 *   to handle the case where you edit the whole container.
 *
 * @return {object} a new attributes object with `editType` modified as directed
 */
function overrideAll(attrs, editTypeOverride, overrideContainers) {
    var out = extendFlat({}, attrs);
    for(var key in out) {
        var attr = out[key];
        if(isPlainObject(attr)) {
            out[key] = overrideOne(attr, editTypeOverride, overrideContainers, key);
        }
    }
    if(overrideContainers === 'from-root') out.editType = editTypeOverride;

    return out;
}

function overrideOne(attr, editTypeOverride, overrideContainers, key) {
    if(attr.valType) {
        var out = extendFlat({}, attr);
        out.editType = editTypeOverride;

        if(Array.isArray(attr.items)) {
            out.items = new Array(attr.items.length);
            for(var i = 0; i < attr.items.length; i++) {
                out.items[i] = overrideOne(attr.items[i], editTypeOverride, 'from-root');
            }
        }
        return out;
    }
    else {
        // don't provide an editType for the _deprecated container
        return overrideAll(attr, editTypeOverride,
            (key.charAt(0) === '_') ? 'nested' : 'from-root');
    }
}
