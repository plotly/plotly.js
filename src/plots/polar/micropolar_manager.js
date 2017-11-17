/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

/* eslint-disable new-cap */
'use strict';

var d3 = require('d3');
var Lib = require('../../lib');
var Color = require('../../components/color');
var utility = require('./utility');
var adapter = require('./adapter');
var micropolar = require('./micropolar');
var UndoManager = require('./undo_manager');
var extendDeepAll = Lib.extendDeepAll;
var manager = module.exports = {};
var scale = 1;
manager.framework = function(_gd) {
    var config, previousConfigClone, plot, convertedInput, container;
    var undoManager = new UndoManager();
    var savedContainer;

    function exports(_inputConfig, _container, scaler) {
        if(_container !== undefined) {
            savedContainer = _container;
        } else {
            _container = savedContainer;
        }

        if(_container) container = _container;
        d3.select(d3.select(container).node().parentNode).selectAll('.svg-container>*:not(.chart-root)').remove();

        config = (!config) ?
            _inputConfig :
            extendDeepAll(config, _inputConfig);
        if(!plot) plot = micropolar.Axis();
        convertedInput = adapter.plotly().convert(config);
        scale = scale * scaler;
        plot.config(convertedInput).render(container, scale);
        _gd.data = config.data;
        _gd.layout = config.layout;
        manager.fillLayout(_gd);
        return config;
    }
    exports.isPolar = true;
    exports.svg = function() { return plot.svg(); };
    exports.getConfig = function() { return config; };
    exports.getLiveConfig = function() {
        return adapter.plotly().convert(plot.getLiveConfig(), true);
    };
    exports.getLiveScales = function() { return {t: plot.angularScale(), r: plot.radialScale()}; };
    exports.setUndoPoint = function() {
        var that = this;
        var configClone = utility.cloneJson(config);
        (function(_configClone, _previousConfigClone) {
            undoManager.add({
                undo: function() {
                    if(_previousConfigClone) that(_previousConfigClone);
                },
                redo: function() {
                    that(_configClone);
                }
            });
        })(configClone, previousConfigClone);
        previousConfigClone = utility.cloneJson(configClone);
    };
    exports.undo = function() { undoManager.undo(); };
    exports.redo = function() { undoManager.redo(); };
    return exports;
};

manager.fillLayout = function(_gd) {
    var container = d3.select(_gd).selectAll('.plot-container'),
        paperDiv = container.selectAll('.svg-container'),
        paper = _gd.framework && _gd.framework.svg && _gd.framework.svg(),
        dflts = {
            width: 800,
            height: 600,
            paper_bgcolor: Color.background,
            _container: container,
            _paperdiv: paperDiv,
            _paper: paper
        };

    _gd._fullLayout = extendDeepAll(dflts, _gd.layout);
};
