'use strict';

var plotButtons = require('./buttons');

var plots = {};

plots['first'] = require('./testplots-geo/first.json');
plots['second'] = require('./testplots-geo/second.json');
plots['kavrayskiy7'] = require('./testplots-geo/kavrayskiy7.json');
plots['custom-colorscale'] = require('./testplots-geo/custom-colorscale.json');
plots['scattergeo-locations'] = require('./testplots-geo/scattergeo-locations.json');
plots['multi-geos'] = require('./testplots-geo/multi-geos.json');
plots['usa-states'] = require('./testplots-geo/usa-states.json');
plots['legendonly'] = require('./testplots-geo/legendonly.json');
plots['europe-bubbles'] = require('./testplots-geo/europe-bubbles.json');
plots['orthographic'] = require('./testplots-geo/orthographic.json');
plots['big-frame'] = require('./testplots-geo/big-frame.json');

plotButtons(plots, './testplots-geo/');
