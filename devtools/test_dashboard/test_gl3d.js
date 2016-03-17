/*eslint dot-notation: 0*/

var plotButtons = require('./buttons');

var figDir = '../../test/image/baselines/gl3d_';

var plots = {};

plots['bunny-hull'] = require('@mocks/gl3d_bunny-hull.json');
plots['ibm-plot'] = require('@mocks/gl3d_ibm-plot.json');
plots['marker-color'] = require('@mocks/gl3d_marker-color.json');
plots['log-axis-big'] = require('@mocks/gl3d_log-axis-big.json');
plots['delaunay'] = require('@mocks/gl3d_delaunay.json');
plots['log-axis'] = require('@mocks/gl3d_log-axis.json');
plots['multi-scene'] = require('@mocks/gl3d_multi-scene.json');
plots['surface-lighting'] = require('@mocks/gl3d_surface-lighting.json');
plots['z-range'] = require('@mocks/gl3d_z-range.json');
plots['mirror-ticks'] = require('@mocks/gl3d_mirror-ticks.json');
plots['autorange-zero'] = require('@mocks/gl3d_autorange-zero.json');
plots['contour-lines'] = require('@mocks/gl3d_contour-lines.json');
plots['xy-defined-ticks'] = require('@mocks/gl3d_xy-defined-ticks.json');
plots['opacity-surface'] = require('@mocks/gl3d_opacity-surface.json');
plots['projection-traces'] = require('@mocks/gl3d_projection-traces.json');
plots['opacity-scaling-spikes'] = require('@mocks/gl3d_opacity-scaling-spikes.json');
plots['text-weirdness'] = require('@mocks/gl3d_text-weirdness.json');
plots['wire-surface'] = require('@mocks/gl3d_wire-surface.json');
plots['triangle'] = require('@mocks/gl3d_triangle.json');
plots['snowden'] = require('@mocks/gl3d_snowden.json');
plots['bunny'] = require('@mocks/gl3d_bunny.json');
plots['ribbons'] = require('@mocks/gl3d_ribbons.json');
plots['scatter-date'] = require('@mocks/gl3d_scatter-date.json');
plots['cufflinks'] = require('@mocks/gl3d_cufflinks.json');
plots['chrisp-nan-1'] = require('@mocks/gl3d_chrisp-nan-1.json');
plots['marker-arrays'] = require('@mocks/gl3d_marker-arrays.json');
plots['scatter3d-colorscale'] = require('@mocks/gl3d_scatter3d-colorscale.json');
plots['autocolorscale'] = require('@mocks/gl3d_autocolorscale.json');
plots['nan-holes'] = require('@mocks/gl3d_nan-holes.json');
plots['tet'] = require('@mocks/gl3d_tet.json');
plots['surface_intensity'] = require('@mocks/gl3d_surface_intensity.json');

plotButtons(plots, figDir);
