'use strict';
/* global d3:false */

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

    this.Plotly = config.Plotly;
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

/**
 * Empty div for containing a group of buttons
 * @Return {HTMLelement}
 */
ModeBar.prototype.createGroup = function () {
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
ModeBar.prototype.createButton = function (config) {
    var button = document.createElement('a');
    var icon = document.createElement('i');
    var _this = this;
    button.setAttribute('rel', 'tooltip');
    button.className = 'modebar-btn plotlyjsicon';

    button.setAttribute('data-attr', config.attr);
    button.setAttribute('data-val', config.val);
    button.setAttribute('data-title', config.title);
    button.setAttribute('data-gravity', config.gravity || 'n');
    button.addEventListener('click', function () {
            config.click.apply(_this, arguments);
        });

    icon.className = config.icon;
    button.appendChild(icon);

    return button;
};

/**
 * Updates active button with attribute specified in layout
 * @Param {object} graphInfo plot object containing data and layout
 * @Return {HTMLelement}
 */
ModeBar.prototype.updateActiveButton = function () {
    var graphInfo = this.graphInfo;
    this.buttonElements.forEach( function (button) {
        var thisval = button.getAttribute('data-val') || true,
            dataAttr = button.getAttribute('data-attr'),
            curval = graphInfo._fullLayout[dataAttr];

        d3.select(button).classed('active', curval===thisval);
    });
};


/**
 * Check if modebar is configured as button configuration argument
 * @Param {object} buttons 2d array of grouped button names
 * @Return {boolean}
 */
ModeBar.prototype.hasButtons = function (buttons) {
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
ModeBar.prototype.getLogo = function(){
    var group = this.createGroup(),
        a = document.createElement('a'),
        i = document.createElement('i');


    a.href = 'https://plot.ly/';
    a.target = '_blank';
    a.setAttribute('data-title', 'Produced with Plotly');
    a.className = 'modebar-btn plotlyjsicon modebar-btn--logo';

    i.className = 'plotlyjsicon-plotlylogo';
    a.appendChild(i);
    group.appendChild(a);
    return group;
};

/**
 * Apply D3 cartesian mode attributes to layout to update hover functionality
 * @Param {object} ev event object
 */
ModeBar.prototype.handleCartesian = function(ev) {
    var button = ev.currentTarget,
        astr = button.getAttribute('data-attr'),
        val = button.getAttribute('data-val') || true,
        _this = this,
        graphInfo = this.graphInfo,
        fullLayout = this.graphInfo._fullLayout,
        Plotly = this.Plotly,
        aobj = {};

    if(astr === 'zoom') {
        var xr = fullLayout.xaxis.range,
            yr = fullLayout.yaxis.range,
            mag = (val==='in') ? 0.5 : 2,
            r0 = (1+mag)/2, r1 = (1-mag)/2;
        aobj = {
            'xaxis.range[0]': r0*xr[0] + r1*xr[1],
            'xaxis.range[1]': r0*xr[1] + r1*xr[0],
            'yaxis.range[0]': r0*yr[0] + r1*yr[1],
            'yaxis.range[1]': r0*yr[1] + r1*yr[0]
        };
    }

    // if ALL traces have orientation 'h', 'hovermode': 'x' otherwise: 'y'
    if (astr==='hovermode' && (val==='x' || val==='y')) {
        val = fullLayout._isHoriz ? 'y' : 'x';
        button.setAttribute('data-val', val);
    }

    aobj[astr] = val;

    Plotly.relayout(graphInfo, aobj).then( function() {
        _this.updateActiveButton();
        if(astr === 'dragmode') {
            Plotly.Fx.setCursor(
                fullLayout._paper.select('.nsewdrag'),
                {pan:'move', zoom:'crosshair'}[val]
            );
            Plotly.Fx.supplyLayoutDefaults(graphInfo.layout, fullLayout,
                graphInfo._fullData);
        }
    });
};

/**
 * Toggle the data hover mode
 * @Param {object} ev event object
 */
ModeBar.prototype.handleHover3d = function(ev) {
    var button = ev.currentTarget,
        attr = button.getAttribute('data-attr'),
        _this = this,
        Plotly = this.Plotly,
        graphInfo = this.graphInfo,
        fullLayout = graphInfo._fullLayout,
        sceneLayouts = Plotly.Lib.getSceneLayouts(fullLayout),
        layoutUpdate = {};

    // 3D has only 1 hover mode; toggle it
    var val = fullLayout[attr]!=='closest' ? 'closest' : false;
    layoutUpdate[attr] = val;

    // Apply to all scenes
    for (var i = 0;  i < sceneLayouts.length; ++i) {
        var sceneLayout = sceneLayouts[i],
            scene = sceneLayout._scene;

        scene.spikeEnable = !scene.spikeEnable;
        scene.container.focus();
    }

    Plotly.relayout(graphInfo, layoutUpdate).then( function() {
        _this.updateActiveButton();
    });
};

/**
 * Reconfigure keyboard bindings for webgl3D camera control on drag
 * @Param {object} ev event object
 */
ModeBar.prototype.handleDrag3d = function(ev) {
    var button = ev.currentTarget,
        attr = button.getAttribute('data-attr'),
        val = button.getAttribute('data-val') || true,
        _this = this,
        Plotly = this.Plotly,
        graphInfo = this.graphInfo,
        fullLayout = graphInfo._fullLayout,
        sceneLayouts = Plotly.Lib.getSceneLayouts(fullLayout),
        layoutUpdate = {};

    // set dragmode to given value
    layoutUpdate[attr] = val;

    // Update the webgl3D key binding of all scenes
    for (var i = 0;  i < sceneLayouts.length; ++i) {
        var sceneLayout = sceneLayouts[i],
            scene = sceneLayout._scene;

        if ('camera' in scene) {
            scene.camera.keyBindingMode = val;
            scene.container.focus();
        }
    }

    Plotly.relayout(graphInfo, layoutUpdate).then( function() {
        _this.updateActiveButton();
    });
};


/**
 * Reset the position of the webgl3D camera
 * @Param {object} ev event object
 */
ModeBar.prototype.handleCamera3d = function(ev) {
    var button = ev.currentTarget,
        attr = button.getAttribute('data-attr'),
        Plotly = this.Plotly,
        graphInfo = this.graphInfo,
        fullLayout = graphInfo._fullLayout,
        sceneLayouts = Plotly.Lib.getSceneLayouts(fullLayout);

    // Reset camera of all scenes
    for (var i = 0;  i < sceneLayouts.length; ++i) {
        var sceneLayout = sceneLayouts[i],
            scene = sceneLayout._scene;

        if (attr === 'resetDefault') {
            // Reset camera position to default
            scene.setCameraToDefault();
        } else if (attr === 'resetLastSave') {
            // Reset camera back to the position at the last save
            var cameraPositionLastSave = scene.cameraPositionLastSave;
            scene.setCameraPosition(cameraPositionLastSave);
        }
    }

    /* TODO have a sceneLastTouched in _fullLayout to only
     * update the camera of the scene last touched by the user
     */
};

ModeBar.prototype.cleanup = function(){
    this.element.innerHTML = '';
    var modebarParent = this.element.parentNode;
    modebarParent.removeChild(this.element);
};

/**
 *
 * @Property config specification hash of button parameters
 */
ModeBar.prototype.config = function config() {
    return {
        zoom2d: {
            title: 'Zoom',
            attr: 'dragmode',
            val: 'zoom',
            icon: 'plotlyjsicon-zoombox',
            click: this.handleCartesian
        },
        pan2d: {
            title: 'Pan',
            attr: 'dragmode',
            val: 'pan',
            icon: 'plotlyjsicon-pan',
            click: this.handleCartesian
        },
        zoomIn2d: {
            title: 'Zoom in',
            attr: 'zoom',
            val: 'in',
            icon: 'plotlyjsicon-zoom_plus',
            click: this.handleCartesian
        },
        zoomOut2d: {
            title: 'Zoom out',
            attr: 'zoom',
            val: 'out',
            icon: 'plotlyjsicon-zoom_minus',
            click: this.handleCartesian
        },
        autoScale2d: {
            title: 'Autoscale',
            attr: 'allaxes.autorange',
            val: '',
            icon: 'plotlyjsicon-autoscale',
            click: this.handleCartesian
        },
        hoverClosest2d: {
            title: 'Show closest data on hover',
            attr: 'hovermode',
            val: 'closest',
            icon: 'plotlyjsicon-tooltip_basic',
            gravity: 'ne',
            click: this.handleCartesian
        },
        hoverCompare2d: {
            title: 'Compare data on hover',
            attr: 'hovermode',
            val: this.graphInfo._fullLayout._isHoriz ? 'y' : 'x',
            icon: 'plotlyjsicon-tooltip_compare',
            gravity: 'ne',
            click: this.handleCartesian
        },
        zoom3d: {
            title: 'Zoom',
            attr: 'dragmode',
            val: 'zoom',
            icon: 'plotlyjsicon-zoombox',
            click: this.handleDrag3d
        },
        pan3d: {
            title: 'Pan',
            attr: 'dragmode',
            val: 'pan',
            icon: 'plotlyjsicon-pan',
            click: this.handleDrag3d
        },
        rotate3d: {
            title: 'Rotate',
            attr: 'dragmode',
            val: 'rotate',
            icon: 'plotlyjsicon-undo',
            click: this.handleDrag3d
        },
        resetCameraDefault3d: {
            title: 'Reset camera to default',
            attr: 'resetDefault',
            val: false,
            icon: 'plotlyjsicon-home',
            click: this.handleCamera3d
        },
        resetCameraLastSave3d: {
            title: 'Reset camera to last save',
            attr: 'resetLastSave',
            val: false,
            icon: 'plotlyjsicon-camera-retro',
            click: this.handleCamera3d
        },
        hoverClosest3d: {
            title: 'Toggle show closest data on hover',
            attr: 'hovermode',
            val: 'closest',
            icon: 'plotlyjsicon-tooltip_basic',
            gravity: 'ne',
            click: this.handleHover3d
        }
    };
};

module.exports = ModeBar;
