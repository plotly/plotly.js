'use strict';

module.exports = {
    CLICK_TRANSITION_TIME: 750,
    CLICK_TRANSITION_EASING: 'poly',
    eventDataKeys: [
        // string
        'currentPath',
        'root',
        'entry',
        // no need to add 'parent' here

        // percentages i.e. ratios
        'percentRoot',
        'percentEntry',
        'percentParent'
    ],
    gapWithPathbar: 1 // i.e. one pixel
};
