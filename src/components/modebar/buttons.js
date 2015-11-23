/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');
var Lib = require('../../lib');
var Snapshot = require('../../snapshot');


var modebarButtons = module.exports = {};

/**
 * Modebar buttons configuration
 *
 * @param {string} name
 *      name / id of the buttons (for tracking)
 * @param {string} title
 *      text that appears while hovering over the button
 * @param {string} icon
 *      name of the svg icon associated with the button
 * @param {string} [gravity]
 *      icon positioning
 * @param {function} click
 *      click handler associated with the button
 * @param {string} [attr]
 *      attribute associated with button,
 *      use this with 'val' to keep track of the state
 * @param {*} [val]
 *      initial 'attr' value, can be a function of graphInfo
 * @param {boolean} [toggle]
 *      is the button a toggle button?
 */

modebarButtons.toImage = {
    name: 'toImage',
    title: 'Download plot as a png',
    icon: 'camera',
    click: function(modebar) {
        var format = 'png';

        if (Lib.isIE()) {
            Lib.notifier('Snapshotting is unavailable in Internet Explorer. ' +
                         'Consider exporting your images using the Plotly Cloud', 'long');
            return;
        }

        if (modebar._snapshotInProgress) {
            Lib.notifier('Snapshotting is still in progress - please hold', 'long');
            return;
        }

        modebar._snapshotInProgress = true;
        Lib.notifier('Taking snapshot - this may take a few seconds', 'long');

        var ev = Snapshot.toImage(modebar.graphInfo, {format: format});

        var filename = modebar.graphInfo.fn || 'newplot';
        filename += '.' + format;

        ev.once('success', function(result) {

            modebar._snapshotInProgress = false;

            var downloadLink = document.createElement('a');
            downloadLink.href = result;
            downloadLink.download = filename; // only supported by FF and Chrome

            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            ev.clean();
        });

        ev.once('error', function (err) {
            modebar._snapshotInProgress = false;

            Lib.notifier('Sorry there was a problem downloading your ' + format, 'long');
            console.error(err);

            ev.clean();
        });
    }
};

modebarButtons.sendDataToCloud = {
    name: 'sendDataToCloud',
    title: 'Save and edit plot in cloud',
    icon: 'disk',
    click: function(modebar) {
        var gd = modebar.graphInfo;
        Plotly.Plots.sendDataToCloud(gd);
    }
};

modebarButtons.zoom2d = {
    name: 'zoom2d',
    title: 'Zoom',
    attr: 'dragmode',
    val: 'zoom',
    icon: 'zoombox',
    click: handleCartesian
};

modebarButtons.pan2d = {
    name: 'pan2d',
    title: 'Pan',
    attr: 'dragmode',
    val: 'pan',
    icon: 'pan',
    click: handleCartesian
};

modebarButtons.zoomIn2d = {
    name: 'zoomIn2d',
    title: 'Zoom in',
    attr: 'zoom',
    val: 'in',
    icon: 'zoom_plus',
    click: handleCartesian
};

modebarButtons.zoomOut2d = {
    name: 'zoomOut2d',
    title: 'Zoom out',
    attr: 'zoom',
    val: 'out',
    icon: 'zoom_minus',
    click: handleCartesian
};

modebarButtons.autoScale2d = {
    name: 'autoScale2d',
    title: 'Autoscale',
    attr: 'zoom',
    val: 'auto',
    icon: 'autoscale',
    click: handleCartesian
};

modebarButtons.resetScale2d = {
    name: 'resetScale2d',
    title: 'Reset axes',
    attr: 'zoom',
    val: 'reset',
    icon: 'home',
    click: handleCartesian
};

modebarButtons.hoverClosestCartesian = {
    name: 'hoverClosestCartesian',
    title: 'Show closest data on hover',
    attr: 'hovermode',
    val: 'closest',
    icon: 'tooltip_basic',
    gravity: 'ne',
    click: handleCartesian
};

modebarButtons.hoverCompareCartesian = {
    name: 'hoverCompareCartesian',
    title: 'Compare data on hover',
    attr: 'hovermode',
    val: function(graphInfo) {
        return graphInfo._fullLayout._isHoriz ? 'y' : 'x';
    },
    icon: 'tooltip_compare',
    gravity: 'ne',
    click: handleCartesian
};

function handleCartesian(modebar, ev) {
    var button = ev.currentTarget,
        astr = button.getAttribute('data-attr'),
        val = button.getAttribute('data-val') || true,
        graphInfo = modebar.graphInfo,
        fullLayout = graphInfo._fullLayout,
        aobj = {};

    if(astr === 'zoom') {
        var mag = (val === 'in') ? 0.5 : 2,
            r0 = (1 + mag) / 2,
            r1 = (1 - mag) / 2,
            axList = Plotly.Axes.list(graphInfo, null, true);

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
    } else {
        // if ALL traces have orientation 'h', 'hovermode': 'x' otherwise: 'y'
        if (astr==='hovermode' && (val==='x' || val==='y')) {
            val = fullLayout._isHoriz ? 'y' : 'x';
            button.setAttribute('data-val', val);
        }

        aobj[astr] = val;
    }

    Plotly.relayout(graphInfo, aobj).then( function() {
        modebar.updateActiveButton();
        if(astr === 'dragmode') {
            if(fullLayout._hasCartesian) {
                Plotly.Fx.setCursor(
                    fullLayout._paper.select('.nsewdrag'),
                    {pan:'move', zoom:'crosshair'}[val]
                );
            }
            Plotly.Fx.supplyLayoutDefaults(graphInfo.layout, fullLayout,
                graphInfo._fullData);
        }
    });
}

modebarButtons.zoom3d = {
    name: 'zoom3d',
    title: 'Zoom',
    attr: 'dragmode',
    val: 'zoom',
    icon: 'zoombox',
    click: handleDrag3d
};

modebarButtons.pan3d = {
    name: 'pan3d',
    title: 'Pan',
    attr: 'dragmode',
    val: 'pan',
    icon: 'pan',
    click: handleDrag3d
};

modebarButtons.orbitRotation = {
    name: 'orbitRotation',
    title: 'orbital rotation',
    attr: 'dragmode',
    val: 'orbit',
    icon: '3d_rotate',
    click: handleDrag3d
};

modebarButtons.tableRotation = {
    name: 'tableRotation',
    title: 'turntable rotation',
    attr: 'dragmode',
    val: 'turntable',
    icon: 'z-axis',
    click: handleDrag3d
};

function handleDrag3d(modebar, ev) {
    var button = ev.currentTarget,
        attr = button.getAttribute('data-attr'),
        val = button.getAttribute('data-val') || true,
        graphInfo = modebar.graphInfo,
        layoutUpdate = {};

    layoutUpdate[attr] = val;

    /*
     * Dragmode will go through the relayout -> doplot -> scene.plot()
     * routine where the dragmode will be set in scene.plot()
     */
    Plotly.relayout(graphInfo, layoutUpdate).then( function() {
        modebar.updateActiveButton();
    });
}

modebarButtons.resetCameraDefault3d = {
    name: 'resetCameraDefault3d',
    title: 'Reset camera to default',
    attr: 'resetDefault',
    icon: 'home',
    click: handleCamera3d
};

modebarButtons.resetCameraLastSave3d = {
    name: 'resetCameraLastSave3d',
    title: 'Reset camera to last save',
    attr: 'resetLastSave',
    icon: 'movie',
    click: handleCamera3d
};

function handleCamera3d(modebar, ev) {
    var button = ev.currentTarget,
        attr = button.getAttribute('data-attr'),
        layout = modebar.graphInfo.layout,
        fullLayout = modebar.graphInfo._fullLayout,
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

modebarButtons.hoverClosest3d = {
    name: 'hoverClosest3d',
    title: 'Toggle show closest data on hover',
    attr: 'hovermode',
    val: null,
    toggle: true,
    icon: 'tooltip_basic',
    gravity: 'ne',
    click: function(modebar, ev) {
        var button = ev.currentTarget,
            val = JSON.parse(button.getAttribute('data-val')) || false,
            graphInfo = modebar.graphInfo,
            fullLayout = graphInfo._fullLayout,
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

        Plotly.relayout(graphInfo, layoutUpdate).then(function() {
            modebar.updateActiveButton(button);
        });
    }
};

modebarButtons.zoomInGeo = {
    name: 'zoomInGeo',
    title: 'Zoom in',
    attr: 'zoom',
    val: 'in',
    icon: 'zoom_plus',
    click: handleGeo
};

modebarButtons.zoomOutGeo = {
    name: 'zoomOutGeo',
    title: 'Zoom in',
    attr: 'zoom',
    val: 'out',
    icon: 'zoom_minus',
    click: handleGeo
};

modebarButtons.resetGeo = {
    name: 'resetGeo',
    title: 'Reset',
    attr: 'reset',
    val: null,
    icon: 'autoscale',
    click: handleGeo
};

modebarButtons.hoverClosestGeo = {
    name: 'hoverClosestGeo',
    title: 'Toggle show closest data on hover',
    attr: 'hovermode',
    val: null,
    toggle: true,
    icon: 'tooltip_basic',
    gravity: 'ne',
    click: handleGeo
};

function handleGeo(modebar, ev) {
    var button = ev.currentTarget,
        attr = button.getAttribute('data-attr'),
        val = button.getAttribute('data-val') || true,
        fullLayout = modebar.graphInfo._fullLayout,
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

    modebar.updateActiveButton(button);
}

modebarButtons.hoverClosestGl2d = {
    name: 'hoverClosestGl2d',
    title: 'Toggle show closest data on hover',
    attr: 'hovermode',
    val: null,
    toggle: true,
    icon: 'tooltip_basic',
    gravity: 'ne',
    click: function(modebar, ev) {
        var button  = ev.currentTarget,
            graphInfo = modebar.graphInfo,
            newHover = graphInfo._fullLayout.hovermode ?
                false :
                'closest';

        Plotly.relayout(graphInfo, 'hovermode', newHover).then(function() {
            modebar.updateActiveButton(button);
        });
    }
};

modebarButtons.hoverClosestPie = {
    name: 'hoverClosestPie',
    title: 'Toggle show closest data on hover',
    attr: 'hovermode',
    val: 'closest',
    icon: 'tooltip_basic',
    gravity: 'ne',
    click: function(modebar) {
        var graphInfo = modebar.graphInfo,
            newHover = graphInfo._fullLayout.hovermode ?
                false :
                'closest';

        Plotly.relayout(graphInfo, 'hovermode', newHover).then(function() {
            modebar.updateActiveButton();
        });

    }
};
