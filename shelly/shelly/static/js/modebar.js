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
            var buttonConfig = _this.config[buttonName];

            if (!buttonConfig) {
                throw new Error(buttonName + ' not specfied in modebar configuration');
            }

            var button = _this.createButton(buttonConfig);

            _this.buttonElements.push(button);
            group.appendChild(button);
        });

        _this.element.appendChild(group);
    });


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
            curval = graphInfo.layout[dataAttr];

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
 * Apply D3 cartesian mode attributes to layout to update hover functionality
 * @Param {object} ev event object
 */
function handleCartesian (ev) {
    var button = ev.currentTarget,
        astr = button.getAttribute('data-attr'),
        val = button.getAttribute('data-val') || true,
        aobj = {},
        graphInfo = this.graphInfo,
        layout = this.graphInfo.layout,
        Plotly = this.Plotly,
        _this = this;

    aobj[astr] = val;

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
 * @Return {HTMLelement}
 */
function handleHover3d (ev) {
    var _this = this,
        button = ev.currentTarget,
        attr = button.getAttribute('data-attr'),
        val = button.getAttribute('data-val') || true,
        layoutUpdate = {},
        graphInfo = this.graphInfo,
        layout = graphInfo.layout,
        scenes = Object.keys(layout).filter(function(k){
            return k.match(/^scene[0-9]*$/);
        }).map( function (sceneKey) {
            return layout[sceneKey];
        });

    layoutUpdate[attr] = val;

    scenes.forEach( function (scene) {
        scene._webgl.spikeEnable = !scene._webgl.spikeEnable;
    });

    this.Plotly.relayout(graphInfo, layoutUpdate).then( function() {
        _this.updateActiveButton();
        scenes[0]._container.focus();
    });
}

/**
 * Reconfigure keyboard bindings for webgl3D camera control
 * @Param {object} ev event object
 * @Return {HTMLelement}
 */
function handle3dCamera (ev) {
    var _this = this,
        button = ev.currentTarget,
        attr = button.getAttribute('data-attr'),
        val = button.getAttribute('data-val') || true,
        layoutUpdate = {},
        graphInfo = this.graphInfo,
        layout = graphInfo.layout,
        scenes = Object.keys(layout).filter(function(k){
            return k.match(/^scene[0-9]*$/);
        }).map( function (sceneKey) {
            return layout[sceneKey];
        });

    if (attr === 'reset') {
            var initCam = layout.scene._webgl.cameraPositionInit;
            val = 'rotate';
        layoutUpdate = {
            'dragmode': 'rotate',
            'scene.cameraPosition[0]': JSON.parse(JSON.stringify(initCam[0])),
            'scene.cameraPosition[1]': JSON.parse(JSON.stringify(initCam[1])),
            'scene.cameraPosition[2]': JSON.parse(JSON.stringify(initCam[2]))
        };
    }else{
        layoutUpdate[attr] = val;
    }

    scenes.forEach( function (scene) {
        if ('_webgl' in scene && 'camera' in scene._webgl) {
            scene._webgl.camera.keyBindingMode = val;
        }
    });

    this.Plotly.relayout(graphInfo, layoutUpdate).then( function() {
        _this.updateActiveButton();
        scenes[0]._container.focus();
    });
}


/**
 *
 * @Property config specification hash of button parameters
 */
ModeBar.prototype.config = {
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
        click: handleCartesian
    },
    hoverCompare2d: {
        title: 'Compare data on hover',
        attr: 'hovermode',
        val: 'x',
        icon: 'ploticon-tooltip_compare',
        click: handleCartesian
    },
    resetCamera3d: {
        title: 'Reset camera',
        attr: 'reset',
        val: '',
        icon: 'ploticon-autoscale',
        click: handle3dCamera
    },
    zoom3d: {
        title: 'Zoom',
        attr: 'dragmode',
        val: 'zoom',
        icon: 'ploticon-zoombox',
        click: handle3dCamera
    },
    pan3d: {
        title: 'Pan',
        attr: 'dragmode',
        val: 'pan',
        icon: 'ploticon-pan',
        click: handle3dCamera
    },
    rotate3d: {
        title: 'Rotate',
        attr: 'dragmode',
        val: 'rotate',
        icon: 'icon-undo',
        click: handle3dCamera
    },
    closest3d: {
        title: 'Toggle show closest data on hover',
        attr: 'hovermode',
        val: 'closest',
        icon: 'ploticon-tooltip_basic',
        click: handleHover3d
    }

};



})();
