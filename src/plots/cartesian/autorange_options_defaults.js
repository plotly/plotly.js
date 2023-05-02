'use strict';

module.exports = function handleAutorangeOptionsDefaults(coerce) {
    var autorangemin = coerce('autorangemin');
    var autorangemax = coerce('autorangemax');

    if(autorangemin === undefined) coerce('autorangeclipmin');
    if(autorangemax === undefined) coerce('autorangeclipmax');

    coerce('autorangeinclude');
};
