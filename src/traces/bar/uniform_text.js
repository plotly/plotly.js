'use strict';

var d3 = require('@plotly/d3');
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
            case 'icicle' :
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
                Lib.setTransormAndDisplay(el, transform);
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
