'use strict';

/**
 * This will be transferred over to gd and overridden by
 * config args to Plotly.newPlot.
 *
 * The defaults are the appropriate settings for plotly.js,
 * so we get the right experience without any config argument.
 *
 * N.B. the config options are not coerced using Lib.coerce so keys
 * like `valType` and `values` are only set for documentation purposes
 * at the moment.
 */

var configAttributes = {
    staticPlot: {
        valType: 'boolean',
        dflt: false,
        description: [
            'Determines whether the graphs are interactive or not.',
            'If *false*, no interactivity, for export or image generation.'
        ].join(' ')
    },

    typesetMath: {
        valType: 'boolean',
        dflt: true,
        description: [
            'Determines whether math should be typeset or not,',
            'when MathJax (either v2 or v3) is present on the page.'
        ].join(' ')
    },

    plotlyServerURL: {
        valType: 'string',
        dflt: '',
        description: [
            'When set it determines base URL for',
            'the \'Edit in Chart Studio\' `showEditInChartStudio`/`showSendToCloud` mode bar button',
            'and the showLink/sendData on-graph link.',
            'To enable sending your data to Chart Studio Cloud, you need to',
            'set both `plotlyServerURL` to \'https://chart-studio.plotly.com\' and',
            'also set `showSendToCloud` to true.'
        ].join(' ')
    },

    editable: {
        valType: 'boolean',
        dflt: false,
        description: [
            'Determines whether the graph is editable or not.',
            'Sets all pieces of `edits`',
            'unless a separate `edits` config item overrides individual parts.'
        ].join(' ')
    },
    edits: {
        annotationPosition: {
            valType: 'boolean',
            dflt: false,
            description: [
                'Determines if the main anchor of the annotation is editable.',
                'The main anchor corresponds to the',
                'text (if no arrow) or the arrow (which drags the whole thing leaving',
                'the arrow length & direction unchanged).'
            ].join(' ')
        },
        annotationTail: {
            valType: 'boolean',
            dflt: false,
            description: [
                'Has only an effect for annotations with arrows.',
                'Enables changing the length and direction of the arrow.'
            ].join(' ')
        },
        annotationText: {
            valType: 'boolean',
            dflt: false,
            description: 'Enables editing annotation text.'
        },
        axisTitleText: {
            valType: 'boolean',
            dflt: false,
            description: 'Enables editing axis title text.'
        },
        colorbarPosition: {
            valType: 'boolean',
            dflt: false,
            description: 'Enables moving colorbars.'
        },
        colorbarTitleText: {
            valType: 'boolean',
            dflt: false,
            description: 'Enables editing colorbar title text.'
        },
        legendPosition: {
            valType: 'boolean',
            dflt: false,
            description: 'Enables moving the legend.'
        },
        legendText: {
            valType: 'boolean',
            dflt: false,
            description: 'Enables editing the trace name fields from the legend'
        },
        shapePosition: {
            valType: 'boolean',
            dflt: false,
            description: 'Enables moving shapes.'
        },
        titleText: {
            valType: 'boolean',
            dflt: false,
            description: 'Enables editing the global layout title.'
        }
    },

    editSelection: {
        valType: 'boolean',
        dflt: true,
        description: 'Enables moving selections.'
    },

    autosizable: {
        valType: 'boolean',
        dflt: false,
        description: [
            'Determines whether the graphs are plotted with respect to',
            'layout.autosize:true and infer its container size.'
        ].join(' ')
    },
    responsive: {
        valType: 'boolean',
        dflt: false,
        description: [
            'Determines whether to change the layout size when window is resized.',
            'In v3, this option will be removed and will always be true.'
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
        valType: 'flaglist',
        flags: ['cartesian', 'gl3d', 'geo', 'mapbox', 'map'],
        extras: [true, false],
        dflt: 'gl3d+geo+map',
        description: [
            'Determines whether mouse wheel or two-finger scroll zooms is enable.',
            'Turned on by default for gl3d, geo, mapbox and map subplots',
            '(as these subplot types do not have zoombox via pan),',
            'but turned off by default for cartesian subplots.',
            'Set `scrollZoom` to *false* to disable scrolling for all subplots.'
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
            'If *reset+autosize*, the odd double clicks resets the axis ranges',
            'to their initial values and even double clicks set the axis ranges',
            'to their autorange values.'
        ].join(' ')
    },
    doubleClickDelay: {
        valType: 'number',
        dflt: 300,
        min: 0,
        description: [
            'Sets the delay for registering a double-click in ms.',
            'This is the time interval (in ms) between first mousedown and',
            '2nd mouseup to constitute a double-click.',
            'This setting propagates to all on-subplot double clicks',
            '(except for geo, mapbox and map) and on-legend double clicks.'
        ].join(' ')
    },

    showAxisDragHandles: {
        valType: 'boolean',
        dflt: true,
        description: [
            'Set to *false* to omit cartesian axis pan/zoom drag handles.'
        ].join(' ')
    },
    showAxisRangeEntryBoxes: {
        valType: 'boolean',
        dflt: true,
        description: [
            'Set to *false* to omit direct range entry at the pan/zoom drag points,',
            'note that `showAxisDragHandles` must be enabled to have an effect.'
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
            'Determines whether a link to Chart Studio Cloud is displayed',
            'at the bottom right corner of resulting graphs.',
            'Use with `sendData` and `linkText`.'
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
    sendData: {
        valType: 'boolean',
        dflt: true,
        description: [
            'If *showLink* is true, does it contain data',
            'just link to a Chart Studio Cloud file?'
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
    showSendToCloud: {
        valType: 'boolean',
        dflt: false,
        description: [
            'Should we include a ModeBar button, labeled "Edit in Chart Studio",',
            'that sends this chart to chart-studio.plotly.com (formerly plot.ly) or another plotly server',
            'as specified by `plotlyServerURL` for editing, export, etc? Prior to version 1.43.0',
            'this button was included by default, now it is opt-in using this flag.',
            'Note that this button can (depending on `plotlyServerURL` being set) send your data',
            'to an external server. However that server does not persist your data',
            'until you arrive at the Chart Studio and explicitly click "Save".'
        ].join(' ')
    },
    showEditInChartStudio: {
        valType: 'boolean',
        dflt: false,
        description: [
            'Same as `showSendToCloud`, but use a pencil icon instead of a floppy-disk.',
            'Note that if both `showSendToCloud` and `showEditInChartStudio` are turned,',
            'only `showEditInChartStudio` will be honored.'
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
            'See ./components/modebar/buttons.js for list of arguments.',
            'To enable predefined modebar buttons e.g. shape drawing, hover and spikelines,',
            'simply provide their string name(s). This could include:',
            '*v1hovermode*, *hoverclosest*, *hovercompare*, *togglehover*, *togglespikelines*,',
            '*drawline*, *drawopenpath*, *drawclosedpath*, *drawcircle*, *drawrect* and *eraseshape*.',
            'Please note that these predefined buttons will only be shown if they are compatible',
            'with all trace types used in a graph.'
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
    toImageButtonOptions: {
        valType: 'any',
        dflt: {},
        description: [
            'Statically override options for toImage modebar button',
            'allowed keys are format, filename, width, height, scale',
            'see ../components/modebar/buttons.js'
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
    watermark: {
        valType: 'boolean',
        dflt: false,
        description: 'watermark the images with the company\'s logo'
    },

    plotGlPixelRatio: {
        valType: 'number',
        dflt: 2,
        min: 1,
        max: 4,
        description: [
            'Set the pixel ratio during WebGL image export.'
        ].join(' ')
    },

    setBackground: {
        valType: 'any',
        dflt: 'transparent',
        description: [
            'Set function to add the background color (i.e. `layout.paper_color`)',
            'to a different container.',
            'This function take the graph div as first argument and the current background',
            'color as second argument.',
            'Alternatively, set to string *opaque* to ensure there is white behind it.'
        ].join(' ')
    },

    topojsonURL: {
        valType: 'string',
        noBlank: true,
        // TODO: Switch the default back to 'https://cdn.plot.ly/' once we remove the legacy maps
        dflt: 'https://cdn.plot.ly/un/',
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
        valType: 'integer',
        min: 0,
        max: 2,
        dflt: 1,
        description: [
            'Turn all console logging on or off (errors will be thrown)',
            'This should ONLY be set via Plotly.setPlotConfig',
            'Available levels:',
            '0: no logs',
            '1: warnings and errors, but not informational messages',
            '2: verbose logs'
        ].join(' ')
    },

    notifyOnLogging: {
        valType: 'integer',
        min: 0,
        max: 2,
        dflt: 0,
        description: [
            'Set on-graph logging (notifier) level',
            'This should ONLY be set via Plotly.setPlotConfig',
            'Available levels:',
            '0: no on-graph logs',
            '1: warnings and errors, but not informational messages',
            '2: verbose logs'
        ].join(' ')
    },

    queueLength: {
        valType: 'integer',
        min: 0,
        dflt: 0,
        description: 'Sets the length of the undo/redo queue.'
    },

    locale: {
        valType: 'string',
        dflt: 'en-US',
        description: [
            'Which localization should we use?',
            'Should be a string like \'en\' or \'en-US\'.'
        ].join(' ')
    },

    locales: {
        valType: 'any',
        dflt: {},
        description: [
            'Localization definitions',
            'Locales can be provided either here (specific to one chart) or globally',
            'by registering them as modules.',
            'Should be an object of objects {locale: {dictionary: {...}, format: {...}}}',
            '{',
            '  da: {',
            '      dictionary: {\'Reset axes\': \'Nulstil aksler\', ...},',
            '      format: {months: [...], shortMonths: [...]}',
            '  },',
            '  ...',
            '}',
            'All parts are optional. When looking for translation or format fields, we',
            'look first for an exact match in a config locale, then in a registered',
            'module. If those fail, we strip off any regionalization (\'en-US\' -> \'en\')',
            'and try each (config, registry) again. The final fallback for translation',
            'is untranslated (which is US English) and for formats is the base English',
            '(the only consequence being the last fallback date format %x is DD/MM/YYYY',
            'instead of MM/DD/YYYY). Currently `grouping` and `currency` are ignored',
            'for our automatic number formatting, but can be used in custom formats.'
        ].join(' ')
    }
};

var dfltConfig = {};

function crawl(src, target) {
    for(var k in src) {
        var obj = src[k];
        if(obj.valType) {
            target[k] = obj.dflt;
        } else {
            if(!target[k]) {
                target[k] = {};
            }
            crawl(obj, target[k]);
        }
    }
}

crawl(configAttributes, dfltConfig);

module.exports = {
    configAttributes: configAttributes,
    dfltConfig: dfltConfig
};
