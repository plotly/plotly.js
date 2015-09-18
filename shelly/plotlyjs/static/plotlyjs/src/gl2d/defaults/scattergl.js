'use strict';

var Plotly = require('../../plotly');

var ScatterGl = module.exports = {};

ScatterGl.attributes = {};

Plotly.Plots.register(ScatterGl, 'scattergl', ['gl2d']);

ScatterGl.attributes = require('../attributes/scattergl');

ScatterGl.supplyDefaults = function (traceIn, traceOut, defaultColor, layout) {
  var Scatter = Plotly.Scatter;

  function coerce(attr, dflt) {
      return Plotly.Lib.coerce(traceIn, traceOut,
                               ScatterGl.attributes, attr, dflt);
  }

  var len = ScatterGl.handleXYZDefaults(traceIn, traceOut, coerce);
  if(!len) {
      traceOut.visible = false;
      return;
  }

  coerce('text');
  coerce('mode');

  if(Scatter.hasLines(traceOut)) {
      Scatter.lineDefaults(traceIn, traceOut, defaultColor, coerce);
  }

  if(Scatter.hasMarkers(traceOut)) {
      Scatter.markerDefaults(traceIn, traceOut, defaultColor, layout, coerce);
  }

  if(Scatter.hasText(traceOut)) {
      Scatter.textDefaults(traceIn, traceOut, layout, coerce);
  }

  var lineColor = (traceOut.line || {}).color ,
      markerColor = (traceOut.marker || {}).color;
  if(coerce('surfaceaxis') >= 0) coerce('surfacecolor', lineColor || markerColor);

  if(Plotly.ErrorBars) {
      Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'y'});
      Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'x', inherit: 'y'});
  }
};


ScatterGl.colorbar = Plotly.Scatter.colorbar;

ScatterGl.calc = function(gd, trace) {
    var cd = [{x: false, y: false, trace: trace, t: {}}];
    Plotly.Scatter.arraysToCalcdata(cd);
    Plotly.Scatter.calcMarkerColorscales(trace);
    return cd;
};
