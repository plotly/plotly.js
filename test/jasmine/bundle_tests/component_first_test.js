var Plotly = require('@lib/core');
var Bar = require('@lib/bar');
var Scatter3d = require('@lib/scatter3d');
var Filter = require('@lib/filter');
var Calendars = require('@lib/calendars');

var checkComponent = require('../assets/check_component');

describe('Bundle with a component loaded before traces and transforms', function() {
    'use strict';

    Plotly.register([Calendars, Filter, Scatter3d, Bar]);

    checkComponent(Plotly);
});
