/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../lib');


/** Convenience wrapper for making array container logic DRY and consistent
 *
 * @param {object} parentObjIn
 *  user input object where the container in question is linked
 *  (i.e. either a user trace object or the user layout object)
 *
 * @param {object} parentObjOut
 *  full object where the coerced container will be linked
 *  (i.e. either a full trace object or the full layout object)
 *
 * @param {object} opts
 *  options object:
 *   - name {string}
 *      name of the key linking the container in question
 *   - handleItemDefaults {function}
 *      defaults method to be called on each item in the array container in question
 *
 *      Its arguments are:
 *          - itemIn {object} item in user layout
 *          - itemOut {object} item in full layout
 *          - parentObj {object} (as in closure)
 *          - opts {object} (as in closure)
 *          - itemOpts {object}
 *              - itemIsNotPlainObject {boolean}
 * N.B.
 *
 *  - opts is passed to handleItemDefaults so it can also store
 *    links to supplementary data (e.g. fullData for layout components)
 *
 */
module.exports = function handleArrayContainerDefaults(parentObjIn, parentObjOut, opts) {
    var name = opts.name;

    var previousContOut = parentObjOut[name];

    var contIn = Lib.isArray(parentObjIn[name]) ? parentObjIn[name] : [],
        contOut = parentObjOut[name] = [],
        i;

    for(i = 0; i < contIn.length; i++) {
        var itemIn = contIn[i],
            itemOut = {},
            itemOpts = {};

        if(!Lib.isPlainObject(itemIn)) {
            itemOpts.itemIsNotPlainObject = true;
            itemIn = {};
        }

        opts.handleItemDefaults(itemIn, itemOut, parentObjOut, opts, itemOpts);

        itemOut._input = itemIn;
        itemOut._index = i;

        contOut.push(itemOut);
    }

    // in case this array gets its defaults rebuilt independent of the whole layout,
    // relink the private keys just for this array.
    if(Lib.isArray(previousContOut)) {
        var len = Math.min(previousContOut.length, contOut.length);
        for(i = 0; i < len; i++) {
            Lib.relinkPrivateKeys(contOut[i], previousContOut[i]);
        }
    }
};
