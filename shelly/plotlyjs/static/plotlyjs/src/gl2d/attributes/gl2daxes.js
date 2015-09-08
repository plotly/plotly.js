var Plotly = require('../../plotly');

var axesAttrs = Plotly.Axes.layoutAttributes;
var extendFlat = Plotly.Lib.extendFlat;

module.exports = {

  title: axesAttrs.title,
  titlefont: axesAttrs.titlefont,
  type: axesAttrs.type,
  autorange: axesAttrs.autorange,
  rangemode: axesAttrs.rangemode,
  range: axesAttrs.range,
  fixedrange: axesAttrs.fixedrange,

  // ticks
  tickmode: axesAttrs.tickmode,
  nticks: axesAttrs.nticks,
  tick0: axesAttrs.tick0,
  dtick: axesAttrs.dtick,
  tickvals: axesAttrs.tickvals,
  ticktext: axesAttrs.ticktext,
  ticks: axesAttrs.ticks,
  mirror: axesAttrs.mirror,
  ticklen: axesAttrs.ticklen,
  tickwidth: axesAttrs.tickwidth,
  tickcolor: axesAttrs.tickcolor,
  showticklabels: axesAttrs.showticklabels,
  tickfont: axesAttrs.tickfont,
  tickangle: axesAttrs.tickangle,
  tickprefix: axesAttrs.tickprefix,
  showtickprefix: axesAttrs.showtickprefix,
  ticksuffix: axesAttrs.ticksuffix,
  showticksuffix: axesAttrs.showticksuffix,
  showexponent: axesAttrs.showexponent,
  exponentformat: axesAttrs.exponentformat,
  tickformat: axesAttrs.tickformat,
  hoverformat: axesAttrs.hoverformat,

  // lines and grids
  showline: axesAttrs.showline,
  linecolor: axesAttrs.linecolor,
  linewidth: axesAttrs.linewidth,
  showgrid: axesAttrs.showgrid,
  gridcolor: extendFlat(axesAttrs.gridcolor,  // shouldn't this be on-par with 2D?
      {dflt: 'rgb(204, 204, 204)'}),
  gridwidth: axesAttrs.gridwidth,
  zeroline: axesAttrs.zeroline,
  zerolinecolor: axesAttrs.zerolinecolor,
  zerolinewidth: axesAttrs.zerolinewidth

};
