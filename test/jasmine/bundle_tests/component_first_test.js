var Plotly = require('@src/core');
var Bar = require('@src/traces/bar');
var Scatter3d = require('@src/traces/scatter3d');
var Filter = require('@src/transforms/filter');
var Calendars = require('@src/components/calendars');

var checkComponent = require('../assets/check_component');

describe('Bundle with a component loaded before traces and transforms', function() {
    'use strict';

    Plotly.register([Calendars, Filter, Scatter3d, Bar]);

    checkComponent(Plotly);
});
