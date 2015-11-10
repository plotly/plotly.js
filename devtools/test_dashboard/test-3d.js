'use strict';

var plotButtons = require('./buttons');

var plots = {};

plots['bunny-hull'] = require('./testplots-3d/bunny-hull.json');
plots['ibm-plot'] = require('./testplots-3d/ibm-plot.json');
plots['marker-color'] = require('./testplots-3d/marker-color.json');
plots['log-axis-big'] = require('./testplots-3d/log-axis-big.json');
plots['delaunay'] = require('./testplots-3d/delaunay.json');
plots['log-axis'] = require('./testplots-3d/log-axis.json');
plots['multi-scene'] = require('./testplots-3d/multi-scene.json');
plots['surface-lighting'] = require('./testplots-3d/surface-lighting.json');
plots['z-range'] = require('./testplots-3d/z-range.json');
plots['mirror-ticks'] = require('./testplots-3d/mirror-ticks.json');
plots['autorange-zero'] = require('./testplots-3d/autorange-zero.json');
plots['contour-lines'] = require('./testplots-3d/contour-lines.json');
plots['xy-defined-ticks'] = require('./testplots-3d/xy-defined-ticks.json');
plots['opacity-surface'] = require('./testplots-3d/opacity-surface.json');
plots['projection-traces'] = require('./testplots-3d/projection-traces.json');
plots['opacity-scaling-spikes'] = require('./testplots-3d/opacity-scaling-spikes.json');
plots['text-weirdness'] = require('./testplots-3d/text-weirdness.json');
plots['wire-surface'] = require('./testplots-3d/wire-surface.json');
plots['triangle-mesh3d'] = require('./testplots-3d/triangle.json');
plots['snowden'] = require('./testplots-3d/snowden.json');
plots['bunny'] = require('./testplots-3d/bunny.json');
plots['ribbons'] = require('./testplots-3d/ribbons.json');
plots['date-time'] = require('./testplots-3d/scatter-date.json');
plots['cufflinks'] = require('./testplots-3d/cufflinks.json');
plots['chrisp-nan-1'] = require('./testplots-3d/chrisp-nan-1.json');
plots['marker-arrays'] = require('./testplots-3d/marker-arrays.json');
plots['scatter3d-colorscale'] = require('./testplots-3d/scatter3d-colorscale.json');
plots['autocolorscale'] = require('./testplots-3d/autocolorscale.json');
plots['nan-holes'] = require('./testplots-3d/nan-holes.json');

plotButtons(plots, './testplots-3d/');
