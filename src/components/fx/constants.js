'use strict';

module.exports = {
    // hover labels for multiple horizontal bars get tilted by this angle
    YANGLE: 60,

    // size and display constants for hover text

    // pixel size of hover arrows
    HOVERARROWSIZE: 6,
    // pixels padding around text
    HOVERTEXTPAD: 3,
    // hover font
    HOVERFONTSIZE: 13,
    HOVERFONT: 'Arial, sans-serif',

    // minimum time (msec) between hover calls
    HOVERMINTIME: 50,

    // ID suffix (with fullLayout._uid) for hover events in the throttle cache
    HOVERID: '-hover'
};
