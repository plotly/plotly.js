/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

/**
 * Modebar buttons configuration
 *
 * @param {string} category button category depending on e.g. plot type
 * @param {string} group button group ('ext', 'drag', 'zoom', 'hover')
 * @param {string} title text that appears while hovering over the button
 * @param {string} icon name of the svg icon associated with the button
 * @param {string} [gravity] icon positioning
 * @param {string} click name of the modebar click handler associated with the button
 * @param {string} [attr] attribute associated with button,
 *                        use this with 'val' to keep track of the state
 * @param {*} [val] initial 'attr' value,
 *                  can be a function of graphInfo
 * @param {boolean} [toggle] is the button a toggle button?
 *
 */

module.exports = {

    // for all plot types
    toImage: {
        category: 'all',
        group: 'ext',
        title: 'download plot as a png',
        icon: 'camera',
        click: 'toImage'
    },
    sendDataToCloud: {
        category: 'all',
        group: 'ext',
        title: 'save and edit plot in cloud',
        icon: 'disk',
        click: 'sendDataToCloud'
    },

    // cartesian and gl2d
    zoom2d: {
        category: '2d',
        group: 'drag',
        title: 'Zoom',
        attr: 'dragmode',
        val: 'zoom',
        icon: 'zoombox',
        click: 'handleCartesian'
    },
    pan2d: {
        category: '2d',
        group: 'drag',
        title: 'Pan',
        attr: 'dragmode',
        val: 'pan',
        icon: 'pan',
        click: 'handleCartesian'
    },
    zoomIn2d: {
        category: '2d',
        group: 'zoom',
        title: 'Zoom in',
        attr: 'zoom',
        val: 'in',
        icon: 'zoom_plus',
        click: 'handleCartesian'
    },
    zoomOut2d: {
        category: '2d',
        group: 'zoom',
        title: 'Zoom out',
        attr: 'zoom',
        val: 'out',
        icon: 'zoom_minus',
        click: 'handleCartesian'
    },
    autoScale2d: {
        category: '2d',
        group: 'zoom',
        title: 'Autoscale',
        attr: 'zoom',
        val: 'auto',
        icon: 'autoscale',
        click: 'handleCartesian'
    },
    resetScale2d: {
        category: '2d',
        group: 'zoom',
        title: 'Reset axes',
        attr: 'zoom',
        val: 'reset',
        icon: 'home',
        click: 'handleCartesian'
    },

    // cartesian only
    hoverClosest2d: {
        category: 'cartesian',
        group: 'hover',
        title: 'Show closest data on hover',
        attr: 'hovermode',
        val: 'closest',
        icon: 'tooltip_basic',
        gravity: 'ne',
        click: 'handleCartesian'
    },
    hoverCompare2d: {
        category: 'cartesian',
        group: 'hover',
        title: 'Compare data on hover',
        attr: 'hovermode',
        val: function(graphInfo) {
            return graphInfo._fullLayout._isHoriz ? 'y' : 'x';
        },
        icon: 'tooltip_compare',
        gravity: 'ne',
        click: 'handleCartesian'
    },

    // gl3d
    zoom3d: {
        category: 'gl3d',
        group: 'drag',
        title: 'Zoom',
        attr: 'dragmode',
        val: 'zoom',
        icon: 'zoombox',
        click: 'handleDrag3d'
    },
    pan3d: {
        category: 'gl3d',
        group: 'drag',
        title: 'Pan',
        attr: 'dragmode',
        val: 'pan',
        icon: 'pan',
        click: 'handleDrag3d'
    },
    orbitRotation: {
        category: 'gl3d',
        group: 'drag',
        title: 'orbital rotation',
        attr: 'dragmode',
        val: 'orbit',
        icon: '3d_rotate',
        click: 'handleDrag3d'
    },
    tableRotation: {
        category: 'gl3d',
        group: 'drag',
        title: 'turntable rotation',
        attr: 'dragmode',
        val: 'turntable',
        icon: 'z-axis',
        click: 'handleDrag3d'
    },
    resetCameraDefault3d: {
        category: 'gl3d',
        group: 'zoom',
        title: 'Reset camera to default',
        attr: 'resetDefault',
        icon: 'home',
        click: 'handleCamera3d'
    },
    resetCameraLastSave3d: {
        category: 'gl3d',
        group: 'zoom',
        title: 'Reset camera to last save',
        attr: 'resetLastSave',
        icon: 'movie',
        click: 'handleCamera3d'
    },
    hoverClosest3d: {
        category: 'gl3d',
        group: 'hover',
        title: 'Toggle show closest data on hover',
        attr: 'hovermode',
        val: null,
        toggle: true,
        icon: 'tooltip_basic',
        gravity: 'ne',
        click: 'handleHover3d'
    },

    // geo
    zoomInGeo: {
        category: 'geo',
        group: 'zoom',
        title: 'Zoom in',
        attr: 'zoom',
        val: 'in',
        icon: 'zoom_plus',
        click: 'handleGeo'
    },
    zoomOutGeo: {
        category: 'geo',
        group: 'zoom',
        title: 'Zoom out',
        attr: 'zoom',
        val: 'out',
        icon: 'zoom_minus',
        click: 'handleGeo'
    },
    resetGeo: {
        category: 'geo',
        group: 'zoom',
        title: 'Reset',
        attr: 'reset',
        val: null,
        icon: 'autoscale',
        click: 'handleGeo'
    },
    hoverClosestGeo: {
        category: 'geo',
        group: 'hover',
        title: 'Toggle show closest data on hover',
        attr: 'hovermode',
        val: null,
        toggle: true,
        icon: 'tooltip_basic',
        gravity: 'ne',
        click: 'handleGeo'
    },

    // gl2d only
    hoverClosestGl2d: {
        category: 'gl2d',
        group: 'hover',
        title: 'Toggle show closest data on hover',
        attr: 'hovermode',
        val: null,
        toggle: true,
        icon: 'tooltip_basic',
        gravity: 'ne',
        click: 'handleHoverGl2d'
    },

    // pie traces only
    hoverClosestPie: {
        category: 'pie',
        group: 'hover',
        title: 'Toggle show closest data on hover',
        attr: 'hovermode',
        val: 'closest',
        icon: 'tooltip_basic',
        gravity: 'ne',
        click: 'handleHoverPie'
    }

};
