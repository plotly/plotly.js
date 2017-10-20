var Plotly = require('@lib');
var Lib = require('@src/lib');
var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('table plots', function() {
    'use strict';
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function initialize(mock, gd) {
        return Plotly.plot(gd, mock.data, mock.layout);
    }

    function countCells() {
        return d3.selectAll('.cell-rect').size();
    }

    it('should be able switch to table trace from another plot type', function(done) {
        var mock = {
            data: [
                {
                    mode: 'markers',
                    type: 'scatter'
                }
            ],
            layout: {
                hovermode: 'closest'
            }
        };

        initialize(mock, gd)
            .then(function() {
                return Plotly.restyle(gd, {type: 'table'})
                    .then(function() {
                        return Plotly.restyle(
                            gd, {'header.values[0]': ['First Column']}
                        );
                    })
                    .then(function() {
                        return Plotly.restyle(
                            gd, {'header.values[1]': ['Second Column']}
                        );
                    })
                    .then(function() {
                        return Plotly.restyle(gd,
                            {
                                'cells.values': [
                                    ['First Row First Col', 'First Row Second Col'],
                                    ['Second Row First Col', 'Second Row Second Col']
                                ]
                            }
                        );
                    });
            })
            .then(function() {
                expect(gd.data[0].type).toBe('table');
                expect(countCells()).toBe(6);
            })
            .then(done);
    });

    it('should be able to use Plotly.restyle on an existing table', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/table_plain_birds.json'));
        var newColors = ['yellow', 'gray'];

        initialize(mock, gd)
            .then(function() {
                return Plotly.restyle(gd, {'cells.fill': newColors})
                    .then(function() {
                        Plotly.restyle(gd, {'header.font.size': 20});
                    });
            })
            .then(function() {
                expect(gd.data[0].cells[0]).toBe('yellow');
                expect(gd.data[0].cells[1]).toBe('gray');
                expect(gd.data[0].header.font.size).toBe(20);
            })
            .then(done);
    });

    it('should work with Plotly.restyle for a specific trace index', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/table_latex_multitrace.json'));
        var initialFontSizeFirstTrace;
        var initialFontSizeSecondTrace;

        initialize(mock, gd)
            .then(function() {
                initialFontSizeFirstTrace = gd.data[0].header.font.size;
                initialFontSizeSecondTrace = gd.data[1].header.font.size;

                expect(initialFontSizeFirstTrace === initialFontSizeSecondTrace).toBe(true);

                return Plotly.restyle(gd, {'header.font.size': initialFontSizeFirstTrace + 1}, 0)
                    .then(function() {
                        Plotly.restyle(gd, {'header.font.size': initialFontSizeSecondTrace + 2}, 1);
                    });
            })
            .then(function() {
                expect(gd.data[0].header.font.size).toBe(initialFontSizeFirstTrace + 1);
                expect(gd.data[1].header.font.size).toBe(initialFontSizeFirstTrace + 2);
                expect(initialFontSizeFirstTrace !== initialFontSizeSecondTrace).toBe(true);
            })
            .then(done);
    });

    it('should work with Plotly.relayout', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/table_latex_multitrace.json'));
        var newTitle = 'New Title';

        initialize(mock, gd)
            .then(function() {
                return Plotly.relayout(gd, {'title': newTitle});
            })
            .then(function() {
                expect(gd.layout.title).toBe(newTitle);
            })
            .then(done);
    });

    it('should work with Plotly.update', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/table_plain_birds.json'));
        var newTitle = 'New Title';
        var initialFontSize;

        initialize(mock, gd)
            .then(function() {
                initialFontSize = gd.data[0].header.font.size;
                return Plotly.update(gd,
                    {'header.font.size': initialFontSize + 1},
                    {'title': newTitle}
                );
            })
            .then(function() {
                expect(gd.layout.title).toBe(newTitle);
                expect(gd.data[0].header.font.size).toBe(initialFontSize + 1);
            })
            .then(done);
    });
});
