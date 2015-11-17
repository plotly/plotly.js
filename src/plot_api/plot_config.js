/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

/**
 * This will be transfered over to gd and overridden by
 * config args to Plotly.plot.
 *
 * The defaults are the appropriate settings for plotly.js,
 * so we get the right experience without any config argument.
 */

module.exports = {

    // no interactivity, for export or image generation
    staticPlot: false,

    // we can edit titles, move annotations, etc
    editable: false,

    // plot will respect layout.autosize=true and infer its container size
    autosizable: false,

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

    // link to open this plot in plotly
    showLink: false,

    // if we show a link, does it contain data or just link to a plotly file?
    sendData: true,

    // text appearing in the sendData link
    linkText: 'Edit chart',

    // false or function adding source(s) to linkText <text>
    showSources: false,

    // display the modebar (true, false, or 'hover')
    displayModeBar: 'hover',

    // add the plotly logo on the end of the modebar
    displaylogo: true,

    // increase the pixel ratio for Gl plot images
    plotGlPixelRatio: 2,

    // function to add the background color to a different container
    // or 'opaque' to ensure there's white behind it
    setBackground: defaultSetBackground,

    // URL to topojson files used in geo charts
    topojsonURL: 'https://cdn.plot.ly/'

};

// where and how the background gets set can be overridden by context
// so we define the default (plotlyjs) behavior here
function defaultSetBackground(gd, bgColor) {
    try {
        gd._fullLayout._paper.style('background', bgColor);
    }
    catch(e) { console.log(e); }
}
