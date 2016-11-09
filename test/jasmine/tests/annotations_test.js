var Annotations = require('@src/components/annotations');

var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');
var Dates = require('@src/lib/dates');

var d3 = require('d3');
var customMatchers = require('../assets/custom_matchers');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Test annotations', function() {
    'use strict';

    describe('supplyLayoutDefaults', function() {

        function _supply(layoutIn, layoutOut) {
            layoutOut = layoutOut || {};
            layoutOut._has = Plots._hasPlotType.bind(layoutOut);

            Annotations.supplyLayoutDefaults(layoutIn, layoutOut);

            return layoutOut.annotations;
        }

        it('should skip non-array containers', function() {
            [null, undefined, {}, 'str', 0, false, true].forEach(function(cont) {
                var msg = '- ' + JSON.stringify(cont);
                var layoutIn = { annotations: cont };
                var out = _supply(layoutIn);

                expect(layoutIn.annotations).toBe(cont, msg);
                expect(out).toEqual([], msg);
            });
        });

        it('should make non-object item visible: false', function() {
            var annotations = [null, undefined, [], 'str', 0, false, true];
            var layoutIn = { annotations: annotations };
            var out = _supply(layoutIn);

            expect(layoutIn.annotations).toEqual(annotations);

            out.forEach(function(item, i) {
                expect(item).toEqual({
                    visible: false,
                    _input: {},
                    _index: i
                });
            });
        });

        it('should default to pixel for axref/ayref', function() {
            var layoutIn = {
                annotations: [{ showarrow: true, arrowhead: 2}]
            };

            var out = _supply(layoutIn);

            expect(out[0].axref).toEqual('pixel');
            expect(out[0].ayref).toEqual('pixel');
        });

        it('should convert ax/ay date coordinates to milliseconds if tail is in axis terms and axis is a date', function() {
            var layoutIn = {
                annotations: [{
                    showarrow: true,
                    axref: 'x',
                    ayref: 'y',
                    x: '2008-07-01',
                    ax: '2004-07-01',
                    y: 0,
                    ay: 50
                }]
            };

            var layoutOut = {
                xaxis: { type: 'date', range: ['2000-01-01', '2016-01-01'] }
            };

            _supply(layoutIn, layoutOut);

            expect(layoutIn.annotations[0].ax).toEqual(Dates.dateTime2ms('2004-07-01'));
        });
    });
});

describe('annotations relayout', function() {
    'use strict';

    var mock = require('@mocks/annotations.json');
    var gd;

    // there is 1 visible: false item
    var len = mock.layout.annotations.length - 1;

    beforeEach(function(done) {
        gd = createGraphDiv();

        var mockData = Lib.extendDeep([], mock.data),
            mockLayout = Lib.extendDeep({}, mock.layout);

        Plotly.plot(gd, mockData, mockLayout).then(done);
    });

    afterEach(destroyGraphDiv);

    function countAnnotations() {
        return d3.selectAll('g.annotation').size();
    }

    it('should be able to add /remove annotations', function(done) {
        expect(countAnnotations()).toEqual(len);

        var ann = { text: '' };

        Plotly.relayout(gd, 'annotations[' + len + ']', ann).then(function() {
            expect(countAnnotations()).toEqual(len + 1);

            return Plotly.relayout(gd, 'annotations[0]', 'remove');
        })
        .then(function() {
            expect(countAnnotations()).toEqual(len);

            return Plotly.relayout(gd, 'annotations[0]', null);
        })
        .then(function() {
            expect(countAnnotations()).toEqual(len - 1);

            return Plotly.relayout(gd, 'annotations[0].visible', false);
        })
        .then(function() {
            expect(countAnnotations()).toEqual(len - 2);

            return Plotly.relayout(gd, { annotations: [] });
        })
        .then(function() {
            expect(countAnnotations()).toEqual(0);

            done();
        });
    });

    it('should be able update annotations', function(done) {

        function assertText(index, expected) {
            var query = '.annotation[data-index="' + index + '"]',
                actual = d3.select(query).select('text').text();

            expect(actual).toEqual(expected);
        }

        assertText(0, 'left top');

        Plotly.relayout(gd, 'annotations[0].text', 'hello').then(function() {
            assertText(0, 'hello');

            return Plotly.relayout(gd, 'annotations[0].text', null);
        })
        .then(function() {
            assertText(0, 'new text');
        })
        .then(done);

    });
});

describe('annotations autosize', function() {
    'use strict';

    var mock = Lib.extendDeep({}, require('@mocks/annotations-autorange.json'));
    var gd;

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

    afterEach(destroyGraphDiv);

    it('should adapt to relayout calls', function(done) {
        gd = createGraphDiv();

        function assertRanges(x, y, x2, y2, x3, y3) {
            var fullLayout = gd._fullLayout;
            var PREC = 1;

            // xaxis2 need a bit more tolerance to pass on CI
            // this most likely due to the different text bounding box values
            // on headfull vs headless browsers.
            var PREC2 = 0.1;

            expect(fullLayout.xaxis.range).toBeCloseToArray(x, PREC, '- xaxis');
            expect(fullLayout.yaxis.range).toBeCloseToArray(y, PREC, '- yaxis');
            expect(fullLayout.xaxis2.range).toBeCloseToArray(x2, PREC2, 'xaxis2');
            expect(fullLayout.yaxis2.range).toBeCloseToArray(y2, PREC, 'yaxis2');
            expect(fullLayout.xaxis3.range).toBeCloseToArray(x3, PREC, 'xaxis3');
            expect(fullLayout.yaxis3.range).toBeCloseToArray(y3, PREC, 'yaxis3');
        }

        Plotly.plot(gd, mock).then(function() {
            assertRanges(
                [0.97, 2.03], [0.97, 2.03],
                [-0.32, 3.38], [0.42, 2.58],
                [0.9, 2.1], [0.86, 2.14]
            );

            return Plotly.relayout(gd, {
                'annotations[0].visible': false,
                'annotations[4].visible': false,
                'annotations[8].visible': false
            });
        })
        .then(function() {
            assertRanges(
                [1.44, 2.02], [0.97, 2.03],
                [1.31, 2.41], [0.42, 2.58],
                [1.44, 2.1], [0.86, 2.14]
            );

            return Plotly.relayout(gd, {
                'annotations[2].visible': false,
                'annotations[5].visible': false,
                'annotations[9].visible': false
            });
        })
        .then(function() {
            assertRanges(
                [1.44, 2.02], [0.99, 1.52],
                [0.5, 2.5], [0.42, 2.58],
                [0.5, 2.5], [0.86, 2.14]
            );

            return Plotly.relayout(gd, {
                'annotations[0].visible': true,
                'annotations[2].visible': true,
                'annotations[4].visible': true,
                'annotations[5].visible': true,
                'annotations[8].visible': true,
                'annotations[9].visible': true
            });
        })
        .then(function() {
            assertRanges(
                [0.97, 2.03], [0.97, 2.03],
                [-0.32, 3.38], [0.42, 2.58],
                [0.9, 2.1], [0.86, 2.14]
            );
        })
        .then(done);
    });
});
