/*eslint dot-notation: 0*/

var plotButtons = require('./buttons');

var figDir = '../../test/image/baselines/';

var plots = {};

plots['10'] = require('@mocks/10.json');
plots['14'] = require('@mocks/14.json');
plots['12'] = require('@mocks/12.json');
plots['17'] = require('@mocks/17.json');
plots['22'] = require('@mocks/22.json');
plots['24'] = require('@mocks/24.json');
plots['28'] = require('@mocks/28.json');
plots['30'] = require('@mocks/30.json');
plots['32'] = require('@mocks/32.json');
plots['axes_booleans'] = require('@mocks/axes_booleans.json');
plots['axes_labels'] = require('@mocks/axes_labels.json');
plots['axes_lines'] = require('@mocks/axes_lines.json');
plots['axes_range_manual'] = require('@mocks/axes_range_manual.json');
plots['axes_range_type'] = require('@mocks/axes_range_type.json');
plots['axes_range_mode'] = require('@mocks/axes_range_mode.json');
plots['basic_error_bar'] = require('@mocks/basic_error_bar.json');
plots['bubble_markersize0'] = require('@mocks/bubble_markersize0.json');
plots['bubble_nonnumeric-sizes'] = require('@mocks/bubble_nonnumeric-sizes.json');
plots['date_axes'] = require('@mocks/date_axes.json');
plots['error_bar_asymmetric_array'] = require('@mocks/error_bar_asymmetric_array.json');
plots['error_bar_asymmetric_constant'] = require('@mocks/error_bar_asymmetric_constant.json');
plots['error_bar_horizontal'] = require('@mocks/error_bar_horizontal.json');
plots['error_bar_style'] = require('@mocks/error_bar_style.json');
plots['fonts'] = require('@mocks/fonts.json');
plots['global_font'] = require('@mocks/global_font.json');
plots['legend_inside'] = require('@mocks/legend_inside.json');
plots['legend_labels'] = require('@mocks/legend_labels.json');
plots['legend_outside'] = require('@mocks/legend_outside.json');
plots['legend_style'] = require('@mocks/legend_style.json');
plots['line_style'] = require('@mocks/line_style.json');
plots['multiple_subplots'] = require('@mocks/multiple_subplots.json');
plots['scatter-colorscale-colorbar'] = require('@mocks/scatter-colorscale-colorbar.json');
plots['scatter-marker-line-colorscales'] = require('@mocks/scatter-marker-line-colorscales.json');
plots['show_legend'] = require('@mocks/show_legend.json');
plots['simple_inset'] = require('@mocks/simple_inset.json');
plots['size_margins'] = require('@mocks/size_margins.json');
plots['stacked_coupled_subplots'] = require('@mocks/stacked_coupled_subplots.json');
plots['stacked_subplots'] = require('@mocks/stacked_subplots.json');

plotButtons(plots, figDir);
