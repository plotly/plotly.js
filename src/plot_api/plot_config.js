/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/* eslint-disable no-console */

/**
 * This will be transferred over to gd and overridden by
 * config args to Plotly.plot.
 *
 * The defaults are the appropriate settings for plotly.js,
 * so we get the right experience without any config argument.
 */

module.exports = {

    staticPlot: {
        valType: 'boolean',
        dflt: false,
        description: [
            'Determines whether the graphs are interactive or not.',
            'If *false*, no interactivity, for export or image generation.'
        ].join(' ')
    },

    editable: {
        valType: 'boolean',
        dflt: false,
        description: [
            'Determines whether the graphs are editable',
            'e.g. where titles and annotations can be moved around',
            'and edited.'
        ].join(' ')
    },

    autosizable: {
        valType: 'boolean',
        dflt: false,
        description: [
            'Determines whether the graphs are plotted with respect to',
            'layout.autosize=true and infer its container size.'
        ].join(' ')
    },

    queueLength: {
        valType: 'number',
        dflt: 0,
        min: 0,
        description: [
            'Sets the length of the undo/redo queue.'
        ].join(' ')
    },

    fillFrame: {
        valType: 'boolean',
        dflt: false,
        description: [
            'When `layout.autosize` is turned on, determines whether the graph',
            'fills the container (the default) or the screen (if set to *true*).'
        ].join(' ')
    },

    frameMargins: {
        valType: 'number',
        dflt: 0,
        min: 0,
        max: 0.5,
        description: [
            'When `layout.autosize` is turned on, set the frame margins',
            'in fraction of the graph size.'
        ].join(' ')
    },

    scrollZoom: {
        valType: 'boolean',
        dftl: false,
        description: [
            'Determines whether mouse wheel or two-finger scroll zooms is',
            'enable. Has an effect only in cartesian plots.'
        ].join(' ')
    },

    doubleClick: {
        valType: 'enumerated',
        values: [false, 'reset', 'autosize', 'reset+autosize'],
        dflt: 'reset+autosize',
        description: [
            'Sets the double click interaction mode.',
            'Has an effect only in cartesian plots.',
            'If *false*, double click is disable.',
            'If *reset*, double click resets the axis ranges to their initial values.',
            'If *autosize*, double click set the axis ranges to their autorange values.',
            'If *reset+autosize, the odd double clicks resets the axis ranges',
            'to their initial values and even double clicks set the axis ranges',
            'to their autorange values.'
        ].join(' ')
    },

    showTips: {
        valType: 'boolean',
        dflt: true,
        description: [
            'Determines whether or not tips are shown while interacting',
            'with the resulting graphs.'
        ].join(' ')
    },

    showLink: {
        valType: 'boolean',
        dflt: false,
        description: [
            'Determines whether a link to plot.ly is displayed',
            'at the bottom right corner of resulting graphs.',
            'Use with `sendData` and `linkText`.'
        ].join(' ')
    },

    sendData: {
        valType: 'boolean',
        dflt: true,
        description: [
            'If *showLink* is true, does it contain data',
            'just link to a plot.ly file?'
        ].join(' ')
    },

    linkText: {
        valType: 'string',
        dflt: 'Edit chart',
        noBlank: true,
        description: [
            'Sets the text appearing in the `showLink` link.'
        ].join(' ')
    },

    showSources: {
        valType: 'any',
        dflt: false,
        description: [
            'Adds a source-displaying function to show sources on',
            'the resulting graphs.'
        ].join(' ')
    },

    displayModeBar: {
        valType: 'enumerated',
        values: ['hover', true, false],
        dflt: 'hover',
        description: [
            'Determines the mode bar display mode.',
            'If *true*, the mode bar is always visible.',
            'If *false*, the mode bar is always hidden.',
            'If *hover*, the mode bar is visible while the mouse cursor',
            'is on the graph container.'
        ].join(' ')
    },

    modeBarButtonsToRemove: {
        valType: 'any',
        dflt: [],
        description: [
            'Remove mode bar buttons by name.',
            'See ./components/modebar/buttons.js for the list of names.'
        ].join(' ')
    },

    modeBarButtonsToAdd: {
        valType: 'any',
        dflt: [],
        description: [
            'Add mode bar button using config objects',
            'See ./components/modebar/buttons.js for list of arguments.'
        ].join(' ')
    },

    modeBarButtons: {
        valType: 'any',
        dflt: false,
        description: [
            'Define fully custom mode bar buttons as nested array,',
            'where the outer arrays represents button groups, and',
            'the inner arrays have buttons config objects or names of default buttons',
            'See ./components/modebar/buttons.js for more info.'
        ].join(' ')
    },

    displaylogo: {
        valType: 'boolean',
        dflt: true,
        description: [
            'Determines whether or not the plotly logo is displayed',
            'on the end of the mode bar.'
        ].join(' ')
    },

    plotGlPixelRatio: {
        valType: 'number',
        dflt: 2,
        min: 0,
        max: 4,
        description: [
            'Set the pixel ratio during WebGL image export.',
            'This config option was formally named `plot3dPixelRatio`',
            'which is now deprecated.'
        ].join(' ')
    },

    // valType 'any' but really it is a 'function'
    setBackground: {
        valType: 'any',
        dflt: defaultSetBackground,
        description: [
            'Set function to add the background color to a different container',
            'or *opaque* to ensure there is white behind it.'
        ].join(' ')
    },

    topojsonURL: {
        valType: 'string',
        noBlank: true,
        dflt: 'https://cdn.plot.ly/',
        description: [
            'Set the URL to topojson used in geo charts.',
            'By default, the topojson files are fetched from cdn.plot.ly.',
            'For example, set this option to:',
            '<path-to-plotly.js>/dist/topojson/',
            'to render geographical feature using the topojson files',
            'that ship with the plotly.js module.'
        ].join(' ')
    },

    mapboxAccessToken: {
        valType: 'string',
        dflt: null,
        description: [
            'Mapbox access token (required to plot mapbox trace types)',
            'If using an Mapbox Atlas server, set this option to \'\'',
            'so that plotly.js won\'t attempt to authenticate to the public Mapbox server.'
        ].join(' ')
    },

    logging: {
        valType: 'boolean',
        dflt: false,
        description: [
            'Turn all console logging on or off (errors will be thrown)',
            'This should ONLY be set via Plotly.setPlotConfig'
        ].join(' ')
    },

    globalTransforms: {
        valType: 'any',
        dflt: [],
        description: [
            'Set global transform to be applied to all traces with no',
            'specification needed'
        ].join(' ')
    }
};

// where and how the background gets set can be overridden by context
// so we define the default (plotly.js) behavior here
function defaultSetBackground(gd, bgColor) {
    try {
        gd._fullLayout._paper.style('background', bgColor);
    }
    catch(e) {
        if(module.exports.logging > 0) {
            console.error(e);
        }
    }
}
