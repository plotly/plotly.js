'use strict';

var Plotly = require('../../plotly');

var ScatterGl = module.exports = {};

ScatterGl.attributes = {};

Plotly.Plots.register(ScatterGl, 'scattergl',
    ['gl2d', 'showLegend', 'errorBarsOK', 'markerColorscale'], {
    description: [
        'The data visualized as scatter point or lines is set in `x` and `y`',
        'using the WebGl plotting engine.'
        'Text (appearing either on the chart or on hover only) is via `text`.',
        'Bubble charts are achieved by setting `marker.size` and/or `marker.color`',
        'to a numerical arrays.'
    ].join(' ')
});

ScatterGl.attributes = require('../attributes/scattergl');

ScatterGl.handleXYDefaults = function(traceIn, traceOut, coerce) {
    var len = 0,
        x = coerce('x'),
        y = coerce('y');

    if(x && y) {
        len = Math.min(x.length, y.length);
        if(len < x.length) traceOut.x = x.slice(0, len);
        if(len < y.length) traceOut.y = y.slice(0, len);
    }

    return len;
};



ScatterGl.supplyDefaults = function (traceIn, traceOut, defaultColor, layout) {
  var Scatter = Plotly.Scatter;

  function coerce(attr, dflt) {
      return Plotly.Lib.coerce(traceIn, traceOut,
                               ScatterGl.attributes, attr, dflt);
  }

  var len = ScatterGl.handleXYDefaults(traceIn, traceOut, coerce);
  if(!len) {
      traceOut.visible = false;
      return;
  }

  coerce('text');

  //Taken from scatter.js  WTF?
  coerce('mode', len < 20 ? 'lines+markers' : 'lines');
  
  if(Scatter.hasLines(traceOut)) {
      Scatter.lineDefaults(traceIn, traceOut, defaultColor, coerce);
  }

  if(Scatter.hasMarkers(traceOut)) {
      Scatter.markerDefaults(traceIn, traceOut, defaultColor, layout, coerce);
  }

  if(Scatter.hasText(traceOut)) {
      Scatter.textDefaults(traceIn, traceOut, layout, coerce);
  }

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
