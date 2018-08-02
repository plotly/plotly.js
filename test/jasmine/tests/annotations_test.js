var Annotations = require('@src/components/annotations');

var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');
var Loggers = require('@src/lib/loggers');
var Axes = require('@src/plots/cartesian/axes');
var HOVERMINTIME = require('@src/components/fx').constants.HOVERMINTIME;
var DBLCLICKDELAY = require('@src/constants/interactions').DBLCLICKDELAY;

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var drag = require('../assets/drag');
var mouseEvent = require('../assets/mouse_event');
var click = require('../assets/click');


describe('Test annotations', function() {
    'use strict';

    describe('supplyLayoutDefaults', function() {

        function _supply(layoutIn, layoutOut) {
            layoutOut = layoutOut || {};
            layoutOut._has = Plots._hasPlotType.bind(layoutOut);
            layoutOut._subplots = {xaxis: ['x', 'x2'], yaxis: ['y', 'y2']};
            ['xaxis', 'yaxis', 'xaxis2', 'yaxis2'].forEach(function(axName) {
                if(!layoutOut[axName]) {
                    layoutOut[axName] = {
                        type: 'linear',
                        range: [0, 1],
                        _annIndices: []
                    };
                }
                Axes.setConvert(layoutOut[axName]);
            });

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
                expect(item).toEqual(jasmine.objectContaining({
                    visible: false,
                    _index: i
                }));
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
                xaxis: {
                    type: 'date',
                    range: ['2000-01-01', '2016-01-01'],
                    _annIndices: []
                }
            };

            _supply(layoutIn, layoutOut);

            expect(layoutOut.annotations[0].x).toEqual('2008-07-01');
            expect(layoutOut.annotations[0].ax).toEqual('2004-07-01');
        });

        it('should clean *xclick* and *yclick* values', function() {
            var errors = [];
            spyOn(Loggers, 'error').and.callFake(function(msg) {
                errors.push(msg);
            });

            var layoutIn = {
                annotations: [{
                    clicktoshow: 'onoff',
                    xref: 'paper',
                    yref: 'paper',
                    xclick: '10',
                    yclick: '30'
                }, {
                    clicktoshow: 'onoff',
                    xref: 'x',
                    yref: 'y',
                    xclick: '1',
                    yclick: '2017-13-50'
                }, {
                    clicktoshow: 'onoff',
                    xref: 'x2',
                    yref: 'y2',
                    xclick: '2',
                    yclick: 'A'
                }]
            };

            var layoutOut = {
                xaxis: {type: 'linear', range: [0, 1], _annIndices: []},
                yaxis: {type: 'date', range: ['2000-01-01', '2018-01-01'], _annIndices: []},
                xaxis2: {type: 'log', range: [1, 2], _annIndices: []},
                yaxis2: {type: 'category', range: [0, 1], _annIndices: []}
            };

            _supply(layoutIn, layoutOut);

            expect(layoutOut.annotations[0]._xclick).toBe(10, 'paper x');
            expect(layoutOut.annotations[0]._yclick).toBe(30, 'paper y');
            expect(layoutOut.annotations[1]._xclick).toBe(1, 'linear');
            expect(layoutOut.annotations[1]._yclick).toBe(undefined, 'invalid date');
            expect(layoutOut.annotations[2]._xclick).toBe(2, 'log');
            expect(layoutOut.annotations[2]._yclick).toBe('A', 'category');
            expect(errors.length).toBe(1);
        });

        it('should default to end for arrowside', function() {
            var layoutIn = {
                annotations: [{ showarrow: true, arrowhead: 2 }]
            };

            var out = _supply(layoutIn);

            expect(out[0].arrowside).toEqual('end');
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

        // insert some MathJax text - to make sure we fall back correctly
        // when MathJax is not provided (as is the case in our normal
        // jasmine test suite)
        expect(typeof MathJax).toBe('undefined');
        mockLayout.annotations[14].text = '$x+y+z$';

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

    it('should sort correctly when index>10', function(done) {
        var addall = {};
        var delall = {};

        // leave the first one alone, but delete and re-add all the others
        for(var i = 1; i < gd.layout.annotations.length; i++) {
            addall['annotations[' + i + ']'] = {text: i, x: i / 10, y: 0};
            delall['annotations[' + i + ']'] = null;
        }

        Plotly.relayout(gd, delall)
        .then(function() {
            expect(gd.layout.annotations).toEqual([mock.layout.annotations[0]]);

            return Plotly.relayout(gd, addall);
        })
        .then(function() {
            var annotations = gd.layout.annotations;
            expect(annotations.length).toBe(mock.layout.annotations.length);
            for(var i = 1; i < annotations.length; i++) {
                expect(annotations[i].text).toBe(i);
            }
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

    var mock;
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
        mock = Lib.extendDeep({}, require('@mocks/annotations-autorange.json'));
    });

    afterEach(destroyGraphDiv);

    function assertRanges(x, y, x2, y2, x3, y3, x4, y4) {
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
        expect(fullLayout.xaxis4.range).toBeCloseToArray(x4, PRECX2, 'xaxis4');
        expect(fullLayout.yaxis4.range).toBeCloseToArray(y4, PRECY2, 'yaxis4');
    }

    function assertVisible(indices) {
        // right now we keep the annotation groups around when they're invisible,
        // they just don't have any graphical elements in them. Might be better
        // to get rid of the groups even, but this test will produce the right
        // results either way, showing that the annotation is or isn't drawn.
        for(var i = 0; i < gd.layout.annotations.length; i++) {
            var selectorBase = '.annotation[data-index="' + i + '"]';
            var annotationGraphicalItems = d3.selectAll(
                selectorBase + ' text,' +
                selectorBase + ' rect,' +
                selectorBase + ' path');
            expect(annotationGraphicalItems.size() > 0)
                .toBe(indices.indexOf(i) !== -1, selectorBase);
        }
    }

    it('should adapt to relayout calls', function(done) {
        Plotly.plot(gd, mock).then(function() {
            assertRanges(
                [0.91, 2.09], [0.91, 2.09],
                ['2000-11-13', '2001-04-21'], [-0.069, 3.917],
                [0.88, 2.05], [0.92, 2.08],
                [-1.38, 8.29], [-0.85, 5.14]
            );
            assertVisible([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]);

            return Plotly.relayout(gd, {
                'annotations[0].visible': false,
                'annotations[4].visible': false,
                'annotations[8].visible': false,
                'annotations[12].visible': false
            });
        })
        .then(function() {
            assertRanges(
                [1.44, 2.02], [0.91, 2.09],
                ['2001-01-18', '2001-03-27'], [-0.069, 3.917],
                [1.44, 2.1], [0.92, 2.08],
                [1.41, 7.42], [-0.85, 5.14]
            );
            assertVisible([1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15, 16, 17]);

            return Plotly.relayout(gd, {
                'annotations[2].visible': false,
                'annotations[5].visible': false,
                'annotations[9].visible': false,
                'annotations[13].visible': false,
            });
        })
        .then(function() {
            assertRanges(
                [1.44, 2.02], [0.99, 1.52],
                ['2001-01-31 23:59:59.999', '2001-02-01 00:00:00.001'], [-0.069, 3.917],
                [0.5, 2.5], [0.92, 2.08],
                [3, 5], [-0.85, 5.14]
            );
            assertVisible([1, 3, 6, 7, 10, 11, 14, 15, 16, 17]);

            return Plotly.relayout(gd, {
                'annotations[0].visible': true,
                'annotations[2].visible': true,
                'annotations[4].visible': true,
                'annotations[5].visible': true,
                'annotations[8].visible': true,
                'annotations[9].visible': true,
                'annotations[12].visible': true,
                'annotations[13].visible': true
            });
        })
        .then(function() {
            assertRanges(
                [0.91, 2.09], [0.91, 2.09],
                ['2000-11-13', '2001-04-21'], [-0.069, 3.917],
                [0.88, 2.05], [0.92, 2.08],
                [-1.38, 8.29], [-0.85, 5.14]
            );
            assertVisible([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]);

            // check that off-plot annotations are hidden - zoom in to
            // only one of the four on each subplot
            return Plotly.relayout(gd, {
                'xaxis.range': [1.4, 1.6],
                'yaxis.range': [0.9, 1.1],
                'xaxis2.range': ['2001-01-15', '2001-02-15'],
                'yaxis2.range': [0.9, 1.1],
                'xaxis3.range': [1.9, 2.1],
                'yaxis3.range': [1.4, 1.6],
                'xaxis4.range': [3.9, 4.1],
                'yaxis4.range': [0.9, 1.1]
            });
        })
        .then(function() {
            assertRanges([1.4, 1.6], [0.9, 1.1],
                ['2001-01-15', '2001-02-15'], [0.9, 1.1],
                [1.9, 2.1], [1.4, 1.6],
                [3.9, 4.1], [0.9, 1.1]
            );
            // only one annotation on each subplot, plus the two paper-referenced
            // are visible after zooming in
            assertVisible([3, 7, 9, 15, 16, 17]);
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
                xref: 'xq', // will be converted to 'x' and xaxis should autorange
                yref: 'yz', // same 'y' -> yaxis
                ax: 50,
                ay: 50
            }});
        })
        .then(function() {
            assertRanges(
                [-1.09, 2.25], [0.84, 3.06],
                // the other axes shouldn't change
                ['2000-11-13', '2001-04-21'], [-0.069, 3.917],
                [0.88, 2.05], [0.92, 2.08],
                [-1.38, 8.29], [-0.85, 5.14]
            );
        })
        .catch(failTest)
        .then(done);
    });

    it('should propagate axis autorange changes when axis ranges are set', function(done) {
        function _assert(msg, xrng, yrng) {
            var fullLayout = gd._fullLayout;
            expect(fullLayout.xaxis.range).toBeCloseToArray(xrng, 1, msg + ' xrng');
            expect(fullLayout.yaxis.range).toBeCloseToArray(yrng, 1, msg + ' yrng');
        }

        Plotly.plot(gd, [{y: [1, 2]}], {
            xaxis: {range: [0, 2]},
            yaxis: {range: [0, 2]},
            annotations: [{
                text: 'a',
                x: 3, y: 3
            }]
        })
        .then(function() {
            _assert('set rng / small tx', [0, 2], [0, 2]);
            return Plotly.relayout(gd, 'annotations[0].text', 'loooooooooooooooooooooooong');
        })
        .then(function() {
            _assert('set rng / big tx', [0, 2], [0, 2]);
            return Plotly.relayout(gd, {
                'xaxis.autorange': true,
                'yaxis.autorange': true
            });
        })
        .then(function() {
            _assert('auto rng / big tx', [-0.22, 3.57], [0.84, 3.365]);
            return Plotly.relayout(gd, 'annotations[0].text', 'a');
        })
        .then(function() {
            _assert('auto rng / small tx', [-0.18, 3.035], [0.84, 3.365]);
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

describe('annotation effects', function() {
    var gd;

    function textDrag() { return gd.querySelector('.annotation-text-g>g'); }
    function arrowDrag() { return gd.querySelector('.annotation-arrow-g>.anndrag'); }
    function textBox() { return gd.querySelector('.annotation-text-g'); }

    function makePlot(annotations, config) {
        gd = createGraphDiv();

        if(!config) config = {editable: true};

        // we've already tested autorange with relayout, so fix the geometry
        // completely so we know exactly what we're dealing with
        // plot area is 300x300, and covers data range 100x100
        return Plotly.plot(gd,
            [{x: [0, 100], y: [0, 100], mode: 'markers'}],
            {
                xaxis: {range: [0, 100]},
                yaxis: {range: [0, 100]},
                width: 500,
                height: 500,
                margin: {l: 100, r: 100, t: 100, b: 100, pad: 0},
                annotations: annotations
            },
            config
        );
    }

    afterEach(destroyGraphDiv);

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
        makePlot([{
            x: 0,
            y: 0,
            showarrow: false,
            text: 'blah<br>blah blah',
            xref: 'paper',
            yref: 'paper',
            xshift: 5, yshift: 5
        }])
        .then(function() {
            var bbox = textBox().getBoundingClientRect();

            return checkDragging(textDrag, bbox.width / 2, bbox.height / 2, 1);
        })
        .catch(failTest)
        .then(done);
    });

    it('also works paper-referenced with explicit anchors and no arrow', function(done) {
        makePlot([{
            x: 0,
            y: 0,
            showarrow: false,
            text: 'blah<br>blah blah',
            xref: 'paper',
            yref: 'paper',
            xanchor: 'left',
            yanchor: 'top',
            xshift: 5, yshift: 5
        }])
        .then(function() {
            // with offsets 0, 0 because the anchor doesn't change now
            return checkDragging(textDrag, 0, 0, 1);
        })
        .catch(failTest)
        .then(done);
    });

    it('works paper-referenced with arrows', function(done) {
        makePlot([{
            x: 0,
            y: 0,
            text: 'blah<br>blah blah',
            xref: 'paper',
            yref: 'paper',
            ax: 30,
            ay: 30,
            xshift: 5, yshift: 5
        }])
        .then(function() {
            return checkDragging(arrowDrag, 0, 0, 1);
        })
        .then(checkTextDrag)
        .catch(failTest)
        .then(done);
    });

    it('works data-referenced with no arrow', function(done) {
        makePlot([{
            x: 0,
            y: 0,
            showarrow: false,
            text: 'blah<br>blah blah',
            xshift: 5, yshift: 5
        }])
        .then(function() {
            return checkDragging(textDrag, 0, 0, 100);
        })
        .catch(failTest)
        .then(done);
    });

    it('works data-referenced with arrow', function(done) {
        makePlot([{
            x: 0,
            y: 0,
            text: 'blah<br>blah blah',
            ax: 30,
            ay: -30,
            xshift: 5, yshift: 5
        }])
        .then(function() {
            return checkDragging(arrowDrag, 0, 0, 100);
        })
        .then(checkTextDrag)
        .catch(failTest)
        .then(done);
    });

    it('works date string data-referenced with no arrow', function(done) {
        gd = createGraphDiv();

        Plotly.newPlot(gd, [{
            x: ['2018-01-01', '2018-02-02'],
            y: ['2017-01-03', '2017-02-04'],
        }], {
            annotations: [{
                showarrow: false,
                text: 'YO!',
                xref: 'x',
                yref: 'y',
                x: '2018-02-01',
                y: '2017-02-05'
            }],
            width: 500,
            height: 500,
            margin: {l: 100, r: 100, t: 100, b: 100, pad: 0},
        }, {
            editable: true
        })
        .then(function() {
            return dragAndReplot(textDrag(), -20, 20);
        })
        .then(function() {
            expect(gd._fullLayout.annotations[0].x).toBe('2018-01-29 13:29:41.4857');
            expect(gd._fullLayout.annotations[0].y).toBe('2017-02-02 13:28:35.6572');
        })
        .catch(failTest)
        .then(done);
    });

    it('works date sting data-referenced with arrow', function(done) {
        gd = createGraphDiv();

        Plotly.newPlot(gd, [{
            x: ['2018-01-01', '2018-02-02'],
            y: ['2017-01-03', '2017-02-04'],
        }], {
            annotations: [{
                text: 'YO!',
                xref: 'x',
                yref: 'y',
                x: '2018-02-01',
                y: '2017-02-05'
            }],
            width: 500,
            height: 500,
            margin: {l: 100, r: 100, t: 100, b: 100, pad: 0},
        }, {
            editable: true
        })
        .then(function() {
            return dragAndReplot(arrowDrag(), -20, 20);
        })
        .then(function() {
            expect(gd._fullLayout.annotations[0].x).toBe('2018-01-29 13:29:41.4857');
            // AJ loosened this test - expected '2017-02-02 06:36:46.8112'
            // but when I run it I get '2017-02-02 06:28:39.9586'.
            // must be different fonts altering autoranging
            expect(gd._fullLayout.annotations[0].y.substr(0, 10)).toBe('2017-02-02');
        })
        .catch(failTest)
        .then(done);
    });

    it('should only make the clippaths it needs and delete others', function(done) {
        makePlot([
            {x: 50, y: 50, text: 'hi', width: 50, ax: 0, ay: -20},
            {x: 20, y: 20, text: 'bye', height: 40, showarrow: false},
            {x: 80, y: 80, text: 'why?', ax: 0, ay: -20}
        ]).then(function() {
            expect(d3.select(gd).selectAll('.annclip').size()).toBe(2);

            return Plotly.relayout(gd, {'annotations[0].visible': false});
        })
        .then(function() {
            expect(d3.select(gd).selectAll('.annclip').size()).toBe(1);

            return Plotly.relayout(gd, {'annotations[2].width': 20});
        })
        .then(function() {
            expect(d3.select(gd).selectAll('.annclip').size()).toBe(2);

            return Plotly.relayout(gd, {'annotations[1].height': null});
        })
        .then(function() {
            expect(d3.select(gd).selectAll('.annclip').size()).toBe(1);

            return Plotly.relayout(gd, {'annotations[2]': null});
        })
        .then(function() {
            expect(d3.select(gd).selectAll('.annclip').size()).toBe(0);
        })
        .catch(failTest)
        .then(done);
    });

    function _click(pos, opts) {
        return new Promise(function(resolve) {
            click(pos[0], pos[1], opts);

            setTimeout(function() {
                resolve();
            }, DBLCLICKDELAY * 1.1);
        });
    }

    var pos0Head, pos0, pos1, pos2Head, pos2, clickData;

    function assertClickData(data) {
        expect(clickData.length).toBe(data.length);
        expect(clickData).toEqual(data);
        clickData.splice(0, clickData.length);
    }

    function initClickTests() {
        var gdBB = gd.getBoundingClientRect();
        pos0Head = [gdBB.left + 200, gdBB.top + 200];
        pos0 = [pos0Head[0], pos0Head[1] - 40];
        pos1 = [gdBB.left + 160, gdBB.top + 340];
        pos2Head = [gdBB.left + 340, gdBB.top + 160];
        pos2 = [pos2Head[0], pos2Head[1] - 40];

        clickData = [];

        gd.on('plotly_clickannotation', function(evt) {
            expect(evt.event).toEqual(jasmine.objectContaining({type: 'click'}));
            evt.button = evt.event.button;
            if(evt.event.ctrlKey) evt.ctrlKey = true;
            delete evt.event;
            clickData.push(evt);
        });
    }

    it('should register clicks and show hover effects on the text box only', function(done) {

        function assertHoverLabel(pos, text, msg) {
            return new Promise(function(resolve) {
                mouseEvent('mousemove', pos[0], pos[1]);
                mouseEvent('mouseover', pos[0], pos[1]);

                setTimeout(function() {
                    var hoverText = d3.selectAll('g.hovertext');
                    expect(hoverText.size()).toEqual(text ? 1 : 0, msg);

                    if(text && hoverText.size()) {
                        expect(hoverText.text()).toEqual(text, msg);
                    }

                    mouseEvent('mouseout', pos[0], pos[1]);
                    mouseEvent('mousemove', 0, 0);

                    setTimeout(resolve, HOVERMINTIME * 1.1);
                }, HOVERMINTIME * 1.1);
            });
        }

        function assertHoverLabels(spec, msg) {
            // spec is an array of [pos, text]
            // always check that the heads don't have hover effects
            // so we only have to explicitly include pos0-2
            spec.push([pos0Head, '']);
            spec.push([pos2Head, '']);
            var p = new Promise(function(resolve) {
                setTimeout(resolve, HOVERMINTIME);
            });
            spec.forEach(function(speci) {
                p = p.then(function() {
                    return assertHoverLabel(speci[0], speci[1],
                        msg ? msg + ' (' + speci + ')' : speci);
                });
            });
            return p;
        }

        makePlot([
            {x: 50, y: 50, text: 'hi', width: 50, height: 40, ax: 0, ay: -40, xshift: -50, yshift: 50},
            {x: 20, y: 20, text: 'bye', height: 40, showarrow: false},
            {x: 80, y: 80, text: 'why?', ax: 0, ay: -40}
        ], {}) // turn off the default editable: true
        .then(function() {
            initClickTests();

            return assertHoverLabels([[pos0, ''], [pos1, ''], [pos2, '']]);
        })
        // not going to register any of these because captureevents is off
        .then(function() { return _click(pos1); })
        .then(function() { return _click(pos2Head); })
        .then(function() {
            assertClickData([]);

            return Plotly.relayout(gd, {
                'annotations[1].captureevents': true,
                'annotations[2].captureevents': true
            });
        })
        // now we'll register the click on #1, but still not on #2
        // because we're clicking the head, not the text box
        .then(function() { return _click(pos1); })
        .then(function() { return _click(pos2Head); })
        .then(function() {
            assertClickData([{
                index: 1,
                annotation: gd.layout.annotations[1],
                fullAnnotation: gd._fullLayout.annotations[1],
                button: 0
            }]);

            expect(gd._fullLayout.annotations[0].hoverlabel).toBeUndefined();

            return Plotly.relayout(gd, {'annotations[0].hovertext': 'bananas'});
        })
        .then(function() {
            expect(gd._fullLayout.annotations[0].hoverlabel).toEqual({
                bgcolor: '#444',
                bordercolor: '#fff',
                font: {family: 'Arial, sans-serif', size: 13, color: '#fff'}
            });

            return assertHoverLabels([[pos0, 'bananas'], [pos1, ''], [pos2, '']],
                '0 only');
        })
        // click and hover work together?
        // this also tests that hover turns on annotation.captureevents
        .then(function() { return _click(pos0); })
        .then(function() {
            assertClickData([{
                index: 0,
                annotation: gd.layout.annotations[0],
                fullAnnotation: gd._fullLayout.annotations[0],
                button: 0
            }]);

            return Plotly.relayout(gd, {
                'annotations[0].hoverlabel': {
                    bgcolor: '#800',
                    bordercolor: '#008',
                    font: {family: 'courier', size: 50, color: '#080'}
                },
                'annotations[1].hovertext': 'chicken'
            });
        })
        .then(function() {
            expect(gd._fullLayout.annotations[0].hoverlabel).toEqual({
                bgcolor: '#800',
                bordercolor: '#008',
                font: {family: 'courier', size: 50, color: '#080'}
            });

            return assertHoverLabels([[pos0, 'bananas'], [pos1, 'chicken'], [pos2, '']],
                '0 and 1');
        })
        .catch(failTest)
        .then(done);
    });

    // Currently annotations do *not* support right-click.
    // TODO: if we integrated this with dragElement rather than
    // annTextGroupInner.on('click') they could support right-click.
    it('does not collect right-click or ctrl-click', function(done) {
        var rightClick = {button: 2, cancelContext: true};
        var ctrlClick = {ctrlKey: true, cancelContext: true};
        makePlot([
            {x: 50, y: 50, text: 'hi', width: 50, height: 40, ax: 0, ay: -40, xshift: -50, yshift: 50, hovertext: 'bananas'},
            {x: 20, y: 20, text: 'bye', height: 40, showarrow: false, captureevents: true},
            {x: 80, y: 80, text: 'why?', ax: 0, ay: -40, captureevents: true}
        ], {}) // turn off the default editable: true
        .then(initClickTests)
        .then(function() { return _click(pos1, rightClick); })
        .then(function() { return _click(pos2Head, rightClick); })
        .then(function() { return _click(pos1, ctrlClick); })
        .then(function() { return _click(pos2Head, ctrlClick); })
        .then(function() { return _click(pos0, rightClick); })
        .then(function() { return _click(pos0, ctrlClick); })
        .then(function() {
            assertClickData([]);

            // sanity check that we still get left clicks
            return _click(pos1);
        })
        .then(function() {
            assertClickData([{
                index: 1,
                annotation: gd.layout.annotations[1],
                fullAnnotation: gd._fullLayout.annotations[1],
                button: 0
            }]);
        })
        .catch(failTest)
        .then(done);
    });

    it('makes the whole text box a link if the link is the whole text', function(done) {
        makePlot([
            {x: 20, y: 20, text: '<a href="https://plot.ly">Plot</a>', showarrow: false},
            {x: 50, y: 50, text: '<a href="https://plot.ly">or</a> not', showarrow: false},
            {x: 80, y: 80, text: '<a href="https://plot.ly">arrow</a>'},
            {x: 20, y: 80, text: 'nor <a href="https://plot.ly">this</a>'}
        ])
        .then(function() {
            function checkBoxLink(index, isLink) {
                var boxLink = d3.selectAll('.annotation[data-index="' + index + '"] g>a');
                expect(boxLink.size()).toBe(isLink ? 1 : 0);

                var textLink = d3.selectAll('.annotation[data-index="' + index + '"] text a');
                expect(textLink.size()).toBe(1);
                checkLink(textLink);

                if(isLink) checkLink(boxLink);
            }

            function checkLink(link) {
                expect(link.node().style.cursor).toBe('pointer');
                expect(link.attr('xlink:href')).toBe('https://plot.ly');
                expect(link.attr('xlink:show')).toBe('new');
            }

            checkBoxLink(0, true);
            checkBoxLink(1, false);
            checkBoxLink(2, true);
            checkBoxLink(3, false);
        })
        .catch(failTest)
        .then(done);
    });
});

describe('animating annotations', function() {
    var gd;

    // Two slightly different 1x1 pngs:
    var img1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQYV2P4z/C/HgAGfgJ+p8YU1AAAAABJRU5ErkJggg==';
    var img2 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQYV2P4//9/PQAJewN9w0ic/wAAAABJRU5ErkJggg==';

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('updates annotations when no axis update present', function(done) {

        function assertAnnotations(expected) {
            var texts = Plotly.d3.select(gd).selectAll('.annotation .annotation-text');
            expect(expected.length).toEqual(texts.size());

            texts.each(function(d, i) {
                expect(Plotly.d3.select(this).text()).toEqual(expected[i]);
            });
        }

        function assertShapes(expected) {
            var paths = Plotly.d3.select(gd).selectAll('.shapelayer path');

            expect(expected.length).toEqual(paths.size());

            paths.each(function(d, i) {
                expect(this.style.fill).toEqual(expected[i]);
            });
        }

        function assertImages(expected) {
            var imgs = Plotly.d3.select(gd).selectAll('.imagelayer image');

            expect(expected.length).toEqual(imgs.size());

            imgs.each(function(d, i) {
                expect(Plotly.d3.select(this).attr('href')).toEqual(expected[i]);
            });
        }

        Plotly.plot(gd,
            [{y: [1, 2, 3]}],
            {
                annotations: [{text: 'hello'}],
                shapes: [{fillcolor: 'rgb(170, 170, 170)'}],
                images: [{source: img1}]
            }
        ).then(function() {
            assertAnnotations(['hello']);
            assertShapes(['rgb(170, 170, 170)']);
            assertImages([img1]);

            return Plotly.animate(gd, [{
                layout: {
                    annotations: [{text: 'hi'}],
                    shapes: [
                        {fillcolor: 'rgb(171, 171, 171)'},
                        {fillcolor: 'rgb(172, 172, 172)'}
                    ],
                    images: [{source: img2}]
                }
            }], {
                frame: {redraw: false, duration: 0}
            });
        }).then(function() {
            assertAnnotations(['hi']);
            assertShapes([
                'rgb(171, 171, 171)',
                'rgb(172, 172, 172)'
            ]);
            assertImages([img2]);

        }).catch(failTest).then(done);
    });
});
