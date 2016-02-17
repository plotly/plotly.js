var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var DBLCLICKDELAY = require('@src/plots/cartesian/constants').DBLCLICKDELAY;

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');


describe('click event', function() {
    var mock = require('@mocks/14.json');

    afterEach(destroyGraphDiv);

    var mockCopy = Lib.extendDeep({}, mock),
        clientX = 351,
        clientY = 223,
        gd;

    // cartesian click events events use the hover data
    // from the mousemove events and then simulate
    // a click event on mouseup
    function click() {
        mouseEvent('mousemove', clientX, clientY);
        mouseEvent('mousedown', clientX, clientY);
        mouseEvent('mouseup', clientX, clientY);
    }

    function doubleClick(cb) {
        click();
        setTimeout(function() {
            click();
            cb();
        }, DBLCLICKDELAY / 2);
    }

    beforeEach(function(done) {
        gd = createGraphDiv();

        Plotly.plot(gd, mockCopy.data, mockCopy.layout)
            .then(done);
    });

    it('should contain the correct fields', function() {
        var futureData;

        gd.on('plotly_click', function(data) {
            futureData = data;
        });

        click();

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

    it('should trigger double click if two clicks are \'close\' together', function(done) {
        var futureData;

        gd.on('plotly_doubleclick', function(data) {
            futureData = data;
        });

        doubleClick(function() {
            expect(futureData).toBe(null);
            done();
        });
    });
});
