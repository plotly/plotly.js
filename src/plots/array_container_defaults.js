/**
* Copyright 2012-2016, Plotly, Inc.
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
 *      defaults method to be called on each item in the array container in question,
 *
 * N.B.
 *
 *  - opts is passed to handleItemDefaults so it can also store
 *    links to supplementary data (e.g. fullData for layout components)
 *
 *  - opts.itemIsNotPlainObject is mutated on every pass in case so logic
 *    in handleItemDefaults relies on that fact.
 *
 */
module.exports = function handleArrayContainerDefaults(parentObjIn, parentObjOut, opts) {
    var name = opts.name;

    var contIn = Array.isArray(parentObjIn[name]) ? parentObjIn[name] : [],
        contOut = parentObjOut[name] = [];

    for(var i = 0; i < contIn.length; i++) {
        var itemIn = contIn[i],
            itemOut = {};

        if(!Lib.isPlainObject(itemIn)) {
            opts.itemIsNotPlainObject = true;
            itemIn = {};
        }
        else {
            opts.itemIsNotPlainObject = false;
        }

        opts.handleItemDefaults(itemIn, itemOut, parentObjOut, opts);

        itemOut._input = itemIn;
        itemOut._index = i;

        contOut.push(itemOut);
    }
};
