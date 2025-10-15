var Plotly = require('../../../lib/core');
var Bar = require('../../../lib/bar');
var Scatter3d = require('../../../lib/scatter3d');
var Calendars = require('../../../lib/calendars');

var checkComponent = require('../assets/check_component');

describe('Bundle with a component loaded after traces', function() {
    'use strict';

    Plotly.register([Bar, Scatter3d, Calendars]);

    checkComponent(Plotly);
});
