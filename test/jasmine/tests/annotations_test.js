var Annotations = require('@src/components/annotations');

var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');
var Axes = require('@src/plots/cartesian/axes');

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
                    _index: i,
                    clicktoshow: false
                });
            });
        });

        it('should default to pixel for axref/ayref', function() {
            var layoutIn = {
                annotations: [{ showarrow: true, arrowhead: 2 }]
            };

            var out = _supply(layoutIn);

            expect(out[0].axref).toEqual('pixel');
            expect(out[0].ayref).toEqual('pixel');
        });

        it('should convert ax/ay date coordinates to date string if tail is in milliseconds and axis is a date', function() {
            var layoutIn = {
                annotations: [{
                    showarrow: true,
                    axref: 'x',
                    ayref: 'y',
                    x: '2008-07-01',
                    // note this is not portable: this generates ms in the local
                    // timezone, so will work correctly where it was created but
                    // not if the milliseconds number is moved to another TZ
                    ax: +(new Date(2004, 6, 1)),
                    y: 0,
                    ay: 50
                }]
            };

            var layoutOut = {
                xaxis: { type: 'date', range: ['2000-01-01', '2016-01-01'] }
            };
            Axes.setConvert(layoutOut.xaxis);

            _supply(layoutIn, layoutOut);

            expect(layoutOut.annotations[0].x).toEqual('2008-07-01');
            expect(layoutOut.annotations[0].ax).toEqual('2004-07-01');
        });

        it('should convert ax/ay category coordinates to linear coords', function() {
            var layoutIn = {
                annotations: [{
                    showarrow: true,
                    axref: 'x',
                    ayref: 'y',
                    x: 'c',
                    ax: 1,
                    y: 'A',
                    ay: 3
                }]
            };

            var layoutOut = {
                xaxis: {
                    type: 'category',
                    _categories: ['a', 'b', 'c'],
                    range: [-0.5, 2.5] },
                yaxis: {
                    type: 'category',
                    _categories: ['A', 'B', 'C'],
                    range: [-0.5, 3]
                }
            };
            Axes.setConvert(layoutOut.xaxis);
            Axes.setConvert(layoutOut.yaxis);

            _supply(layoutIn, layoutOut);

            expect(layoutOut.annotations[0].x).toEqual(2);
            expect(layoutOut.annotations[0].ax).toEqual(1);
            expect(layoutOut.annotations[0].y).toEqual(0);
            expect(layoutOut.annotations[0].ay).toEqual(3);
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
        var updateObj = { 'annotations[0].text': 'hello' };

        function assertText(index, expected) {
            var query = '.annotation[data-index="' + index + '"]',
                actual = d3.select(query).select('text').text();

            expect(actual).toEqual(expected);
        }

        function assertUpdateObj() {
            // w/o mutating relayout update object
            expect(Object.keys(updateObj)).toEqual(['annotations[0].text']);
            expect(updateObj['annotations[0].text']).toEqual('hello');
        }

        assertText(0, 'left top');

        Plotly.relayout(gd, 'annotations[0].text', 'hello').then(function() {
            assertText(0, 'hello');

            return Plotly.relayout(gd, 'annotations[0].text', null);
        })
        .then(function() {
            assertText(0, 'new text');

            return Plotly.relayout(gd, updateObj);
        })
        .then(function() {
            assertText(0, 'hello');
            assertUpdateObj();

            return Plotly.relayout(gd, 'annotations[0].text', null);
        })
        .then(function() {
            assertText(0, 'new text');

            return Plotly.update(gd, {}, updateObj);
        })
        .then(function() {
            assertText(0, 'hello');
            assertUpdateObj();
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
            // but also because it's a date axis that we've converted to ms
            var PRECX2 = -10;
            // yaxis2 needs a bit more now too...
            var PRECY2 = 0.2;
            var dateAx = fullLayout.xaxis2;

            expect(fullLayout.xaxis.range).toBeCloseToArray(x, PREC, '- xaxis');
            expect(fullLayout.yaxis.range).toBeCloseToArray(y, PREC, '- yaxis');
            expect(Lib.simpleMap(dateAx.range, dateAx.r2l))
                .toBeCloseToArray(Lib.simpleMap(x2, dateAx.r2l), PRECX2, 'xaxis2 ' + dateAx.range);
            expect(fullLayout.yaxis2.range).toBeCloseToArray(y2, PRECY2, 'yaxis2');
            expect(fullLayout.xaxis3.range).toBeCloseToArray(x3, PREC, 'xaxis3');
            expect(fullLayout.yaxis3.range).toBeCloseToArray(y3, PREC, 'yaxis3');
        }

        Plotly.plot(gd, mock).then(function() {
            assertRanges(
                [0.97, 2.03], [0.97, 2.03],
                ['2000-10-01 08:23:18.0583', '2001-06-05 19:20:23.301'], [-0.245, 4.245],
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
                ['2001-01-18 15:06:04.0449', '2001-03-27 14:01:20.8989'], [-0.245, 4.245],
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
                ['2001-01-31 23:59:59.999', '2001-02-01 00:00:00.001'], [-0.245, 4.245],
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
                ['2000-10-01 08:23:18.0583', '2001-06-05 19:20:23.301'], [-0.245, 4.245],
                [0.9, 2.1], [0.86, 2.14]
            );
        })
        .then(done);
    });
});

describe('annotation clicktoshow', function() {
    var gd;

    afterEach(destroyGraphDiv);

    function layout() {
        return {
            xaxis: {domain: [0, 0.5]},
            xaxis2: {domain: [0.5, 1], anchor: 'y2'},
            yaxis2: {anchor: 'x2'},
            annotations: [
                {x: 1, y: 2, xref: 'x', yref: 'y', text: 'index0'}, // (1,2) selects
                {x: 1, y: 3, xref: 'x', yref: 'y', text: 'index1'},
                {x: 2, y: 3, xref: 'x', yref: 'y', text: 'index2'}, // ** (2,3) selects
                {x: 4, y: 2, xref: 'x', yref: 'y', text: 'index3'},
                {x: 1, y: 2, xref: 'x2', yref: 'y', text: 'index4'},
                {x: 1, y: 2, xref: 'x', yref: 'y2', text: 'index5'},
                {x: 1, xclick: 5, y: 2, xref: 'x', yref: 'y', text: 'index6'},
                {x: 1, y: 2, yclick: 6, xref: 'x', yref: 'y', text: 'index7'},
                {x: 1, y: 2.0000001, xref: 'x', yref: 'y', text: 'index8'},
                {x: 1, y: 2, xref: 'x', yref: 'y', text: 'index9'}, // (1,2) selects
                {x: 7, xclick: 1, y: 2, xref: 'x', yref: 'y', text: 'index10'}, // (1,2) selects
                {x: 1, y: 8, yclick: 2, xref: 'x', yref: 'y', text: 'index11'}, // (1,2) selects
                {x: 1, y: 2, xref: 'paper', yref: 'y', text: 'index12'},
                {x: 1, y: 2, xref: 'x', yref: 'paper', text: 'index13'},
                {x: 1, y: 2, xref: 'paper', yref: 'paper', text: 'index14'}
            ]
        };
    }

    var data = [
        {x: [0, 1, 2], y: [1, 2, 3]},
        {x: [0, 1, 2], y: [1, 2, 3], xaxis: 'x2', yaxis: 'y2'}
    ];

    function hoverData(xyPairs) {
        // hovering on nothing can have undefined hover data - must be supported
        if(!xyPairs.length) return;

        return xyPairs.map(function(xy) {
            return {
                x: xy[0],
                y: xy[1],
                xaxis: gd._fullLayout.xaxis,
                yaxis: gd._fullLayout.yaxis
            };
        });
    }

    function checkVisible(opts) {
        gd._fullLayout.annotations.forEach(function(ann, i) {
            expect(ann.visible).toBe(opts.on.indexOf(i) !== -1, 'i: ' + i + ', step: ' + opts.step);
        });
    }

    function allAnnotations(attr, value) {
        var update = {};
        for(var i = 0; i < gd.layout.annotations.length; i++) {
            update['annotations[' + i + '].' + attr] = value;
        }
        return update;
    }

    function clickAndCheck(opts) {
        return function() {
            expect(Annotations.hasClickToShow(gd, hoverData(opts.newPts)))
                .toBe(opts.newCTS, 'step: ' + opts.step);

            var clickResult = Annotations.onClick(gd, hoverData(opts.newPts));
            if(clickResult && clickResult.then) {
                return clickResult.then(function() { checkVisible(opts); });
            }
            else {
                checkVisible(opts);
            }
        };
    }

    function updateAndCheck(opts) {
        return function() {
            return Plotly.update(gd, {}, opts.update).then(function() {
                checkVisible(opts);
            });
        };
    }

    var allIndices = layout().annotations.map(function(v, i) { return i; });

    it('should select only clicktoshow annotations matching x, y, and axes of any point', function(done) {
        gd = createGraphDiv();

        // first try to select without adding clicktoshow, both visible and invisible
        Plotly.plot(gd, data, layout())
        // clicktoshow is off initially, so it doesn't *expect* clicking will
        // do anything, and it doesn't *actually* do anything.
        .then(clickAndCheck({newPts: [[1, 2]], newCTS: false, on: allIndices, step: 1}))
        .then(updateAndCheck({update: allAnnotations('visible', false), on: [], step: 2}))
        // still nothing happens with hidden annotations
        .then(clickAndCheck({newPts: [[1, 2]], newCTS: false, on: [], step: 3}))

        // turn on clicktoshow (onout mode) and we see some action!
        .then(updateAndCheck({update: allAnnotations('clicktoshow', 'onout'), on: [], step: 4}))
        .then(clickAndCheck({newPts: [[1, 2]], newCTS: true, on: [0, 9, 10, 11], step: 5}))
        .then(clickAndCheck({newPts: [[2, 3]], newCTS: true, on: [2], step: 6}))
        // clicking the same point again will close all, but in onout mode hasClickToShow
        // is false because closing notes is kind of passive
        .then(clickAndCheck({newPts: [[2, 3]], newCTS: false, on: [], step: 7}))
        // now click two points (as if in compare hovermode)
        .then(clickAndCheck({newPts: [[1, 2], [2, 3]], newCTS: true, on: [0, 2, 9, 10, 11], step: 8}))
        // close all by clicking somewhere else
        .then(clickAndCheck({newPts: [[0, 1]], newCTS: false, on: [], step: 9}))

        // now switch to onoff mode
        .then(updateAndCheck({update: allAnnotations('clicktoshow', 'onoff'), on: [], step: 10}))
        // again, clicking a point turns those annotations on
        .then(clickAndCheck({newPts: [[1, 2]], newCTS: true, on: [0, 9, 10, 11], step: 11}))
        // clicking a different point (or no point at all) leaves open annotations the same
        .then(clickAndCheck({newPts: [[0, 1]], newCTS: false, on: [0, 9, 10, 11], step: 12}))
        .then(clickAndCheck({newPts: [], newCTS: false, on: [0, 9, 10, 11], step: 13}))
        // clicking another point turns it on too, without turning off the original
        .then(clickAndCheck({newPts: [[0, 1], [2, 3]], newCTS: true, on: [0, 2, 9, 10, 11], step: 14}))
        // finally click each one off
        .then(clickAndCheck({newPts: [[1, 2]], newCTS: true, on: [2], step: 15}))
        .then(clickAndCheck({newPts: [[2, 3]], newCTS: true, on: [], step: 16}))
        .then(done);
    });
});
