/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var mapboxgl = require('mapbox-gl');

var Fx = require('../cartesian/graph_interact');
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
    this.styleUrl = null;
    this.traceHash = {};
    this.layerList = [];
}

var proto = Mapbox.prototype;

module.exports = function createMapbox(opts) {
    var mapbox = new Mapbox(opts);

    return mapbox;
};

proto.plot = function(calcData, fullLayout, promises) {
    var self = this;

    // feed in new mapbox options
    self.opts = fullLayout[this.id];

    var promise;

    if(!self.map) {
        promise = new Promise(function(resolve, reject) {
            self.createMap(calcData, fullLayout, resolve, reject);
        });
    }
    else {
        promise = new Promise(function(resolve, reject) {
            self.updateMap(calcData, fullLayout, resolve, reject);
        });
    }

    promises.push(promise);
};

proto.createMap = function(calcData, fullLayout, resolve, reject) {
    var self = this,
        gd = self.gd,
        opts = self.opts;

    // mapbox doesn't have a way to get the current style URL; do it ourselves
    var styleUrl = self.styleUrl = convertStyleUrl(opts.style);

    var map = self.map = new mapboxgl.Map({
        container: self.div,

        style: styleUrl,
        center: convertCenter(opts.center),
        zoom: opts.zoom,
        bearing: opts.bearing,
        pitch: opts.pitch,

        interactive: !self.isStatic,
        preserveDrawingBuffer: self.isStatic
    });

    // clear navigation container
    var controlContainer = this.div.getElementsByClassName(constants.controlContainerClassName)[0];
    this.div.removeChild(controlContainer);

    self.rejectOnError(reject);

    map.once('load', function() {
        self.updateData(calcData);
        self.updateLayout(fullLayout);

        self.resolveOnRender(resolve);
    });

    // keep track of pan / zoom in user layout
    map.on('move', function() {
        var center = map.getCenter();
        opts._input.center = opts.center = { lon: center.lng, lat: center.lat };
        opts._input.zoom = opts.zoom = map.getZoom();
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
    });

    map.on('click', function() {
        Fx.click(gd, { target: true });
    });

    function unhover() {
        Fx.loneUnhover(fullLayout._toppaper);
    }

    map.on('dragstart', unhover);
    map.on('zoomstart', unhover);

};

proto.updateMap = function(calcData, fullLayout, resolve, reject) {
    var self = this,
        map = self.map;

    self.rejectOnError(reject);

    var styleUrl = convertStyleUrl(self.opts.style);

    if(self.styleUrl !== styleUrl) {
        self.styleUrl = styleUrl;
        map.setStyle(styleUrl);

        map.style.once('load', function() {

            // need to rebuild trace layers on reload
            // to avoid 'lost event' errors
            self.traceHash = {};

            self.updateData(calcData);
            self.updateLayout(fullLayout);

            self.resolveOnRender(resolve);
        });
    }
    else {
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

        if(traceObj) traceObj.update(calcTrace);
        else {
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
    this.map.resize();
};

proto.resolveOnRender = function(resolve) {
    var map = this.map;

    map.on('render', function onRender() {
        if(map.loaded()) {
            map.off('render', onRender);
            resolve();
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

proto.updateFramework = function(fullLayout) {
    var domain = fullLayout[this.id].domain,
        size = fullLayout._size;

    var style = this.div.style;

    // TODO Is this correct? It seems to get the map zoom level wrong?

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
    var opts = this.opts,
        layers = opts.layers,
        layerList = this.layerList,
        i;

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
    }
    else {
        for(i = 0; i < layers.length; i++) {
            layerList[i].update(layers[i]);
        }
    }
};

proto.destroy = function() {
    this.map.remove();
    this.container.removeChild(this.div);
};

proto.toImage = function() {
    return this.map.getCanvas().toDataURL();
};

// convenience wrapper to create blank GeoJSON sources
// and avoid 'invalid GeoJSON' errors
proto.createGeoJSONSource = function() {
    var blank = {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: []
        }
    };

    return new mapboxgl.GeoJSONSource({data: blank});
};

// convenience wrapper to create set multiple layer
// 'layout' or 'paint options at once.
proto.setOptions = function(id, methodName, opts) {
    var map = this.map,
        keys = Object.keys(opts);

    for(var i = 0; i < keys.length; i++) {
        var key = keys[i];

        map[methodName](id, key, opts[key]);
    }
};

// convenience method to project a [lon, lat] array to pixel coords
proto.project = function(v) {
    return this.map.project(new mapboxgl.LngLat(v[0], v[1]));
};

function convertStyleUrl(style) {
    var styleValues = layoutAttributes.style.values;

    // if style is part of the 'official' mapbox values,
    // add URL prefix and suffix
    if(styleValues.indexOf(style) !== -1) {
        return constants.styleUrlPrefix + style + '-' + constants.styleUrlSuffix;
    }

    return style;
}

function convertCenter(center) {
    return [center.lon, center.lat];
}
