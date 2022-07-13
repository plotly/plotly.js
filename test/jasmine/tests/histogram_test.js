var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');
var Registry = require('@src/registry');
var setConvert = require('@src/plots/cartesian/set_convert');

var supplyDefaults = require('@src/traces/histogram/defaults');
var supplyDefaults2D = require('@src/traces/histogram2d/defaults');
var supplyDefaults2DC = require('@src/traces/histogram2dcontour/defaults');
var calc = require('@src/traces/histogram/calc').calc;
var getBinSpanLabelRound = require('@src/traces/histogram/bin_label_vals');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var supplyAllDefaults = require('../assets/supply_defaults');


var checkEventData = require('../assets/check_event_data');
var constants = require('@src/traces/histogram/constants');

describe('Test histogram', function() {
    'use strict';

    describe('supplyDefaults', function() {
        var traceIn,
            traceOut;

        beforeEach(function() {
            traceOut = {};
        });

        it('should set visible to false when x or y is empty', function() {
            traceIn = {
                x: []
            };
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.visible).toBe(false);

            traceIn = {
                y: []
            };
            traceOut = {};
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.visible).toBe(false);
        });

        it('should set visible to false when x or y is empty AND the other is present', function() {
            traceIn = {
                x: [],
                y: [1, 2, 2]
            };
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.visible).toBe(false);

            traceIn = {
                x: [1, 2, 2],
                y: []
            };
            traceOut = {};
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.visible).toBe(false);
        });

        it('should set visible to false when type is histogram2d(contour) and x or y are empty', function() {
            traceIn = {
                x: [],
                y: [1, 2, 2]
            };
            supplyDefaults2D(traceIn, traceOut, '', {});
            expect(traceOut.visible).toBe(false);

            traceIn = {
                x: [1, 2, 2],
                y: []
            };
            traceOut = {};
            supplyDefaults2D(traceIn, traceOut, '', {});
            expect(traceOut.visible).toBe(false);

            traceIn = {
                x: [],
                y: []
            };
            traceOut = {};
            supplyDefaults2D(traceIn, traceOut, '', {});
            expect(traceOut.visible).toBe(false);

            traceIn = {
                x: [],
                y: [1, 2, 2]
            };
            traceOut = {};
            supplyDefaults2DC(traceIn, traceOut, '', {});
            expect(traceOut.visible).toBe(false);
        });

        it('should set orientation to v by default', function() {
            traceIn = {
                x: [1, 2, 2]
            };
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.orientation).toBe('v');

            traceIn = {
                x: [1, 2, 2],
                y: [1, 2, 2]
            };
            traceOut = {};
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.orientation).toBe('v');
        });

        it('should set orientation to h when only y is supplied', function() {
            traceIn = {
                y: [1, 2, 2]
            };
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.orientation).toBe('h');
        });

        // coercing bin attributes got moved to calc because it needs
        // axis type - so here we just test that it's NOT happening

        it('should not coerce autobinx regardless of xbins', function() {
            traceIn = {
                x: [1, 2, 2],
                xbins: {
                    start: 1,
                    end: 3,
                    size: 1
                }
            };
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.autobinx).toBeUndefined();

            traceIn = {
                x: [1, 2, 2]
            };
            traceOut = {};
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.autobinx).toBeUndefined();
        });

        it('should not coerce autobiny regardless of ybins', function() {
            traceIn = {
                y: [1, 2, 2],
                ybins: {
                    start: 1,
                    end: 3,
                    size: 1
                }
            };
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.autobiny).toBeUndefined();

            traceIn = {
                y: [1, 2, 2]
            };
            traceOut = {};
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.autobiny).toBeUndefined();
        });

        it('should inherit layout.calendar', function() {
            traceIn = {
                x: [1, 2, 3]
            };
            supplyDefaults(traceIn, traceOut, '', {calendar: 'islamic'});

            // we always fill calendar attributes, because it's hard to tell if
            // we're on a date axis at this point.
            // size axis calendar is weird, but *might* be able to happen if
            // we're using histfunc=min or max (does this work?)
            expect(traceOut.xcalendar).toBe('islamic');
            expect(traceOut.ycalendar).toBe('islamic');
        });

        it('should take its own calendars', function() {
            traceIn = {
                x: [1, 2, 3],
                xcalendar: 'coptic',
                ycalendar: 'nepali'
            };
            supplyDefaults(traceIn, traceOut, '', {calendar: 'islamic'});

            expect(traceOut.xcalendar).toBe('coptic');
            expect(traceOut.ycalendar).toBe('nepali');
        });
    });

    describe('cross-trace bingroup logic:', function() {
        var gd;

        beforeEach(function() {
            spyOn(Lib, 'warn');
        });

        function _assert(msg, exp, warnMsg) {
            var allBinOpts = gd._fullLayout._histogramBinOpts;
            var groups = Object.keys(allBinOpts);

            expect(groups.length).toBe(exp.length, 'same # of bin groups| ' + msg);

            var eGroups = exp.map(function(expi) { return expi[0]; });
            expect(groups).toEqual(eGroups, 'same bin groups| ' + msg);

            exp.forEach(function(expi) {
                var k = expi[0];
                var binOpts = allBinOpts[k];

                if(!binOpts) {
                    return fail('bingroup ' + k + ' does NOT exist| ' + msg);
                }

                var traces = binOpts.traces || [];

                if(!traces.length) {
                    return fail('traces list for bingroup ' + k + ' is empty| ' + msg);
                }

                expect(traces.length).toBe(expi[1].length, 'same # of tracked traces|' + msg);

                traces.forEach(function(t, i) {
                    expect(t.index)
                        .toBe(expi[1][i], 'tracks same traces[' + i + ']|' + msg);
                    expect(t['_' + binOpts.dirs[i] + 'bingroup'])
                        .toBe(k, '_(x|y)bingroup key in trace' + i + '| ' + msg);
                });
            });

            if(warnMsg) {
                expect(Lib.warn).toHaveBeenCalledWith(warnMsg);
            } else {
                expect(Lib.warn).toHaveBeenCalledTimes(0);
            }
        }

        it('should group traces w/ same axes and w/ same orientation', function() {
            var barModes = ['group', 'stack'];

            barModes.forEach(function(mode) {
                gd = {
                    data: [
                        {type: 'histogram', y: [1, 2]},
                        {type: 'histogram', y: [2, 3]},

                        {type: 'histogram', y: [1, 2], xaxis: 'x2'},
                        {type: 'histogram', y: [3, 4], xaxis: 'x2'},

                        {type: 'histogram', y: [3, 4]},
                        {type: 'histogram', y: [2, 4], xaxis: 'x2'},

                        {type: 'histogram', x: [1, 3]},
                        {uid: 'solo', type: 'histogram', x: [2, 2], yaxis: 'y2'},
                        {type: 'histogram', x: [2, 3]}
                    ],
                    layout: {barmode: mode}
                };
                supplyAllDefaults(gd);
                _assert('under barmode:' + mode, [
                    ['xyy', [0, 1, 4]],
                    ['x2yy', [2, 3, 5]],
                    ['xyx', [6, 8]],
                    ['solo__x', [7]]
                ]);
            });
        });

        it('should group traces on matching axes and w/ same orientation', function() {
            var barModes = ['group', 'stack'];

            barModes.forEach(function(mode) {
                gd = {
                    data: [
                        {type: 'histogram', y: [1, 2]},
                        {type: 'histogram', y: [2, 3], xaxis: 'x2'},
                        {type: 'histogram', x: [1, 2], yaxis: 'y2'},
                        {type: 'histogram', x: [2, 3], yaxis: 'y2'},
                    ],
                    layout: {
                        barmode: mode,
                        xaxis2: {matches: 'x'},
                        yaxis2: {matches: 'x'}
                    }
                };
                supplyAllDefaults(gd);
                _assert('under barmode:' + mode, [
                    ['g0yy', [0, 1]],
                    ['g0g0x', [2, 3]]
                ]);
            });
        });

        it('should not group traces by default under barmode:overlay ', function() {
            gd = {
                data: [
                    {uid: 'a', type: 'histogram', y: [1, 2]},
                    {uid: 'b', type: 'histogram', y: [2, 3]},

                    {uid: 'c', type: 'histogram', y: [1, 2], xaxis: 'x2'},
                    {uid: 'd', type: 'histogram', y: [3, 4], xaxis: 'x2'},

                    {uid: 'e', type: 'histogram', y: [3, 1]},
                    {uid: 'f', type: 'histogram', y: [2, 1], xaxis: 'x2'},

                    {uid: 'g', type: 'histogram', x: [1, 2]},
                    {uid: 'h', type: 'histogram', x: [2, 3], yaxis: 'y2'},
                    {uid: 'i', type: 'histogram', x: [2, 4]}
                ],
                layout: {barmode: 'overlay'}
            };
            supplyAllDefaults(gd);
            _assert('', [
                ['a__y', [0]], ['b__y', [1]], ['c__y', [2]],
                ['d__y', [3]], ['e__y', [4]], ['f__y', [5]],
                ['g__x', [6]], ['h__x', [7]], ['i__x', [8]]
            ]);
        });

        it('should not group histogram2d* traces by default', function() {
            gd = {
                data: [
                    {uid: 'a', type: 'histogram2d', x: [1, 2], y: [1, 3]},
                    {uid: 'b', type: 'histogram2d', x: [2, 3], y: [2, 3]},
                    {uid: 'c', type: 'histogram2dcontour', x: [1, 3], y: [1, 2], xaxis: 'x2', yaxis: 'y2'},
                    {uid: 'd', type: 'histogram2dcontour', x: [2, 3], y: [2, 4], xaxis: 'x2', yaxis: 'y2'},
                ],
                layout: {}
            };
            supplyAllDefaults(gd);
            _assert('N.B. one bingroup for x, one bingroup for y for each trace', [
                ['a__x', [0]], ['a__y', [0]],
                ['b__x', [1]], ['b__y', [1]],
                ['c__x', [2]], ['c__y', [2]],
                ['d__x', [3]], ['d__y', [3]]
            ]);
        });

        it('should be able to group traces by *bingroup* under barmode:overlay ', function() {
            gd = {
                data: [
                    {bingroup: '1', type: 'histogram', y: [1, 2]},
                    {uid: 'b', type: 'histogram', y: [2, 3]},
                    {bingroup: '2', type: 'histogram', y: [1, 4], xaxis: 'x2'},
                    {bingroup: '1', type: 'histogram', y: [3, 4], xaxis: 'x2'},
                    {bingroup: '2', type: 'histogram', y: [3, 4]},
                    {uid: 'f', type: 'histogram', y: [2, 4], xaxis: 'x2'},
                    {bingroup: '3', type: 'histogram', x: [1, 5]},
                    {bingroup: '1', type: 'histogram', x: [2, 5], yaxis: 'y2'},
                    {bingroup: '3', type: 'histogram', x: [2, 5]}
                ],
                layout: {barmode: 'overlay'}
            };
            supplyAllDefaults(gd);
            _assert('', [
                ['1', [0, 3, 7]],
                ['2', [2, 4]],
                ['3', [6, 8]],
                ['b__y', [1]],
                ['f__y', [5]]
            ]);
        });

        it('should be able to group histogram2d traces by *bingroup*', function() {
            gd = {
                data: [
                    {uid: 'a', type: 'histogram2d', x: [1, 2], y: [1, 2]},
                    {uid: 'b', type: 'histogram2d', x: [1, 3], y: [1, 1]},
                    {bingroup: '1', type: 'histogram2d', x: [1, 2], y: [1, 2]},
                    {bingroup: '1', type: 'histogram2d', x: [1, 2], y: [1, 2]},
                    {uid: 'e', type: 'histogram2d', x: [1, 3], y: [1, 3]},
                ]
            };
            supplyAllDefaults(gd);
            _assert('', [
                ['a__x', [0]], ['a__y', [0]],
                ['b__x', [1]], ['b__y', [1]],
                ['1__x', [2, 3]], ['1__y', [2, 3]],
                ['e__x', [4]], ['e__y', [4]]
            ]);
        });

        it('should be able to group histogram and histogram2d* traces together', function() {
            gd = {
                data: [
                    {bingroup: '1', type: 'histogram', y: [1, 3]},
                    {bingroup: '1', type: 'histogram', y: [3, 3], xaxis: 'x2'},
                    {bingroup: '1', type: 'histogram2d', x: [1, 3], y: [3, 2]},
                    {bingroup: '1', type: 'histogram2dcontour', x: [1, 2], y: [3, 4]}
                ],
                layout: {barmode: 'overlay'}
            };
            supplyAllDefaults(gd);
            _assert('N.B. histogram2d* indices show up twice, once for x-bins, once for y-bins', [
                ['1', [0, 1]],
                ['1__x', [2, 3]],
                ['1__y', [2, 3]]
            ]);
        });

        it('should not group traces across axes of different types', function() {
            gd = {
                data: [
                    {uid: 'a', bingroup: '1', type: 'histogram', y: [1, 2]},
                    {uid: 'b', bingroup: '1', type: 'histogram', y: ['cats', 'dogs'], yaxis: 'y2'},
                ],
                layout: {barmode: 'overlay'}
            };
            supplyAllDefaults(gd);

            _assert('', [
                ['1', [0]],
                ['b__y', [1]]
            ],
                'Attempted to group the bins of trace 1 set on a type:category axis ' +
                'with bins on type:linear axis.'
            );
        });

        it('should force traces that "have to match" to have same bingroup (stack case)', function() {
            gd = {
                data: [
                    // these 3 traces "have to match"
                    {bingroup: '1', type: 'histogram', y: [1, 2]},
                    {type: 'histogram', y: [1, 3]},
                    {bingroup: '2', type: 'histogram', y: [2, 3]}
                ],
                layout: {barmode: 'stack'}
            };
            supplyAllDefaults(gd);

            _assert('used first valid bingroup to identify bin opts', [
                ['1', [0, 1, 2]]
            ],
                'Trace 2 must match within bingroup 1.' +
                ' Ignoring its bingroup: 2 setting.'
            );
        });

        it('traces that "have to match" can be grouped with traces that do not have to match using *bingroup*', function() {
            gd = {
                data: [
                    // these 2 traces "have to match"
                    {bingroup: '1', type: 'histogram', y: [1, 3]},
                    {type: 'histogram', y: [1, 3]},
                    // this one does not have to match with the above two,
                    // (it's on another subplot), but it can be grouped
                    {bingroup: '1', type: 'histogram', y: [2, 3], xaxis: 'x2', yaxis: 'y2'},
                    // this one does not have to match either
                    // (it's a histogram2d* traces), but it can be grouped
                    {xbingroup: '1', ybingroup: '1', type: 'histogram2d', x: [3, 4], y: [3, 4]}
                ],
                layout: {}
            };
            supplyAllDefaults(gd);

            _assert('', [
                // N.B ordering in *binOpts.traces* does not matter
                ['1', [0, 1, 3, 3, 2]]
            ]);
        });

        it('should not group traces across different calendars', function() {
            gd = {
                data: [
                    {uid: 'a', bingroup: '1', type: 'histogram', x: ['2000-01-01']},
                    {uid: 'b', bingroup: '1', type: 'histogram', x: ['2000-01-01'], xcalendar: 'julian'},
                ],
                layout: {barmode: 'overlay'}
            };
            supplyAllDefaults(gd);

            _assert('', [
                ['1', [0]],
                ['b__x', [1]]
            ],
                'Attempted to group the bins of trace 1 set with a julian calendar ' +
                'with bins on a gregorian calendar'
            );
        });

        it('should attempt to group traces when the *calendars* module is not registered', function() {
            var original = Registry.getComponentMethod;
            var cnt = 0;

            spyOn(Registry, 'getComponentMethod').and.callFake(function() {
                if(arguments[0] === 'calendars') {
                    cnt++;
                    return Lib.noop;
                } else {
                    return original.call(arguments);
                }
            });

            gd = {
                data: [
                    {uid: 'a', type: 'histogram', x: [1, 3]},
                    {uid: 'b', type: 'histogram', x: [1, 20]}
                ],
                layout: {barmode: 'stack'}
            };
            supplyAllDefaults(gd);

            _assert('', [
                ['xyx', [0, 1]]
            ]);

            expect(cnt).toBe(3, '# of Registry.getComponentMethod calls for *calendars* methods');
        });

        it('should force traces that "have to match" to have same bingroup (alignmentgroup case)', function() {
            var traces;

            function initTraces() {
                traces = [{}, {}, {yaxis: 'y2'}, {yaxis: 'y2'}];
                traces.forEach(function(t) {
                    t.type = 'histogram';
                    t.x = [1, 2];
                });
            }

            function _supply() {
                gd = {
                    data: traces,
                    layout: {
                        barmode: 'group',
                        grid: {rows: 2, columns: 1}
                    }
                };
                supplyAllDefaults(gd);
            }

            initTraces();
            _supply(gd);
            _assert('base (separate subplot w/o alignmentgroup)', [
                ['xyx', [0, 1]],
                ['xy2x', [2, 3]]
            ]);

            initTraces();
            [
                {alignmentgroup: 'a', offsetgroup: '-'},
                {alignmentgroup: 'a', offsetgroup: '--'},
                {alignmentgroup: 'a', offsetgroup: '-'},
                {alignmentgroup: 'a', offsetgroup: '--'}
            ].forEach(function(patch, i) {
                Lib.extendFlat(traces[i], patch);
            });
            _supply(gd);
            _assert('all in same alignmentgroup, must match', [
                ['xv', [0, 1, 2, 3]]
            ]);
        });
    });

    describe('calc', function() {
        function _calc(opts, extraTraces, layout, prependExtras) {
            var base = { type: 'histogram' };
            var trace = Lib.extendFlat({}, base, opts);
            var gd = { data: prependExtras ? [] : [trace] };

            if(layout) gd.layout = layout;

            if(Array.isArray(extraTraces)) {
                extraTraces.forEach(function(extraTrace) {
                    gd.data.push(Lib.extendFlat({}, base, extraTrace));
                });
            }

            if(prependExtras) gd.data.push(trace);

            supplyAllDefaults(gd);
            var fullTrace = gd._fullData[prependExtras ? gd._fullData.length - 1 : 0];

            if(prependExtras) {
                for(var i = 0; i < gd._fullData.length - 1; i++) {
                    calc(gd, gd._fullData[i]);
                }
            }

            var out = calc(gd, fullTrace);
            delete out[0].trace;

            // this is dumb - but some of the `ph0` values are `-0` which doesn't match `0`
            // even though -0 === 0
            out.forEach(function(cdi) {
                for(var key in cdi) {
                    if(typeof cdi[key] === 'function') cdi[key] = cdi[key]();
                    if(cdi[key] === 0) cdi[key] = 0;
                }
            });

            return out;
        }

        var oneDay = 24 * 3600000;

        it('should handle auto dates with nonuniform (month) bins', function() {
            // All data on exact years: shift so bin center is an
            // exact year, except on leap years
            var out = _calc({
                x: ['1970-01-01', '1970-01-01', '1971-01-01', '1973-01-01'],
                nbinsx: 4
            });

            // TODO: this gives half-day gaps between all but the first two
            // bars. Now that we have explicit per-bar positioning, perhaps
            // we should fill the space, rather than insisting on equal-width
            // bars?
            var d70 = Date.UTC(1970, 0, 1);
            var d71 = Date.UTC(1971, 0, 1);
            var d72 = Date.UTC(1972, 0, 1, 12);
            var d73 = Date.UTC(1973, 0, 1);
            expect(out).toEqual([
                // full calcdata has x and y too (and t in the first one),
                // but those come later from crossTraceCalc.
                {i: 0, b: 0, p: d70, s: 2, pts: [0, 1], ph0: d70, ph1: d70},
                {i: 1, b: 0, p: d71, s: 1, pts: [2], ph0: d71, ph1: d71},
                {i: 2, b: 0, p: d72, s: 0, pts: [], ph0: d72, ph1: d72},
                {i: 3, b: 0, p: d73, s: 1, pts: [3], ph0: d73, ph1: d73}
            ]);

            // All data on exact months: shift so bin center is on (31-day months)
            // or in (shorter months) that month
            out = _calc({
                x: ['1970-01-01', '1970-01-01', '1970-02-01', '1970-04-01'],
                nbinsx: 4
            });

            var d70feb = Date.UTC(1970, 1, 1);
            var d70mar = Date.UTC(1970, 2, 2, 12);
            var d70apr = Date.UTC(1970, 3, 1);
            expect(out).toEqual([
                {i: 0, b: 0, p: d70, s: 2, pts: [0, 1], ph0: d70, ph1: d70},
                {i: 1, b: 0, p: d70feb, s: 1, pts: [2], ph0: d70feb, ph1: d70feb},
                {i: 2, b: 0, p: d70mar, s: 0, pts: [], ph0: d70mar, ph1: d70mar},
                {i: 3, b: 0, p: d70apr, s: 1, pts: [3], ph0: d70apr, ph1: d70apr}
            ]);

            // data on exact days: shift so each bin goes from noon to noon
            // even though this gives kind of odd bin centers since the bins
            // are months... but the important thing is it's unambiguous which
            // bin any given day is in.
            out = _calc({
                x: ['1970-01-02', '1970-01-31', '1970-02-13', '1970-04-19'],
                nbinsx: 4
            });

            expect(out).toEqual([
                // dec 31 12:00 -> jan 31 12:00, middle is jan 16
                {i: 0, b: 0, p: Date.UTC(1970, 0, 16), s: 2, pts: [0, 1], ph0: Date.UTC(1970, 0, 1), ph1: Date.UTC(1970, 0, 31)},
                // jan 31 12:00 -> feb 28 12:00, middle is feb 14 12:00
                {i: 1, b: 0, p: Date.UTC(1970, 1, 14, 12), s: 1, pts: [2], ph0: Date.UTC(1970, 1, 1), ph1: Date.UTC(1970, 1, 28)},
                {i: 2, b: 0, p: Date.UTC(1970, 2, 16), s: 0, pts: [], ph0: Date.UTC(1970, 2, 1), ph1: Date.UTC(1970, 2, 31)},
                {i: 3, b: 0, p: Date.UTC(1970, 3, 15, 12), s: 1, pts: [3], ph0: Date.UTC(1970, 3, 1), ph1: Date.UTC(1970, 3, 30)}
            ]);
        });

        it('should handle auto dates with uniform (day) bins', function() {
            var out = _calc({
                x: ['1970-01-01', '1970-01-01', '1970-01-02', '1970-01-04'],
                nbinsx: 4
            });

            var x0 = 0;
            var x1 = x0 + oneDay;
            var x2 = x1 + oneDay;
            var x3 = x2 + oneDay;

            expect(out).toEqual([
                {i: 0, b: 0, p: x0, s: 2, pts: [0, 1], ph0: x0, ph1: x0},
                {i: 1, b: 0, p: x1, s: 1, pts: [2], ph0: x1, ph1: x1},
                {i: 2, b: 0, p: x2, s: 0, pts: [], ph0: x2, ph1: x2},
                {i: 3, b: 0, p: x3, s: 1, pts: [3], ph0: x3, ph1: x3}
            ]);
        });

        it('should handle very small bins', function() {
            var out = _calc({
                x: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
                xbins: {
                    start: 0,
                    end: 10,
                    size: 0.001
                }
            });

            expect(out.length).toEqual(9001);
        });

        it('handles single-bin data without extra bins', function() {
            var out = _calc({
                x: [2.1, 3, 3.9],
                xbins: {start: 0, end: 10, size: 2}
            });

            expect(out).toEqual([
                {i: 0, b: 0, p: 3, s: 3, width1: 2, pts: [0, 1, 2], ph0: 2, ph1: 3.9}
            ]);
        });

        it('handles single-value overlaid autobinned data with other manual bins', function() {
            var out = _calc({x: [1.1, 1.1, 1.1]}, [
                {x: [1, 2, 3, 4], xbins: {start: 0.5, end: 4.5, size: 2}},
                {x: [10, 10.5, 11, 11.5], xbins: {start: 9.8, end: 11.8, size: 0.5}}
            ], {
                barmode: 'overlay'
            });

            expect(out).toEqual([
                {i: 0, b: 0, p: 1.1, s: 3, width1: 0.5, pts: [0, 1, 2], ph0: 1.1, ph1: 1.1}
            ]);
        });

        it('handles single-value overlaid autobinned data with other auto bins', function() {
            var out = _calc({x: ['', null, 17, '', 17]}, [
                {x: [10, 20, 30, 40]},
                {x: [100, 101, 102, 103]}
            ], {
                barmode: 'overlay'
            });

            expect(out).toEqual([
                {i: 0, b: 0, p: 17, s: 2, width1: 2, pts: [2, 4], ph0: 17, ph1: 17}
            ]);
        });

        it('handles multiple single-valued overlaid autobinned traces', function() {
            var out = _calc({x: [1]}, [{x: [1]}], {barmode: 'overlay'}, true);

            expect(out).toEqual([
                {p: 1, s: 1, b: 0, pts: [0], ph1: 1, ph0: 1, width1: 1, i: 0}
            ]);
        });

        it('handles multiple single-valued overlaid autobinned traces with different values', function() {
            var out = _calc({x: [null, 13, '', 13]}, [
                {x: [5]},
                {x: [null, 29, 29, 29, null]}
            ], {
                barmode: 'overlay'
            });

            expect(out).toEqual([
                {i: 0, b: 0, p: 13, s: 2, width1: 8, pts: [1, 3], ph0: 13, ph1: 13}
            ]);
        });

        it('handles multiple single-date overlaid autobinned traces with different values', function() {
            var out = _calc({x: [null, '2011-02-03', '', '2011-02-03']}, [
                {x: ['2011-02-05']},
                {x: [null, '2015-05-05', '2015-05-05', '2015-05-05', null]}
            ], {
                barmode: 'overlay'
            });

            var p = 1296691200000;
            expect(out).toEqual([
                {i: 0, b: 0, p: p, s: 2, width1: 2 * 24 * 3600 * 1000, pts: [1, 3], ph0: p, ph1: p}
            ]);
        });

        it('handles several overlaid autobinned traces with only one value total', function() {
            var out = _calc({x: [null, 97, '', 97]}, [
                {x: [97]},
                {x: [null, 97, 97, 97, null]}
            ], {
                barmode: 'overlay'
            });

            expect(out).toEqual([
                {i: 0, b: 0, p: 97, s: 2, width1: 1, pts: [1, 3], ph0: 97, ph1: 97}
            ]);
        });

        it('can tell the difference between single-bin and single-value histograms', function() {
            var out = _calc({x: [1, 4]}, [], {barmode: 'overlay'});

            expect(out).toEqual([
                {i: 0, b: 0, p: 2, s: 2, width1: 5, pts: [0, 1], ph0: 0, ph1: 4}
            ]);

            // real single-valued trace inherits bar width from the simply single-bin trace
            out = _calc({x: [5]}, [
                {x: [1, 4]}
            ], {
                barmode: 'overlay'
            });

            expect(out).toEqual([
                {i: 0, b: 0, p: 5, s: 1, width1: 5, pts: [0], ph0: 5, ph1: 5}
            ]);
        });

        // from issue #3881
        it('handle single-value edge case 1', function() {
            var gd = {
                data: [
                    {uid: 'a', type: 'histogram', y: [1]},
                    {uid: 'b', type: 'histogram', y: [2]},

                    {uid: 'c', type: 'histogram', y: [1], xaxis: 'x2'},
                    {uid: 'd', type: 'histogram', y: [3], xaxis: 'x2'},

                    {uid: 'e', type: 'histogram', y: [3]},
                    {uid: 'f', type: 'histogram', y: [2], xaxis: 'x2'},

                    {uid: 'g', type: 'histogram', x: [1]},
                    {uid: 'h', type: 'histogram', x: [2], yaxis: 'y2'},
                    {uid: 'i', type: 'histogram', x: [2]}
                ],
                layout: {barmode: 'overlay'}
            };
            supplyAllDefaults(gd);
            Plots.doCalcdata(gd);

            var allBinOpts = gd._fullLayout._histogramBinOpts;
            var groups = Object.keys(allBinOpts);
            expect(groups).toEqual(
                ['a__y', 'b__y', 'c__y', 'd__y', 'e__y', 'f__y', 'g__x', 'h__x', 'i__x'],
                'bin groups'
            );
        });

        // from issue #3881
        it('handle single-value edge case 2', function() {
            var gd = {
                data: [
                    {bingroup: '1', type: 'histogram', y: [1]},
                    {uid: 'b', type: 'histogram', y: [2]},
                    {bingroup: '2', type: 'histogram', y: [1], xaxis: 'x2'},
                    {bingroup: '1', type: 'histogram', y: [3], xaxis: 'x2'},
                    {bingroup: '2', type: 'histogram', y: [3]},
                    {uid: 'f', type: 'histogram', y: [2], xaxis: 'x2'},
                    {bingroup: '3', type: 'histogram', x: [1]},
                    {bingroup: '1', type: 'histogram', x: [2], yaxis: 'y2'},
                    {bingroup: '3', type: 'histogram', x: [2]}
                ],
                layout: {barmode: 'overlay'}
            };
            supplyAllDefaults(gd);
            Plots.doCalcdata(gd);

            var allBinOpts = gd._fullLayout._histogramBinOpts;
            var groups = Object.keys(allBinOpts);
            expect(groups).toEqual(['1', '2', '3', 'b__y', 'f__y'], 'bin groups');
        });

        function calcPositions(opts, extraTraces, prepend) {
            return _calc(opts, extraTraces, {}, prepend).map(function(v) { return v.p; });
        }

        it('harmonizes autobins when all traces are autobinned', function() {
            var trace1 = {x: [1, 2, 3, 4]};
            var trace2 = {x: [5, 5.5, 6, 6.5]};

            expect(calcPositions(trace1)).toBeCloseToArray([0.5, 2.5, 4.5], 5);

            expect(calcPositions(trace2)).toBeCloseToArray([5.5, 6.5], 5);

            expect(calcPositions(trace1, [trace2])).toEqual([1, 3, 5]);
            expect(calcPositions(trace2, [trace1])).toEqual([5, 7]);
        });

        it('harmonizes start/end value of bins when all traces are autobinned', function(done) {
            var mock = require('@mocks/histogram_overlay-bingroup');
            var gd = createGraphDiv();
            Plotly.newPlot(gd, mock)
                .then(function(gd) {
                    destroyGraphDiv();
                    var cd0 = gd.calcdata[0];
                    var cd1 = gd.calcdata[1];
                    for(var i = 0; i < cd0.length && i < cd1.length; i++) {
                        expect(cd0[i].ph0).toBe(cd1[i].ph0);
                        expect(cd0[i].ph1).toBe(cd1[i].ph1);
                    }
                })
                .then(done, done.fail);
        });

        it('autobins all data as one', function() {
            // all integers, so all autobins should get shifted to start 0.5 lower
            // than they otherwise would.
            var trace1 = {x: [1, 2, 3, 4]};
            var trace2 = {x: [-2, 1, 4, 7]};

            // as above... size: 2
            expect(calcPositions(trace1)).toBeCloseToArray([0.5, 2.5, 4.5], 5);

            // {size: 5, start: -5.5}: -5..-1, 0..4, 5..9
            expect(calcPositions(trace2)).toEqual([-3, 2, 7]);

            // together bins match the wider trace
            expect(calcPositions(trace1, [trace2])).toBeCloseToArray([2], 5);
            expect(calcPositions(trace2, [trace1])).toEqual([-3, 2, 7]);

            // unless we add enough points to shrink the bins
            expect(calcPositions(trace2, [trace1, trace1, trace1, trace1]))
                .toBeCloseToArray([-1.5, 0.5, 2.5, 4.5, 6.5], 5);
        });

        it('harmonizes autobins with smaller manual bins', function() {
            var trace1 = {x: [1, 2, 3, 4]};
            var trace2 = {x: [5, 6, 7, 8], xbins: {start: 4.3, end: 7.1, size: 0.4}};

            // size is preserved, and start is shifted to be compatible with trace2
            // (but we can't just use start from trace2 or it would cut off all our data!)
            expect(calcPositions(trace1, [trace2])).toBeCloseToArray([
                0.9, 1.3, 1.7, 2.1, 2.5, 2.9, 3.3, 3.7, 4.1
            ], 5);
        });

        it('harmonizes autobins with larger manual bins', function() {
            var trace1 = {x: [1, 2, 3, 4]};
            var trace2 = {x: [5, 6, 7, 8], xbins: {start: 3.7, end: 15, size: 7}};

            expect(calcPositions(trace1, [trace2])).toBeCloseToArray([
                0.2, 7.2
            ], 5);
        });

        it('ignores incompatible sizes, and harmonizes start values', function() {
            var trace1 = {x: [1, 2, 3, 4], xbins: {start: 1.7, end: 3.5, size: 0.6}};
            var trace2 = {x: [5, 6, 7, 8], xbins: {start: 4.3, end: 7.1, size: 0.4}};

            // trace1 is first: all its settings are used directly,
            // and trace2 uses its size and shifts start to harmonize with it.
            expect(calcPositions(trace1, [trace2])).toBeCloseToArray([
                2.0, 2.6, 3.2
            ], 5);
            expect(calcPositions(trace2, [trace1], true)).toBeCloseToArray([
                5.0, 5.6, 6.2, 6.8
            ], 5);

            // switch the order: trace2 values win
            expect(calcPositions(trace2, [trace1])).toBeCloseToArray([
                4.9, 5.3, 5.7, 6.1, 6.5, 6.9
            ], 5);
            expect(calcPositions(trace1, [trace2], true)).toBeCloseToArray([
                2.1, 2.5, 2.9
            ], 5);
        });

        it('can take size and start from different traces in any order', function() {
            var trace1 = {x: [1, 2, 3, 4], xbins: {size: 0.6}};
            var trace2 = {x: [5, 6, 7, 8], xbins: {start: 4.8}};

            [true, false].forEach(function(prepend) {
                expect(calcPositions(trace1, [trace2], prepend)).toBeCloseToArray([
                    0.9, 1.5, 2.1, 2.7, 3.3, 3.9
                ], 5);

                expect(calcPositions(trace2, [trace1], prepend)).toBeCloseToArray([
                    5.1, 5.7, 6.3, 6.9, 7.5, 8.1
                ], 5);
            });
        });

        it('works with only a size specified', function() {
            // this used to not just lose the size, but actually errored out.
            var trace1 = {x: [1, 2, 3, 4], xbins: {size: 0.8}};
            var trace2 = {x: [5, 6, 7, 8]};

            [true, false].forEach(function(prepend) {
                expect(calcPositions(trace1, [trace2], prepend)).toBeCloseToArray([
                    1, 1.8, 2.6, 3.4, 4.2
                ], 5);

                expect(calcPositions(trace2, [trace1], prepend)).toBeCloseToArray([
                    5, 5.8, 6.6, 7.4, 8.2
                ], 5);
            });
        });

        it('ignores traces on other axes', function() {
            var trace1 = {x: [1, 2, 3, 4]};
            var trace2 = {x: [5, 5.5, 6, 6.5]};
            var trace3 = {x: [1, 1.1, 1.2, 1.3], xaxis: 'x2'};
            var trace4 = {x: [1, 1.2, 1.4, 1.6], yaxis: 'y2'};

            expect(calcPositions(trace1, [trace2, trace3, trace4])).toEqual([1, 3, 5]);
            expect(calcPositions(trace3)).toBeCloseToArray([1.1, 1.3], 5);
        });

        it('can handle TypedArrays', function() {
            var trace1 = {x: new Float32Array([1, 2, 3, 4])};
            var trace2 = {x: new Float32Array([5, 5.5, 6, 6.5])};
            var trace3 = {x: new Float64Array([1, 1.1, 1.2, 1.3]), xaxis: 'x2'};
            var trace4 = {x: new Float64Array([1, 1.2, 1.4, 1.6]), yaxis: 'y2'};

            expect(calcPositions(trace1, [trace2, trace3, trace4])).toEqual([1, 3, 5]);
            expect(calcPositions(trace3)).toBeCloseToArray([1.1, 1.3], 5);
        });

        describe('cumulative distribution functions', function() {
            var base = {
                x: [0, 5, 10, 15, 5, 10, 15, 10, 15, 15],
                y: [2, 2, 2, 14, 6, 6, 6, 10, 10, 2]
            };

            it('makes the right base histogram', function() {
                var baseOut = _calc(base);
                expect(baseOut).toEqual([
                    {i: 0, b: 0, p: 2, s: 1, pts: [0], ph0: 0, ph1: 0},
                    {i: 1, b: 0, p: 7, s: 2, pts: [1, 4], ph0: 5, ph1: 5},
                    {i: 2, b: 0, p: 12, s: 3, pts: [2, 5, 7], ph0: 10, ph1: 10},
                    {i: 3, b: 0, p: 17, s: 4, pts: [3, 6, 8, 9], ph0: 15, ph1: 15},
                ]);
            });

            // ph0, ph1, and pts have been omitted from CDFs for now
            var CDFs = [
                {p: [2, 7, 12, 17], s: [1, 3, 6, 10]},
                {
                    direction: 'decreasing',
                    p: [2, 7, 12, 17], s: [10, 9, 7, 4]
                },
                {
                    currentbin: 'exclude',
                    p: [7, 12, 17, 22], s: [1, 3, 6, 10]
                },
                {
                    direction: 'decreasing', currentbin: 'exclude',
                    p: [-3, 2, 7, 12], s: [10, 9, 7, 4]
                },
                {
                    currentbin: 'half',
                    p: [2, 7, 12, 17, 22], s: [0.5, 2, 4.5, 8, 10]
                },
                {
                    direction: 'decreasing', currentbin: 'half',
                    p: [-3, 2, 7, 12, 17], s: [10, 9.5, 8, 5.5, 2]
                },
                {
                    direction: 'decreasing', currentbin: 'half', histnorm: 'percent',
                    p: [-3, 2, 7, 12, 17], s: [100, 95, 80, 55, 20]
                },
                {
                    currentbin: 'exclude', histnorm: 'probability',
                    p: [7, 12, 17, 22], s: [0.1, 0.3, 0.6, 1]
                },
                {
                    // behaves the same as without *density*
                    direction: 'decreasing', currentbin: 'half', histnorm: 'density',
                    p: [-3, 2, 7, 12, 17], s: [10, 9.5, 8, 5.5, 2]
                },
                {
                    // behaves the same as without *density*, only *probability*
                    direction: 'decreasing', currentbin: 'half', histnorm: 'probability density',
                    p: [-3, 2, 7, 12, 17], s: [1, 0.95, 0.8, 0.55, 0.2]
                },
                {
                    currentbin: 'half', histfunc: 'sum',
                    p: [2, 7, 12, 17, 22], s: [1, 6, 19, 44, 60]
                },
                {
                    currentbin: 'half', histfunc: 'sum', histnorm: 'probability',
                    p: [2, 7, 12, 17, 22], s: [0.5 / 30, 0.1, 9.5 / 30, 22 / 30, 1]
                },
                {
                    direction: 'decreasing', currentbin: 'half', histfunc: 'max', histnorm: 'percent',
                    p: [-3, 2, 7, 12, 17], s: [100, 3100 / 32, 2700 / 32, 1900 / 32, 700 / 32]
                },
                {
                    direction: 'decreasing', currentbin: 'half', histfunc: 'min', histnorm: 'density',
                    p: [-3, 2, 7, 12, 17], s: [8, 7, 5, 3, 1]
                },
                {
                    currentbin: 'exclude', histfunc: 'avg', histnorm: 'probability density',
                    p: [7, 12, 17, 22], s: [0.1, 0.3, 0.6, 1]
                }
            ];

            CDFs.forEach(function(CDF) {
                var p = CDF.p;
                var s = CDF.s;

                it('handles direction=' + CDF.direction + ', currentbin=' + CDF.currentbin +
                        ', histnorm=' + CDF.histnorm + ', histfunc=' + CDF.histfunc, function() {
                    var traceIn = Lib.extendFlat({}, base, {
                        cumulative: {
                            enabled: true,
                            direction: CDF.direction,
                            currentbin: CDF.currentbin
                        },
                        histnorm: CDF.histnorm,
                        histfunc: CDF.histfunc
                    });
                    var out = _calc(traceIn);

                    expect(out.length).toBe(p.length);
                    out.forEach(function(outi, i) {
                        expect(outi.p).toBe(p[i]);
                        expect(outi.s).toBeCloseTo(s[i], 6);
                        expect(outi.b).toBe(0);
                    });
                });
            });
        });
    });

    describe('plot / restyle', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should update autobins correctly when restyling', function(done) {
            // note: I'm *not* testing what this does to gd.data, as that's
            // really a matter of convenience and will perhaps change later (v3?)
            var data1 = [1.5, 2, 2, 3, 3, 3, 4, 4, 5];
            Plotly.newPlot(gd, [{x: data1, type: 'histogram' }])
            .then(function() {
                expect(gd._fullData[0].xbins).toEqual({start: 1, end: 6, size: 1});
                expect(gd._fullData[0].nbinsx).toBe(0);

                // same range but fewer samples changes autobin size
                var data2 = [1.5, 5];
                return Plotly.restyle(gd, 'x', [data2]);
            })
            .then(function() {
                expect(gd._fullData[0].xbins).toEqual({start: -2.5, end: 7.5, size: 5});
                expect(gd._fullData[0].nbinsx).toBe(0);

                // different range
                var data3 = [10, 20.2, 20, 30, 30, 30, 40, 40, 50];
                return Plotly.restyle(gd, 'x', [data3]);
            })
            .then(function() {
                expect(gd._fullData[0].xbins).toEqual({start: 5, end: 55, size: 10});
                expect(gd._fullData[0].nbinsx).toBe(0);

                // explicit change to start does not update anything else
                return Plotly.restyle(gd, 'xbins.start', 3);
            })
            .then(function() {
                expect(gd._fullData[0].xbins).toEqual({start: 3, end: 55, size: 10});
                expect(gd._fullData[0].nbinsx).toBe(0);

                // restart autobin
                return Plotly.restyle(gd, 'autobinx', true);
            })
            .then(function() {
                expect(gd._fullData[0].xbins).toEqual({start: 5, end: 55, size: 10});
                expect(gd._fullData[0].nbinsx).toBe(0);

                // explicit end does not update anything else
                return Plotly.restyle(gd, 'xbins.end', 43);
            })
            .then(function() {
                expect(gd._fullData[0].xbins).toEqual({start: 5, end: 43, size: 10});
                expect(gd._fullData[0].nbinsx).toBe(0);

                // nbins would update all three, but explicit end is honored
                return Plotly.restyle(gd, 'nbinsx', 3);
            })
            .then(function() {
                expect(gd._fullData[0].xbins).toEqual({start: 0, end: 43, size: 20});
                expect(gd._fullData[0].nbinsx).toBe(3);

                // explicit size updates auto start *and* end, and moots nbins
                return Plotly.restyle(gd, {'xbins.end': null, 'xbins.size': 2});
            })
            .then(function() {
                expect(gd._fullData[0].xbins).toEqual({start: 9, end: 51, size: 2});
                expect(gd._fullData[0].nbinsx).toBeUndefined();
            })
            .then(done, done.fail);
        });

        it('respects explicit autobin: false as a one-time autobin', function(done) {
            var data1 = [1.5, 2, 2, 3, 3, 3, 4, 4, 5];
            Plotly.newPlot(gd, [{x: data1, type: 'histogram', autobinx: false }])
            .then(function() {
                // we have no bins, so even though autobin is false we have to autobin once
                // but for backward compat. calc pushes these bins back into gd.data
                // even though there's no `autobinx` attribute anymore.
                expect(gd._fullData[0].xbins).toEqual({start: 1, end: 6, size: 1});
                expect(gd.data[0].xbins).toEqual({start: 1, end: 6, size: 1});

                // since autobin is false, this will not change the bins
                var data2 = [1.5, 5];
                return Plotly.restyle(gd, 'x', [data2]);
            })
            .then(function() {
                expect(gd._fullData[0].xbins).toEqual({start: 1, end: 6, size: 1});
            })
            .then(done, done.fail);
        });

        it('allows changing axis type with new x data', function(done) {
            var x1 = [1, 1, 1, 1, 2, 2, 2, 3, 3, 4];
            var x2 = ['2017-01-01', '2017-01-01', '2017-01-01', '2017-01-02', '2017-01-02', '2017-01-03'];

            Plotly.newPlot(gd, [{x: x1, type: 'histogram'}])
            .then(function() {
                expect(gd._fullLayout.xaxis.type).toBe('linear');
                expect(gd._fullLayout.xaxis.range).toBeCloseToArray([0.5, 4.5], 3);

                return Plotly.restyle(gd, {x: [x2]});
            })
            .then(function() {
                expect(gd._fullLayout.xaxis.type).toBe('date');
                expect(gd._fullLayout.xaxis.range).toEqual(['2016-12-31 12:00', '2017-01-03 12:00']);
            })
            .then(done, done.fail);
        });

        it('can resize a plot with several histograms', function(done) {
            Plotly.newPlot(gd, [{
                type: 'histogram',
                x: [1, 1, 1, 1, 2, 2, 2, 3, 3, 4]
            }, {
                type: 'histogram',
                x: [1, 1, 1, 1, 2, 2, 2, 3, 3, 4]
            }], {
                width: 400,
                height: 400
            })
            .then(function() {
                expect(gd._fullLayout.width).toBe(400);
                expect(gd._fullLayout.height).toBe(400);

                gd._fullData.forEach(function(trace, i) {
                    expect(trace._xautoBinFinished).toBeUndefined(i);
                });

                return Plotly.relayout(gd, {width: 500, height: 500});
            })
            .then(function() {
                expect(gd._fullLayout.width).toBe(500);
                expect(gd._fullLayout.height).toBe(500);

                gd._fullData.forEach(function(trace, i) {
                    expect(trace._xautoBinFinished).toBeUndefined(i);
                });
            })
            .then(done, done.fail);
        });

        it('gives the right bar width for single-value histograms', function(done) {
            Plotly.newPlot(gd, [{
                type: 'histogram',
                x: [3, 3, 3],
                xbins: {start: 0, end: 10, size: 2}
            }])
            .then(function() {
                expect(gd._fullLayout.xaxis.range).toBeCloseToArray([2, 4], 3);
            })
            .then(done, done.fail);
        });

        it('can recalc after the first trace is hidden', function(done) {
            function assertTraceCount(n) {
                expect(gd.querySelectorAll('.trace').length).toBe(n);
            }

            Plotly.newPlot(gd, [{
                x: [1, 2, 3], type: 'histogram'
            }, {
                x: [1, 2, 3], type: 'histogram'
            }, {
                x: [1, 2, 3], type: 'histogram'
            }, {
                type: 'histogram'
            }])
            .then(function() {
                assertTraceCount(3);
                return Plotly.restyle(gd, 'visible', 'legendonly');
            })
            .then(function() {
                assertTraceCount(0);
                return Plotly.restyle(gd, 'visible', true, [1]);
            })
            .then(function() {
                assertTraceCount(1);
                return Plotly.restyle(gd, 'visible', true, [2]);
            })
            .then(function() {
                assertTraceCount(2);
                return Plotly.restyle(gd, 'visible', true);
            })
            .then(function() {
                assertTraceCount(3);
            })
            .then(done, done.fail);
        });

        it('autobins all histograms (on the same subplot) together except `visible: false`', function(done) {
            function _assertBinCenters(expectedCenters) {
                var centers = gd.calcdata.map(function(cd) {
                    return cd.map(function(cdi) { return cdi.p; });
                });

                expect(centers).toBeCloseTo2DArray(expectedCenters);
            }

            var hidden = [undefined];

            Plotly.newPlot(gd, [
                {type: 'histogram', x: [1]},
                {type: 'histogram', x: [10, 10.1, 10.2, 10.3]},
                {type: 'histogram', x: [20, 20, 20, 20, 20, 20, 20, 20, 20, 21]},
                {type: 'histogram'}
            ])
            .then(function() {
                _assertBinCenters([[0], [10], [20], hidden]);
                return Plotly.restyle(gd, 'visible', 'legendonly', [1, 2]);
            })
            .then(function() {
                _assertBinCenters([[0], hidden, hidden, hidden]);
                return Plotly.restyle(gd, 'visible', false, [1, 2]);
            })
            .then(function() {
                _assertBinCenters([[1], hidden, hidden, hidden]);
                return Plotly.restyle(gd, 'visible', [false, false, true]);
            })
            .then(function() {
                _assertBinCenters([hidden, hidden, [20, 21], hidden]);
                return Plotly.restyle(gd, 'visible', [false, true, false]);
            })
            .then(function() {
                _assertBinCenters([hidden, [10.1, 10.3], hidden, hidden]);
                // only one trace is visible, despite traces being grouped
                expect(gd._fullLayout.bargap).toBe(0);
                return Plotly.restyle(gd, 'visible', ['legendonly', true, 'legendonly']);
            })
            .then(function() {
                _assertBinCenters([hidden, [10], hidden, hidden]);
                // legendonly traces still flip us back to gapped
                expect(gd._fullLayout.bargap).toBe(0.2);
            })
            .then(done, done.fail);
        });
    });
});

describe('getBinSpanLabelRound', function() {
    function _test(leftGap, rightGap, edges, calendar, expected) {
        var ax = {type: 'not date'};
        // only date axes have any different treatment here. We could explicitly
        // test category
        if(calendar) {
            ax = {type: 'date', calendar: 'gregorian', range: [0, 1e7]};
            setConvert(ax);
        }

        var roundFn = getBinSpanLabelRound(leftGap, rightGap, edges, ax, calendar);

        var j = 0;
        var PREC = calendar ? 1 : 6;
        edges.forEach(function(edge, i) {
            if(i) {
                expect(roundFn(edge, true)).toBeCloseTo(expected[j], PREC, 'right ' + i);
                j++;
            }
            if(i < edges.length - 1) {
                expect(roundFn(edge)).toBeCloseTo(expected[j], PREC, 'left ' + i);
                j++;
            }
        });
    }

    it('works when the bin edges are round numbers and data are "continuous"', function() {
        _test(0.05, 0.3, [0, 2, 4, 6], false, [0, 1.9, 2, 3.9, 4, 5.9]);
        _test(0, 0.1, [0, 1, 2], false, [0, 0.9, 1, 1.9]);
        _test(0, 0.001, [0, 1, 2], false, [0, 0.999, 1, 1.999]);
        _test(0.1, 0.1, [115, 125, 135], false, [115, 124.9, 125, 134.9]);
        _test(0.1, 0.01, [115, 125, 135], false, [115, 124.99, 125, 134.99]);
        _test(10, 100, [5000, 6000, 7000], false, [5000, 5900, 6000, 6900]);

        // too small of a right gap: stop disambiguating data at the edge
        _test(0, 0.0009, [0, 1, 2], false, [0, 1, 1, 2]);
        _test(0.1, 0.009, [115, 125, 135], false, [115, 125, 125, 135]);
    });

    it('works when the bins are shifted to be less round than the data', function() {
        // integer or category data look like this - though categories don't even
        // get here normally, unless you explicitly ask to bin multiple categories
        // together, because uniqueValsPerBin will be true
        _test(0.5, 0.5, [-0.5, 4.5, 9.5], false, [0, 4, 5, 9]);

        _test(0.013, 0.087, [-0.013, 0.987, 1.987], false, [0, 0.9, 1, 1.9]);
        _test(500, 500, [4500, 9500, 14500], false, [5000, 9000, 10000, 14000]);
    });

    var jan17 = Date.UTC(2017, 0, 1);
    var feb17 = Date.UTC(2017, 1, 1);
    var mar17 = Date.UTC(2017, 2, 1);
    var jan18 = Date.UTC(2018, 0, 1);
    var jan19 = Date.UTC(2019, 0, 1);
    var j2116 = Date.UTC(2116, 0, 1);
    var j2117 = Date.UTC(2117, 0, 1);
    var j2216 = Date.UTC(2216, 0, 1);
    var j2217 = Date.UTC(2217, 0, 1);
    var sec = 1000;
    var min = 60 * sec;
    var hr = 60 * min;
    var day = 24 * hr;

    it('rounds dates to full fields (if larger than seconds) - round bin edges case', function() {
        // sub-second & 1-second resolution
        _test(0, 0.1, [jan17, jan17 + 1, jan17 + 2], 'gregorian',
            [jan17, jan17 + 0.9, jan17 + 1, jan17 + 1.9]);
        _test(1, 3, [jan17, jan17 + 20, jan17 + 40], 'gregorian',
            [jan17, jan17 + 19, jan17 + 20, jan17 + 39]);
        _test(5, 35, [jan17, jan17 + 1000, jan17 + 2000], 'gregorian',
            [jan17, jan17 + 990, jan17 + 1000, jan17 + 1990]);
        _test(0, 100, [jan17, jan17 + 20000, jan17 + 40000], 'gregorian',
            [jan17, jan17 + 19900, jan17 + 20000, jan17 + 39900]);
        _test(100, 2000, [jan17, jan17 + 10000, jan17 + 20000], 'gregorian',
            [jan17, jan17 + 9000, jan17 + 10000, jan17 + 19000]);

        // > second, only go to the next full field
        // 30 sec gap - still show seconds
        _test(0, 30 * sec, [jan17, jan17 + 5 * min, jan17 + 10 * min], 'gregorian',
            [jan17, jan17 + 5 * min - sec, jan17 + 5 * min, jan17 + 10 * min - sec]);
        // 1-minute gap round to minutes
        _test(10 * sec, min, [jan17, jan17 + 5 * min, jan17 + 10 * min], 'gregorian',
            [jan17, jan17 + 4 * min, jan17 + 5 * min, jan17 + 9 * min]);
        // 30-minute gap - still show minutes
        _test(0, 30 * min, [jan17, jan17 + day, jan17 + 2 * day], 'gregorian',
            [jan17, jan17 + day - min, jan17 + day, jan17 + 2 * day - min]);
        // 1-hour gap - round to hours
        _test(0, hr, [jan17, jan17 + day, jan17 + 2 * day], 'gregorian',
            [jan17, jan17 + day - hr, jan17 + day, jan17 + 2 * day - hr]);
        // 12-hour gap - still hours
        _test(0, 12 * hr, [jan17, feb17, mar17], 'gregorian',
            [jan17, feb17 - hr, feb17, mar17 - hr]);
        // 1-day gap - round to days
        _test(0, day, [jan17, feb17, mar17], 'gregorian',
            [jan17, feb17 - day, feb17, mar17 - day]);
        // 15-day gap - still days
        _test(0, 15 * day, [jan17, jan18, jan19], 'gregorian',
            [jan17, jan18 - day, jan18, jan19 - day]);
        // 28-day gap STILL gets days - in principle this might happen with data
        // that's actually monthly, if the bins edges fall on different months
        // (ie not full years) but that's a very weird edge case so I'll ignore it!
        _test(0, 28 * day, [jan17, jan18, jan19], 'gregorian',
            [jan17, jan18 - day, jan18, jan19 - day]);
        // 31-day gap - months
        _test(0, 31 * day, [jan17, jan18, jan19], 'gregorian',
            [jan17, Date.UTC(2017, 11, 1), jan18, Date.UTC(2018, 11, 1)]);
        // 365-day gap - years have enough buffer to handle leap vs nonleap years
        _test(0, 365 * day, [jan17, j2117, j2217], 'gregorian',
            [jan17, j2116, j2117, j2216]);
        // no bigger rounding than years
        _test(0, 40 * 365 * day, [jan17, j2117, j2217], 'gregorian',
            [jan17, j2116, j2117, j2216]);
    });

    it('rounds dates to full fields (if larger than seconds) - round data case', function() {
        // sub-second & 1-second resolution
        _test(0.05, 0.05, [jan17 - 0.05, jan17 + 0.95, jan17 + 1.95], 'gregorian',
            [jan17, jan17 + 0.9, jan17 + 1, jan17 + 1.9]);
        _test(0.5, 3.5, [jan17 - 0.5, jan17 + 19.5, jan17 + 39.5], 'gregorian',
            [jan17, jan17 + 19, jan17 + 20, jan17 + 39]);
        _test(5, 35, [jan17 - 5, jan17 + 995, jan17 + 1995], 'gregorian',
            [jan17, jan17 + 990, jan17 + 1000, jan17 + 1990]);
        _test(50, 50, [jan17 - 50, jan17 + 19950, jan17 + 39950], 'gregorian',
            [jan17, jan17 + 19900, jan17 + 20000, jan17 + 39900]);
        _test(500, 2500, [jan17 - 500, jan17 + 9500, jan17 + 19500], 'gregorian',
            [jan17, jan17 + 9000, jan17 + 10000, jan17 + 19000]);

        // > second, only go to the next full field
        // 30 sec gap - still show seconds
        _test(15 * sec, 15 * sec, [jan17 - 15 * sec, jan17 + 5 * min - 15 * sec, jan17 + 10 * min - 15 * sec], 'gregorian',
            [jan17 - 15 * sec, jan17 + 5 * min - 16 * sec, jan17 + 5 * min - 15 * sec, jan17 + 10 * min - 16 * sec]);
        // 1-minute gap round to minutes
        _test(30 * sec, 30 * sec, [jan17 - 30 * sec, jan17 + 5 * min - 30 * sec, jan17 + 10 * min - 30 * sec], 'gregorian',
            [jan17, jan17 + 4 * min, jan17 + 5 * min, jan17 + 9 * min]);
        // 30-minute gap - still show minutes
        _test(15 * min, 15 * min, [jan17 - 15 * min, jan17 + day - 15 * min, jan17 + 2 * day - 15 * min], 'gregorian',
            [jan17 - 15 * min, jan17 + day - 16 * min, jan17 + day - 15 * min, jan17 + 2 * day - 16 * min]);
        // 1-hour gap - round to hours
        _test(30 * min, 30 * min, [jan17 - 30 * min, jan17 + day - 30 * min, jan17 + 2 * day - 30 * min], 'gregorian',
            [jan17, jan17 + day - hr, jan17 + day, jan17 + 2 * day - hr]);
        // 12-hour gap - still hours
        _test(6 * hr, 6 * hr, [jan17 - 6 * hr, feb17 - 6 * hr, mar17 - 6 * hr], 'gregorian',
            [jan17 - 6 * hr, feb17 - 7 * hr, feb17 - 6 * hr, mar17 - 7 * hr]);
        // 1-day gap - round to days
        _test(12 * hr, 12 * hr, [jan17 - 12 * hr, feb17 - 12 * hr, mar17 - 12 * hr], 'gregorian',
            [jan17, feb17 - day, feb17, mar17 - day]);
        // 15-day gap - still days
        _test(7 * day, 8 * day, [jan17 - 7 * day, jan18 - 7 * day, jan19 - 7 * day], 'gregorian',
            [jan17 - 7 * day, jan18 - 8 * day, jan18 - 7 * day, jan19 - 8 * day]);
        // 28-day gap STILL gets days - in principle this might happen with data
        // that's actually monthly, if the bins edges fall on different months
        // (ie not full years) but that's a very weird edge case so I'll ignore it!
        _test(14 * day, 14 * day, [jan17 - 14 * day, jan18 - 14 * day, jan19 - 14 * day], 'gregorian',
            [jan17 - 14 * day, jan18 - 15 * day, jan18 - 14 * day, jan19 - 15 * day]);
        // 31-day gap - months
        _test(15 * day, 16 * day, [jan17 - 15 * day, jan18 - 15 * day, jan19 - 15 * day], 'gregorian',
            [jan17, Date.UTC(2017, 11, 1), jan18, Date.UTC(2018, 11, 1)]);
        // 365-day gap - years have enough buffer to handle leap vs nonleap years
        _test(182 * day, 183 * day, [jan17 - 182 * day, j2117 - 182 * day, j2217 - 182 * day], 'gregorian',
            [jan17, j2116, j2117, j2216]);
        // no bigger rounding than years
        _test(20 * 365 * day, 20 * 365 * day, [jan17, j2117, j2217], 'gregorian',
            [jan17, j2116, j2117, j2216]);
    });

    it('rounds (mostly) correctly when using world calendars', function() {
        var cn = 'chinese';
        var cn8 = Lib.dateTime2ms('1995-08-01', cn);
        var cn8i = Lib.dateTime2ms('1995-08i-01', cn);
        var cn9 = Lib.dateTime2ms('1995-09-01', cn);

        var cn1x00 = Lib.dateTime2ms('2000-01-01', cn);
        var cn1x01 = Lib.dateTime2ms('2001-01-01', cn);
        var cn1x02 = Lib.dateTime2ms('2002-01-01', cn);
        var cn1x10 = Lib.dateTime2ms('2010-01-01', cn);
        var cn1x20 = Lib.dateTime2ms('2020-01-01', cn);

        _test(100, 2000, [cn8i, cn8i + 10000, cn8i + 20000], cn,
            [cn8i, cn8i + 9000, cn8i + 10000, cn8i + 19000]);
        _test(500, 2500, [cn8i - 500, cn8i + 9500, cn8i + 19500], cn,
            [cn8i, cn8i + 9000, cn8i + 10000, cn8i + 19000]);

        _test(0, day, [cn8, cn8i, cn9], cn,
            [cn8, cn8i - day, cn8i, cn9 - day]);
        _test(12 * hr, 12 * hr, [cn8 - 12 * hr, cn8i - 12 * hr, cn9 - 12 * hr], cn,
            [cn8, cn8i - day, cn8i, cn9 - day]);

        _test(0, 28 * day, [cn1x00, cn1x01, cn1x02], cn,
            [cn1x00, Lib.dateTime2ms('2000-12-01', cn), cn1x01, Lib.dateTime2ms('2001-12-01', cn)]);
        _test(14 * day, 14 * day, [cn1x00 - 14 * day, cn1x01 - 14 * day, cn1x02 - 14 * day], cn,
            [cn1x00, Lib.dateTime2ms('2000-12-01', cn), cn1x01, Lib.dateTime2ms('2001-12-01', cn)]);

        _test(0, 353 * day, [cn1x00, cn1x10, cn1x20], cn,
            [cn1x00, Lib.dateTime2ms('2009-01-01', cn), cn1x10, Lib.dateTime2ms('2019-01-01', cn)]);
        // occasionally we give extra precision for world dates (month when it should be year
        // or day when it should be month). That's better than doing the opposite... not going
        // to fix now, too many edge cases, better not to complicate the logic for them all.
        _test(176 * day, 177 * day, [cn1x00 - 176 * day, cn1x10 - 176 * day, cn1x20 - 176 * day], cn, [
            Lib.dateTime2ms('1999-08-01', cn), Lib.dateTime2ms('2009-07-01', cn),
            Lib.dateTime2ms('2009-08-01', cn), Lib.dateTime2ms('2019-07-01', cn)
        ]);
    });
});

describe('event data', function() {
    var mock = require('@mocks/hist_category');
    checkEventData(mock, 100, 200, constants.eventDataKeys);
});
