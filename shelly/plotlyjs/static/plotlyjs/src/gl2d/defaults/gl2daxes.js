'use strict';

var Plotly = require('../../plotly');

var Gl2dAxes = module.exports = {};

Gl2dAxes.axesNames = [ 'xaxis', 'yaxis' ];

Gl2dAxes.layoutAttributes = require('../attributes/gl2daxes');

function noop() {}

Gl2dAxes.supplyLayoutDefaults = function(layoutIn, layoutOut, options) {
  var Axes = Plotly.Axes;
  console.log('Supply axis defaults');
  Gl2dAxes.axesNames.forEach(function(axName) {
    var containerIn  = layoutIn[axName] || {};
    var containerOut =  {
      _id:   axName[0] + options.scene2d,
      _name: axName
    };

    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(containerIn, containerOut,
                                 Gl2dAxes.layoutAttributes, attr, dflt);
    }

    layoutOut[axName] = containerOut = Axes.handleAxisDefaults(
      containerIn,
      containerOut,
      coerce,
      {
        font:   options.font,
        letter:   axName[0],
        data:     options.data,
        showGrid: true
      }
    );

    coerce('gridcolor');
    coerce('title', '');

    containerOut.setScale = noop;
  });
};

Gl2dAxes.setConvert = function (containerOut) {
    Plotly.Axes.setConvert(containerOut);
    containerOut.setScale = noop;
};

Gl2dAxes.initAxes = function (td) {
    var fullLayout = td._fullLayout;

    // until they play better together
    delete fullLayout.xaxis;
    delete fullLayout.yaxis;

    var sceneIds = Plotly.Plots.getSubplotIds(fullLayout, 'gl2d');

    for (var i = 0; i < sceneIds.length; ++i) {
        var sceneId = sceneIds[i];
        var sceneLayout = fullLayout[sceneId];
        for (var j = 0; j < 2; ++j) {
            var axisName = Gl2dAxes.axesNames[j];
            var ax = sceneLayout[axisName];
            ax._td = td;
        }
    }
};
