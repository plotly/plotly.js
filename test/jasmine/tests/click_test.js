var Plotly = require('@src/index');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');


describe('click event', function() {
    var mock = require('@mocks/14.json');

    describe('event data', function() {
        var mockCopy = Lib.extendDeep({}, mock),
            clientX = 351,
            clientY = 223,
            gd;

        function click() {
            mouseEvent('mousemove', clientX, clientY);
            mouseEvent('mousedown', clientX, clientY);
            mouseEvent('mouseup', clientX, clientY);
        }

        beforeEach(function(done) {
            gd = createGraphDiv();

            Plotly.plot(gd, mockCopy.data, mockCopy.layout)
                .then(done);
        });

        afterEach(destroyGraphDiv);

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
    });
});
