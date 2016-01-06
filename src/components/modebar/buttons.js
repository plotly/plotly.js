/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');
var Lib = require('../../lib');
var Snapshot = require('../../snapshot');
var Icons = require('../../../build/ploticon');


var modeBarButtons = module.exports = {};

/**
 * ModeBar buttons configuration
 *
 * @param {string} name
 *      name / id of the buttons (for tracking)
 * @param {string} title
 *      text that appears while hovering over the button,
 *      enter null, false or '' for no hover text
 * @param {string} icon
 *      svg icon object associated with the button
 *      can be linked to Plotly.Icons to use the default plotly icons
 * @param {string} [gravity]
 *      icon positioning
 * @param {function} click
 *      click handler associated with the button, a function of
 *      'gd' (the main graph object) and
 *      'ev' (the event object)
 * @param {string} [attr]
 *      attribute associated with button,
 *      use this with 'val' to keep track of the state
 * @param {*} [val]
 *      initial 'attr' value, can be a function of gd
 * @param {boolean} [toggle]
 *      is the button a toggle button?
 */

modeBarButtons.toImage = {
    name: 'toImage',
    title: 'Download plot as a png',
    icon: Icons.camera,
    click: function(gd) {
        var format = 'png';

        if (Lib.isIE()) {
            Lib.notifier('Snapshotting is unavailable in Internet Explorer. ' +
                         'Consider exporting your images using the Plotly Cloud', 'long');
            return;
        }

        if (gd._snapshotInProgress) {
            Lib.notifier('Snapshotting is still in progress - please hold', 'long');
            return;
        }

        gd._snapshotInProgress = true;
        Lib.notifier('Taking snapshot - this may take a few seconds', 'long');

        var ev = Snapshot.toImage(gd, {format: format});

        var filename = gd.fn || 'newplot';
        filename += '.' + format;

        ev.once('success', function(result) {
            gd._snapshotInProgress = false;

            var downloadLink = document.createElement('a');
            downloadLink.href = result;
            downloadLink.download = filename; // only supported by FF and Chrome

            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            ev.clean();
        });

        ev.once('error', function (err) {
            gd._snapshotInProgress = false;

            Lib.notifier('Sorry there was a problem downloading your ' + format, 'long');
            console.error(err);

            ev.clean();
        });
    }
};

modeBarButtons.sendDataToCloud = {
    name: 'sendDataToCloud',
    title: 'Save and edit plot in cloud',
    icon: Icons.disk,
    click: function(gd) {
        Plotly.Plots.sendDataToCloud(gd);
    }
};

modeBarButtons.zoom2d = {
    name: 'zoom2d',
    title: 'Zoom',
    attr: 'dragmode',
    val: 'zoom',
    icon: Icons.zoombox,
    click: handleCartesian
};

modeBarButtons.pan2d = {
    name: 'pan2d',
    title: 'Pan',
    attr: 'dragmode',
    val: 'pan',
    icon: Icons.pan,
    click: handleCartesian
};

modeBarButtons.select2d = {
    name: 'select2d',
    title: 'Box Select',
    attr: 'dragmode',
    val: 'select',
    icon: Icons.selectbox,
    click: handleCartesian
};

modeBarButtons.lasso2d = {
    name: 'lasso2d',
    title: 'Lasso Select',
    attr: 'dragmode',
    val: 'lasso',
    icon: Icons.lasso,
    click: handleCartesian
};

modeBarButtons.zoomIn2d = {
    name: 'zoomIn2d',
    title: 'Zoom in',
    attr: 'zoom',
    val: 'in',
    icon: Icons.zoom_plus,
    click: handleCartesian
};

modeBarButtons.zoomOut2d = {
    name: 'zoomOut2d',
    title: 'Zoom out',
    attr: 'zoom',
    val: 'out',
    icon: Icons.zoom_minus,
    click: handleCartesian
};

modeBarButtons.autoScale2d = {
    name: 'autoScale2d',
    title: 'Autoscale',
    attr: 'zoom',
    val: 'auto',
    icon: Icons.autoscale,
    click: handleCartesian
};

modeBarButtons.resetScale2d = {
    name: 'resetScale2d',
    title: 'Reset axes',
    attr: 'zoom',
    val: 'reset',
    icon: Icons.home,
    click: handleCartesian
};

modeBarButtons.hoverClosestCartesian = {
    name: 'hoverClosestCartesian',
    title: 'Show closest data on hover',
    attr: 'hovermode',
    val: 'closest',
    icon: Icons.tooltip_basic,
    gravity: 'ne',
    click: handleCartesian
};

modeBarButtons.hoverCompareCartesian = {
    name: 'hoverCompareCartesian',
    title: 'Compare data on hover',
    attr: 'hovermode',
    val: function(gd) {
        return gd._fullLayout._isHoriz ? 'y' : 'x';
    },
    icon: Icons.tooltip_compare,
    gravity: 'ne',
    click: handleCartesian
};

var DRAGCURSORS = {
    pan: 'move',
    zoom: 'crosshair',
    select: 'crosshair',
    lasso: 'crosshair'
};

function handleCartesian(gd, ev) {
    var button = ev.currentTarget,
        astr = button.getAttribute('data-attr'),
        val = button.getAttribute('data-val') || true,
        fullLayout = gd._fullLayout,
        aobj = {};

    if(astr === 'zoom') {
        var mag = (val === 'in') ? 0.5 : 2,
            r0 = (1 + mag) / 2,
            r1 = (1 - mag) / 2,
            axList = Plotly.Axes.list(gd, null, true);

        var ax, axName, initialRange;

        for(var i = 0; i < axList.length; i++) {
            ax = axList[i];
            if(!ax.fixedrange) {
                axName = ax._name;
                if(val === 'auto') aobj[axName + '.autorange'] = true;
                else if(val === 'reset') {
                    if(ax._rangeInitial === undefined) {
                        aobj[axName + '.autorange'] = true;
                    }
                    else aobj[axName + '.range'] = ax._rangeInitial.slice();
                }
                else {
                    initialRange = ax.range;
                    aobj[axName + '.range'] = [
                        r0 * initialRange[0] + r1 * initialRange[1],
                        r0 * initialRange[1] + r1 * initialRange[0]
                    ];
                }
            }
        }
    }
    else {
        // if ALL traces have orientation 'h', 'hovermode': 'x' otherwise: 'y'
        if (astr==='hovermode' && (val==='x' || val==='y')) {
            val = fullLayout._isHoriz ? 'y' : 'x';
            button.setAttribute('data-val', val);
        }

        aobj[astr] = val;
    }

    Plotly.relayout(gd, aobj).then( function() {
        if(astr === 'dragmode') {
            if(fullLayout._hasCartesian) {
                Plotly.Fx.setCursor(
                    fullLayout._paper.select('.nsewdrag'),
                    DRAGCURSORS[val]
                );
            }
            Plotly.Fx.supplyLayoutDefaults(gd.layout, fullLayout, gd._fullData);
        }
    });
}

modeBarButtons.zoom3d = {
    name: 'zoom3d',
    title: 'Zoom',
    attr: 'dragmode',
    val: 'zoom',
    icon: Icons.zoombox,
    click: handleDrag3d
};

modeBarButtons.pan3d = {
    name: 'pan3d',
    title: 'Pan',
    attr: 'dragmode',
    val: 'pan',
    icon: Icons.pan,
    click: handleDrag3d
};

modeBarButtons.orbitRotation = {
    name: 'orbitRotation',
    title: 'orbital rotation',
    attr: 'dragmode',
    val: 'orbit',
    icon: Icons['3d_rotate'],
    click: handleDrag3d
};

modeBarButtons.tableRotation = {
    name: 'tableRotation',
    title: 'turntable rotation',
    attr: 'dragmode',
    val: 'turntable',
    icon: Icons['z-axis'],
    click: handleDrag3d
};

function handleDrag3d(gd, ev) {
    var button = ev.currentTarget,
        attr = button.getAttribute('data-attr'),
        val = button.getAttribute('data-val') || true,
        layoutUpdate = {};

    layoutUpdate[attr] = val;

    /*
     * Dragmode will go through the relayout -> doplot -> scene.plot()
     * routine where the dragmode will be set in scene.plot()
     */
    Plotly.relayout(gd, layoutUpdate);
}

modeBarButtons.resetCameraDefault3d = {
    name: 'resetCameraDefault3d',
    title: 'Reset camera to default',
    attr: 'resetDefault',
    icon: Icons.home,
    click: handleCamera3d
};

modeBarButtons.resetCameraLastSave3d = {
    name: 'resetCameraLastSave3d',
    title: 'Reset camera to last save',
    attr: 'resetLastSave',
    icon: Icons.movie,
    click: handleCamera3d
};

function handleCamera3d(gd, ev) {
    var button = ev.currentTarget,
        attr = button.getAttribute('data-attr'),
        layout = gd.layout,
        fullLayout = gd._fullLayout,
        sceneIds = Plotly.Plots.getSubplotIds(fullLayout, 'gl3d');

    for(var i = 0;  i < sceneIds.length; i++) {
        var sceneId = sceneIds[i],
            sceneLayout = layout[sceneId],
            fullSceneLayout = fullLayout[sceneId],
            scene = fullSceneLayout._scene;

        if(!sceneLayout || attr==='resetDefault') scene.setCameraToDefault();
        else if(attr === 'resetLastSave') {

            var cameraPos = sceneLayout.camera;
            if(cameraPos) scene.setCamera(cameraPos);
            else scene.setCameraToDefault();
        }
    }

    /*
     * TODO have a sceneLastTouched in _fullLayout to only
     * update the camera of the scene last touched by the user
     */
}

modeBarButtons.hoverClosest3d = {
    name: 'hoverClosest3d',
    title: 'Toggle show closest data on hover',
    attr: 'hovermode',
    val: null,
    toggle: true,
    icon: Icons.tooltip_basic,
    gravity: 'ne',
    click: function(gd, ev) {
        var button = ev.currentTarget,
            val = JSON.parse(button.getAttribute('data-val')) || false,
            fullLayout = gd._fullLayout,
            sceneIds = Plotly.Plots.getSubplotIds(fullLayout, 'gl3d');

        var axes = ['xaxis', 'yaxis', 'zaxis'],
            spikeAttrs = ['showspikes', 'spikesides', 'spikethickness', 'spikecolor'];

        // initialize 'current spike' object to be stored in the DOM
        var currentSpikes = {},
            axisSpikes = {},
            layoutUpdate = {};

        if(val) {
            layoutUpdate = val;
            button.setAttribute('data-val', JSON.stringify(null));
        }
        else {
            layoutUpdate = {'allaxes.showspikes': false};

            for(var i = 0;  i < sceneIds.length; i++) {
                var sceneId = sceneIds[i],
                    sceneLayout = fullLayout[sceneId],
                    sceneSpikes = currentSpikes[sceneId] = {};

                // copy all the current spike attrs
                for(var j = 0; j < 3; j++) {
                    var axis = axes[j];
                    axisSpikes = sceneSpikes[axis] = {};

                    for(var k = 0; k < spikeAttrs.length; k++) {
                        var spikeAttr = spikeAttrs[k];
                        axisSpikes[spikeAttr] = sceneLayout[axis][spikeAttr];
                    }
                }
            }

            button.setAttribute('data-val', JSON.stringify(currentSpikes));
        }

        Plotly.relayout(gd, layoutUpdate);
    }
};

modeBarButtons.zoomInGeo = {
    name: 'zoomInGeo',
    title: 'Zoom in',
    attr: 'zoom',
    val: 'in',
    icon: Icons.zoom_plus,
    click: handleGeo
};

modeBarButtons.zoomOutGeo = {
    name: 'zoomOutGeo',
    title: 'Zoom in',
    attr: 'zoom',
    val: 'out',
    icon: Icons.zoom_minus,
    click: handleGeo
};

modeBarButtons.resetGeo = {
    name: 'resetGeo',
    title: 'Reset',
    attr: 'reset',
    val: null,
    icon: Icons.autoscale,
    click: handleGeo
};

modeBarButtons.hoverClosestGeo = {
    name: 'hoverClosestGeo',
    title: 'Toggle show closest data on hover',
    attr: 'hovermode',
    val: null,
    toggle: true,
    icon: Icons.tooltip_basic,
    gravity: 'ne',
    click: handleGeo
};

function handleGeo(gd, ev) {
    var button = ev.currentTarget,
        attr = button.getAttribute('data-attr'),
        val = button.getAttribute('data-val') || true,
        fullLayout = gd._fullLayout,
        geoIds = Plotly.Plots.getSubplotIds(fullLayout, 'geo');

    for(var i = 0;  i < geoIds.length; i++) {
        var geo = fullLayout[geoIds[i]]._geo;

        if(attr === 'zoom') {
            var scale = geo.projection.scale();
            var newScale = (val === 'in') ? 2 * scale : 0.5 * scale;
            geo.projection.scale(newScale);
            geo.zoom.scale(newScale);
            geo.render();
        }
        else if(attr === 'reset') geo.zoomReset();
        else if(attr === 'hovermode') geo.showHover = !geo.showHover;
    }
}

modeBarButtons.hoverClosestGl2d = {
    name: 'hoverClosestGl2d',
    title: 'Toggle show closest data on hover',
    attr: 'hovermode',
    val: null,
    toggle: true,
    icon: Icons.tooltip_basic,
    gravity: 'ne',
    click: toggleHover
};

modeBarButtons.hoverClosestPie = {
    name: 'hoverClosestPie',
    title: 'Toggle show closest data on hover',
    attr: 'hovermode',
    val: 'closest',
    icon: Icons.tooltip_basic,
    gravity: 'ne',
    click: toggleHover
};

function toggleHover(gd) {
    var newHover = gd._fullLayout.hovermode ?  false : 'closest';

    Plotly.relayout(gd, 'hovermode', newHover);
}
