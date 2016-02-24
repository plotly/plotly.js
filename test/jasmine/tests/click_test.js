var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var DBLCLICKDELAY = require('@src/plots/cartesian/constants').DBLCLICKDELAY;

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');


describe('click interactions', function() {
    var mock = require('@mocks/14.json'),
        mockCopy = Lib.extendDeep({}, mock),
        gd;

    var pointPos = [351, 223],
        blankPos = [70, 363];

    afterEach(destroyGraphDiv);

    // cartesian click events events use the hover data
    // from the mousemove events and then simulate
    // a click event on mouseup
    function click(x, y) {
        mouseEvent('mousemove', x, y);
        mouseEvent('mousedown', x, y);
        mouseEvent('mouseup', x, y);
    }

    function doubleClick(x, y, cb) {
        click(x, y);
        setTimeout(function() {
            click(x, y);
            cb();
        }, DBLCLICKDELAY / 2);
    }

    beforeEach(function(done) {
        gd = createGraphDiv();

        Plotly.plot(gd, mockCopy.data, mockCopy.layout)
            .then(done);
    });

    describe('click events', function() {
        var futureData;

        beforeEach(function() {
            gd.on('plotly_click', function(data) {
                futureData = data;
            });
        });

        it('should not be trigged when not on data points', function() {
            click(blankPos[0], blankPos[1]);
            expect(futureData).toBe(undefined);
        });

        it('should contain the correct fields', function() {
            click(pointPos[0], pointPos[1]);
            expect(futureData.points.length).toEqual(1);

            var pt = futureData.points[0];
            expect(Object.keys(pt)).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber',
                'x', 'y', 'xaxis', 'yaxis'
            ]);
            expect(pt.curveNumber).toEqual(0);
            expect(pt.pointNumber).toEqual(11);
            expect(pt.x).toEqual(0.125);
            expect(pt.y).toEqual(2.125);
        });
    });

    describe('double click events', function() {
        var futureData;

        beforeEach(function() {
            gd.on('plotly_doubleclick', function(data) {
                futureData = data;
            });
        });

        it('should return null', function(done) {
            doubleClick(pointPos[0], pointPos[1], function() {
                expect(futureData).toBe(null);
                done();
            });
        });
    });
});
