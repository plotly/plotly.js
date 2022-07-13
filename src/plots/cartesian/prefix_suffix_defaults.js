'use strict';

var getShowAttrDflt = require('./show_dflt');

module.exports = function handlePrefixSuffixDefaults(containerIn, containerOut, coerce, axType, options) {
    if(!options) options = {};
    var tickSuffixDflt = options.tickSuffixDflt;

    var showAttrDflt = getShowAttrDflt(containerIn);

    var tickPrefix = coerce('tickprefix');
    if(tickPrefix) coerce('showtickprefix', showAttrDflt);

    var tickSuffix = coerce('ticksuffix', tickSuffixDflt);
    if(tickSuffix) coerce('showticksuffix', showAttrDflt);
};
