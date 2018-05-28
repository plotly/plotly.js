/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var mapboxgl = require('mapbox-gl');

var Fx = require('../../components/fx');
var Lib = require('../../lib');
var dragElement = require('../../components/dragelement');
var prepSelect = require('../cartesian/select').prepSelect;
var constants = require('./constants');
var layoutAttributes = require('./layout_attributes');
var createMapboxLayer = require('./layers');

function Mapbox(opts) {
    this.id = opts.id;
    this.gd = opts.gd;
    this.container = opts.container;
    this.isStatic = opts.staticPlot;

    var fullLayout = opts.fullLayout;

    // unique id for this Mapbox instance
    this.uid = fullLayout._uid + '-' + this.id;

    // full mapbox options (N.B. needs to be updated on every updates)
    this.opts = fullLayout[this.id];

    // create framework on instantiation for a smoother first plot call
    this.div = null;
    this.xaxis = null;
    this.yaxis = null;
    this.createFramework(fullLayout);

    // state variables used to infer how and what to update
    this.map = null;
    this.accessToken = null;
    this.styleObj = null;
    this.traceHash = {};
    this.layerList = [];
}

var proto = Mapbox.prototype;

module.exports = function createMapbox(opts) {
    return new Mapbox(opts);
};

proto.plot = function(calcData, fullLayout, promises) {
    var self = this;

    // feed in new mapbox options
    var opts = self.opts = fullLayout[this.id];

    // remove map and create a new map if access token has change
    if(self.map && (opts.accesstoken !== self.accessToken)) {
        self.map.remove();
        self.map = null;
        self.styleObj = null;
        self.traceHash = [];
        self.layerList = {};
    }

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
    var gd = self.gd;
    var opts = self.opts;

    // store style id and URL or object
    var styleObj = self.styleObj = getStyleObj(opts.style);

    // store access token associated with this map
    self.accessToken = opts.accesstoken;

    // create the map!
    var map = self.map = new mapboxgl.Map({
        container: self.div,

        style: styleObj.style,
        center: convertCenter(opts.center),
        zoom: opts.zoom,
        bearing: opts.bearing,
        pitch: opts.pitch,

        interactive: !self.isStatic,
        preserveDrawingBuffer: self.isStatic,

        doubleClickZoom: false,
        boxZoom: false
    });

    // clear navigation container
    var className = constants.controlContainerClassName;
    var controlContainer = self.div.getElementsByClassName(className)[0];
    self.div.removeChild(controlContainer);

    // make sure canvas does not inherit left and top css
    map._canvas.style.left = '0px';
    map._canvas.style.top = '0px';

    self.rejectOnError(reject);

    map.once('load', function() {
        self.updateData(calcData);
        self.updateLayout(fullLayout);
        self.resolveOnRender(resolve);
    });

    if(self.isStatic) return;

    // keep track of pan / zoom in user layout and emit relayout event
    map.on('moveend', function(eventData) {
        if(!self.map) return;

        var view = self.getView();

        opts._input.center = opts.center = view.center;
        opts._input.zoom = opts.zoom = view.zoom;
        opts._input.bearing = opts.bearing = view.bearing;
        opts._input.pitch = opts.pitch = view.pitch;

        // 'moveend' gets triggered by map.setCenter, map.setZoom,
        // map.setBearing and map.setPitch.
        //
        // Here, we make sure that 'plotly_relayout' is
        // triggered here only when the 'moveend' originates from a
        // mouse target (filtering out API calls) to not
        // duplicate 'plotly_relayout' events.

        if(eventData.originalEvent) {
            var update = {};
            update[self.id] = Lib.extendFlat({}, view);
            gd.emit('plotly_relayout', update);
        }
    });

    map.on('mousemove', function(evt) {
        var bb = self.div.getBoundingClientRect();

        // some hackery to get Fx.hover to work
        evt.clientX = evt.point.x + bb.left;
        evt.clientY = evt.point.y + bb.top;

        evt.target.getBoundingClientRect = function() { return bb; };

        self.xaxis.p2c = function() { return evt.lngLat.lng; };
        self.yaxis.p2c = function() { return evt.lngLat.lat; };

        Fx.hover(gd, evt, self.id);

        var update = {};
        var view = self.getView();
        update[self.id] = Lib.extendFlat({}, view);
        gd.emit('plotly_relayouting', update);

    });

    map.on('click', function(evt) {
        // TODO: this does not support right-click. If we want to support it, we
        // would likely need to change mapbox to use dragElement instead of straight
        // mapbox event binding. Or perhaps better, make a simple wrapper with the
        // right mousedown, mousemove, and mouseup handlers just for a left/right click
        // pie would use this too.
        Fx.click(gd, evt.originalEvent);
    });

    function unhover() {
        Fx.loneUnhover(fullLayout._toppaper);
    }

    map.on('dragstart', unhover);
    map.on('zoomstart', unhover);

    map.on('dblclick', function() {
        var viewInitial = self.viewInitial;

        map.setCenter(convertCenter(viewInitial.center));
        map.setZoom(viewInitial.zoom);
        map.setBearing(viewInitial.bearing);
        map.setPitch(viewInitial.pitch);

        var viewNow = self.getView();

        opts._input.center = opts.center = viewNow.center;
        opts._input.zoom = opts.zoom = viewNow.zoom;
        opts._input.bearing = opts.bearing = viewNow.bearing;
        opts._input.pitch = opts.pitch = viewNow.pitch;

        gd.emit('plotly_doubleclick', null);
    });

    // define clear select on map creation, to keep one ref per map,
    // so that map.on / map.off in updateFx works as expected
    self.clearSelect = function() {
        gd._fullLayout._zoomlayer.selectAll('.select-outline').remove();
    };
};

proto.updateMap = function(calcData, fullLayout, resolve, reject) {
    var self = this;
    var map = self.map;

    self.rejectOnError(reject);

    var styleObj = getStyleObj(self.opts.style);

    if(self.styleObj.id !== styleObj.id) {
        self.styleObj = styleObj;
        map.setStyle(styleObj.style);

        map.once('styledata', function() {
            // need to rebuild trace layers on reload
            // to avoid 'lost event' errors
            self.traceHash = {};
            self.updateData(calcData);
            self.updateLayout(fullLayout);
            self.resolveOnRender(resolve);
        });
    } else {
        self.updateData(calcData);
        self.updateLayout(fullLayout);
        self.resolveOnRender(resolve);
    }
};

proto.updateData = function(calcData) {
    var traceHash = this.traceHash;
    var traceObj, trace, i, j;

    // update or create trace objects
    for(i = 0; i < calcData.length; i++) {
        var calcTrace = calcData[i];

        trace = calcTrace[0].trace;
        traceObj = traceHash[trace.uid];

        if(traceObj) {
            traceObj.update(calcTrace);
        } else if(trace._module) {
            traceHash[trace.uid] = trace._module.plot(this, calcTrace);
        }
    }

    // remove empty trace objects
    var ids = Object.keys(traceHash);
    id_loop:
    for(i = 0; i < ids.length; i++) {
        var id = ids[i];

        for(j = 0; j < calcData.length; j++) {
            trace = calcData[j][0].trace;
            if(id === trace.uid) continue id_loop;
        }

        traceObj = traceHash[id];
        traceObj.dispose();
        delete traceHash[id];
    }
};

proto.updateLayout = function(fullLayout) {
    var map = this.map,
        opts = this.opts;

    map.setCenter(convertCenter(opts.center));
    map.setZoom(opts.zoom);
    map.setBearing(opts.bearing);
    map.setPitch(opts.pitch);

    this.updateLayers();
    this.updateFramework(fullLayout);
    this.updateFx(fullLayout);
    this.map.resize();
};

proto.resolveOnRender = function(resolve) {
    var map = this.map;

    map.on('render', function onRender() {
        if(map.loaded()) {
            map.off('render', onRender);
            // resolve at end of render loop
            setTimeout(resolve, 0);
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

    if(dragMode === 'select') {
        fillRangeItems = function(eventData, poly) {
            var ranges = eventData.range = {};
            ranges[self.id] = [
                invert([poly.xmin, poly.ymin]),
                invert([poly.xmax, poly.ymax])
            ];
        };
    } else {
        fillRangeItems = function(eventData, poly, pts) {
            var dataPts = eventData.lassoPoints = {};
            dataPts[self.id] = pts.filtered.map(invert);
        };
    }

    if(dragMode === 'select' || dragMode === 'lasso') {
        map.dragPan.disable();
        map.on('zoomstart', self.clearSelect);

        var dragOptions = {
            element: self.div,
            gd: gd,
            plotinfo: {
                xaxis: self.xaxis,
                yaxis: self.yaxis,
                fillRangeItems: fillRangeItems
            },
            xaxes: [self.xaxis],
            yaxes: [self.yaxis],
            subplot: self.id
        };

        dragOptions.prepFn = function(e, startX, startY) {
            prepSelect(e, startX, startY, dragOptions, dragMode);
        };

        dragElement.init(dragOptions);
    } else {
        map.dragPan.enable();
        map.off('zoomstart', self.clearSelect);
        self.div.onmousedown = null;
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

proto.updateLayers = function() {
    var opts = this.opts;
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
            layerList.push(createMapboxLayer(this, i, layers[i]));
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

// convenience method to project a [lon, lat] array to pixel coords
proto.project = function(v) {
    return this.map.project(new mapboxgl.LngLat(v[0], v[1]));
};

// get map's current view values in plotly.js notation
proto.getView = function() {
    var map = this.map;

    var mapCenter = map.getCenter();
    var center = { lon: mapCenter.lng, lat: mapCenter.lat };

    return {
        center: center,
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch()
    };
};

function getStyleObj(val) {
    var styleValues = layoutAttributes.style.values;
    var styleDflt = layoutAttributes.style.dflt;
    var styleObj = {};

    if(Lib.isPlainObject(val)) {
        styleObj.id = val.id;
        styleObj.style = val;
    } else if(typeof val === 'string') {
        styleObj.id = val;
        styleObj.style = (styleValues.indexOf(val) !== -1) ?
             convertStyleVal(val) :
             val;
    } else {
        styleObj.id = styleDflt;
        styleObj.style = convertStyleVal(styleDflt);
    }

    styleObj.transition = {duration: 0, delay: 0};

    return styleObj;
}

// if style is part of the 'official' mapbox values, add URL prefix and suffix
function convertStyleVal(val) {
    return constants.styleUrlPrefix + val + '-' + constants.styleUrlSuffix;
}

function convertCenter(center) {
    return [center.lon, center.lat];
}
