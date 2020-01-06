/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');
var Lib = require('../../lib');

function resizeText(gd, gTrace, traceType) {
    var fullLayout = gd._fullLayout;
    var minSize = fullLayout['_' + traceType + 'Text_minsize'];
    if(minSize) {
        var shouldHide = fullLayout.uniformtext.mode === 'hide';

        var selector;
        switch(traceType) {
            case 'funnelarea' :
            case 'pie' :
            case 'sunburst' :
                selector = 'g.slice';
                break;
            case 'treemap' :
                selector = 'g.slice, g.pathbar';
                break;
            default :
                selector = 'g.points > g.point';
        }

        gTrace.selectAll(selector).each(function(d) {
            var transform = d.transform;
            if(transform) {
                transform.scale = (shouldHide && transform.hide) ? 0 : minSize / transform.fontSize;

                var el = d3.select(this).select('text');
                el.attr('transform', Lib.getTextTransform(transform));
            }
        });
    }
}

function recordMinTextSize(
    traceType, // in
    transform, // inout
    fullLayout // inout
) {
    if(fullLayout.uniformtext.mode) {
        var minKey = getMinKey(traceType);
        var minSize = fullLayout.uniformtext.minsize;
        var size = transform.scale * transform.fontSize;

        transform.hide = size < minSize;

        fullLayout[minKey] = fullLayout[minKey] || Infinity;
        if(!transform.hide) {
            fullLayout[minKey] = Math.min(
                fullLayout[minKey],
                Math.max(size, minSize)
            );
        }
    }
}

function clearMinTextSize(
    traceType, // in
    fullLayout // inout
) {
    var minKey = getMinKey(traceType);
    fullLayout[minKey] = undefined;
}

function getMinKey(traceType) {
    return '_' + traceType + 'Text_minsize';
}

module.exports = {
    recordMinTextSize: recordMinTextSize,
    clearMinTextSize: clearMinTextSize,
    resizeText: resizeText
};
