/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isPlainObject = require('../lib/is_plain_object');

module.exports = {
    /*
     * default (all false) edit flags for restyle (traces)
     * creates a new object each call, so the caller can mutate freely
     */
    traces: function() {
        return {
            docalc: false,
            docalcAutorange: false,
            doplot: false,
            dostyle: false,
            docolorbars: false,
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
            dolegend: false,
            doticks: false,
            dolayoutstyle: false,
            doplot: false,
            docalc: false,
            domodebar: false,
            docamera: false,
            layoutReplot: false
        };
    },

    /*
     * update `flags` with the `editType` values found in `attr`
     *
     * If `attr` itself contains an `editType`, we just use that.
     * If it doesn't, we recurse into any other objects contained
     * in `attr` and update with all `editType` values found in
     * *any* of them.
     *
     * So container objects may not need their own `editType`,
     * if they're content to delegate to their members, but they
     * may provide one either for performance or, in case of arrays,
     * if adding/removing entries requires different flags than
     * simply changing attributes of an existing entry.
     */
    update: function(flags, attr) {
        function extend(attr1) {
            var editType = attr1.editType;
            if(editType === undefined) {
                // if there's no editType defined, recurse into
                Object.keys(attr1).forEach(function(attrName) {
                    var attr2 = attr1[attrName];
                    if(attrName.charAt(0) !== '_' && isPlainObject(attr2)) {
                        extend(attr2);
                    }
                });
            }
            else {
                var editTypeParts = editType.split('+');
                editTypeParts.forEach(function(part) {
                    flags[part] = true;
                });
            }
        }

        extend(attr);
    }
};
