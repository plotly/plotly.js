var Choropleth = require('@src/traces/choropleth');

var Plotly = require('@lib');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');
var loggers = require('@src/lib/loggers');

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');


var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelStyle = customAssertions.assertHoverLabelStyle;
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;

describe('Test choropleth', function() {
    'use strict';

    describe('supplyDefaults', function() {
        var traceIn;
        var traceOut;

        var defaultColor = '#444';
        var layout = {
            font: Plots.layoutAttributes.font,
            _dfltTitle: {colorbar: 'cb'}
        };

        beforeEach(function() {
            traceOut = {};
        });

        it('should set _length based on locations and z but not slice', function() {
            traceIn = {
                locations: ['CAN', 'USA'],
                z: [1, 2, 3]
            };

            Choropleth.supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.z).toEqual([1, 2, 3]);
            expect(traceOut.locations).toEqual(['CAN', 'USA']);
            expect(traceOut._length).toBe(2);

            traceIn = {
                locations: ['CAN', 'USA', 'ALB'],
                z: [1, 2]
            };

            Choropleth.supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.z).toEqual([1, 2]);
            expect(traceOut.locations).toEqual(['CAN', 'USA', 'ALB']);
            expect(traceOut._length).toBe(2);
        });

        it('should make trace invisible if locations is not defined', function() {
            traceIn = {
                z: [1, 2, 3]
            };

            Choropleth.supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);
        });

        it('should make trace invisible if z is not an array', function() {
            traceIn = {
                locations: ['CAN', 'USA'],
                z: 'no gonna work'
            };

            Choropleth.supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);
        });

        it('should not coerce *marker.line.color* when *marker.line.width* is *0*', function() {
            traceIn = {
                locations: ['CAN', 'USA'],
                z: [1, 2],
                marker: {
                    line: {
                        color: 'red',
                        width: 0
                    }
                }
            };

            Choropleth.supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.marker.line.width).toBe(0, 'mlw');
            expect(traceOut.marker.line.color).toBe(undefined, 'mlc');
        });

        it('should default locationmode to *geojson-id* when a valid *geojson* is provided', function() {
            traceIn = {
                locations: ['CAN', 'USA'],
                z: [1, 2],
                geojson: 'url'
            };
            traceOut = {};
            Choropleth.supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.locationmode).toBe('geojson-id', 'valid url string');

            traceIn = {
                locations: ['CAN', 'USA'],
                z: [1, 2],
                geojson: {}
            };
            traceOut = {};
            Choropleth.supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.locationmode).toBe('geojson-id', 'valid object');

            traceIn = {
                locations: ['CAN', 'USA'],
                z: [1, 2],
                geojson: ''
            };
            traceOut = {};
            Choropleth.supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.locationmode).toBe('ISO-3', 'invalid sting');

            traceIn = {
                locations: ['CAN', 'USA'],
                z: [1, 2],
                geojson: []
            };
            traceOut = {};
            Choropleth.supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.locationmode).toBe('ISO-3', 'invalid object');
        });

        it('should only coerce *featureidkey* when locationmode is *geojson-id', function() {
            traceIn = {
                locations: ['CAN', 'USA'],
                z: [1, 2],
                geojson: 'url',
                featureidkey: 'properties.name'
            };
            traceOut = {};
            Choropleth.supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.featureidkey).toBe('properties.name', 'coerced');

            traceIn = {
                locations: ['CAN', 'USA'],
                z: [1, 2],
                featureidkey: 'properties.name'
            };
            traceOut = {};
            Choropleth.supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.featureidkey).toBe(undefined, 'NOT coerced');
        });
    });
});

describe('Test choropleth hover:', function() {
    var gd;

    afterEach(destroyGraphDiv);

    function transformPlot(gd, transformString) {
        gd.style.webkitTransform = transformString;
        gd.style.MozTransform = transformString;
        gd.style.msTransform = transformString;
        gd.style.OTransform = transformString;
        gd.style.transform = transformString;
    }

    function run(hasCssTransform, pos, fig, content, style) {
        gd = createGraphDiv();
        var scale = 1;

        style = style || {
            bgcolor: 'rgb(68, 68, 68)',
            bordercolor: 'rgb(255, 255, 255)',
            fontColor: 'rgb(255, 255, 255)',
            fontSize: 13,
            fontFamily: 'Arial'
        };

        return Plotly.newPlot(gd, fig)
        .then(function() {
            if(hasCssTransform) {
                scale = 0.5;
                transformPlot(gd, 'translate(-25%, -25%) scale(0.5)');
            }

            mouseEvent('mousemove', scale * pos[0], scale * pos[1]);
            assertHoverLabelContent({
                nums: content[0],
                name: content[1]
            });
            assertHoverLabelStyle(
                d3Select('g.hovertext'),
                style
            );
        });
    }

    [false, true].forEach(function(hasCssTransform) {
        it('should generate hover label info (base), hasCssTransform: ' + hasCssTransform, function(done) {
            var fig = Lib.extendDeep({}, require('@mocks/geo_first.json'));

            run(
                hasCssTransform,
                [400, 160],
                fig,
                ['RUS\n10', 'trace 1']
            )
            .then(done, done.fail);
        });
    });

    [false, true].forEach(function(hasCssTransform) {
        it('should use the hovertemplate, hasCssTransform: ' + hasCssTransform, function(done) {
            var fig = Lib.extendDeep({}, require('@mocks/geo_first.json'));
            fig.data[1].hovertemplate = 'tpl %{z}<extra>x</extra>';

            run(
                hasCssTransform,
                [400, 160],
                fig,
                ['tpl 10', 'x']
            )
            .then(done, done.fail);
        });
    });

    [false, true].forEach(function(hasCssTransform) {
        it('should generate hover label info (\'text\' single value case), hasCssTransform: ' + hasCssTransform, function(done) {
            var fig = Lib.extendDeep({}, require('@mocks/geo_first.json'));
            fig.data[1].text = 'tExT';
            fig.data[1].hoverinfo = 'text';

            run(
                hasCssTransform,
                [400, 160],
                fig,
                ['tExT', null]
            )
            .then(done, done.fail);
        });
    });

    [false, true].forEach(function(hasCssTransform) {
        it('should generate hover label info (\'text\' array case), hasCssTransform: ' + hasCssTransform, function(done) {
            var fig = Lib.extendDeep({}, require('@mocks/geo_first.json'));
            fig.data[1].text = ['tExT', 'TeXt', '-text-'];
            fig.data[1].hoverinfo = 'text';

            run(
                hasCssTransform,
                [400, 160],
                fig,
                ['-text-', null]
            )
            .then(done, done.fail);
        });
    });

    [false, true].forEach(function(hasCssTransform) {
        it('should generate hover labels from `hovertext`, hasCssTransform: ' + hasCssTransform, function(done) {
            var fig = Lib.extendDeep({}, require('@mocks/geo_first.json'));
            fig.data[1].hovertext = ['tExT', 'TeXt', '-text-'];
            fig.data[1].text = ['N', 'O', 'P'];
            fig.data[1].hoverinfo = 'text';

            run(
                hasCssTransform,
                [400, 160],
                fig,
                ['-text-', null]
            )
            .then(done, done.fail);
        });
    });

    [false, true].forEach(function(hasCssTransform) {
        it('should generate hover label with custom styling, hasCssTransform: ' + hasCssTransform, function(done) {
            var fig = Lib.extendDeep({}, require('@mocks/geo_first.json'));
            fig.data[1].hoverlabel = {
                bgcolor: 'red',
                bordercolor: ['blue', 'black', 'green'],
                font: {family: 'Roboto'}
            };

            run(
                hasCssTransform,
                [400, 160],
                fig,
                ['RUS\n10', 'trace 1'],
                {
                    bgcolor: 'rgb(255, 0, 0)',
                    bordercolor: 'rgb(0, 128, 0)',
                    fontColor: 'rgb(0, 128, 0)',
                    fontSize: 13,
                    fontFamily: 'Roboto'
                }
            )
            .then(done, done.fail);
        });
    });

    [false, true].forEach(function(hasCssTransform) {
        it('should generate hover label with arrayOk \'hoverinfo\' settings, hasCssTransform: ' + hasCssTransform, function(done) {
            var fig = Lib.extendDeep({}, require('@mocks/geo_first.json'));
            fig.data[1].hoverinfo = ['location', 'z', 'location+name'];

            run(
                hasCssTransform,
                [400, 160],
                fig,
                ['RUS', 'trace 1']
            )
            .then(done, done.fail);
        });
    });

    describe('should preserve z formatting hovetemplate equivalence', function() {
        var base = function() {
            return {
                data: [{
                    type: 'choropleth',
                    locations: ['RUS'],
                    z: [10.02132132143214321]
                }]
            };
        };

        var pos = [400, 160];
        var exp = ['10.02132', 'RUS'];

        [false, true].forEach(function(hasCssTransform) {
            it('- base case (truncate z decimals), hasCssTransform: ' + hasCssTransform, function(done) {
                run(hasCssTransform, pos, base(), exp)
                .then(done, done.fail);
            });
        });

        [false, true].forEach(function(hasCssTransform) {
            it('- hovertemplate case (same z truncation), hasCssTransform: ' + hasCssTransform, function(done) {
                var fig = base();
                fig.hovertemplate = '%{z}<extra>%{location}</extra>';
                run(hasCssTransform, pos, fig, exp)
                .then(done, done.fail);
            });
        });
    });

    [false, true].forEach(function(hasCssTransform) {
        it('should include *properties* from input custom geojson, hasCssTransform: ' + hasCssTransform, function(done) {
            var fig = Lib.extendDeep({}, require('@mocks/geo_custom-geojson.json'));
            fig.data = [fig.data[1]];
            fig.data[0].hovertemplate = '%{properties.name}<extra>%{ct[0]:.1f} | %{ct[1]:.1f}</extra>';
            fig.layout.geo.projection = {scale: 20};

            run(hasCssTransform, [300, 200], fig, ['New York', '-75.1 | 42.6'])
            .then(done, done.fail);
        });
    });
});

describe('choropleth drawing', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('should not throw an error with bad locations', function(done) {
        spyOn(loggers, 'log');
        Plotly.newPlot(gd, [{
            locations: ['canada', 0, null, '', 'utopia'],
            z: [1, 2, 3, 4, 5],
            locationmode: 'country names',
            type: 'choropleth'
        }])
        .then(function() {
            // only utopia logs - others are silently ignored
            expect(loggers.log).toHaveBeenCalledTimes(1);
        })
        .then(done, done.fail);
    });

    it('preserves order after hide/show', function(done) {
        function getIndices() {
            var out = [];
            d3SelectAll('.choropleth').each(function(d) { out.push(d[0].trace.index); });
            return out;
        }

        Plotly.newPlot(gd, [{
            type: 'choropleth',
            locations: ['CAN', 'USA'],
            z: [1, 2]
        }, {
            type: 'choropleth',
            locations: ['CAN', 'USA'],
            z: [2, 1]
        }])
        .then(function() {
            expect(getIndices()).toEqual([0, 1]);
            return Plotly.restyle(gd, 'visible', false, [0]);
        })
        .then(function() {
            expect(getIndices()).toEqual([1]);
            return Plotly.restyle(gd, 'visible', true, [0]);
        })
        .then(function() {
            expect(getIndices()).toEqual([0, 1]);
        })
        .then(done, done.fail);
    });
});
