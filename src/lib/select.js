/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var polygon = require('./polygon');

var select = module.exports = {};

/**
 * Constructs a new point selection definition.
 *
 * @param pointNumber the point number of the point as in `data`
 * @param searchInfo identifies the trace the point is contained in
 * @param subtract true if the selection definition should mark a deselection
 * @return {{pointNumber: Number, searchInfo: Object, subtract: boolean}}
 */
select.pointSelectionDef = function(pointNumber, searchInfo, subtract) {
    return {
        pointNumber: pointNumber,
        searchInfo: searchInfo,
        subtract: subtract
    };
};

function isPointSelectionDef(o) {
    return 'pointNumber' in o && 'searchInfo' in o;
}

function pointNumberTester(pointSelectionDef) {
    return {
        xmin: 0,
        xmax: 0,
        ymin: 0,
        ymax: 0,
        pts: [],
        contains: function(pt, omitFirstEdge, pointNumber, searchInfo) {
            return searchInfo.cd[0].trace._expandedIndex === pointSelectionDef.searchInfo.cd[0].trace._expandedIndex &&
              pointNumber === pointSelectionDef.pointNumber;
        },
        isRect: false,
        degenerate: false,
        subtract: pointSelectionDef.subtract
    };
}

/**
 * Wraps multiple selection testers.
 *
 * @param list an array of selection testers
 *
 * @return a selection tester object with a contains function
 * that can be called to evaluate a point against all wrapped
 * selection testers that were passed in list.
 */
select.multiTester = function multiTester(list) {
    var testers = [];
    var xmin = isPointSelectionDef(list[0]) ? 0 : list[0][0][0];
    var xmax = xmin;
    var ymin = isPointSelectionDef(list[0]) ? 0 : list[0][0][1];
    var ymax = ymin;

    for(var i = 0; i < list.length; i++) {
        if(isPointSelectionDef(list[i])) {
            testers.push(pointNumberTester(list[i]));
        } else {
            var tester = polygon.tester(list[i]);
            tester.subtract = list[i].subtract;
            testers.push(tester);
            xmin = Math.min(xmin, tester.xmin);
            xmax = Math.max(xmax, tester.xmax);
            ymin = Math.min(ymin, tester.ymin);
            ymax = Math.max(ymax, tester.ymax);
        }
    }

    // TODO Consider making signature of contains more lean
    /**
     * Tests if the given point is within this tester.
     *
     * @param pt an object having an `x` and a `y` property defining the location
     *        of the point
     * @param arg parameter to pass additional arguments down to wrapped testers
     * @param pointNumber the point number of the point
     * @param searchInfo identifies the trace the point is contained in
     * @return {boolean}
     */
    function contains(pt, arg, pointNumber, searchInfo) {
        var yes = false;
        for(var i = 0; i < testers.length; i++) {
            if(testers[i].contains(pt, arg, pointNumber, searchInfo)) {
                // if contained by subtract tester - exclude the point
                yes = testers[i].subtract === false;
            }
        }

        return yes;
    }

    return {
        xmin: xmin,
        xmax: xmax,
        ymin: ymin,
        ymax: ymax,
        pts: [],
        contains: contains,
        isRect: false,
        degenerate: false
    };
};
