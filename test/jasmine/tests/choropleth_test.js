var Choropleth = require('@src/traces/choropleth');

var Plotly = require('@lib');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');
var failTest = require('../assets/fail_test');

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
    });
});

describe('Test choropleth hover:', function() {
    var gd;

    afterEach(destroyGraphDiv);

    function run(pos, fig, content, style) {
        gd = createGraphDiv();

        style = style || {
            bgcolor: 'rgb(68, 68, 68)',
            bordercolor: 'rgb(255, 255, 255)',
            fontColor: 'rgb(255, 255, 255)',
            fontSize: 13,
            fontFamily: 'Arial'
        };

        return Plotly.plot(gd, fig).then(function() {
            mouseEvent('mousemove', pos[0], pos[1]);
            assertHoverLabelContent({
                nums: content[0],
                name: content[1]
            });
            assertHoverLabelStyle(
                d3.select('g.hovertext'),
                style
            );
        });
    }

    it('should generate hover label info (base)', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/geo_first.json'));

        run(
            [400, 160],
            fig,
            ['RUS\n10', 'trace 1']
        )
        .then(done);
    });

    it('should use the hovertemplate', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/geo_first.json'));
        fig.data[1].hovertemplate = 'tpl %{z}<extra>x</extra>';

        run(
            [400, 160],
            fig,
            ['tpl 10', 'x']
        )
        .then(done);
    });

    it('should generate hover label info (\'text\' single value case)', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/geo_first.json'));
        fig.data[1].text = 'tExT';
        fig.data[1].hoverinfo = 'text';

        run(
            [400, 160],
            fig,
            ['tExT', null]
        )
        .then(done);
    });

    it('should generate hover label info (\'text\' array case)', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/geo_first.json'));
        fig.data[1].text = ['tExT', 'TeXt', '-text-'];
        fig.data[1].hoverinfo = 'text';

        run(
            [400, 160],
            fig,
            ['-text-', null]
        )
        .then(done);
    });

    it('should generate hover label with custom styling', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/geo_first.json'));
        fig.data[1].hoverlabel = {
            bgcolor: 'red',
            bordercolor: ['blue', 'black', 'green'],
            font: {family: 'Roboto'}
        };

        run(
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
        .then(done);
    });

    it('should generate hover label with arrayOk \'hoverinfo\' settings', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/geo_first.json'));
        fig.data[1].hoverinfo = ['location', 'z', 'location+name'];

        run(
            [400, 160],
            fig,
            ['RUS', 'trace 1']
        )
        .then(done);
    });
});

describe('choropleth drawing', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('should not throw an error with bad locations', function(done) {
        spyOn(Lib, 'log');
        Plotly.newPlot(gd, [{
            locations: ['canada', 0, null, '', 'utopia'],
            z: [1, 2, 3, 4, 5],
            locationmode: 'country names',
            type: 'choropleth'
        }])
        .then(function() {
            // only utopia logs - others are silently ignored
            expect(Lib.log).toHaveBeenCalledTimes(1);
        })
        .catch(failTest)
        .then(done);
    });

    it('preserves order after hide/show', function(done) {
        function getIndices() {
            var out = [];
            d3.selectAll('.choropleth').each(function(d) { out.push(d[0].trace.index); });
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
        .catch(failTest)
        .then(done);
    });
});
