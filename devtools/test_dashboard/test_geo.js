/*eslint dot-notation: 0*/

var plotButtons = require('./buttons');

var figDir = '../../test/image/baselines/geo_';

var plots = {};

plots['first'] = require('@mocks/geo_first.json');
plots['second'] = require('@mocks/geo_second.json');
plots['kavrayskiy7'] = require('@mocks/geo_kavrayskiy7.json');
plots['custom-colorscale'] = require('@mocks/geo_custom-colorscale.json');
plots['scattergeo-locations'] = require('@mocks/geo_scattergeo-locations.json');
plots['multi-geos'] = require('@mocks/geo_multi-geos.json');
plots['usa-states'] = require('@mocks/geo_usa-states.json');
plots['legendonly'] = require('@mocks/geo_legendonly.json');
plots['europe-bubbles'] = require('@mocks/geo_europe-bubbles.json');
plots['orthographic'] = require('@mocks/geo_orthographic.json');
plots['big-frame'] = require('@mocks/geo_big-frame.json');
plots['bg-color'] = require('@mocks/geo_bg-color.json');
plots['canadian-cites'] = require('@mocks/geo_canadian-cites.json');
plots['conic-conformal'] = require('@mocks/geo_conic-conformal.json');
plots['stereographic'] = require('@mocks/geo_stereographic.json');
plots['choropleth-text'] = require('@mocks/geo_choropleth-text.json');
plots['choropleth-usa'] = require('@mocks/geo_choropleth-usa.json');
plots['country-names'] = require('@mocks/geo_country-names.json');

plotButtons(plots, figDir);
