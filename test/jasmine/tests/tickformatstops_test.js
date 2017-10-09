var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var Axes = require('@src/plots/cartesian/axes');
var Fx = require('@src/components/fx');
var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var selectButton = require('../assets/modebar_button');
var fail = require('../assets/fail_test');

var mock = require('@mocks/tickformatstops.json');

function getZoomInButton(gd) {
    return selectButton(gd._fullLayout._modeBar, 'zoomIn2d');
}

function getZoomOutButton(gd) {
    return selectButton(gd._fullLayout._modeBar, 'zoomOut2d');
}

function getFormatter(format) {
    return d3.time.format.utc(format);
}

describe('Test Axes.getTickformat', function() {
    'use strict';

    it('get proper tickformatstop for linear axis', function() {
        var lineartickformatstops = [
            {
                dtickrange: [null, 1],
                value: '.f2',
            },
            {
                dtickrange: [1, 100],
                value: '.f1',
            },
            {
                dtickrange: [100, null],
                value: 'g',
            }
        ];
        expect(Axes.getTickFormat({
            type: 'linear',
            tickformatstops: lineartickformatstops,
            dtick: 0.1
        })).toEqual(lineartickformatstops[0].value);

        expect(Axes.getTickFormat({
            type: 'linear',
            tickformatstops: lineartickformatstops,
            dtick: 1
        })).toEqual(lineartickformatstops[1].value);

        expect(Axes.getTickFormat({
            type: 'linear',
            tickformatstops: lineartickformatstops,
            dtick: 99
        })).toEqual(lineartickformatstops[1].value);
        expect(Axes.getTickFormat({
            type: 'linear',
            tickformatstops: lineartickformatstops,
            dtick: 99999
        })).toEqual(lineartickformatstops[2].value);
    });

    it('get proper tickformatstop for date axis', function() {
        var MILLISECOND = 1;
        var SECOND = MILLISECOND * 1000;
        var MINUTE = SECOND * 60;
        var HOUR = MINUTE * 60;
        var DAY = HOUR * 24;
        var WEEK = DAY * 7;
        var MONTH = 'M1'; // or YEAR / 12;
        var YEAR = 'M12'; // or 365.25 * DAY;
        var datetickformatstops = [
            {
                dtickrange: [null, SECOND],
                value: '%H:%M:%S.%L ms' // millisecond
            },
            {
                dtickrange: [SECOND, MINUTE],
                value: '%H:%M:%S s' // second
            },
            {
                dtickrange: [MINUTE, HOUR],
                value: '%H:%M m' // minute
            },
            {
                dtickrange: [HOUR, DAY],
                value: '%H:%M h' // hour
            },
            {
                dtickrange: [DAY, WEEK],
                value: '%e. %b d' // day
            },
            {
                dtickrange: [WEEK, MONTH],
                value: '%e. %b w' // week
            },
            {
                dtickrange: [MONTH, YEAR],
                value: '%b \'%y M' // month
            },
            {
                dtickrange: [YEAR, null],
                value: '%Y Y' // year
            }
        ];
        expect(Axes.getTickFormat({
            type: 'date',
            tickformatstops: datetickformatstops,
            dtick: 100
        })).toEqual(datetickformatstops[0].value); // millisecond

        expect(Axes.getTickFormat({
            type: 'date',
            tickformatstops: datetickformatstops,
            dtick: 1000
        })).toEqual(datetickformatstops[1].value); // second

        expect(Axes.getTickFormat({
            type: 'date',
            tickformatstops: datetickformatstops,
            dtick: 1000 * 60 * 60 * 3 // three hours
        })).toEqual(datetickformatstops[3].value); // hour

        expect(Axes.getTickFormat({
            type: 'date',
            tickformatstops: datetickformatstops,
            dtick: 1000 * 60 * 60 * 24 * 7 * 2 // two weeks
        })).toEqual(datetickformatstops[5].value); // week

        expect(Axes.getTickFormat({
            type: 'date',
            tickformatstops: datetickformatstops,
            dtick: 'M1'
        })).toEqual(datetickformatstops[6].value); // month

        expect(Axes.getTickFormat({
            type: 'date',
            tickformatstops: datetickformatstops,
            dtick: 'M5'
        })).toEqual(datetickformatstops[6].value); // month

        expect(Axes.getTickFormat({
            type: 'date',
            tickformatstops: datetickformatstops,
            dtick: 'M24'
        })).toEqual(datetickformatstops[7].value); // year
    });

    it('get proper tickformatstop for log axis', function() {
        var logtickformatstops = [
            {
                dtickrange: [null, 'L0.01'],
                value: '.f3',
            },
            {
                dtickrange: ['L0.01', 'L1'],
                value: '.f2',
            },
            {
                dtickrange: ['D1', 'D2'],
                value: '.f1',
            },
            {
                dtickrange: [1, null],
                value: 'g'
            }
        ];
        expect(Axes.getTickFormat({
            type: 'log',
            tickformatstops: logtickformatstops,
            dtick: 'L0.0001'
        })).toEqual(logtickformatstops[0].value);

        expect(Axes.getTickFormat({
            type: 'log',
            tickformatstops: logtickformatstops,
            dtick: 'L0.1'
        })).toEqual(logtickformatstops[1].value);

        expect(Axes.getTickFormat({
            type: 'log',
            tickformatstops: logtickformatstops,
            dtick: 'L2'
        })).toEqual(undefined);
        expect(Axes.getTickFormat({
            type: 'log',
            tickformatstops: logtickformatstops,
            dtick: 'D2'
        })).toEqual(logtickformatstops[2].value);
        expect(Axes.getTickFormat({
            type: 'log',
            tickformatstops: logtickformatstops,
            dtick: 1
        })).toEqual(logtickformatstops[3].value);
    });
});

describe('Test tickformatstops:', function() {
    'use strict';

    var mockCopy, gd;

    beforeEach(function() {
        gd = createGraphDiv();
        mockCopy = Lib.extendDeep({}, mock);
    });

    afterEach(destroyGraphDiv);

    it('handles zooming-in until milliseconds zoom level', function(done) {
        var promise = Plotly.plot(gd, mockCopy.data, mockCopy.layout);

        var testCount = 0;

        var zoomIn = function() {
            promise = promise.then(function() {
                getZoomInButton(gd).click();
                var xLabels = Axes.calcTicks(gd._fullLayout.xaxis);
                var formatter = getFormatter(Axes.getTickFormat(gd._fullLayout.xaxis));
                var expectedLabels = xLabels.map(function(d) {return formatter(new Date(d.x));});
                var actualLabels = xLabels.map(function(d) {return d.text;});
                expect(expectedLabels).toEqual(actualLabels);
                testCount++;

                if(gd._fullLayout.xaxis.dtick > 1) {
                    zoomIn();
                } else {
                    // make sure we tested as many levels as we thought we would
                    expect(testCount).toBe(32);
                    done();
                }
            });
        };
        zoomIn();
    });

    it('handles zooming-out until years zoom level', function(done) {
        var promise = Plotly.plot(gd, mockCopy.data, mockCopy.layout);

        var testCount = 0;

        var zoomOut = function() {
            promise = promise.then(function() {
                getZoomOutButton(gd).click();
                var xLabels = Axes.calcTicks(gd._fullLayout.xaxis);
                var formatter = getFormatter(Axes.getTickFormat(gd._fullLayout.xaxis));
                var expectedLabels = xLabels.map(function(d) {return formatter(new Date(d.x));});
                var actualLabels = xLabels.map(function(d) {return d.text;});
                expect(expectedLabels).toEqual(actualLabels);
                testCount++;

                if(typeof gd._fullLayout.xaxis.dtick === 'number' ||
                    typeof gd._fullLayout.xaxis.dtick === 'string' && parseInt(gd._fullLayout.xaxis.dtick.replace(/\D/g, '')) < 48) {
                    zoomOut();
                } else {
                    // make sure we tested as many levels as we thought we would
                    expect(testCount).toBe(5);
                    done();
                }
            });
        };
        zoomOut();
    });

    it('responds to hover', function(done) {
        var evt = { xpx: 270, ypx: 10 };

        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
            Fx.hover(gd, evt, 'xy');

            var hoverTrace = gd._hoverdata[0];
            var formatter = getFormatter(Axes.getTickFormat(gd._fullLayout.xaxis));

            expect(hoverTrace.curveNumber).toEqual(0);
            expect(hoverTrace.pointNumber).toEqual(3);
            expect(hoverTrace.x).toEqual('2005-04-01');
            expect(hoverTrace.y).toEqual(0);

            expect(d3.selectAll('g.axistext').size()).toEqual(1);
            expect(d3.selectAll('g.hovertext').size()).toEqual(1);
            expect(d3.selectAll('g.axistext').select('text').html()).toEqual(formatter(new Date(hoverTrace.x)));
            expect(d3.selectAll('g.hovertext').select('text').html()).toEqual('0');
        })
        .catch(fail)
        .then(done);
    });

});
