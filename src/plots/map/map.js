'use strict';

var maplibregl = require('maplibre-gl');

var Lib = require('../../lib');
var geoUtils = require('../../lib/geo_location_utils');
var Registry = require('../../registry');
var Axes = require('../cartesian/axes');
var dragElement = require('../../components/dragelement');

var Fx = require('../../components/fx');
var dragHelpers = require('../../components/dragelement/helpers');
var drawMode = dragHelpers.drawMode;
var selectMode = dragHelpers.selectMode;

var prepSelect = require('../../components/selections').prepSelect;
var clearOutline = require('../../components/selections').clearOutline;
var clearSelectionsCache = require('../../components/selections').clearSelectionsCache;
var selectOnClick = require('../../components/selections').selectOnClick;

var constants = require('./constants');
var createMapLayer = require('./layers');

function Map(gd, id) {
    this.id = id;
    this.gd = gd;

    var fullLayout = gd._fullLayout;
    var context = gd._context;

    this.container = fullLayout._glcontainer.node();
    this.isStatic = context.staticPlot;

    // unique id for this Map instance
    this.uid = fullLayout._uid + '-' + this.id;

    // create framework on instantiation for a smoother first plot call
    this.div = null;
    this.xaxis = null;
    this.yaxis = null;
    this.createFramework(fullLayout);

    // state variables used to infer how and what to update
    this.map = null;
    this.styleObj = null;
    this.traceHash = {};
    this.layerList = [];
    this.belowLookup = {};
    this.dragging = false;
    this.wheeling = false;
}

var proto = Map.prototype;

proto.plot = function(calcData, fullLayout, promises) {
    var self = this;

    var promise;

    if(!self.map) {
        promise = new Promise(function(resolve, reject) {
            self.createMap(calcData, fullLayout, resolve, reject);
        });
    } else {
        promise = new Promise(function(resolve, reject) {
            self.updateMap(calcData, fullLayout, resolve, reject);
        });
    }

    promises.push(promise);
};

proto.createMap = function(calcData, fullLayout, resolve, reject) {
    var self = this;
    var opts = fullLayout[self.id];

    // store style id and URL or object
    var styleObj = self.styleObj = getStyleObj(opts.style);


    var bounds = opts.bounds;
    var maxBounds = bounds ? [[bounds.west, bounds.south], [bounds.east, bounds.north]] : null;

    // create the map!
    var map = self.map = new maplibregl.Map({
        container: self.div,

        style: styleObj.style,
        center: convertCenter(opts.center),
        zoom: opts.zoom,
        bearing: opts.bearing,
        pitch: opts.pitch,
        maxBounds: maxBounds,

        interactive: !self.isStatic,
        preserveDrawingBuffer: self.isStatic,

        doubleClickZoom: false,
        boxZoom: false,

        attributionControl: false
    })
    .addControl(new maplibregl.AttributionControl({
        compact: true
    }));

    var requestedIcons = {};
    map.on('styleimagemissing', function(e) {
        var id = e.id;
        if(!requestedIcons[id] && id.includes('-15')) {
            requestedIcons[id] = true;
            var img = new Image(15, 15);
            img.onload = function() {
                map.addImage(id, img);
            };
            img.crossOrigin = 'Anonymous';
            img.src = 'https://unpkg.com/maki@2.1.0/icons/' + id + '.svg';
        }
    });

    map.setTransformRequest(function(url) {
        url = url.replace('https://fonts.openmaptiles.org/Open Sans Extrabold', 'https://fonts.openmaptiles.org/Open Sans Extra Bold');
        url = url.replace('https://tiles.basemaps.cartocdn.com/fonts/Open Sans Extrabold', 'https://fonts.openmaptiles.org/Open Sans Extra Bold');
        url = url.replace('https://fonts.openmaptiles.org/Open Sans Regular,Arial Unicode MS Regular', 'https://fonts.openmaptiles.org/Klokantech Noto Sans Regular');
        return {
            url: url
        };
    });


    // make sure canvas does not inherit left and top css
    map._canvas.style.left = '0px';
    map._canvas.style.top = '0px';

    self.rejectOnError(reject);

    if(!self.isStatic) {
        self.initFx(calcData, fullLayout);
    }

    var promises = [];

    promises.push(new Promise(function(resolve) {
        map.once('load', resolve);
    }));

    promises = promises.concat(geoUtils.fetchTraceGeoData(calcData));

    Promise.all(promises).then(function() {
        self.fillBelowLookup(calcData, fullLayout);
        self.updateData(calcData);
        self.updateLayout(fullLayout);
        self.resolveOnRender(resolve);
    }).catch(reject);
};

proto.updateMap = function(calcData, fullLayout, resolve, reject) {
    var self = this;
    var map = self.map;
    var opts = fullLayout[this.id];

    self.rejectOnError(reject);

    var promises = [];
    var styleObj = getStyleObj(opts.style);

    if(JSON.stringify(self.styleObj) !== JSON.stringify(styleObj)) {
        self.styleObj = styleObj;
        map.setStyle(styleObj.style);

        // need to rebuild trace layers on reload
        // to avoid 'lost event' errors
        self.traceHash = {};

        promises.push(new Promise(function(resolve) {
            map.once('styledata', resolve);
        }));
    }

    promises = promises.concat(geoUtils.fetchTraceGeoData(calcData));

    Promise.all(promises).then(function() {
        self.fillBelowLookup(calcData, fullLayout);
        self.updateData(calcData);
        self.updateLayout(fullLayout);
        self.resolveOnRender(resolve);
    }).catch(reject);
};

proto.fillBelowLookup = function(calcData, fullLayout) {
    var opts = fullLayout[this.id];
    var layers = opts.layers;
    var i, val;

    var belowLookup = this.belowLookup = {};
    var hasTraceAtTop = false;

    for(i = 0; i < calcData.length; i++) {
        var trace = calcData[i][0].trace;
        var _module = trace._module;

        if(typeof trace.below === 'string') {
            val = trace.below;
        } else if(_module.getBelow) {
            // 'smart' default that depend the map's base layers
            val = _module.getBelow(trace, this);
        }

        if(val === '') {
            hasTraceAtTop = true;
        }

        belowLookup['trace-' + trace.uid] = val || '';
    }

    for(i = 0; i < layers.length; i++) {
        var item = layers[i];

        if(typeof item.below === 'string') {
            val = item.below;
        } else if(hasTraceAtTop) {
            // if one or more trace(s) set `below:''` and
            // layers[i].below is unset,
            // place layer below traces
            val = 'traces';
        } else {
            val = '';
        }

        belowLookup['layout-' + i] = val;
    }

    // N.B. If multiple layers have the 'below' value,
    // we must clear the stashed 'below' field in order
    // to make `traceHash[k].update()` and `layerList[i].update()`
    // remove/add the all those layers to have preserve
    // the correct layer ordering
    var val2list = {};
    var k, id;

    for(k in belowLookup) {
        val = belowLookup[k];
        if(val2list[val]) {
            val2list[val].push(k);
        } else {
            val2list[val] = [k];
        }
    }

    for(val in val2list) {
        var list = val2list[val];
        if(list.length > 1) {
            for(i = 0; i < list.length; i++) {
                k = list[i];
                if(k.indexOf('trace-') === 0) {
                    id = k.split('trace-')[1];
                    if(this.traceHash[id]) {
                        this.traceHash[id].below = null;
                    }
                } else if(k.indexOf('layout-') === 0) {
                    id = k.split('layout-')[1];
                    if(this.layerList[id]) {
                        this.layerList[id].below = null;
                    }
                }
            }
        }
    }
};

var traceType2orderIndex = {
    choroplethmap: 0,
    densitymap: 1,
    scattermap: 2
};

proto.updateData = function(calcData) {
    var traceHash = this.traceHash;
    var traceObj, trace, i, j;

    // Need to sort here by trace type here,
    // in case traces with different `type` have the same
    // below value, but sorting we ensure that
    // e.g. choroplethmap traces will be below scattermap traces
    var calcDataSorted = calcData.slice().sort(function(a, b) {
        return (
            traceType2orderIndex[a[0].trace.type] -
            traceType2orderIndex[b[0].trace.type]
        );
    });

    // update or create trace objects
    for(i = 0; i < calcDataSorted.length; i++) {
        var calcTrace = calcDataSorted[i];

        trace = calcTrace[0].trace;
        traceObj = traceHash[trace.uid];

        var didUpdate = false;
        if(traceObj) {
            if(traceObj.type === trace.type) {
                traceObj.update(calcTrace);
                didUpdate = true;
            } else {
                traceObj.dispose();
            }
        }
        if(!didUpdate && trace._module) {
            traceHash[trace.uid] = trace._module.plot(this, calcTrace);
        }
    }

    // remove empty trace objects
    var ids = Object.keys(traceHash);
    idLoop:
    for(i = 0; i < ids.length; i++) {
        var id = ids[i];

        for(j = 0; j < calcData.length; j++) {
            trace = calcData[j][0].trace;
            if(id === trace.uid) continue idLoop;
        }

        traceObj = traceHash[id];
        traceObj.dispose();
        delete traceHash[id];
    }
};

proto.updateLayout = function(fullLayout) {
    var map = this.map;
    var opts = fullLayout[this.id];

    if(!this.dragging && !this.wheeling) {
        map.setCenter(convertCenter(opts.center));
        map.setZoom(opts.zoom);
        map.setBearing(opts.bearing);
        map.setPitch(opts.pitch);
    }

    this.updateLayers(fullLayout);
    this.updateFramework(fullLayout);
    this.updateFx(fullLayout);
    this.map.resize();

    if(this.gd._context._scrollZoom.map) {
        map.scrollZoom.enable();
    } else {
        map.scrollZoom.disable();
    }
};

proto.resolveOnRender = function(resolve) {
    var map = this.map;

    map.on('render', function onRender() {
        if(map.loaded()) {
            map.off('render', onRender);
            // resolve at end of render loop
            //
            // Need a 10ms delay (0ms should suffice to skip a thread in the
            // render loop) to workaround map-gl bug introduced in v1.3.0
            setTimeout(resolve, 10);
        }
    });
};

proto.rejectOnError = function(reject) {
    var map = this.map;

    function handler() {
        reject(new Error(constants.mapOnErrorMsg));
    }

    map.once('error', handler);
    map.once('style.error', handler);
    map.once('source.error', handler);
    map.once('tile.error', handler);
    map.once('layer.error', handler);
};

proto.createFramework = function(fullLayout) {
    var self = this;

    var div = self.div = document.createElement('div');
    div.id = self.uid;
    div.style.position = 'absolute';
    self.container.appendChild(div);

    // create mock x/y axes for hover routine
    self.xaxis = {
        _id: 'x',
        c2p: function(v) { return self.project(v).x; }
    };
    self.yaxis = {
        _id: 'y',
        c2p: function(v) { return self.project(v).y; }
    };

    self.updateFramework(fullLayout);

    // mock axis for hover formatting
    self.mockAxis = {
        type: 'linear',
        showexponent: 'all',
        exponentformat: 'B'
    };
    Axes.setConvert(self.mockAxis, fullLayout);
};

proto.initFx = function(calcData, fullLayout) {
    var self = this;
    var gd = self.gd;
    var map = self.map;

    // keep track of pan / zoom in user layout and emit relayout event
    map.on('moveend', function(evt) {
        if(!self.map) return;

        var fullLayoutNow = gd._fullLayout;

        // 'moveend' gets triggered by map.setCenter, map.setZoom,
        // map.setBearing and map.setPitch.
        //
        // Here, we make sure that state updates amd 'plotly_relayout'
        // are triggered only when the 'moveend' originates from a
        // mouse target (filtering out API calls) to not
        // duplicate 'plotly_relayout' events.

        if(evt.originalEvent || self.wheeling) {
            var optsNow = fullLayoutNow[self.id];
            Registry.call('_storeDirectGUIEdit', gd.layout, fullLayoutNow._preGUI, self.getViewEdits(optsNow));

            var viewNow = self.getView();
            optsNow._input.center = optsNow.center = viewNow.center;
            optsNow._input.zoom = optsNow.zoom = viewNow.zoom;
            optsNow._input.bearing = optsNow.bearing = viewNow.bearing;
            optsNow._input.pitch = optsNow.pitch = viewNow.pitch;
            gd.emit('plotly_relayout', self.getViewEditsWithDerived(viewNow));
        }
        if(evt.originalEvent && evt.originalEvent.type === 'mouseup') {
            self.dragging = false;
        } else if(self.wheeling) {
            self.wheeling = false;
        }

        if(fullLayoutNow && fullLayoutNow._rehover) {
            fullLayoutNow._rehover();
        }
    });

    map.on('wheel', function() {
        self.wheeling = true;
    });

    map.on('mousemove', function(evt) {
        var bb = self.div.getBoundingClientRect();
        var xy = [
            evt.originalEvent.offsetX,
            evt.originalEvent.offsetY
        ];

        evt.target.getBoundingClientRect = function() { return bb; };

        self.xaxis.p2c = function() { return map.unproject(xy).lng; };
        self.yaxis.p2c = function() { return map.unproject(xy).lat; };

        gd._fullLayout._rehover = function() {
            if(gd._fullLayout._hoversubplot === self.id && gd._fullLayout[self.id]) {
                Fx.hover(gd, evt, self.id);
            }
        };

        Fx.hover(gd, evt, self.id);
        gd._fullLayout._hoversubplot = self.id;
    });

    function unhover() {
        Fx.loneUnhover(fullLayout._hoverlayer);
    }

    map.on('dragstart', function() {
        self.dragging = true;
        unhover();
    });
    map.on('zoomstart', unhover);

    map.on('mouseout', function() {
        gd._fullLayout._hoversubplot = null;
    });

    function emitUpdate() {
        var viewNow = self.getView();
        gd.emit('plotly_relayouting', self.getViewEditsWithDerived(viewNow));
    }

    map.on('drag', emitUpdate);
    map.on('zoom', emitUpdate);

    map.on('dblclick', function() {
        var optsNow = gd._fullLayout[self.id];
        Registry.call('_storeDirectGUIEdit', gd.layout, gd._fullLayout._preGUI, self.getViewEdits(optsNow));

        var viewInitial = self.viewInitial;
        map.setCenter(convertCenter(viewInitial.center));
        map.setZoom(viewInitial.zoom);
        map.setBearing(viewInitial.bearing);
        map.setPitch(viewInitial.pitch);

        var viewNow = self.getView();
        optsNow._input.center = optsNow.center = viewNow.center;
        optsNow._input.zoom = optsNow.zoom = viewNow.zoom;
        optsNow._input.bearing = optsNow.bearing = viewNow.bearing;
        optsNow._input.pitch = optsNow.pitch = viewNow.pitch;

        gd.emit('plotly_doubleclick', null);
        gd.emit('plotly_relayout', self.getViewEditsWithDerived(viewNow));
    });

    // define event handlers on map creation, to keep one ref per map,
    // so that map.on / map.off in updateFx works as expected
    self.clearOutline = function() {
        clearSelectionsCache(self.dragOptions);
        clearOutline(self.dragOptions.gd);
    };

    /**
     * Returns a click handler function that is supposed
     * to handle clicks in pan mode.
     */
    self.onClickInPanFn = function(dragOptions) {
        return function(evt) {
            var clickMode = gd._fullLayout.clickmode;

            if(clickMode.indexOf('select') > -1) {
                selectOnClick(evt.originalEvent, gd, [self.xaxis], [self.yaxis], self.id, dragOptions);
            }

            if(clickMode.indexOf('event') > -1) {
                // TODO: this does not support right-click. If we want to support it, we
                // would likely need to change map to use dragElement instead of straight
                // map event binding. Or perhaps better, make a simple wrapper with the
                // right mousedown, mousemove, and mouseup handlers just for a left/right click
                // pie would use this too.
                Fx.click(gd, evt.originalEvent);
            }
        };
    };
};

proto.updateFx = function(fullLayout) {
    var self = this;
    var map = self.map;
    var gd = self.gd;

    if(self.isStatic) return;

    function invert(pxpy) {
        var obj = self.map.unproject(pxpy);
        return [obj.lng, obj.lat];
    }

    var dragMode = fullLayout.dragmode;
    var fillRangeItems;

    fillRangeItems = function(eventData, poly) {
        if(poly.isRect) {
            var ranges = eventData.range = {};
            ranges[self.id] = [
                invert([poly.xmin, poly.ymin]),
                invert([poly.xmax, poly.ymax])
            ];
        } else {
            var dataPts = eventData.lassoPoints = {};
            dataPts[self.id] = poly.map(invert);
        }
    };

    // Note: dragOptions is needed to be declared for all dragmodes because
    // it's the object that holds persistent selection state.
    // Merge old dragOptions with new to keep possibly initialized
    // persistent selection state.
    var oldDragOptions = self.dragOptions;
    self.dragOptions = Lib.extendDeep(oldDragOptions || {}, {
        dragmode: fullLayout.dragmode,
        element: self.div,
        gd: gd,
        plotinfo: {
            id: self.id,
            domain: fullLayout[self.id].domain,
            xaxis: self.xaxis,
            yaxis: self.yaxis,
            fillRangeItems: fillRangeItems
        },
        xaxes: [self.xaxis],
        yaxes: [self.yaxis],
        subplot: self.id
    });

    // Unregister the old handler before potentially registering
    // a new one. Otherwise multiple click handlers might
    // be registered resulting in unwanted behavior.
    map.off('click', self.onClickInPanHandler);
    if(selectMode(dragMode) || drawMode(dragMode)) {
        map.dragPan.disable();
        map.on('zoomstart', self.clearOutline);

        self.dragOptions.prepFn = function(e, startX, startY) {
            prepSelect(e, startX, startY, self.dragOptions, dragMode);
        };

        dragElement.init(self.dragOptions);
    } else {
        map.dragPan.enable();
        map.off('zoomstart', self.clearOutline);
        self.div.onmousedown = null;
        self.div.ontouchstart = null;
        self.div.removeEventListener('touchstart', self.div._ontouchstart);
        // TODO: this does not support right-click. If we want to support it, we
        // would likely need to change map to use dragElement instead of straight
        // map event binding. Or perhaps better, make a simple wrapper with the
        // right mousedown, mousemove, and mouseup handlers just for a left/right click
        // pie would use this too.
        self.onClickInPanHandler = self.onClickInPanFn(self.dragOptions);
        map.on('click', self.onClickInPanHandler);
    }
};

proto.updateFramework = function(fullLayout) {
    var domain = fullLayout[this.id].domain;
    var size = fullLayout._size;

    var style = this.div.style;
    style.width = size.w * (domain.x[1] - domain.x[0]) + 'px';
    style.height = size.h * (domain.y[1] - domain.y[0]) + 'px';
    style.left = size.l + domain.x[0] * size.w + 'px';
    style.top = size.t + (1 - domain.y[1]) * size.h + 'px';

    this.xaxis._offset = size.l + domain.x[0] * size.w;
    this.xaxis._length = size.w * (domain.x[1] - domain.x[0]);

    this.yaxis._offset = size.t + (1 - domain.y[1]) * size.h;
    this.yaxis._length = size.h * (domain.y[1] - domain.y[0]);
};

proto.updateLayers = function(fullLayout) {
    var opts = fullLayout[this.id];
    var layers = opts.layers;
    var layerList = this.layerList;
    var i;

    // if the layer arrays don't match,
    // don't try to be smart,
    // delete them all, and start all over.

    if(layers.length !== layerList.length) {
        for(i = 0; i < layerList.length; i++) {
            layerList[i].dispose();
        }

        layerList = this.layerList = [];

        for(i = 0; i < layers.length; i++) {
            layerList.push(createMapLayer(this, i, layers[i]));
        }
    } else {
        for(i = 0; i < layers.length; i++) {
            layerList[i].update(layers[i]);
        }
    }
};

proto.destroy = function() {
    if(this.map) {
        this.map.remove();
        this.map = null;
        this.container.removeChild(this.div);
    }
};

proto.toImage = function() {
    this.map.stop();
    return this.map.getCanvas().toDataURL();
};

// convenience wrapper to create set multiple layer
// 'layout' or 'paint options at once.
proto.setOptions = function(id, methodName, opts) {
    for(var k in opts) {
        this.map[methodName](id, k, opts[k]);
    }
};

proto.getMapLayers = function() {
    return this.map.getStyle().layers;
};

// convenience wrapper that first check in 'below' references
// a layer that exist and then add the layer to the map,
proto.addLayer = function(opts, below) {
    var map = this.map;

    if(typeof below === 'string') {
        if(below === '') {
            map.addLayer(opts, below);
            return;
        }

        var mapLayers = this.getMapLayers();
        for(var i = 0; i < mapLayers.length; i++) {
            if(below === mapLayers[i].id) {
                map.addLayer(opts, below);
                return;
            }
        }

        Lib.warn([
            'Trying to add layer with *below* value',
            below,
            'referencing a layer that does not exist',
            'or that does not yet exist.'
        ].join(' '));
    }

    map.addLayer(opts);
};

// convenience method to project a [lon, lat] array to pixel coords
proto.project = function(v) {
    return this.map.project(new maplibregl.LngLat(v[0], v[1]));
};

// get map's current view values in plotly.js notation
proto.getView = function() {
    var map = this.map;
    var mapCenter = map.getCenter();
    var lon = mapCenter.lng;
    var lat = mapCenter.lat;
    var center = { lon: lon, lat: lat };

    var canvas = map.getCanvas();
    var w = parseInt(canvas.style.width);
    var h = parseInt(canvas.style.height);

    return {
        center: center,
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
        _derived: {
            coordinates: [
                map.unproject([0, 0]).toArray(),
                map.unproject([w, 0]).toArray(),
                map.unproject([w, h]).toArray(),
                map.unproject([0, h]).toArray()
            ]
        }
    };
};

proto.getViewEdits = function(cont) {
    var id = this.id;
    var keys = ['center', 'zoom', 'bearing', 'pitch'];
    var obj = {};

    for(var i = 0; i < keys.length; i++) {
        var k = keys[i];
        obj[id + '.' + k] = cont[k];
    }

    return obj;
};

proto.getViewEditsWithDerived = function(cont) {
    var id = this.id;
    var obj = this.getViewEdits(cont);
    obj[id + '._derived'] = cont._derived;
    return obj;
};

function getStyleObj(val) {
    var styleObj = {};

    if(Lib.isPlainObject(val)) {
        styleObj.id = val.id;
        styleObj.style = val;
    } else if(typeof val === 'string') {
        styleObj.id = val;

        if(constants.stylesMap[val]) {
            styleObj.style = constants.stylesMap[val];
        } else {
            styleObj.style = val;
        }
    } else {
        styleObj.id = constants.styleValueDflt;
        styleObj.style = convertStyleVal(constants.styleValueDflt);
    }

    styleObj.transition = {duration: 0, delay: 0};

    return styleObj;
}

// if style is part of the 'official' map values, add URL prefix and suffix
function convertStyleVal(val) {
    return constants.styleUrlPrefix + val + '-' + constants.styleUrlSuffix;
}

function convertCenter(center) {
    return [center.lon, center.lat];
}

module.exports = Map;
