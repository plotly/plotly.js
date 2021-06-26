'use strict';

module.exports = {
    CLICK_TRANSITION_TIME: 750,
    CLICK_TRANSITION_EASING: 'linear',
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
    ]
};
