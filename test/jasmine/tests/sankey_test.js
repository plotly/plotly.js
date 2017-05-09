var Plotly = require('@lib/index');
var attributes = require('@src/traces/sankey/attributes');
var Lib = require('@src/lib');
var d3 = require('d3');
var mock = require('@mocks/sankey_energy.json');
var mockDark = require('@mocks/sankey_energy_dark.json');
var Plots = require('@src/plots/plots');
var Sankey = require('@src/traces/sankey');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('sankey tests', function() {

    'use strict';

    function _supply(traceIn) {
        var traceOut = { visible: true },
            defaultColor = '#444',
            layout = { };

        Sankey.supplyDefaults(traceIn, traceOut, defaultColor, layout);

        return traceOut;
    }

    function _supplyWithLayout(traceIn, layout) {
        var traceOut = { visible: true },
            defaultColor = '#444';

        Sankey.supplyDefaults(traceIn, traceOut, defaultColor, layout);

        return traceOut;
    }

    describe('don\'t remove nodes if encountering no circularity', function() {

        it('removing a single self-pointing node', function() {
            var fullTrace = _supply({
                node: {
                    label: ['a', 'b']
                },
                link: {
                    value: [1],
                    source: [1],
                    target: [0]
                }
            });

            expect(fullTrace.node.label).toEqual(['a', 'b'], 'node labels retained');
            expect(fullTrace.link.value).toEqual([1], 'link value(s) retained');
            expect(fullTrace.link.source).toEqual([1], 'link source(s) retained');
            expect(fullTrace.link.target).toEqual([0], 'link target(s) retained');
        });
    });

    describe('log warning if issue is encountered with graph structure',
        function() {

            it('some nodes are not linked', function() {

                var warnings = [];
                spyOn(Lib, 'warn').and.callFake(function(msg) {
                    warnings.push(msg);
                });

                _supply({
                    node: {
                        label: ['a', 'b', 'c']
                    },
                    link: {
                        value: [1],
                        source: [0],
                        target: [1]
                    }
                });

                expect(warnings.length).toEqual(1);
            });
        });

    describe('sankey global defaults', function() {

        it('should not coerce trace opacity', function() {
            var gd = Lib.extendDeep({}, mock);

            Plots.supplyDefaults(gd);

            expect(gd._fullData[0].opacity).toBeUndefined();
        });

    });

    describe('sankey defaults', function() {

        it('\'Sankey\' specification should have proper arrays where mandatory',
            function() {

                var fullTrace = _supply({});

                expect(fullTrace.node.label)
                    .toEqual([], 'presence of node label array is guaranteed');

                expect(fullTrace.link.value)
                    .toEqual([], 'presence of link value array is guaranteed');

                expect(fullTrace.link.source)
                    .toEqual([], 'presence of link source array is guaranteed');

                expect(fullTrace.link.target)
                    .toEqual([], 'presence of link target array is guaranteed');

            });

        it('\'Sankey\' specification should have proper types',
            function() {

                var fullTrace = _supply({});

                expect(fullTrace.orientation)
                    .toEqual(attributes.orientation.dflt, 'use orientation by default');

                expect(fullTrace.valueformat)
                    .toEqual(attributes.valueformat.dflt, 'valueformat by default');

                expect(fullTrace.valuesuffix)
                    .toEqual(attributes.valuesuffix.dflt, 'valuesuffix by default');

                expect(fullTrace.arrangement)
                    .toEqual(attributes.arrangement.dflt, 'arrangement by default');

                expect(fullTrace.domain.x)
                    .toEqual(attributes.domain.x.dflt, 'x domain by default');

                expect(fullTrace.domain.y)
                    .toEqual(attributes.domain.y.dflt, 'y domain by default');
            });

        it('\'Sankey\' layout dependent specification should have proper types',
            function() {

                var fullTrace = _supplyWithLayout({}, {font: {family: 'Arial'}});
                expect(fullTrace.textfont)
                    .toEqual({family: 'Arial'}, 'textfont is defined');
            });

        it('\'line\' specifications should yield the default values',
            function() {

                var fullTrace = _supply({});

                expect(fullTrace.node.line.color)
                    .toEqual('#444', 'default node line color');
                expect(fullTrace.node.line.width)
                    .toEqual(0.5, 'default node line thickness');

                expect(fullTrace.link.line.color)
                    .toEqual('#444', 'default link line color');
                expect(fullTrace.link.line.width)
                    .toEqual(0, 'default link line thickness');
            });

        it('fills \'node\' colors if not specified', function() {

            var fullTrace = _supply({
                node: {
                    label: ['a', 'b']
                },
                link: {
                    source: [0],
                    target: [1],
                    value: [1]
                }
            });

            expect(Lib.isArray(fullTrace.node.color)).toBe(true, 'set up color array');

        });

    });

    describe('sankey calc', function() {

        function _calc(trace) {
            var gd = { data: [trace] };

            Plots.supplyDefaults(gd);
            var fullTrace = gd._fullData[0];
            Sankey.calc(gd, fullTrace);
            return fullTrace;
        }

        var base = { type: 'sankey' };

        it('circularity is detected', function() {

            var errors = [];
            spyOn(Lib, 'error').and.callFake(function(msg) {
                errors.push(msg);
            });

            _calc(Lib.extendDeep({}, base, {
                node: {
                    label: ['a', 'b', 'c']
                },
                link: {
                    value: [1, 1, 1],
                    source: [0, 1, 2],
                    target: [1, 2, 0]
                }
            }));

            expect(errors.length).toEqual(1);
        });

        describe('remove nodes if encountering circularity', function() {

            it('removing a single self-pointing node', function() {
                var fullTrace = _calc(Lib.extendDeep({}, base, {
                    node: {
                        label: ['a']
                    },
                    link: {
                        value: [1],
                        source: [0],
                        target: [0]
                    }
                }));

                expect(fullTrace.node.label).toEqual([], 'node label(s) removed');
                expect(fullTrace.link.value).toEqual([], 'link value(s) removed');
                expect(fullTrace.link.source).toEqual([], 'link source(s) removed');
                expect(fullTrace.link.target).toEqual([], 'link target(s) removed');

            });

            it('removing everything if detecting a circle', function() {
                var fullTrace = _calc(Lib.extendDeep({}, base, {
                    node: {
                        label: ['a', 'b', 'c', 'd', 'e']
                    },
                    link: {
                        value: [1, 1, 1, 1, 1, 1, 1, 1],
                        source: [0, 1, 2, 3],
                        target: [1, 2, 0, 4]
                    }
                }));

                expect(fullTrace.node.label).toEqual([], 'node label(s) removed');
                expect(fullTrace.link.value).toEqual([], 'link value(s) removed');
                expect(fullTrace.link.source).toEqual([], 'link source(s) removed');
                expect(fullTrace.link.target).toEqual([], 'link target(s) removed');

            });
        });
    });

    describe('lifecycle methods', function() {

        afterEach(destroyGraphDiv);

        it('Plotly.deleteTraces with two traces removes the deleted plot', function(done) {

            var gd = createGraphDiv();
            var mockCopy = Lib.extendDeep({}, mock);
            var mockCopy2 = Lib.extendDeep({}, mockDark);

            Plotly.plot(gd, mockCopy)
                .then(function() {
                    expect(gd.data.length).toEqual(1);
                    expect(d3.selectAll('.sankey').size()).toEqual(1);
                    return Plotly.plot(gd, mockCopy2);
                })
                .then(function() {
                    expect(gd.data.length).toEqual(2);
                    expect(d3.selectAll('.sankey').size()).toEqual(2);
                    return Plotly.deleteTraces(gd, [0]);
                })
                .then(function() {
                    expect(gd.data.length).toEqual(1);
                    expect(d3.selectAll('.sankey').size()).toEqual(1);
                    return Plotly.deleteTraces(gd, 0);
                })
                .then(function() {
                    expect(gd.data.length).toEqual(0);
                    expect(d3.selectAll('.sankey').size()).toEqual(0);
                    done();
                });
        });

        it('Plotly.plot does not show Sankey if \'visible\' is false', function(done) {

            var gd = createGraphDiv();
            var mockCopy = Lib.extendDeep({}, mock);

            Plotly.plot(gd, mockCopy)
                .then(function() {
                    expect(gd.data.length).toEqual(1);
                    expect(d3.selectAll('.sankey').size()).toEqual(1);
                    return Plotly.restyle(gd, 'visible', false);
                })
                .then(function() {
                    expect(gd.data.length).toEqual(1);
                    expect(d3.selectAll('.sankey').size()).toEqual(0);
                    return Plotly.restyle(gd, 'visible', true);
                })
                .then(function() {
                    expect(gd.data.length).toEqual(1);
                    expect(d3.selectAll('.sankey').size()).toEqual(1);
                    done();
                });
        });
    });
});
