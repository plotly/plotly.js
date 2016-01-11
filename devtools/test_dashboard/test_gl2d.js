/*eslint dot-notation: 0*/

var plotButtons = require('./buttons');

var figDir = '../../test/image/baselines/gl2d_';

var plots = {};

plots['10'] = require('@mocks/gl2d_10.json');
plots['14'] = require('@mocks/gl2d_14.json');
plots['12'] = require('@mocks/gl2d_12.json');
plots['17'] = require('@mocks/gl2d_17.json');
plots['22'] = require('@mocks/gl2d_22.json');
plots['24'] = require('@mocks/gl2d_24.json');
plots['28'] = require('@mocks/gl2d_28.json');
plots['30'] = require('@mocks/gl2d_30.json');
plots['32'] = require('@mocks/gl2d_32.json');
plots['axes_booleans'] = require('@mocks/gl2d_axes_booleans.json');
plots['axes_labels'] = require('@mocks/gl2d_axes_labels.json');
plots['axes_lines'] = require('@mocks/gl2d_axes_lines.json');
plots['axes_range_manual'] = require('@mocks/gl2d_axes_range_manual.json');
plots['axes_range_type'] = require('@mocks/gl2d_axes_range_type.json');
plots['axes_range_mode'] = require('@mocks/gl2d_axes_range_mode.json');
plots['basic_error_bar'] = require('@mocks/gl2d_basic_error_bar.json');
plots['bubble_markersize0'] = require('@mocks/gl2d_bubble_markersize0.json');
plots['bubble_nonnumeric-sizes'] = require('@mocks/gl2d_bubble_nonnumeric-sizes.json');
plots['date_axes'] = require('@mocks/gl2d_date_axes.json');
plots['error_bar_asymmetric_array'] = require('@mocks/gl2d_error_bar_asymmetric_array.json');
plots['error_bar_asymmetric_constant'] = require('@mocks/gl2d_error_bar_asymmetric_constant.json');
plots['error_bar_horizontal'] = require('@mocks/gl2d_error_bar_horizontal.json');
plots['error_bar_style'] = require('@mocks/gl2d_error_bar_style.json');
plots['fonts'] = require('@mocks/gl2d_fonts.json');
plots['global_font'] = require('@mocks/gl2d_global_font.json');
plots['legend_inside'] = require('@mocks/gl2d_legend_inside.json');
plots['legend_labels'] = require('@mocks/gl2d_legend_labels.json');
plots['legend_outside'] = require('@mocks/gl2d_legend_outside.json');
plots['legend_style'] = require('@mocks/gl2d_legend_style.json');
plots['line_style'] = require('@mocks/gl2d_line_style.json');
plots['multiple_subplots'] = require('@mocks/gl2d_multiple_subplots.json');
plots['scatter-colorscale-colorbar'] = require('@mocks/gl2d_scatter-colorscale-colorbar.json');
plots['scatter-marker-line-colorscales'] = require('@mocks/gl2d_scatter-marker-line-colorscales.json');
plots['show_legend'] = require('@mocks/gl2d_show_legend.json');
plots['simple_inset'] = require('@mocks/gl2d_simple_inset.json');
plots['size_margins'] = require('@mocks/gl2d_size_margins.json');
plots['stacked_coupled_subplots'] = require('@mocks/gl2d_stacked_coupled_subplots.json');
plots['stacked_subplots'] = require('@mocks/gl2d_stacked_subplots.json');

plotButtons(plots, figDir);
