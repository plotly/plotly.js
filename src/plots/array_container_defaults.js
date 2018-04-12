/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../lib');
var Template = require('../plot_api/plot_template');

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
 *              - index {integer}
 * N.B.
 *
 *  - opts is passed to handleItemDefaults so it can also store
 *    links to supplementary data (e.g. fullData for layout components)
 *
 */
module.exports = function handleArrayContainerDefaults(parentObjIn, parentObjOut, opts) {
    var name = opts.name;

    var previousContOut = parentObjOut[name];

    var contIn = Lib.isArrayOrTypedArray(parentObjIn[name]) ? parentObjIn[name] : [];
    var contOut = parentObjOut[name] = [];
    var templater = Template.arrayTemplater(parentObjOut, name);
    var i, itemOut;

    for(i = 0; i < contIn.length; i++) {
        var itemIn = contIn[i];
        var itemOpts = {};

        if(!Lib.isPlainObject(itemIn)) {
            itemOpts.itemIsNotPlainObject = true;
            itemIn = {};
        }
        itemOut = templater.newItem(itemIn);

        if(itemOut.visible !== false) {
            opts.handleItemDefaults(itemIn, itemOut, parentObjOut, opts, itemOpts);
        }

        itemOut._input = itemIn;
        itemOut._index = i;

        contOut.push(itemOut);
    }

    var defaultItems = templater.defaultItems();
    for(i = 0; i < defaultItems.length; i++) {
        itemOut = defaultItems[i];
        opts.handleItemDefaults({}, itemOut, parentObjOut, opts, {});
        // TODO: we don't have an _input here - need special handling for edits,
        // is that all _input is used for?
        itemOut._index = contOut.length;
        contOut.push(itemOut);
    }

    // in case this array gets its defaults rebuilt independent of the whole layout,
    // relink the private keys just for this array.
    if(Lib.isArrayOrTypedArray(previousContOut)) {
        var len = Math.min(previousContOut.length, contOut.length);
        for(i = 0; i < len; i++) {
            Lib.relinkPrivateKeys(contOut[i], previousContOut[i]);
        }
    }

    return contOut;
};
