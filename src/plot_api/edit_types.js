/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

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
     */
    update: function(flags, attr) {
        var editType = attr.editType;
        if(editType) {
            var editTypeParts = editType.split('+');
            for(var i = 0; i < editTypeParts.length; i++) {
                flags[editTypeParts[i]] = true;
            }
        }
    }
};
