'use strict';

var plotButtons = require('./test-buttons');

var plots = {};

plots['marker-color'] = require('./testplots/marker-color.json');
plots['log-axis-big'] = require('./testplots/log-axis-big.json');
plots['delaunay'] = require('./testplots/delaunay.json');
plots['log-axis'] = require('./testplots/log-axis.json');
plots['multi-scene'] = require('./testplots/multi-scene.json');
plots['surface-lighting'] = require('./testplots/surface-lighting.json');
plots['z-range'] = require('./testplots/z-range.json');
plots['mirror-ticks'] = require('./testplots/mirror-ticks.json');
plots['autorange-zero'] = require('./testplots/autorange-zero.json');
plots['contour-lines'] = require('./testplots/contour-lines.json');
plots['xy-defined-ticks'] = require('./testplots/xy-defined-ticks.json');
plots['opacity-surface'] = require('./testplots/opacity-surface.json');
plots['projection-traces'] = require('./testplots/projection-traces.json');
plots['opacity-scaling-spikes'] = require('./testplots/opacity-scaling-spikes.json');
plots['text-weirdness'] = require('./testplots/text-weirdness.json');
plots['wire-surface'] = require('./testplots/wire-surface.json');
plots['triangle-mesh3d'] = require('./testplots/triangle.json');
plots['snowden'] = require('./testplots/snowden.json');
plots['bunny'] = require('./testplots/bunny.json');
plots['ribbons'] = require('./testplots/ribbons.json');
plots['date-time'] = require('./testplots/scatter-date.json');
plots['cufflinks'] = require('./testplots/cufflinks.json');
plots['chrisp-nan-1'] = require('./testplots/chrisp-nan-1.json');

plotButtons(plots);
