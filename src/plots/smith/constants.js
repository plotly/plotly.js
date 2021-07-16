'use strict';

module.exports = {
    attr: 'subplot',
    name: 'smith',

    axisNames: ['imaginaryaxis', 'realaxis'],
    axisName2dataArray: {imaginaryaxis: 'theta', realaxis: 'r'},

    layerNames: [
        'draglayer',
        'plotbg',
        'backplot',
        'angular-grid',
        'radial-grid',
        'frontplot',
        'angular-line',
        'radial-line',
        'angular-axis',
        'radial-axis'
    ],

    radialDragBoxSize: 50,
    angularDragBoxSize: 30,
    cornerLen: 25,
    cornerHalfWidth: 2,

    // pixels to move mouse before you stop clamping to starting point
    MINDRAG: 8,
    // smallest radial distance [px] allowed for a zoombox
    MINZOOM: 20,
    // distance [px] off (r=0) or (r=radius) where we transition
    // from single-sided to two-sided radial zoom
    OFFEDGE: 20
};
