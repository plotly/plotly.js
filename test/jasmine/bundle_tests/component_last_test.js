var Plotly = require('@lib/core');
var Scatter = require('@lib/scatter');
var Bar = require('@lib/bar');
var Scatter3d = require('@lib/scatter3d');
var Filter = require('@lib/filter');
var Calendars = require('@lib/calendars');

var checkComponent = require('../assets/check_component');

describe('Bundle with a component loaded after traces and transforms', function() {
    'use strict';

    Plotly.register([Scatter, Bar, Scatter3d, Filter, Calendars]);

    checkComponent(Plotly);
});
