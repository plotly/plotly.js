var Annotations = require('@src/components/annotations');

var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');
var Loggers = require('@src/lib/loggers');
var Axes = require('@src/plots/cartesian/axes');

var d3 = require('d3');
var customMatchers = require('../assets/custom_matchers');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var drag = require('../assets/drag');


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

        spyOn(Loggers, 'warn');
    });

    afterEach(destroyGraphDiv);

    function countAnnotations() {
        return d3.selectAll('g.annotation').size();
    }

    function assertText(index, expected) {
        var query = '.annotation[data-index="' + index + '"]',
            actual = d3.select(query).select('text').text();

        expect(actual).toEqual(expected);
    }

    it('should be able to add /remove annotations', function(done) {
        expect(countAnnotations()).toEqual(len);

        var ann = { text: '' };

        Plotly.relayout(gd, 'annotations[' + len + ']', ann)
        .then(function() {
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

            return Plotly.relayout(gd, {annotations: []});
        })
        .then(function() {
            expect(countAnnotations()).toEqual(0);

            return Plotly.relayout(gd, {annotations: [ann, {text: 'boo', x: 1, y: 1}]});
        })
        .then(function() {
            expect(countAnnotations()).toEqual(2);

            return Plotly.relayout(gd, {annotations: null});
        })
        .then(function() {
            expect(countAnnotations()).toEqual(0);
            expect(Loggers.warn).not.toHaveBeenCalled();

            return Plotly.relayout(gd, {'annotations[0]': ann});
        })
        .then(function() {
            expect(countAnnotations()).toEqual(1);

            return Plotly.relayout(gd, {'annotations[0]': null});
        })
        .then(function() {
            expect(countAnnotations()).toEqual(0);
            expect(Loggers.warn).not.toHaveBeenCalled();
        })
        .catch(failTest)
        .then(done);
    });

    it('should be able update annotations', function(done) {
        var updateObj = { 'annotations[0].text': 'hello' };

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
        .catch(failTest)
        .then(done);

    });

    it('can update several annotations and add and delete in one call', function(done) {
        expect(countAnnotations()).toEqual(len);
        var annos = gd.layout.annotations,
            anno0 = Lib.extendFlat(annos[0]),
            anno1 = Lib.extendFlat(annos[1]),
            anno3 = Lib.extendFlat(annos[3]);

        // store some (unused) private keys and make sure they are copied over
        // correctly during relayout
        var fullAnnos = gd._fullLayout.annotations;
        fullAnnos[0]._boo = 'hoo';
        fullAnnos[1]._foo = 'bar';
        fullAnnos[3]._cheese = ['gorgonzola', 'gouda', 'gloucester'];
        // this one gets lost
        fullAnnos[2]._splat = 'the cat';

        Plotly.relayout(gd, {
            'annotations[0].text': 'tortilla',
            'annotations[0].x': 3.45,
            'annotations[1]': {text: 'chips', x: 1.1, y: 2.2}, // add new annotation btwn 0 and 1
            'annotations[2].text': 'guacamole', // alter 2 (which was 1 before we started)
            'annotations[3]': null, // remove 3 (which was 2 before we started)
            'annotations[4].text': 'lime' // alter 4 (which was 3 before and will be 3 afterward)
        })
        .then(function() {
            expect(countAnnotations()).toEqual(len);

            var fullAnnosAfter = gd._fullLayout.annotations,
                fullStr = JSON.stringify(fullAnnosAfter);

            assertText(0, 'tortilla');
            anno0.text = 'tortilla';
            expect(annos[0]).toEqual(anno0);
            expect(fullAnnosAfter[0]._boo).toBe('hoo');


            assertText(1, 'chips');
            expect(annos[1]).toEqual({text: 'chips', x: 1.1, y: 2.2});
            expect(fullAnnosAfter[1]._foo).toBeUndefined();

            assertText(2, 'guacamole');
            anno1.text = 'guacamole';
            expect(annos[2]).toEqual(anno1);
            expect(fullAnnosAfter[2]._foo).toBe('bar');
            expect(fullAnnosAfter[2]._splat).toBeUndefined();

            assertText(3, 'lime');
            anno3.text = 'lime';
            expect(annos[3]).toEqual(anno3);
            expect(fullAnnosAfter[3]._cheese).toEqual(['gorgonzola', 'gouda', 'gloucester']);

            expect(fullStr.indexOf('_splat')).toBe(-1);
            expect(fullStr.indexOf('the cat')).toBe(-1);

            expect(Loggers.warn).not.toHaveBeenCalled();

        })
        .catch(failTest)
        .then(done);
    });

    [
        {annotations: [{text: 'a'}], 'annotations[0]': {text: 'b'}},
        {annotations: null, 'annotations[0]': {text: 'b'}},
        {annotations: [{text: 'a'}], 'annotations[0]': null},
        {annotations: [{text: 'a'}], 'annotations[0].text': 'b'},
        {'annotations[0]': {text: 'a'}, 'annotations[0].text': 'b'},
        {'annotations[0]': null, 'annotations[0].text': 'b'},
        {annotations: {text: 'a'}},
        {'annotations[0]': 'not an object'},
        {'annotations[100]': {text: 'bad index'}}
    ].forEach(function(update) {
        it('warns on ambiguous combinations and invalid values: ' + JSON.stringify(update), function() {
            Plotly.relayout(gd, update);
            expect(Loggers.warn).toHaveBeenCalled();
            // we could test the results here, but they're ambiguous and/or undefined so why bother?
            // the important thing is the developer is warned that something went wrong.
        });
    });

    it('handles xref/yref changes with or without x/y changes', function(done) {
        Plotly.relayout(gd, {

            // #0: change all 4, with opposite ordering of keys
            'annotations[0].x': 2.2,
            'annotations[0].xref': 'x',
            'annotations[0].yref': 'y',
            'annotations[0].y': 3.3,

            // #1: change xref and yref without x and y: no longer changes x & y
            'annotations[1].xref': 'x',
            'annotations[1].yref': 'y',

            // #2: change x and y
            'annotations[2].x': 0.1,
            'annotations[2].y': 0.3
        })
        .then(function() {
            var annos = gd.layout.annotations;

            // explicitly change all 4
            expect(annos[0].x).toBe(2.2);
            expect(annos[0].y).toBe(3.3);
            expect(annos[0].xref).toBe('x');
            expect(annos[0].yref).toBe('y');

            // just change xref/yref -> we do NOT make any implicit changes
            // to x/y within plotly.js
            expect(annos[1].x).toBe(0.25);
            expect(annos[1].y).toBe(1);
            expect(annos[1].xref).toBe('x');
            expect(annos[1].yref).toBe('y');

            // just change x/y -> nothing else changes
            expect(annos[2].x).toBe(0.1);
            expect(annos[2].y).toBe(0.3);
            expect(annos[2].xref).toBe('paper');
            expect(annos[2].yref).toBe('paper');
            expect(Loggers.warn).not.toHaveBeenCalled();
        })
        .catch(failTest)
        .then(done);
    });
});

describe('annotations log/linear axis changes', function() {
    'use strict';

    var mock = {
        data: [
            {x: [1, 2, 3], y: [1, 2, 3]},
            {x: [1, 2, 3], y: [3, 2, 1], yaxis: 'y2'}
        ],
        layout: {
            annotations: [
                {x: 1, y: 1, text: 'boo', xref: 'x', yref: 'y'},
                {x: 1, y: 1, text: '', ax: 2, ay: 2, axref: 'x', ayref: 'y'}
            ],
            yaxis: {range: [1, 3]},
            yaxis2: {range: [0, 1], overlaying: 'y', type: 'log'}
        }
    };
    var gd;

    beforeEach(function(done) {
        gd = createGraphDiv();

        var mockData = Lib.extendDeep([], mock.data),
            mockLayout = Lib.extendDeep({}, mock.layout);

        Plotly.plot(gd, mockData, mockLayout).then(done);
    });

    afterEach(destroyGraphDiv);

    it('doesnt try to update position automatically with ref changes', function(done) {
        // we don't try to figure out the position on a new axis / canvas
        // automatically when you change xref / yref, we leave it to the caller.
        // previously this logic was part of plotly.js... But it's really only
        // the plot.ly workspace that wants this and can assign an unambiguous
        // meaning to it, so we'll move the logic there, where there are far
        // fewer edge cases to consider because xref never gets edited along
        // with anything else in one `relayout` call.

        // linear to log
        Plotly.relayout(gd, {'annotations[0].yref': 'y2'})
        .then(function() {
            expect(gd.layout.annotations[0].y).toBe(1);

            // log to paper
            return Plotly.relayout(gd, {'annotations[0].yref': 'paper'});
        })
        .then(function() {
            expect(gd.layout.annotations[0].y).toBe(1);

            // paper to log
            return Plotly.relayout(gd, {'annotations[0].yref': 'y2'});
        })
        .then(function() {
            expect(gd.layout.annotations[0].y).toBe(1);

            // log to linear
            return Plotly.relayout(gd, {'annotations[0].yref': 'y'});
        })
        .then(function() {
            expect(gd.layout.annotations[0].y).toBe(1);

            // y and yref together
            return Plotly.relayout(gd, {'annotations[0].y': 0.2, 'annotations[0].yref': 'y2'});
        })
        .then(function() {
            expect(gd.layout.annotations[0].y).toBe(0.2);

            // yref first, then y
            return Plotly.relayout(gd, {'annotations[0].yref': 'y', 'annotations[0].y': 2});
        })
        .then(function() {
            expect(gd.layout.annotations[0].y).toBe(2);
        })
        .catch(failTest)
        .then(done);
    });

    it('keeps the same data value if the axis type is changed without position', function(done) {
        // because annotations (and images) use linearized positions on log axes,
        // we have `relayout` update the positions so the data value the annotation
        // points to is unchanged by the axis type change.

        Plotly.relayout(gd, {'yaxis.type': 'log'})
        .then(function() {
            expect(gd.layout.annotations[0].y).toBe(0);
            expect(gd.layout.annotations[1].y).toBe(0);
            expect(gd.layout.annotations[1].ay).toBeCloseTo(Math.LN2 / Math.LN10, 6);

            return Plotly.relayout(gd, {'yaxis.type': 'linear'});
        })
        .then(function() {
            expect(gd.layout.annotations[0].y).toBe(1);
            expect(gd.layout.annotations[1].y).toBe(1);
            expect(gd.layout.annotations[1].ay).toBeCloseTo(2, 6);

            return Plotly.relayout(gd, {
                'yaxis.type': 'log',
                'annotations[0].y': 0.2,
                'annotations[1].ay': 0.3
            });
        })
        .then(function() {
            expect(gd.layout.annotations[0].y).toBe(0.2);
            expect(gd.layout.annotations[1].y).toBe(0);
            expect(gd.layout.annotations[1].ay).toBe(0.3);

            return Plotly.relayout(gd, {
                'annotations[0].y': 2,
                'annotations[1].ay': 2.5,
                'yaxis.type': 'linear'
            });
        })
        .then(function() {
            expect(gd.layout.annotations[0].y).toBe(2);
            expect(gd.layout.annotations[1].y).toBe(1);
            expect(gd.layout.annotations[1].ay).toBe(2.5);
        })
        .catch(failTest)
        .then(done);
    });

});

describe('annotations autorange', function() {
    'use strict';

    var mock = Lib.extendDeep({}, require('@mocks/annotations-autorange.json'));
    var gd;

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);

        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

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
        // and xaxis3 too...
        var PRECX3 = 0.2;

        var dateAx = fullLayout.xaxis2;

        expect(fullLayout.xaxis.range).toBeCloseToArray(x, PREC, '- xaxis');
        expect(fullLayout.yaxis.range).toBeCloseToArray(y, PREC, '- yaxis');
        expect(Lib.simpleMap(dateAx.range, dateAx.r2l))
            .toBeCloseToArray(Lib.simpleMap(x2, dateAx.r2l), PRECX2, 'xaxis2 ' + dateAx.range);
        expect(fullLayout.yaxis2.range).toBeCloseToArray(y2, PRECY2, 'yaxis2');
        expect(fullLayout.xaxis3.range).toBeCloseToArray(x3, PRECX3, 'xaxis3');
        expect(fullLayout.yaxis3.range).toBeCloseToArray(y3, PREC, 'yaxis3');
    }

    it('should adapt to relayout calls', function(done) {
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
        .catch(failTest)
        .then(done);
    });

    it('catches bad xref/yref', function(done) {
        Plotly.plot(gd, mock).then(function() {
            return Plotly.relayout(gd, {'annotations[1]': {
                text: 'LT',
                x: -1,
                y: 3,
                xref: 'x5', // will be converted to 'x' and xaxis should autorange
                yref: 'y5', // same 'y' -> yaxis
                ax: 50,
                ay: 50
            }});
        })
        .then(function() {
            assertRanges(
                [-1.09, 2.09], [0.94, 3.06],
                // the other axes shouldn't change
                ['2000-10-01 08:23:18.0583', '2001-06-05 19:20:23.301'], [-0.245, 4.245],
                [0.9, 2.1], [0.86, 2.14]
            );
        })
        .catch(failTest)
        .then(done);
    });
});

describe('annotation clicktoshow', function() {
    var gd;

    beforeEach(function() { gd = createGraphDiv(); });

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
        .catch(failTest)
        .then(done);
    });

    it('works on date and log axes', function(done) {
        Plotly.plot(gd, [{
            x: ['2016-01-01', '2016-01-02', '2016-01-03'],
            y: [1, 1, 3]
        }], {
            yaxis: {type: 'log'},
            annotations: [{
                x: '2016-01-02',
                y: 0,
                text: 'boo',
                showarrow: true,
                clicktoshow: 'onoff',
                visible: false
            }]
        })
        .then(function() {
            expect(gd._fullLayout.xaxis.type).toBe('date');
            expect(gd._fullLayout.yaxis.type).toBe('log');
        })
        .then(clickAndCheck({newPts: [['2016-01-02', 1]], newCTS: true, on: [0]}))
        .catch(failTest)
        .then(done);
    });

    it('works on category axes', function(done) {
        Plotly.plot(gd, [{
            x: ['a', 'b', 'c'],
            y: [1, 2, 3]
        }], {
            annotations: [{
                x: 'b',
                y: 2,
                text: 'boo',
                showarrow: true,
                clicktoshow: 'onout',
                visible: false
            }, {
                // you can also use category serial numbers
                x: 2,
                y: 3,
                text: 'hoo',
                showarrow: true,
                clicktoshow: 'onout',
                visible: false
            }]
        })
        .then(function() {
            expect(gd._fullLayout.xaxis.type).toBe('category');
            expect(gd._fullLayout.yaxis.type).toBe('linear');
        })
        .then(clickAndCheck({newPts: [['b', 2]], newCTS: true, on: [0], step: 1}))
        .then(clickAndCheck({newPts: [['c', 3]], newCTS: true, on: [1], step: 2}))
        .catch(failTest)
        .then(done);
    });
});

describe('annotation dragging', function() {
    var gd;

    function textDrag() { return gd.querySelector('.annotation-text-g>g'); }
    function arrowDrag() { return gd.querySelector('.annotation-arrow-g>.anndrag'); }
    function textBox() { return gd.querySelector('.annotation-text-g'); }

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

    beforeEach(function(done) {
        gd = createGraphDiv();

        // we've already tested autorange with relayout, so fix the geometry
        // completely so we know exactly what we're dealing with
        // plot area is 300x300, and covers data range 100x100
        Plotly.plot(gd,
            [{x: [0, 100], y: [0, 100], mode: 'markers'}],
            {
                xaxis: {range: [0, 100]},
                yaxis: {range: [0, 100]},
                width: 500,
                height: 500,
                margin: {l: 100, r: 100, t: 100, b: 100, pad: 0}
            },
            {editable: true}
        )
        .then(done);
    });

    afterEach(destroyGraphDiv);

    function initAnnotation(annotation) {
        return Plotly.relayout(gd, {annotations: [annotation]})
        .then(function() {
            return Plots.previousPromises(gd);
        });
    }

    function dragAndReplot(node, dx, dy, edge) {
        return drag(node, dx, dy, edge).then(function() {
            return Plots.previousPromises(gd);
        });
    }

    /*
     * run through a series of drags of the same annotation
     * findDragger: fn that returns the element to drag on
     *  (either textDrag or ArrowDrag)
     * autoshiftX, autoshiftY: how much does the annotation anchor shift
     *  moving between one region and the next. Zero except if autoanchor
     *  is active, ie paper-referenced with no arrow
     * coordScale: how big is the full plot? paper-referenced has scale 1
     *  and for the plot defined above, data-referenced has scale 100
     */
    function checkDragging(findDragger, autoshiftX, autoshiftY, coordScale) {
        var bboxInitial = textBox().getBoundingClientRect();
        // first move it within the same auto-anchor zone
        return dragAndReplot(findDragger(), 30, -30)
        .then(function() {
            var bbox = textBox().getBoundingClientRect();

            // I'm not sure why these calculations aren't exact - they end up
            // being off by a fraction of a pixel, or a full pixel sometimes
            // even though as far as I can see in practice the positioning is
            // exact. In any event, this precision is enough to ensure that
            // anchor: auto is being used.
            expect(bbox.left).toBeWithin(bboxInitial.left + 30, 1);
            expect(bbox.top).toBeWithin(bboxInitial.top - 30, 1);

            var ann = gd.layout.annotations[0];
            expect(ann.x).toBeWithin(0.1 * coordScale, 0.01 * coordScale);
            expect(ann.y).toBeWithin(0.1 * coordScale, 0.01 * coordScale);

            // now move it to the center
            // note that we explicitly offset by half the box size because the
            // auto-anchor will move to the center
            return dragAndReplot(findDragger(), 120 - autoshiftX, -120 + autoshiftY);
        })
        .then(function() {
            var bbox = textBox().getBoundingClientRect();
            expect(bbox.left).toBeWithin(bboxInitial.left + 150 - autoshiftX, 2);
            expect(bbox.top).toBeWithin(bboxInitial.top - 150 + autoshiftY, 2);

            var ann = gd.layout.annotations[0];
            expect(ann.x).toBeWithin(0.5 * coordScale, 0.01 * coordScale);
            expect(ann.y).toBeWithin(0.5 * coordScale, 0.01 * coordScale);

            // next move it near the upper right corner, where the auto-anchor
            // moves to the top right corner
            // we don't move it all the way to the corner, so the annotation will
            // still be entirely on the plot even with an arrow.
            return dragAndReplot(findDragger(), 90 - autoshiftX, -90 + autoshiftY);
        })
        .then(function() {
            var bbox = textBox().getBoundingClientRect();
            expect(bbox.left).toBeWithin(bboxInitial.left + 240 - 2 * autoshiftX, 2);
            expect(bbox.top).toBeWithin(bboxInitial.top - 240 + 2 * autoshiftY, 2);

            var ann = gd.layout.annotations[0];
            expect(ann.x).toBeWithin(0.8 * coordScale, 0.01 * coordScale);
            expect(ann.y).toBeWithin(0.8 * coordScale, 0.01 * coordScale);

            // finally move it back to 0, 0
            return dragAndReplot(findDragger(), -240 + 2 * autoshiftX, 240 - 2 * autoshiftY);
        })
        .then(function() {
            var bbox = textBox().getBoundingClientRect();
            expect(bbox.left).toBeWithin(bboxInitial.left, 2);
            expect(bbox.top).toBeWithin(bboxInitial.top, 2);

            var ann = gd.layout.annotations[0];
            expect(ann.x).toBeWithin(0 * coordScale, 0.01 * coordScale);
            expect(ann.y).toBeWithin(0 * coordScale, 0.01 * coordScale);
        });
    }

    // for annotations with arrows: check that dragging the text moves only
    // ax and ay (and the textbox itself)
    function checkTextDrag() {
        var ann = gd.layout.annotations[0],
            x0 = ann.x,
            y0 = ann.y,
            ax0 = ann.ax,
            ay0 = ann.ay;

        var bboxInitial = textBox().getBoundingClientRect();

        return dragAndReplot(textDrag(), 50, -50)
        .then(function() {
            var bbox = textBox().getBoundingClientRect();
            expect(bbox.left).toBeWithin(bboxInitial.left + 50, 1);
            expect(bbox.top).toBeWithin(bboxInitial.top - 50, 1);

            ann = gd.layout.annotations[0];

            expect(ann.x).toBe(x0);
            expect(ann.y).toBe(y0);
            expect(ann.ax).toBeWithin(ax0 + 50, 1);
            expect(ann.ay).toBeWithin(ay0 - 50, 1);
        });
    }

    it('respects anchor: auto when paper-referenced without arrow', function(done) {
        initAnnotation({
            x: 0,
            y: 0,
            showarrow: false,
            text: 'blah<br>blah blah',
            xref: 'paper',
            yref: 'paper'
        })
        .then(function() {
            var bbox = textBox().getBoundingClientRect();

            return checkDragging(textDrag, bbox.width / 2, bbox.height / 2, 1);
        })
        .catch(failTest)
        .then(done);
    });

    it('also works paper-referenced with explicit anchors and no arrow', function(done) {
        initAnnotation({
            x: 0,
            y: 0,
            showarrow: false,
            text: 'blah<br>blah blah',
            xref: 'paper',
            yref: 'paper',
            xanchor: 'left',
            yanchor: 'top'
        })
        .then(function() {
            // with offsets 0, 0 because the anchor doesn't change now
            return checkDragging(textDrag, 0, 0, 1);
        })
        .catch(failTest)
        .then(done);
    });

    it('works paper-referenced with arrows', function(done) {
        initAnnotation({
            x: 0,
            y: 0,
            text: 'blah<br>blah blah',
            xref: 'paper',
            yref: 'paper',
            ax: 30,
            ay: 30
        })
        .then(function() {
            return checkDragging(arrowDrag, 0, 0, 1);
        })
        .then(checkTextDrag)
        .catch(failTest)
        .then(done);
    });

    it('works data-referenced with no arrow', function(done) {
        initAnnotation({
            x: 0,
            y: 0,
            showarrow: false,
            text: 'blah<br>blah blah'
        })
        .then(function() {
            return checkDragging(textDrag, 0, 0, 100);
        })
        .catch(failTest)
        .then(done);
    });

    it('works data-referenced with arrow', function(done) {
        initAnnotation({
            x: 0,
            y: 0,
            text: 'blah<br>blah blah',
            ax: 30,
            ay: -30
        })
        .then(function() {
            return checkDragging(arrowDrag, 0, 0, 100);
        })
        .then(checkTextDrag)
        .catch(failTest)
        .then(done);
    });
});
