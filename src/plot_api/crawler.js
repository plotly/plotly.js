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
