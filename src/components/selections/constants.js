'use strict';

module.exports = {
    // max pixels off straight before a lasso select line counts as bent
    BENDPX: 1.5,

    // smallest dimension allowed for a select box
    MINSELECT: 12,

    // throttling limit (ms) for selectPoints calls
    SELECTDELAY: 100,

    // cache ID suffix for throttle
    SELECTID: '-select',
};
