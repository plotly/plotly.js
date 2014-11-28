'use strict';

(function () {

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
    this.element.className = 'modebar';
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

    if (this.graphInfo.displaylogo) {
        this.element.appendChild(this.getLogo());
    }

    config.container.appendChild(this.element);

    this.updateActiveButton();

}

window.ModeBar = ModeBar;

/**
 * Empty div for containing a group of buttons
 * @Return {HTMLelement}
 */
ModeBar.prototype.createGroup = function () {
    var group = document.createElement('div');
    group.className = 'btn-group float--left';

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
    var button = document.createElement('button');
    var icon = document.createElement('i');

    button.setAttribute('rel', 'tooltip');
    button.className = 'btn btn--icon btn--plot ploticon';

    button.setAttribute('data-attr', config.attr);
    button.setAttribute('data-val', config.val);
    button.setAttribute('title', config.title);
    button.setAttribute('data-gravity', config.gravity || 'n');
    button.addEventListener('click', config.click.bind(this));

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

        button.classList.toggle('active', curval===thisval);
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
        a = document.createElement('a');

    a.setAttribute('rel', 'tooltip');
    a.href = 'https://plot.ly/';
    a.target = '_blank';
    a.title = 'Produced with Plotly';
    a.className = "ploticon-plotlylogo";
    a.setAttribute('data-gravity', 'ne');

    group.appendChild(a);
    group.classList.add('btn-group--logo');
    return group;
}

/**
 * Apply D3 cartesian mode attributes to layout to update hover functionality
 * @Param {object} ev event object
 */
function handleCartesian (ev) {
    var button = ev.currentTarget,
        astr = button.getAttribute('data-attr'),
        val = button.getAttribute('data-val') || true,
        aobj = {},
        graphInfo = this.graphInfo,
        layout = this.graphInfo._fullLayout,
        Plotly = this.Plotly,
        _this = this;

    if(astr === 'zoom') {
        var xr = layout.xaxis.range,
            yr = layout.yaxis.range,
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
        val = layout._isHoriz ? 'y' : 'x';
        button.setAttribute('data-val', val);
    }

    aobj[astr] = val;

    Plotly.relayout(graphInfo, aobj).then( function() {
        _this.updateActiveButton();
        if(astr === 'dragmode') {
            Plotly.Fx.setCursor(
                layout._paper.select('.nsewdrag'),
                {pan:'move', zoom:'crosshair'}[val]
            );
        }
    });
}

/**
 * Toggle the data hover mode
 * @Param {object} ev event object
 */
function handleHover3d (ev) {
    var _this = this,
        button = ev.currentTarget,
        attr = button.getAttribute('data-attr'),
        val = button.getAttribute('data-val') || true,
        layoutUpdate = {},
        graphInfo = this.graphInfo,
        layout = graphInfo._fullLayout,
        scenes = Object.keys(layout).filter(function(k){
            return k.match(/^scene[0-9]*$/);
        }).map( function (sceneKey) {
            return layout[sceneKey];
        });

    layoutUpdate[attr] = val;

    scenes.forEach( function (sceneLayout) {
        sceneLayout._scene.spikeEnable = !sceneLayout._scene.spikeEnable;
    });

    this.Plotly.relayout(graphInfo, layoutUpdate).then( function() {
        _this.updateActiveButton();
        scenes[0]._container.focus();
    });
}

/**
 * Reconfigure keyboard bindings for webgl3D camera control on drag
 * @Param {object} ev event object
 */
function handleDrag3d (ev) {
    var _this = this,
        button = ev.currentTarget,
        attr = button.getAttribute('data-attr'),
        val = button.getAttribute('data-val') || true,
        layoutUpdate = {},
        graphInfo = this.graphInfo,
        layout = graphInfo._fullLayout,
        scenes = Object.keys(layout).filter(function(k){
            return k.match(/^scene[0-9]*$/);
        }).map( function (sceneKey) {
            return layout[sceneKey];
        });

    // set dragmode to given value
    layoutUpdate[attr] = val;

    // update the webgl3D key binding
    scenes.forEach( function (sceneLayout) {
        if ('_scene' in sceneLayout && 'camera' in sceneLayout._scene) {
            sceneLayout._scene.camera.keyBindingMode = val;
        }
    });

    this.Plotly.relayout(graphInfo, layoutUpdate).then( function() {
        _this.updateActiveButton();
        scenes[0]._container.focus();
    });
}


/**
 * Reset the position of the webgl3D camera
 * @Param {object} ev event object
 */
function handleCamera3d (ev) {
    var _this = this,
        button = ev.currentTarget,
        attr = button.getAttribute('data-attr'),
        val = button.getAttribute('data-val') || true,
        layoutUpdate = {},
        graphInfo = this.graphInfo,
        layout = graphInfo._fullLayout,
        scenes = Object.keys(layout).filter(function(k){
            return k.match(/^scene[0-9]*$/);
        }).map( function (sceneKey) {
            return layout[sceneKey];
        }),
        _scene = layout.scene._scene;

    if (attr === 'resetDefault') {
        // Reset camera position to default
        _scene.setCameraToDefault();
    } else if (attr === 'resetLastSave') {
        // Reset camera back to the position at the last save
        var cameraPositionLastSave = _scene.cameraPositionLastSave;
        _scene.setCameraPosition(cameraPositionLastSave);
    }

    /**
     * TODO multiple scenes!
     * Ideally, in a multiple scene plot, the modebar buttons should
     * reset the camera position of the scene last moved.
     */
}

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
            icon: 'ploticon-zoombox',
            click: handleCartesian
        },
        pan2d: {
            title: 'Pan',
            attr: 'dragmode',
            val: 'pan',
            icon: 'ploticon-pan',
            click: handleCartesian
        },
        zoomIn2d: {
            title: 'Zoom in',
            attr: 'zoom',
            val: 'in',
            icon: 'ploticon-zoom_plus',
            click: handleCartesian
        },
        zoomOut2d: {
            title: 'Zoom out',
            attr: 'zoom',
            val: 'out',
            icon: 'ploticon-zoom_minus',
            click: handleCartesian
        },
        autoScale2d: {
            title: 'Autoscale',
            attr: 'allaxes.autorange',
            val: '',
            icon: 'ploticon-autoscale',
            click: handleCartesian
        },
        hoverClosest2d: {
            title: 'Show closest data on hover',
            attr: 'hovermode',
            val: 'closest',
            icon: 'ploticon-tooltip_basic',
            gravity: 'ne',
            click: handleCartesian
        },
        hoverCompare2d: {
            title: 'Compare data on hover',
            attr: 'hovermode',
            val: this.graphInfo._fullLayout._isHoriz ? 'y' : 'x',
            icon: 'ploticon-tooltip_compare',
            gravity: 'ne',
            click: handleCartesian
        },
        zoom3d: {
            title: 'Zoom',
            attr: 'dragmode',
            val: 'zoom',
            icon: 'ploticon-zoombox',
            click: handleDrag3d
        },
        pan3d: {
            title: 'Pan',
            attr: 'dragmode',
            val: 'pan',
            icon: 'ploticon-pan',
            click: handleDrag3d
        },
        rotate3d: {
            title: 'Rotate',
            attr: 'dragmode',
            val: 'rotate',
            icon: 'icon-undo',
            click: handleDrag3d
        },
        resetCameraDefault3d: {
            title: 'Reset camera to default',
            attr: 'resetDefault',
            val: false,
            icon: 'icon-home',
            click: handleCamera3d
        },
        resetCameraLastSave3d: {
            title: 'Reset camera to last save',
            attr: 'resetLastSave',
            val: false,
            icon: 'icon-camera-retro',
            click: handleCamera3d
        },
        closest3d: {
            title: 'Toggle show closest data on hover',
            attr: 'hovermode',
            val: 'closest',
            icon: 'ploticon-tooltip_basic',
            gravity: 'ne',
            click: handleHover3d
        }
    };
};



})();
