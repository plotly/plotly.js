var Plotly = require('../../plotly');

var axesAttrs = Plotly.Axes.layoutAttributes;

module.exports = {
  title: {
      valType: 'string',
      role: 'info',
      description: 'Sets the title of the plot.',
      dflt: ''
  },
  titlefont: axesAttrs.titlefont,
  _nestedModules: {
      'xaxis': 'Gl2dAxes',
      'yaxis': 'Gl2dAxes'
  }
};
