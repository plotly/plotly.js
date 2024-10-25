var Plotly = require('../../../lib/core');
var Bar = require('../../../lib/bar');
var Scatter3d = require('../../../lib/scatter3d');
var Calendars = require('../../../lib/calendars');

var checkComponent = require('../assets/check_component');

describe('Bundle with a component loaded before traces', function() {
    'use strict';

    Plotly.register([Calendars, Scatter3d, Bar]);

    checkComponent(Plotly);
});
