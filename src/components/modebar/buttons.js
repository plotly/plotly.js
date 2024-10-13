'use strict';

var Registry = require('../../registry');
var Plots = require('../../plots/plots');
var axisIds = require('../../plots/cartesian/axis_ids');
var Icons = require('../../fonts/ploticon');
var eraseActiveShape = require('../shapes/draw').eraseActiveShape;
var Lib = require('../../lib');
var _ = Lib._;
var lodash = require('lodash');  // Import lodash, not using default _

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
    title: function(gd) {
        var opts = gd._context.toImageButtonOptions || {};
        var format = opts.format || 'png';
        return format === 'png' ?
            _(gd, 'Download plot as a png') : // legacy text
            _(gd, 'Download plot'); // generic non-PNG text
    },
    icon: Icons.camera,
    click: function(gd) {
        var toImageButtonOptions = gd._context.toImageButtonOptions;
        var opts = {format: toImageButtonOptions.format || 'png'};

        Lib.notifier(_(gd, 'Taking snapshot - this may take a few seconds'), 'long');

        if(opts.format !== 'svg' && Lib.isIE()) {
            Lib.notifier(_(gd, 'IE only supports svg.  Changing format to svg.'), 'long');
            opts.format = 'svg';
        }

        ['filename', 'width', 'height', 'scale'].forEach(function(key) {
            if(key in toImageButtonOptions) {
                opts[key] = toImageButtonOptions[key];
            }
        });

        Registry.call('downloadImage', gd, opts)
          .then(function(filename) {
              Lib.notifier(_(gd, 'Snapshot succeeded') + ' - ' + filename, 'long');
          })
          .catch(function() {
              Lib.notifier(_(gd, 'Sorry, there was a problem downloading your snapshot!'), 'long');
          });
    }
};

modeBarButtons.sendDataToCloud = {
    name: 'sendDataToCloud',
    title: function(gd) { return _(gd, 'Edit in Chart Studio'); },
    icon: Icons.disk,
    click: function(gd) {
        Plots.sendDataToCloud(gd);
    }
};

modeBarButtons.editInChartStudio = {
    name: 'editInChartStudio',
    title: function(gd) { return _(gd, 'Edit in Chart Studio'); },
    icon: Icons.pencil,
    click: function(gd) {
        Plots.sendDataToCloud(gd);
    }
};

modeBarButtons.zoom2d = {
    name: 'zoom2d',
    _cat: 'zoom',
    title: function(gd) { return _(gd, 'Zoom'); },
    attr: 'dragmode',
    val: 'zoom',
    icon: Icons.zoombox,
    click: handleCartesian
};

modeBarButtons.pan2d = {
    name: 'pan2d',
    _cat: 'pan',
    title: function(gd) { return _(gd, 'Pan'); },
    attr: 'dragmode',
    val: 'pan',
    icon: Icons.pan,
    click: handleCartesian
};

modeBarButtons.select2d = {
    name: 'select2d',
    _cat: 'select',
    title: function(gd) { return _(gd, 'Box Select'); },
    attr: 'dragmode',
    val: 'select',
    icon: Icons.selectbox,
    click: handleCartesian
};

modeBarButtons.lasso2d = {
    name: 'lasso2d',
    _cat: 'lasso',
    title: function(gd) { return _(gd, 'Lasso Select'); },
    attr: 'dragmode',
    val: 'lasso',
    icon: Icons.lasso,
    click: handleCartesian
};

modeBarButtons.drawclosedpath = {
    name: 'drawclosedpath',
    title: function(gd) { return _(gd, 'Draw closed freeform'); },
    attr: 'dragmode',
    val: 'drawclosedpath',
    icon: Icons.drawclosedpath,
    click: handleCartesian
};

modeBarButtons.drawopenpath = {
    name: 'drawopenpath',
    title: function(gd) { return _(gd, 'Draw open freeform'); },
    attr: 'dragmode',
    val: 'drawopenpath',
    icon: Icons.drawopenpath,
    click: handleCartesian
};

modeBarButtons.drawline = {
    name: 'drawline',
    title: function(gd) { return _(gd, 'Draw line'); },
    attr: 'dragmode',
    val: 'drawline',
    icon: Icons.drawline,
    click: handleCartesian
};

modeBarButtons.drawrect = {
    name: 'drawrect',
    title: function(gd) { return _(gd, 'Draw rectangle'); },
    attr: 'dragmode',
    val: 'drawrect',
    icon: Icons.drawrect,
    click: handleCartesian
};

modeBarButtons.drawcircle = {
    name: 'drawcircle',
    title: function(gd) { return _(gd, 'Draw circle'); },
    attr: 'dragmode',
    val: 'drawcircle',
    icon: Icons.drawcircle,
    click: handleCartesian
};

modeBarButtons.eraseshape = {
    name: 'eraseshape',
    title: function(gd) { return _(gd, 'Erase active shape'); },
    icon: Icons.eraseshape,
    click: eraseActiveShape
};

modeBarButtons.zoomIn2d = {
    name: 'zoomIn2d',
    _cat: 'zoomin',
    title: function(gd) { return _(gd, 'Zoom in'); },
    attr: 'zoom',
    val: 'in',
    icon: Icons.zoom_plus,
    click: handleCartesian
};

modeBarButtons.zoomOut2d = {
    name: 'zoomOut2d',
    _cat: 'zoomout',
    title: function(gd) { return _(gd, 'Zoom out'); },
    attr: 'zoom',
    val: 'out',
    icon: Icons.zoom_minus,
    click: handleCartesian
};

modeBarButtons.autoScale2d = {
    name: 'autoScale2d',
    _cat: 'autoscale',
    title: function(gd) { return _(gd, 'Autoscale'); },
    attr: 'zoom',
    val: 'auto',
    icon: Icons.autoscale,
    click: handleCartesian
};

modeBarButtons.resetScale2d = {
    name: 'resetScale2d',
    _cat: 'resetscale',
    title: function(gd) { return _(gd, 'Reset axes'); },
    attr: 'zoom',
    val: 'reset',
    icon: Icons.home,
    click: handleCartesian
};

modeBarButtons.hoverClosestCartesian = {
    name: 'hoverClosestCartesian',
    _cat: 'hoverclosest',
    title: function(gd) { return _(gd, 'Show closest data on hover'); },
    attr: 'hovermode',
    val: 'closest',
    icon: Icons.tooltip_basic,
    gravity: 'ne',
    click: handleCartesian
};

modeBarButtons.hoverCompareCartesian = {
    name: 'hoverCompareCartesian',
    _cat: 'hoverCompare',
    title: function(gd) { return _(gd, 'Compare data on hover'); },
    attr: 'hovermode',
    val: function(gd) {
        return gd._fullLayout._isHoriz ? 'y' : 'x';
    },
    icon: Icons.tooltip_compare,
    gravity: 'ne',
    click: handleCartesian
};

function handleCartesian(gd, ev) {
    var button = ev.currentTarget;
    var astr = button.getAttribute('data-attr');
    var val = button.getAttribute('data-val') || true;
    var fullLayout = gd._fullLayout;
    var aobj = {};
    var axList = axisIds.list(gd, null, true);
    var allSpikesEnabled = fullLayout._cartesianSpikesEnabled;

    var ax, i;

    if(astr === 'zoom') {
        var mag = (val === 'in') ? 0.5 : 2;
        var r0 = (1 + mag) / 2;
        var r1 = (1 - mag) / 2;
        var axName;

        for(i = 0; i < axList.length; i++) {
            ax = axList[i];

            if(!ax.fixedrange) {
                axName = ax._name;
                if(val === 'auto') {
                    aobj[axName + '.autorange'] = true;
                } else if(val === 'reset') {
                    if(ax._rangeInitial0 === undefined && ax._rangeInitial1 === undefined) {
                        aobj[axName + '.autorange'] = true;
                    } else if(ax._rangeInitial0 === undefined) {
                        aobj[axName + '.autorange'] = ax._autorangeInitial;
                        aobj[axName + '.range'] = [null, ax._rangeInitial1];
                    } else if(ax._rangeInitial1 === undefined) {
                        aobj[axName + '.range'] = [ax._rangeInitial0, null];
                        aobj[axName + '.autorange'] = ax._autorangeInitial;
                    } else {
                        aobj[axName + '.range'] = [ax._rangeInitial0, ax._rangeInitial1];
                    }

                    // N.B. "reset" also resets showspikes
                    if(ax._showSpikeInitial !== undefined) {
                        aobj[axName + '.showspikes'] = ax._showSpikeInitial;
                        if(allSpikesEnabled === 'on' && !ax._showSpikeInitial) {
                            allSpikesEnabled = 'off';
                        }
                    }
                } else {
                    var rangeNow = [
                        ax.r2l(ax.range[0]),
                        ax.r2l(ax.range[1]),
                    ];

                    var rangeNew = [
                        r0 * rangeNow[0] + r1 * rangeNow[1],
                        r0 * rangeNow[1] + r1 * rangeNow[0]
                    ];

                    aobj[axName + '.range[0]'] = ax.l2r(rangeNew[0]);
                    aobj[axName + '.range[1]'] = ax.l2r(rangeNew[1]);
                }
            }
        }
    } else {
        // if ALL traces have orientation 'h', 'hovermode': 'x' otherwise: 'y'
        if(astr === 'hovermode' && (val === 'x' || val === 'y')) {
            val = fullLayout._isHoriz ? 'y' : 'x';
            button.setAttribute('data-val', val);
        }

        aobj[astr] = val;
    }

    fullLayout._cartesianSpikesEnabled = allSpikesEnabled;

    Registry.call('_guiRelayout', gd, aobj);
}

modeBarButtons.zoom3d = {
    name: 'zoom3d',
    _cat: 'zoom',
    title: function(gd) { return _(gd, 'Zoom'); },
    attr: 'scene.dragmode',
    val: 'zoom',
    icon: Icons.zoombox,
    click: handleDrag3d
};

modeBarButtons.pan3d = {
    name: 'pan3d',
    _cat: 'pan',
    title: function(gd) { return _(gd, 'Pan'); },
    attr: 'scene.dragmode',
    val: 'pan',
    icon: Icons.pan,
    click: handleDrag3d
};

modeBarButtons.orbitRotation = {
    name: 'orbitRotation',
    title: function(gd) { return _(gd, 'Orbital rotation'); },
    attr: 'scene.dragmode',
    val: 'orbit',
    icon: Icons['3d_rotate'],
    click: handleDrag3d
};

modeBarButtons.tableRotation = {
    name: 'tableRotation',
    title: function(gd) { return _(gd, 'Turntable rotation'); },
    attr: 'scene.dragmode',
    val: 'turntable',
    icon: Icons['z-axis'],
    click: handleDrag3d
};

function handleDrag3d(gd, ev) {
    var button = ev.currentTarget;
    var attr = button.getAttribute('data-attr');
    var val = button.getAttribute('data-val') || true;
    var sceneIds = gd._fullLayout._subplots.gl3d || [];
    var layoutUpdate = {};

    var parts = attr.split('.');

    for(var i = 0; i < sceneIds.length; i++) {
        layoutUpdate[sceneIds[i] + '.' + parts[1]] = val;
    }

    // for multi-type subplots
    var val2d = (val === 'pan') ? val : 'zoom';
    layoutUpdate.dragmode = val2d;

    Registry.call('_guiRelayout', gd, layoutUpdate);
}

modeBarButtons.resetCameraDefault3d = {
    name: 'resetCameraDefault3d',
    _cat: 'resetCameraDefault',
    title: function(gd) { return _(gd, 'Reset camera to default'); },
    attr: 'resetDefault',
    icon: Icons.home,
    click: handleCamera3d
};

modeBarButtons.resetCameraLastSave3d = {
    name: 'resetCameraLastSave3d',
    _cat: 'resetCameraLastSave',
    title: function(gd) { return _(gd, 'Reset camera to last save'); },
    attr: 'resetLastSave',
    icon: Icons.movie,
    click: handleCamera3d
};

function handleCamera3d(gd, ev) {
    var button = ev.currentTarget;
    var attr = button.getAttribute('data-attr');
    var resetLastSave = attr === 'resetLastSave';
    var resetDefault = attr === 'resetDefault';

    var fullLayout = gd._fullLayout;
    var sceneIds = fullLayout._subplots.gl3d || [];
    var aobj = {};

    for(var i = 0; i < sceneIds.length; i++) {
        var sceneId = sceneIds[i];
        var camera = sceneId + '.camera';
        var aspectratio = sceneId + '.aspectratio';
        var aspectmode = sceneId + '.aspectmode';
        var scene = fullLayout[sceneId]._scene;
        var didUpdate;

        if(resetLastSave) {
            aobj[camera + '.up'] = scene.viewInitial.up;
            aobj[camera + '.eye'] = scene.viewInitial.eye;
            aobj[camera + '.center'] = scene.viewInitial.center;
            didUpdate = true;
        } else if(resetDefault) {
            aobj[camera + '.up'] = null;
            aobj[camera + '.eye'] = null;
            aobj[camera + '.center'] = null;
            didUpdate = true;
        }

        if(didUpdate) {
            aobj[aspectratio + '.x'] = scene.viewInitial.aspectratio.x;
            aobj[aspectratio + '.y'] = scene.viewInitial.aspectratio.y;
            aobj[aspectratio + '.z'] = scene.viewInitial.aspectratio.z;
            aobj[aspectmode] = scene.viewInitial.aspectmode;
        }
    }

    Registry.call('_guiRelayout', gd, aobj);
}

modeBarButtons.hoverClosest3d = {
    name: 'hoverClosest3d',
    _cat: 'hoverclosest',
    title: function(gd) { return _(gd, 'Toggle show closest data on hover'); },
    attr: 'hovermode',
    val: null,
    toggle: true,
    icon: Icons.tooltip_basic,
    gravity: 'ne',
    click: handleHover3d
};

function getNextHover3d(gd, ev) {
    var button = ev.currentTarget;
    var val = button._previousVal;
    var fullLayout = gd._fullLayout;
    var sceneIds = fullLayout._subplots.gl3d || [];

    var axes = ['xaxis', 'yaxis', 'zaxis'];

    // initialize 'current spike' object to be stored in the DOM
    var currentSpikes = {};
    var layoutUpdate = {};

    if(val) {
        layoutUpdate = val;
        button._previousVal = null;
    } else {
        for(var i = 0; i < sceneIds.length; i++) {
            var sceneId = sceneIds[i];
            var sceneLayout = fullLayout[sceneId];

            var hovermodeAStr = sceneId + '.hovermode';
            currentSpikes[hovermodeAStr] = sceneLayout.hovermode;
            layoutUpdate[hovermodeAStr] = false;

            // copy all the current spike attrs
            for(var j = 0; j < 3; j++) {
                var axis = axes[j];
                var spikeAStr = sceneId + '.' + axis + '.showspikes';
                layoutUpdate[spikeAStr] = false;
                currentSpikes[spikeAStr] = sceneLayout[axis].showspikes;
            }
        }

        button._previousVal = currentSpikes;
    }
    return layoutUpdate;
}

function handleHover3d(gd, ev) {
    var layoutUpdate = getNextHover3d(gd, ev);
    Registry.call('_guiRelayout', gd, layoutUpdate);
}

modeBarButtons.zoomInGeo = {
    name: 'zoomInGeo',
    _cat: 'zoomin',
    title: function(gd) { return _(gd, 'Zoom in'); },
    attr: 'zoom',
    val: 'in',
    icon: Icons.zoom_plus,
    click: handleGeo
};

modeBarButtons.zoomOutGeo = {
    name: 'zoomOutGeo',
    _cat: 'zoomout',
    title: function(gd) { return _(gd, 'Zoom out'); },
    attr: 'zoom',
    val: 'out',
    icon: Icons.zoom_minus,
    click: handleGeo
};

modeBarButtons.resetGeo = {
    name: 'resetGeo',
    _cat: 'reset',
    title: function(gd) { return _(gd, 'Reset'); },
    attr: 'reset',
    val: null,
    icon: Icons.autoscale,
    click: handleGeo
};

modeBarButtons.hoverClosestGeo = {
    name: 'hoverClosestGeo',
    _cat: 'hoverclosest',
    title: function(gd) { return _(gd, 'Toggle show closest data on hover'); },
    attr: 'hovermode',
    val: null,
    toggle: true,
    icon: Icons.tooltip_basic,
    gravity: 'ne',
    click: toggleHover
};

function handleGeo(gd, ev) {
    var button = ev.currentTarget;
    var attr = button.getAttribute('data-attr');
    var val = button.getAttribute('data-val') || true;
    var fullLayout = gd._fullLayout;
    var geoIds = fullLayout._subplots.geo || [];

    for(var i = 0; i < geoIds.length; i++) {
        var id = geoIds[i];
        var geoLayout = fullLayout[id];

        if(attr === 'zoom') {
            var scale = geoLayout.projection.scale;
            var newScale = (val === 'in') ? 2 * scale : 0.5 * scale;

            Registry.call('_guiRelayout', gd, id + '.projection.scale', newScale);
        }
    }

    if(attr === 'reset') {
        resetView(gd, 'geo');
    }
}

modeBarButtons.hoverClosestPie = {
    name: 'hoverClosestPie',
    _cat: 'hoverclosest',
    title: function(gd) { return _(gd, 'Toggle show closest data on hover'); },
    attr: 'hovermode',
    val: 'closest',
    icon: Icons.tooltip_basic,
    gravity: 'ne',
    click: toggleHover
};

function getNextHover(gd) {
    var fullLayout = gd._fullLayout;

    if(fullLayout.hovermode) return false;

    if(fullLayout._has('cartesian')) {
        return fullLayout._isHoriz ? 'y' : 'x';
    }
    return 'closest';
}

function toggleHover(gd) {
    var newHover = getNextHover(gd);
    Registry.call('_guiRelayout', gd, 'hovermode', newHover);
}

modeBarButtons.resetViewSankey = {
    name: 'resetSankeyGroup',
    title: function(gd) { return _(gd, 'Reset view'); },
    icon: Icons.home,
    click: function(gd) {
        var aObj = {
            'node.groups': [],
            'node.x': [],
            'node.y': []
        };
        for(var i = 0; i < gd._fullData.length; i++) {
            var viewInitial = gd._fullData[i]._viewInitial;
            aObj['node.groups'].push(viewInitial.node.groups.slice());
            aObj['node.x'].push(viewInitial.node.x.slice());
            aObj['node.y'].push(viewInitial.node.y.slice());
        }
        Registry.call('restyle', gd, aObj);
    }
};

// buttons when more then one plot types are present

modeBarButtons.toggleHover = {
    name: 'toggleHover',
    title: function(gd) { return _(gd, 'Toggle show closest data on hover'); },
    attr: 'hovermode',
    val: null,
    toggle: true,
    icon: Icons.tooltip_basic,
    gravity: 'ne',
    click: function(gd, ev) {
        var layoutUpdate = getNextHover3d(gd, ev);
        layoutUpdate.hovermode = getNextHover(gd);

        Registry.call('_guiRelayout', gd, layoutUpdate);
    }
};

modeBarButtons.resetViews = {
    name: 'resetViews',
    title: function(gd) { return _(gd, 'Reset views'); },
    icon: Icons.home,
    click: function(gd, ev) {
        var button = ev.currentTarget;

        button.setAttribute('data-attr', 'zoom');
        button.setAttribute('data-val', 'reset');
        handleCartesian(gd, ev);

        button.setAttribute('data-attr', 'resetLastSave');
        handleCamera3d(gd, ev);

        resetView(gd, 'geo');
        resetView(gd, 'mapbox');
        resetView(gd, 'map');
    }
};

modeBarButtons.toggleSpikelines = {
    name: 'toggleSpikelines',
    title: function(gd) { return _(gd, 'Toggle Spike Lines'); },
    icon: Icons.spikeline,
    attr: '_cartesianSpikesEnabled',
    val: 'on',
    click: function(gd) {
        var fullLayout = gd._fullLayout;
        var allSpikesEnabled = fullLayout._cartesianSpikesEnabled;

        fullLayout._cartesianSpikesEnabled = allSpikesEnabled === 'on' ? 'off' : 'on';
        Registry.call('_guiRelayout', gd, setSpikelineVisibility(gd));
    }
};

// Define default template and style
var DEFAULT_TEMPLATES = {
    date_x: '%{x|%Y-%m-%d}', // xaxis.type == "date"
    date_y: '%{y|%Y-%m-%d}',
    multicategory_x: '%{x}', // xaxis.type == "multicategory"
    multicategory_y: '%{y}',
    category_x: '%{x}', // xaxis.type == "category"
    category_y: '%{y}',
    x: 'x: %{x:.4~g}',
    y: 'y: %{y:.4~g}',
    // z: 'z: %{z:.4~g}',
    z: 'z: %{z}',
    open: 'open: %{open:.2f}',
    high: 'high: %{high:.2f}',
    low: 'low: %{low:.2f}',
    close: 'close: %{close:.2f}'
};

var DEFAULT_STYLE = {
    align: 'left',
    arrowcolor: 'black',
    arrowhead: 3,
    arrowsize: 1.8,
    arrowwidth: 1,
    font: {
        color: 'black',
        family: 'Arial',
        size: 12
    },
    showarrow: true,
    xanchor: 'left'
};

modeBarButtons.tooltip = {
    name: 'tooltip',
    title: function(gd) { return _(gd, 'Add Tooltip to Points'); },
    icon: Icons.tooltip_annotate,
    attr: '_tooltipEnabled',
    val: 'on',
    click: function(gd) {
        var fullLayout = gd._fullLayout;
        var tooltipEnabled = fullLayout._tooltipEnabled;

        fullLayout._tooltipEnabled = tooltipEnabled === 'on' ? 'off' : 'on';

        if(fullLayout._tooltipEnabled === 'on') {
            gd._tooltipClickHandler = function(data) {
                var traceIndex = data.points[0].curveNumber;
                var trace = gd.data[traceIndex];
                var pts = data.points[0];

                // handle missing axis in data.points[0] (in scattercarpet)
                if(pts.xaxis === undefined) pts.xaxis = fullLayout.xaxis;
                if(pts.yaxis === undefined) pts.yaxis = fullLayout.yaxis;

                // Build the default tooltip template dynamically based on available data fields
                var defaultTemplateParts = [];
                var xAxisType = pts.xaxis.type;
                var yAxisType = pts.yaxis.type;
                if(pts.x !== undefined) defaultTemplateParts.push(DEFAULT_TEMPLATES.hasOwnProperty(xAxisType + '_x') ? DEFAULT_TEMPLATES[xAxisType + '_x'] : DEFAULT_TEMPLATES.x);
                if(pts.y !== undefined) defaultTemplateParts.push(DEFAULT_TEMPLATES.hasOwnProperty(yAxisType + '_y') ? DEFAULT_TEMPLATES[yAxisType + '_y'] : DEFAULT_TEMPLATES.y);
                if(pts.z !== undefined) defaultTemplateParts.push(DEFAULT_TEMPLATES.z);
                // ohlc
                if(pts.open !== undefined) defaultTemplateParts.push(DEFAULT_TEMPLATES.open);
                if(pts.high !== undefined) defaultTemplateParts.push(DEFAULT_TEMPLATES.high);
                if(pts.low !== undefined) defaultTemplateParts.push(DEFAULT_TEMPLATES.low);
                if(pts.close !== undefined) defaultTemplateParts.push(DEFAULT_TEMPLATES.close);
                // not consistent:
                // box: missing max, upper fence... in data.points[0]

                var defaultTemplate = defaultTemplateParts.join('<br>');

                var userTemplate = trace.tooltiptemplate || gd._fullData[traceIndex].tooltiptemplate || defaultTemplate; // Use user defined tooltiptemplate, or trace default if availabe
                var customStyle = lodash.defaults({}, trace.tooltip, DEFAULT_STYLE);  // Merge custom style with default
                addTooltip(gd, data, userTemplate, customStyle);
            };
            gd.on('plotly_click', gd._tooltipClickHandler);
        } else {
            gd.removeListener('plotly_click', gd._tooltipClickHandler);
        }

        if(!gd._relayoutHandlerAdded) {
            gd._relayoutHandlerAdded = true;
            gd.on('plotly_relayout', function(eventData) {
                removeEmptyAnnotations(gd, eventData);
            });
        }
    }
};

function clickPointToCoord(gd, data) {
    var pts = data.points[0];
    var xaxis = pts.xaxis;
    var yaxis = pts.yaxis;
    var bb = data.event.target.getBoundingClientRect();

    // pixel to Cartesian coordinates
    var x = xaxis.p2c(data.event.clientX - bb.left);
    var y = yaxis.p2c(data.event.clientY - bb.top);

    return {x: x, y: y};
}

function addTooltip(gd, data, userTemplate, customStyle) {
    var pts = data.points[0];
    var fullLayout = gd._fullLayout;

    if(pts && pts.xaxis && pts.yaxis && fullLayout) {
        // Convert template to text using Plotly hovertemplate formatting method
        var text = Lib.hovertemplateString(userTemplate, {}, fullLayout._d3locale, pts, {});

        var x = pts.x;
        var y = (pts.y !== undefined && pts.y !== null) ? pts.y : pts.high; // fallback value for candlestick etc

        // Handle histogram with more than one curve (bars displayed side to side)
        // This ensures the tooltip is on the clicked bar and not always on the middle bar
        if(pts.fullData && ['histogram', 'box', 'violin'].includes(pts.fullData.type) && fullLayout._dataLength) {
            var clickCoord = clickPointToCoord(gd, data);
            if(pts.fullData.orientation === 'v') {
                x = clickCoord.x;
            }
            if(pts.fullData.orientation === 'h') {
                y = clickCoord.y;
            }
        }

        // Retrieve the proper axis ids for xref and yref
        var xAxisName = 'x' + (pts.xaxis._id !== 'x' ? pts.xaxis._id.replace('x', '') : '');
        var yAxisName = 'y' + (pts.yaxis._id !== 'y' ? pts.yaxis._id.replace('y', '') : '');

        var newAnnotation = {
            // Handle log axis https://plotly.com/javascript/text-and-annotations/#annotations-with-log-axes
            x: pts.xaxis.type === 'log' ? Math.log10(x) : x,
            y: pts.yaxis.type === 'log' ? Math.log10(y) : y,
            xref: xAxisName,
            yref: yAxisName,
            text: text,
            showarrow: true,
            ax: 5,
            ay: -20
        };

        lodash.defaults(newAnnotation, customStyle);

        // Prevent having multiple tooltip annotations on the same point (useful when user wants to annotate nearby points)
        // Does not prevent multiple tooltips on histogram (would not be useful on bars)
        var existingIndex = fullLayout.annotations.findIndex(function(ann) {
            return ann.x === x && ann.y === y && ann.xref === xAxisName && ann.yref === yAxisName;
        });

        if(existingIndex === -1) {
            fullLayout.annotations.push(newAnnotation);
            var aObj = { annotations: fullLayout.annotations };
            Registry.call('_guiRelayout', gd, aObj);
        }
    }
}

function removeEmptyAnnotations(gd, eventData) {
    for(var key in eventData) {
        if(key.includes('annotations[') && key.includes('].text')) {
            var index = key.match(/annotations\[(\d+)\]\.text/)[1];
            if(eventData[key] === '') {
                var updatedAnnotations = gd.layout.annotations || [];
                updatedAnnotations.splice(index, 1);
                var aObj = { annotations: updatedAnnotations };
                Registry.call('_guiRelayout', gd, aObj);
                break;
            }
        }
    }
}

function setSpikelineVisibility(gd) {
    var fullLayout = gd._fullLayout;
    var areSpikesOn = fullLayout._cartesianSpikesEnabled === 'on';
    var axList = axisIds.list(gd, null, true);
    var aobj = {};

    for(var i = 0; i < axList.length; i++) {
        var ax = axList[i];
        aobj[ax._name + '.showspikes'] = areSpikesOn ? true : ax._showSpikeInitial;
    }

    return aobj;
}

modeBarButtons.resetViewMapbox = {
    name: 'resetViewMapbox',
    _cat: 'resetView',
    title: function(gd) { return _(gd, 'Reset view'); },
    attr: 'reset',
    icon: Icons.home,
    click: function(gd) {
        resetView(gd, 'mapbox');
    }
};

modeBarButtons.resetViewMap = {
    name: 'resetViewMap',
    _cat: 'resetView',
    title: function(gd) { return _(gd, 'Reset view'); },
    attr: 'reset',
    icon: Icons.home,
    click: function(gd) {
        resetView(gd, 'map');
    }
};

modeBarButtons.zoomInMapbox = {
    name: 'zoomInMapbox',
    _cat: 'zoomin',
    title: function(gd) { return _(gd, 'Zoom in'); },
    attr: 'zoom',
    val: 'in',
    icon: Icons.zoom_plus,
    click: handleMapboxZoom
};

modeBarButtons.zoomInMap = {
    name: 'zoomInMap',
    _cat: 'zoomin',
    title: function(gd) { return _(gd, 'Zoom in'); },
    attr: 'zoom',
    val: 'in',
    icon: Icons.zoom_plus,
    click: handleMapZoom
};

modeBarButtons.zoomOutMapbox = {
    name: 'zoomOutMapbox',
    _cat: 'zoomout',
    title: function(gd) { return _(gd, 'Zoom out'); },
    attr: 'zoom',
    val: 'out',
    icon: Icons.zoom_minus,
    click: handleMapboxZoom
};

modeBarButtons.zoomOutMap = {
    name: 'zoomOutMap',
    _cat: 'zoomout',
    title: function(gd) { return _(gd, 'Zoom out'); },
    attr: 'zoom',
    val: 'out',
    icon: Icons.zoom_minus,
    click: handleMapZoom
};

function handleMapboxZoom(gd, ev) {
    _handleMapZoom(gd, ev, 'mapbox');
}

function handleMapZoom(gd, ev) {
    _handleMapZoom(gd, ev, 'map');
}

function _handleMapZoom(gd, ev, mapType) {
    var button = ev.currentTarget;
    var val = button.getAttribute('data-val');
    var fullLayout = gd._fullLayout;
    var subplotIds = fullLayout._subplots[mapType] || [];
    var scalar = 1.05;
    var aObj = {};

    for(var i = 0; i < subplotIds.length; i++) {
        var id = subplotIds[i];
        var current = fullLayout[id].zoom;
        var next = (val === 'in') ? scalar * current : current / scalar;
        aObj[id + '.zoom'] = next;
    }

    Registry.call('_guiRelayout', gd, aObj);
}

function resetView(gd, subplotType) {
    var fullLayout = gd._fullLayout;
    var subplotIds = fullLayout._subplots[subplotType] || [];
    var aObj = {};

    for(var i = 0; i < subplotIds.length; i++) {
        var id = subplotIds[i];
        var subplotObj = fullLayout[id]._subplot;
        var viewInitial = subplotObj.viewInitial;
        var viewKeys = Object.keys(viewInitial);

        for(var j = 0; j < viewKeys.length; j++) {
            var key = viewKeys[j];
            aObj[id + '.' + key] = viewInitial[key];
        }
    }

    Registry.call('_guiRelayout', gd, aObj);
}
