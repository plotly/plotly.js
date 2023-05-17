'use strict';

module.exports = function handleAutorangeOptionsDefaults(coerce) {
    var minallowed = coerce('autorangeoptions.minallowed');
    var maxallowed = coerce('autorangeoptions.maxallowed');

    if(minallowed === undefined) coerce('autorangeoptions.clipmin');
    if(maxallowed === undefined) coerce('autorangeoptions.clipmax');

    coerce('autorangeoptions.include');
};
