(function () {
'use strict';

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

    var _this = this,
        groupedButtons = config.buttons;

    this.Plotly = config.Plotly;
    this.graphInfo = config.graphInfo;
    this.element = document.createElement('div');
    this.element.className = 'modebar';
    this.buttons = [];

    groupedButtons.forEach( function (buttons) {
        var group = _this.createGroup();

        buttons.forEach( function (buttonName) {
            var buttonConfig = _this.config[buttonName];

            if (!buttonConfig) {
                throw new Error(buttonName + ' not specfied in modebar configuration');
            }

            var button = _this.createButton(buttonConfig);

            _this.buttons.push(button);
            group.appendChild(button);
        });

        _this.element.appendChild(group);
    });


    config.container.appendChild(this.element);

    _this.updateActiveButton();

}

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
 * Empty div for containing a group of buttons
 * @Param {object} config
 * @Param {string} config.attr
 * @Param {string} config.val
 * @Param {string} config.title
 * @Param {function} config.click
 * @Return {HTMLelement}
 */
ModeBar.createButton = function (config) {
    var button = document.createaElement('button');
    var icon = document.createaElement('i');

    button.setAttribute('rel', 'tooltip');
    button.className = 'btn btn--icon btn--plot ploticon';

    button.setAttribute('data-attr', config.attr);
    button.setAttribute('data-val', config.val);
    button.setAttribute('title', config.title);

    icon.className = config.icon;

    button.eventListener('click', config.click);

    return button;
};

/**
 * Updates active button with attribute specified in layout
 * @Param {object} graphInfo plot object containing data and layout
 * @Return {HTMLelement}
 */
ModeBar.updateActiveButton = function () {
    var graphInfo = this.graphInfo;
    this.buttons.forEach( function (button) {
        var thisval = button.getAttribute('data-val') || true,
            dataAttr = button.getAttribute('data-attr'),
            curval = graphInfo.layout[dataAttr];

        button.classList.toggle('active', curval===thisval);
    });
};

/**
 *
 * @Property config specification hash of button parameters
 */
ModeBar.prototype.config = {
    zoomCartesian: {
        title: 'Zoom',
        attr: 'dragmode',
        val: 'zoom',
        icon: 'ploticon-zoom',
        click: ModeBar.handleCartesian
    },
    panCartesian: {
        title: 'Pan',
        attr: 'dragmode',
        val: 'pan',
        icon: 'ploticon-pan',
        click: ModeBar.handleCartesian
    },
    zoomInCartesian: {
        title: 'Zoom in',
        attr: 'zoom',
        val: 'in',
        icon: 'ploticon-zoom_plus',
        click: ModeBar.handleCartesian
    },
    zoomOutCartesian: {
        title: 'Zoom out',
        attr: 'zoom',
        val: 'out',
        icon: 'ploticon-zoom_minus',
        click: ModeBar.handleCartesian
    },
    autoScaleCartesian: {
        title: 'Autoscale',
        attr: 'allaxes.autorange',
        val: '',
        icon: 'ploticon-autoscale',
        click: ModeBar.handleCartesian
    },
    hoverClosestCartesian: {
        title: 'Show closest data on hover',
        attr: 'hovermode',
        val: 'closest',
        icon: 'ploticon-tooltip_basic',
        click: ModeBar.handleCartesian
    },
    hoverCompareCartesian: {
        title: 'Compare data on hover',
        attr: 'hovermode',
        val: 'x',
        icon: 'ploticon-tooltip_compare',
        click: ModeBar.handleCartesian
    }
};

/**
 * Click handler for cartesian type plots
 * @Param {object} ev event object
 * @Return {HTMLelement}
 */
ModeBar.prototype.handleCartesian = function (ev) {
    var button = ev.currentTarget,
        astr = button.getAttribute('data-attr'),
        val = button.getAttribute('data-val') || true,
        aobj = {},
        graphInfo = this.graphInfo,
        layout = this.graphInfo.layout,
        Plotly = this.Plotly,
        _this = this;

    aobj[astr] = val;

    if(astr==='zoom') {
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
            Plotly.fx.setCursor(
                layout._paper.select('.nsewdrag'),
                {pan:'move', zoom:'crosshair'}[val]
            );
        }
    });
};



})();
