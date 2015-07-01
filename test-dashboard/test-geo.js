'use strict';

var plotButtons = require('./buttons');

var mockDir = '../image_server/test/mocks/geo_',
    figDir = '../image_server/test/test-images-baseline/geo_';

var plots = {};

plots['first'] = require('../image_server/test/mocks/geo_first.json');
plots['second'] = require('../image_server/test/mocks/geo_second.json');
plots['kavrayskiy7'] = require('../image_server/test/mocks/geo_kavrayskiy7.json');
plots['custom-colorscale'] = require('../image_server/test/mocks/geo_custom-colorscale.json');
plots['scattergeo-locations'] = require('../image_server/test/mocks/geo_scattergeo-locations.json');
plots['multi-geos'] = require('../image_server/test/mocks/geo_multi-geos.json');
plots['usa-states'] = require('../image_server/test/mocks/geo_usa-states.json');
plots['legendonly'] = require('../image_server/test/mocks/geo_legendonly.json');
plots['europe-bubbles'] = require('../image_server/test/mocks/geo_europe-bubbles.json');
plots['orthographic'] = require('../image_server/test/mocks/geo_orthographic.json');
plots['big-frame'] = require('../image_server/test/mocks/geo_big-frame.json');
plots['bg-color'] = require('../image_server/test/mocks/geo_bg-color.json');
plots['canadian-cites'] = require('../image_server/test/mocks/geo_canadian-cites.json');
plots['conic-conformal'] = require('../image_server/test/mocks/geo_conic-conformal.json');
plots['stereographic'] = require('../image_server/test/mocks/geo_stereographic.json');
plots['choropleth-text'] = require('../image_server/test/mocks/geo_choropleth-text.json');
plots['choropleth-usa'] = require('../image_server/test/mocks/geo_choropleth-usa.json');

plotButtons(plots, figDir);
