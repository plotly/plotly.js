/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/**
 * This will be transferred over to gd and overridden by
 * config args to Plotly.plot.
 *
 * The defaults are the appropriate settings for plotly.js,
 * so we get the right experience without any config argument.
 */

module.exports = {

    // no interactivity, for export or image generation
    staticPlot: false,

    // we can edit titles, move annotations, etc - sets all pieces of `edits`
    // unless a separate `edits` config item overrides individual parts
    editable: false,
    edits: {
        // annotationPosition: the main anchor of the annotation, which is the
        // text (if no arrow) or the arrow (which drags the whole thing leaving
        // the arrow length & direction unchanged)
        annotationPosition: false,
        // just for annotations with arrows, change the length  and direction of the arrow
        annotationTail: false,
        annotationText: false,
        axisTitleText: false,
        colorbarPosition: false,
        colorbarTitleText: false,
        legendPosition: false,
        // edit the trace name fields from the legend
        legendText: false,
        shapePosition: false,
        // the global `layout.title`
        titleText: false
    },

    // DO autosize once regardless of layout.autosize
    // (use default width or height values otherwise)
    autosizable: false,

    // set the length of the undo/redo queue
    queueLength: 0,

    // if we DO autosize, do we fill the container or the screen?
    fillFrame: false,

    // if we DO autosize, set the frame margins in percents of plot size
    frameMargins: 0,

    // mousewheel or two-finger scroll zooms the plot
    scrollZoom: false,

    // double click interaction (false, 'reset', 'autosize' or 'reset+autosize')
    doubleClick: 'reset+autosize',

    // new users see some hints about interactivity
    showTips: true,

    // enable axis pan/zoom drag handles
    showAxisDragHandles: true,

    // enable direct range entry at the pan/zoom drag points (drag handles must be enabled above)
    showAxisRangeEntryBoxes: true,

    // link to open this plot in plotly
    showLink: false,

    // if we show a link, does it contain data or just link to a plotly file?
    sendData: true,

    // text appearing in the sendData link
    linkText: 'Edit chart',

    // false or function adding source(s) to linkText <text>
    showSources: false,

    // display the mode bar (true, false, or 'hover')
    displayModeBar: 'hover',

    // remove mode bar button by name
    // (see ./components/modebar/buttons.js for the list of names)
    modeBarButtonsToRemove: [],

    // add mode bar button using config objects
    // (see ./components/modebar/buttons.js for list of arguments)
    modeBarButtonsToAdd: [],

    // fully custom mode bar buttons as nested array,
    // where the outer arrays represents button groups, and
    // the inner arrays have buttons config objects or names of default buttons
    // (see ./components/modebar/buttons.js for more info)
    modeBarButtons: false,

    // add the plotly logo on the end of the mode bar
    displaylogo: true,

    // increase the pixel ratio for Gl plot images
    plotGlPixelRatio: 2,

    // background setting function
    // 'transparent' sets the background `layout.paper_color`
    // 'opaque' blends bg color with white ensuring an opaque background
    // or any other custom function of gd
    setBackground: 'transparent',

    // URL to topojson files used in geo charts
    topojsonURL: 'https://cdn.plot.ly/',

    // Mapbox access token (required to plot mapbox trace types)
    // If using an Mapbox Atlas server, set this option to '',
    // so that plotly.js won't attempt to authenticate to the public Mapbox server.
    mapboxAccessToken: null,

    // Turn all console logging on or off (errors will be thrown)
    // This should ONLY be set via Plotly.setPlotConfig
    logging: false,

    // Set global transform to be applied to all traces with no
    // specification needed
    globalTransforms: []
};
