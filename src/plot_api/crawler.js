/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../lib');

var crawler = module.exports = {};

crawler.IS_SUBPLOT_OBJ = '_isSubplotObj';
crawler.IS_LINKED_TO_ARRAY = '_isLinkedToArray';
crawler.DEPRECATED = '_deprecated';

// list of underscore attributes to keep in schema as is
crawler.UNDERSCORE_ATTRS = [crawler.IS_SUBPLOT_OBJ, crawler.IS_LINKED_TO_ARRAY, crawler.DEPRECATED];

/**
 * Crawl the attribute tree, recursively calling a callback function
 *
 * @param {object} attrs
 *  The node of the attribute tree (e.g. the root) from which recursion originates
 * @param {Function} callback
 *  A callback function with the signature:
 *          @callback callback
 *          @param {object} attr an attribute
 *          @param {String} attrName name string
 *          @param {object[]} attrs all the attributes
 *          @param {Number} level the recursion level, 0 at the root
 * @param {Number} [specifiedLevel]
 *  The level in the tree, in order to let the callback function detect descend or backtrack,
 *  typically unsupplied (implied 0), just used by the self-recursive call.
 *  The necessity arises because the tree traversal is not controlled by callback return values.
 *  The decision to not use callback return values for controlling tree pruning arose from
 *  the goal of keeping the crawler backwards compatible. Observe that one of the pruning conditions
 *  precedes the callback call.
 *
 * @return {object} transformOut
 *  copy of transformIn that contains attribute defaults
 */
crawler.crawl = function(attrs, callback, specifiedLevel) {
    var level = specifiedLevel || 0;
    Object.keys(attrs).forEach(function(attrName) {
        var attr = attrs[attrName];

        if(crawler.UNDERSCORE_ATTRS.indexOf(attrName) !== -1) return;

        callback(attr, attrName, attrs, level);

        if(Lib.isValObject(attr)) return;
        if(Lib.isPlainObject(attr)) crawler.crawl(attr, callback, level + 1);
    });
};
