var d3 = require('d3');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

/**
 * common test that components work as registered
 * expects bar, scatter3d, filter, and calendars to be registered
 * but the test is that they may have been registered in any order
 */
module.exports = function checkComponent(Plotly) {
    describe('core (svg 2d, scatter) and registered (bar) traces and transforms', function() {
        var gd;

        var mock = {
            data: [
                {
                    // x data is date so we coerce a calendar
                    x: ['2001-01-01', '2002-01-01', '2003-01-01'],
                    y: [1, 3, 5]
                },
                {
                    x: ['2001-01-01', '2002-01-01', '2003-01-01'],
                    y: [1, 3, 5],
                    type: 'bar',
                    transforms: [{
                        type: 'filter',
                        operation: '<',
                        target: 'y',
                        value: '4',
                        // need an explicit calendar, as filter uses a default of null
                        // the rest of them get the default calendar filled in
                        valuecalendar: 'nepali'
                    }]
                }
            ]
        };

        beforeEach(function(done) {
            gd = createGraphDiv();
            Plotly.plot(gd, mock.data, mock.layout).then(done);
        });

        afterEach(destroyGraphDiv);

        it('should graph scatter traces with calendar attributes', function() {
            var nodes = d3.selectAll('g.trace.scatter');

            expect(nodes.size()).toEqual(1);

            // compare to core_test
            expect(gd._fullLayout.calendar).toBe('gregorian');
            expect(gd._fullLayout.xaxis.calendar).toBe('gregorian');
            expect(gd._fullData[0].xcalendar).toBe('gregorian');
        });

        it('should graph bar traces with calendar attributes', function() {
            var nodes = d3.selectAll('g.trace.bars');

            expect(nodes.size()).toEqual(1);
            expect(gd._fullData[1].xcalendar).toBe('gregorian');
            expect(gd._fullData[1].transforms[0].valuecalendar).toBe('nepali');
        });
    });

    describe('registered subplot (gl3d)', function() {
        var gd;

        var mock = require('@mocks/gl3d_world-cals');
        // just pick out the scatter3d trace
        mock.data = [mock.data[1]];
        var xaxisCalendar = mock.layout.scene.xaxis.calendar;
        var zDataCalendar = mock.data[0].zcalendar;

        beforeEach(function(done) {
            gd = createGraphDiv();
            Plotly.plot(gd, mock.data, mock.layout).then(done);
        });

        afterEach(destroyGraphDiv);

        it('should graph gl3d axes and 3d plot types with calendars', function() {
            expect(xaxisCalendar).toBeDefined();
            expect(zDataCalendar).toBeDefined();

            expect(gd._fullLayout.scene.xaxis.calendar).toBe(xaxisCalendar);
            expect(gd._fullData[0].zcalendar).toBe(zDataCalendar);
        });
    });
};
