/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = {
    maxDimensionCount: 60,
    overdrag: 45,
    cellPad: 8,
    latexCheck: /^\$.*\$$/,
    wrapSplitCharacter: ' ',
    wrapSpacer: ' ',
    lineBreaker: '<br>',
    uplift: 5,
    goldenRatio: 1.618,
    columnTitleOffset: 28,
    columnExtentOffset: 10,
    transitionEase: 'cubic-out',
    transitionDuration: 100,
    releaseTransitionEase: 'cubic-out',
    releaseTransitionDuration: 120,
    scrollbarWidth: 8,
    scrollbarCaptureWidth: 18,
    scrollbarOffset: 5,
    scrollbarHideDelay: 1000,
    scrollbarHideDuration: 1000,
    cn: {
        // general class names
        table: 'table',
        tableControlView: 'table-control-view',
        scrollBackground: 'scroll-background',
        yColumn: 'y-column',
        columnBlock: 'column-block',
        scrollAreaClip: 'scroll-area-clip',
        scrollAreaClipRect: 'scroll-area-clip-rect',
        columnBoundary: 'column-boundary',
        columnBoundaryClippath: 'column-boundary-clippath',
        columnBoundaryRect: 'column-boundary-rect',
        columnCells: 'column-cells',
        columnCell: 'column-cell',
        cellRect: 'cell-rect',
        cellText: 'cell-text',
        cellTextHolder: 'cell-text-holder',

        // scroll related class names
        scrollbarKit: 'scrollbar-kit',
        scrollbar: 'scrollbar',
        scrollbarSlider: 'scrollbar-slider',
        scrollbarGlyph: 'scrollbar-glyph',
        scrollbarCaptureZone: 'scrollbar-capture-zone'
    }
};
