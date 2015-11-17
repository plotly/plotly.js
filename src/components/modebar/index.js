/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');
var d3 = require('d3');

/**
 * UI controller for interactive plots
 * @Class
 * @Param {object} config
 * @Param {object} config.buttons    nested arrays of grouped buttons to initialize
 * @Param {object} config.container  container div to append modebar
 * @Param {object} config.Plotly     main plotly namespace module
 * @Param {object} config.graphInfo  primary plot object containing data and layout
 */
function ModeBar (config) {

    if (!(this instanceof ModeBar)) return new ModeBar();

    var _this = this;

    this._snapshotInProgress = false;
    this.graphInfo = config.graphInfo;
    this.element = document.createElement('div');

    if(this.graphInfo._context.displayModeBar === 'hover') {
        this.element.className = 'modebar modebar--hover';
    } else {
        this.element.className = 'modebar';
    }

    this.buttons = config.buttons;
    this.buttonElements = [];

    this.buttons.forEach( function (buttonGroup) {
        var group = _this.createGroup();

        buttonGroup.forEach( function (buttonName) {
            var buttonConfig = _this.config()[buttonName];

            if (!buttonConfig) {
                throw new Error(buttonName + ' not specfied in modebar configuration');
            }

            var button = _this.createButton(buttonConfig);

            _this.buttonElements.push(button);
            group.appendChild(button);
        });

        _this.element.appendChild(group);
    });

    if (this.graphInfo._context.displaylogo) {
        this.element.appendChild(this.getLogo());
    }

    config.container.appendChild(this.element);

    this.updateActiveButton();
}

var proto = ModeBar.prototype;

/**
 * Empty div for containing a group of buttons
 * @Return {HTMLelement}
 */
proto.createGroup = function () {
    var group = document.createElement('div');
    group.className = 'modebar-group';

    return group;
};

/**
 * Create a new button div and set constant and configurable attributes
 * @Param {object} config
 * @Param {string} config.attr
 * @Param {string} config.val
 * @Param {string} config.title
 * @Param {function} config.click
 * @Return {HTMLelement}
 */
proto.createButton = function (config) {
    var _this = this,
        button = document.createElement('a');

    button.setAttribute('rel', 'tooltip');
    button.className = 'modebar-btn';

    if (config.attr !== undefined) button.setAttribute('data-attr', config.attr);
    if (config.val !== undefined) button.setAttribute('data-val', config.val);
    button.setAttribute('data-title', config.title);
    button.setAttribute('data-gravity', config.gravity || 'n');
    button.addEventListener('click', function () {
            config.click.apply(_this, arguments);
        });

    button.setAttribute('data-toggle', config.toggle);
    if(config.toggle) button.classList.add('active');

    button.appendChild(this.createIcon(Plotly.Icons[config.icon]));

    return button;
};

/**
 * Add an icon to a button
 * @Param {object} thisIcon
 * @Param {number} thisIcon.width
 * @Param {string} thisIcon.path
 * @Return {HTMLelement}
 */
proto.createIcon = function (thisIcon) {
    var iconDef = Plotly.Icons,
        iconHeight = iconDef.ascent - iconDef.descent,
        svgNS = 'http://www.w3.org/2000/svg',
        icon = document.createElementNS(svgNS, 'svg'),
        path = document.createElementNS(svgNS, 'path');

    icon.setAttribute('height', '1em');
    icon.setAttribute('width', (thisIcon.width / iconHeight)+'em');
    icon.setAttribute('viewBox', [0, 0, thisIcon.width, iconHeight].join(' '));

    path.setAttribute('d', thisIcon.path);
    path.setAttribute('transform', 'matrix(1 0 0 -1 0 ' + iconDef.ascent + ')');
    icon.appendChild(path);

    return icon;
};

/**
 * Updates active button with attribute specified in layout
 * @Param {object} graphInfo plot object containing data and layout
 * @Return {HTMLelement}
 */
proto.updateActiveButton = function(buttonClicked) {
    var fullLayout = this.graphInfo._fullLayout,
        dataAttrClicked = (buttonClicked !== undefined) ?
            buttonClicked.getAttribute('data-attr') :
            null;

    this.buttonElements.forEach(function(button) {
        var thisval = button.getAttribute('data-val') || true,
            dataAttr = button.getAttribute('data-attr'),
            isToggleButton = button.getAttribute('data-toggle')==='true',
            button3 = d3.select(button);

        // Use 'data-toggle' and 'buttonClicked' to toggle buttons
        // that have no one-to-one equivalent in fullLayout
        if(isToggleButton) {
            if(dataAttr === dataAttrClicked) {
                button3.classed('active', !button3.classed('active'));
            }
        }
        else {
            button3.classed('active', fullLayout[dataAttr]===thisval);
        }

    });
};


/**
 * Check if modebar is configured as button configuration argument
 * @Param {object} buttons 2d array of grouped button names
 * @Return {boolean}
 */
proto.hasButtons = function (buttons) {
    var currentButtons = this.buttons;

    if (buttons.length !== currentButtons.length) return false;

    for (var i = 0; i < buttons.length; ++i) {
        if (buttons[i].length !== currentButtons[i].length) return false;
        for (var j = 0; j < buttons[i].length; j++) {
            if (buttons[i][j] !== currentButtons[i][j]) return false;
        }
    }

    return true;
};

/**
 * @return {HTMLDivElement} The logo image wrapped in a group
 */
proto.getLogo = function(){
    var group = this.createGroup(),
        a = document.createElement('a');

    a.href = 'https://plot.ly/';
    a.target = '_blank';
    a.setAttribute('data-title', 'Produced with Plotly');
    a.className = 'modebar-btn plotlyjsicon modebar-btn--logo';

    a.appendChild(this.createIcon(Plotly.Icons.plotlylogo));

    group.appendChild(a);
    return group;
};

/**
 * Apply D3 cartesian mode attributes to layout to update hover functionality
 * @Param {object} ev event object
 */
proto.handleCartesian = function(ev) {
    var button = ev.currentTarget,
        astr = button.getAttribute('data-attr'),
        val = button.getAttribute('data-val') || true,
        _this = this,
        graphInfo = this.graphInfo,
        fullLayout = this.graphInfo._fullLayout,
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
        _this.updateActiveButton();
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
};

/**
 * Toggle the data hover mode
 * @Param {object} ev event object
 */
proto.handleHover3d = function(ev) {
    var button = ev.currentTarget,
        val = JSON.parse(button.getAttribute('data-val')) || false,
        _this = this,
        graphInfo = this.graphInfo,
        fullLayout = graphInfo._fullLayout,
        sceneIds = Plotly.Plots.getSubplotIds(fullLayout, 'gl3d'),
        layoutUpdate = {},

        // initialize 'current spike' object to be stored in the DOM
        currentSpikes = {},
        axes = ['xaxis', 'yaxis', 'zaxis'],
        spikeAttrs = ['showspikes', 'spikesides', 'spikethickness', 'spikecolor'];

    var i, sceneId, sceneLayout, sceneSpikes;
    var j, axis, axisSpikes;
    var k, spikeAttr;

    if (val) {
        layoutUpdate = val;
        button.setAttribute('data-val', JSON.stringify(null));
    }
    else {
        layoutUpdate = {'allaxes.showspikes': false};

        for (i = 0;  i < sceneIds.length; i++) {
            sceneId = sceneIds[i];
            sceneLayout = fullLayout[sceneId];
            sceneSpikes = currentSpikes[sceneId] = {};

            // copy all the current spike attrs
            for (j = 0; j < 3; j++) {
                axis = axes[j];
                axisSpikes = sceneSpikes[axis] = {};
                for (k = 0; k < spikeAttrs.length; k++) {
                    spikeAttr = spikeAttrs[k];
                    axisSpikes[spikeAttr] = sceneLayout[axis][spikeAttr];
                }
            }
        }

        button.setAttribute('data-val', JSON.stringify(currentSpikes));
    }

    Plotly.relayout(graphInfo, layoutUpdate).then( function() {
        _this.updateActiveButton(button);
    });

};

/**
 * Reconfigure keyboard bindings for webgl3D camera control on drag
 * @Param {object} ev event object
 */
proto.handleDrag3d = function(ev) {
    var button = ev.currentTarget,
        attr = button.getAttribute('data-attr'),
        val = button.getAttribute('data-val') || true,
        _this = this,
        graphInfo = this.graphInfo,
        layoutUpdate = {};

    layoutUpdate[attr] = val;

    // Dragmode will go through the relayout->doplot->scene.plot()
    // routine where the dragmode will be set in scene.plot()
    Plotly.relayout(graphInfo, layoutUpdate).then( function() {
        _this.updateActiveButton();
    });
};


/**
 * Reset the position of the webgl3D camera
 * @Param {object} ev event object
 */
proto.handleCamera3d = function(ev) {
    var button = ev.currentTarget,
        attr = button.getAttribute('data-attr'),
        layout = this.graphInfo.layout,
        fullLayout = this.graphInfo._fullLayout,
        sceneIds = Plotly.Plots.getSubplotIds(fullLayout, 'gl3d');

    var i, sceneId, sceneLayout, fullSceneLayout, scene, cameraPos;

    for (i = 0;  i < sceneIds.length; i++) {
        sceneId = sceneIds[i];
        sceneLayout = layout[sceneId];
        fullSceneLayout = fullLayout[sceneId];
        scene = fullSceneLayout._scene;

        if (!sceneLayout || attr==='resetDefault') scene.setCameraToDefault();
        else if (attr === 'resetLastSave') {

            cameraPos = sceneLayout.camera;
            if (cameraPos) scene.setCamera(cameraPos);
            else scene.setCameraToDefault();
        }
    }

    /* TODO have a sceneLastTouched in _fullLayout to only
     * update the camera of the scene last touched by the user
     */
};

proto.handleGeo = function(ev) {
    var button = ev.currentTarget,
        attr = button.getAttribute('data-attr'),
        val = button.getAttribute('data-val') || true,
        fullLayout = this.graphInfo._fullLayout,
        geoIds = Plotly.Plots.getSubplotIds(fullLayout, 'geo');

    var geo, scale, newScale;

    for(var i = 0;  i < geoIds.length; i++) {
        geo = fullLayout[geoIds[i]]._geo;

        if(attr === 'zoom') {
            scale = geo.projection.scale();
            newScale = val==='in' ? 2 * scale : 0.5 * scale;
            geo.projection.scale(newScale);
            geo.zoom.scale(newScale);
            geo.render();
        }
        else if(attr === 'reset') geo.zoomReset();
        else if(attr === 'hovermode') geo.showHover = !geo.showHover;
    }

    this.updateActiveButton(button);
};

proto.handleHoverPie = function() {
    var _this = this,
        graphInfo = _this.graphInfo,
        newHover = graphInfo._fullLayout.hovermode ?
            false :
            'closest';

    Plotly.relayout(graphInfo, 'hovermode', newHover).then(function() {
        _this.updateActiveButton();
    });
};

proto.handleHoverGl2d = function(ev) {
    var _this = this,
        button  = ev.currentTarget,
        graphInfo = _this.graphInfo,
        newHover = graphInfo._fullLayout.hovermode ?  false : 'closest';

    Plotly.relayout(graphInfo, 'hovermode', newHover).then(function() {
        _this.updateActiveButton(button);
    });
};

proto.cleanup = function(){
    this.element.innerHTML = '';
    var modebarParent = this.element.parentNode;
    if (modebarParent) modebarParent.removeChild(this.element);
};

proto.toImage = function() {

    var format = 'png';
    var _this = this;

    if ( Plotly.Lib.isIE() ) {
        Plotly.Lib.notifier('Snapshotting is unavailable in Internet Explorer. ' +
                            'Consider exporting your images using the Plotly Cloud', 'long');
        return;
    }

    if (this._snapshotInProgress) {
        Plotly.Lib.notifier('Snapshotting is still in progress - please hold', 'long');
        return;
    }

    this._snapshotInProgress = true;
    Plotly.Lib.notifier('Taking snapshot - this may take a few seconds', 'long');

    var ev = Plotly.Snapshot.toImage(this.graphInfo, {format: format});

    var filename = this.graphInfo.fn || 'newplot';
    filename += '.' + format;

    ev.once('success', function(result) {

        _this._snapshotInProgress = false;

        var downloadLink = document.createElement('a');
        downloadLink.href = result;
        downloadLink.download = filename; // only supported by FF and Chrome

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        ev.clean();
    });

    ev.once('error', function (err) {
        _this._snapshotInProgress = false;

        Plotly.Lib.notifier('Sorry there was a problem downloading your ' + format, 'long');
        console.error(err);

        ev.clean();
    });
};

proto.sendDataToCloud = function() {
    var gd = this.graphInfo;
    Plotly.Plots.sendDataToCloud(gd)
};

/**
 *
 * @Property config specification hash of button parameters
 */
proto.config = function config() {
    return {
        zoom2d: {
            title: 'Zoom',
            attr: 'dragmode',
            val: 'zoom',
            icon: 'zoombox',
            click: this.handleCartesian
        },
        pan2d: {
            title: 'Pan',
            attr: 'dragmode',
            val: 'pan',
            icon: 'pan',
            click: this.handleCartesian
        },
        zoomIn2d: {
            title: 'Zoom in',
            attr: 'zoom',
            val: 'in',
            icon: 'zoom_plus',
            click: this.handleCartesian
        },
        zoomOut2d: {
            title: 'Zoom out',
            attr: 'zoom',
            val: 'out',
            icon: 'zoom_minus',
            click: this.handleCartesian
        },
        autoScale2d: {
            title: 'Autoscale',
            attr: 'zoom',
            val: 'auto',
            icon: 'autoscale',
            click: this.handleCartesian
        },
        resetScale2d: {
            title: 'Reset axes',
            attr: 'zoom',
            val: 'reset',
            icon: 'home',
            click: this.handleCartesian
        },
        hoverClosest2d: {
            title: 'Show closest data on hover',
            attr: 'hovermode',
            val: 'closest',
            icon: 'tooltip_basic',
            gravity: 'ne',
            click: this.handleCartesian
        },
        hoverCompare2d: {
            title: 'Compare data on hover',
            attr: 'hovermode',
            val: this.graphInfo._fullLayout._isHoriz ? 'y' : 'x',
            icon: 'tooltip_compare',
            gravity: 'ne',
            click: this.handleCartesian
        },
        toImage: {
            title: 'download plot as a png',
            icon: 'camera',
            click: this.toImage
        },
        sendDataToCloud: {
            title: 'save and edit plot in cloud',
            icon: 'disk',
            click: this.sendDataToCloud
        },
        // gl3d
        zoom3d: {
            title: 'Zoom',
            attr: 'dragmode',
            val: 'zoom',
            icon: 'zoombox',
            click: this.handleDrag3d
        },
        pan3d: {
            title: 'Pan',
            attr: 'dragmode',
            val: 'pan',
            icon: 'pan',
            click: this.handleDrag3d
        },
        orbitRotation: {
            title: 'orbital rotation',
            attr: 'dragmode',
            val: 'orbit',
            icon: '3d_rotate',
            click: this.handleDrag3d
        },
        tableRotation: {
            title: 'turntable rotation',
            attr: 'dragmode',
            val: 'turntable',
            icon: 'z-axis',
            click: this.handleDrag3d
        },
        resetCameraDefault3d: {
            title: 'Reset camera to default',
            attr: 'resetDefault',
            icon: 'home',
            click: this.handleCamera3d
        },
        resetCameraLastSave3d: {
            title: 'Reset camera to last save',
            attr: 'resetLastSave',
            icon: 'movie',
            click: this.handleCamera3d
        },
        hoverClosest3d: {
            title: 'Toggle show closest data on hover',
            attr: 'hovermode',
            val: null,
            toggle: true,
            icon: 'tooltip_basic',
            gravity: 'ne',
            click: this.handleHover3d
        },
        // geo
        zoomInGeo: {
            title: 'Zoom in',
            attr: 'zoom',
            val: 'in',
            icon: 'zoom_plus',
            click: this.handleGeo
        },
        zoomOutGeo: {
            title: 'Zoom out',
            attr: 'zoom',
            val: 'out',
            icon: 'zoom_minus',
            click: this.handleGeo
        },
        resetGeo: {
            title: 'Reset',
            attr: 'reset',
            val: null,
            icon: 'autoscale',
            click: this.handleGeo
        },
        hoverClosestGeo: {
            title: 'Toggle show closest data on hover',
            attr: 'hovermode',
            val: null,
            toggle: true,
            icon: 'tooltip_basic',
            gravity: 'ne',
            click: this.handleGeo
        },
        // pie
        hoverClosestPie: {
            title: 'Toggle show closest data on hover',
            attr: 'hovermode',
            val: 'closest',
            icon: 'tooltip_basic',
            gravity: 'ne',
            click: this.handleHoverPie
        },
        // gl2d
        hoverClosestGl2d: {
            title: 'Toggle show closest data on hover',
            attr: 'hovermode',
            val: null,
            toggle: true,
            icon: 'tooltip_basic',
            gravity: 'ne',
            click: this.handleHoverGl2d
        }
    };
};

module.exports = ModeBar;
