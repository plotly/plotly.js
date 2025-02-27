'use strict';

module.exports = function handleAutorangeOptionsDefaults(coerce, autorange, range) {
    var minRange, maxRange;
    if(range) {
        var isReversed = (
            autorange === 'reversed' ||
            autorange === 'min reversed' ||
            autorange === 'max reversed'
        );

        minRange = range[isReversed ? 1 : 0];
        maxRange = range[isReversed ? 0 : 1];
    }

    var minallowed = coerce('autorangeoptions.minallowed', maxRange === null ? minRange : undefined);
    var maxallowed = coerce('autorangeoptions.maxallowed', minRange === null ? maxRange : undefined);

    if(minallowed === undefined) coerce('autorangeoptions.clipmin');
    if(maxallowed === undefined) coerce('autorangeoptions.clipmax');

    coerce('autorangeoptions.include');
};
