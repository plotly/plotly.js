export const cellPad = 8;
export const columnExtentOffset = 10;
export const columnTitleOffset = 28;
export const emptyHeaderHeight = 16;
export const latexCheck = /^\$.*\$$/;
export const goldenRatio = 1.618;
export const lineBreaker = '<br>';
export const maxDimensionCount = 60;
export const overdrag = 45;
export const releaseTransitionDuration = 120;
export const releaseTransitionEase = 'cubic-out';
export const scrollbarCaptureWidth = 18;
export const scrollbarHideDelay = 1000;
export const scrollbarHideDuration = 1000;
export const scrollbarOffset = 5;
export const scrollbarWidth = 8;
export const transitionDuration = 100;
export const transitionEase = 'cubic-out';
export const uplift = 5;
export const wrapSpacer = ' ';
export const wrapSplitCharacter = ' ';

export const cn = {
    // General class names
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

    // Scroll related class names
    scrollbarKit: 'scrollbar-kit',
    scrollbar: 'scrollbar',
    scrollbarSlider: 'scrollbar-slider',
    scrollbarGlyph: 'scrollbar-glyph',
    scrollbarCaptureZone: 'scrollbar-capture-zone'
} as const;
