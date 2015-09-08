var Plotly = require('../../plotly');

var axesAttrs = Plotly.Axes.layoutAttributes;
var extendFlat = Plotly.Lib.extendFlat;

module.exports = {
  title: {
      type: 'string',
      description: 'Sets the title of the plot.',
      dflt: ''
  },
  titlefont: axesAttrs.titlefont,
  _nestedModules: {
      'xaxis': 'Gl2dAxes',
      'yaxis': 'Gl2dAxes'
  }
};
