'use strict';

var Lib = require('../../lib');
var Color = require('../../components/color');

var DESELECTDIM = require('../../constants/interactions').DESELECTDIM;

function styleTextSelection(cd) {
    var cd0 = cd[0];
    var trace = cd0.trace;
    var stash = cd0.t;
    var scene = stash._scene;
    var index = stash.index;
    var els = scene.selectBatch[index];
    var unels = scene.unselectBatch[index];
    var baseOpts = scene.textOptions[index];
    var selOpts = scene.textSelectedOptions[index] || {};
    var unselOpts = scene.textUnselectedOptions[index] || {};
    var opts = Lib.extendFlat({}, baseOpts);
    var i, j;

    if(els.length || unels.length) {
        var stc = selOpts.color;
        var utc = unselOpts.color;
        var base = baseOpts.color;
        var hasArrayBase = Lib.isArrayOrTypedArray(base);
        opts.color = new Array(trace._length);

        for(i = 0; i < els.length; i++) {
            j = els[i];
            opts.color[j] = stc || (hasArrayBase ? base[j] : base);
        }
        for(i = 0; i < unels.length; i++) {
            j = unels[i];
            var basej = hasArrayBase ? base[j] : base;
            opts.color[j] = utc ? utc :
                stc ? basej : Color.addOpacity(basej, DESELECTDIM);
        }
    }

    scene.glText[index].update(opts);
}

module.exports = {
    styleTextSelection: styleTextSelection
};
