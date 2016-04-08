var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');

describe('pie unhovering', function() {
    var mock = require('@mocks/pie_simple.json');

    describe('event data', function() {
        var mockCopy = Lib.extendDeep({}, mock),
            width = mockCopy.layout.width,
            height = mockCopy.layout.height,
            gd;

        beforeEach(function(done) {
            gd = createGraphDiv();

            Plotly.plot(gd, mockCopy.data, mockCopy.layout)
                .then(done);
        });

        afterEach(destroyGraphDiv);

        it('should contain the correct fields', function() {
            var futureData;

            gd.on('plotly_unhover', function(data) {
                futureData = data;
            });

            var x = width / 2
            var y = height / 2
            mouseEvent('mouseover', x, y);
            mouseEvent('mouseout', x, y);

            expect(futureData.points.length).toEqual(1);
            expect(Object.keys(futureData.points[0])).toEqual([
                    'v', 'label', 'color', 'i', 'hidden',
                    'text', 'px1', 'pxmid', 'midangle',
                    'px0', 'largeArc', 'cxFinal', 'cyFinal'
                ]);
            expect(futureData.points[0].i).toEqual(3);
        });

        it('should fire when the mouse moves off the graph', function(done) {
            var count = 0
            futureData = [];

            gd.on('plotly_unhover', function(data) {
                count++;
            });

            setTimeout(function() {
                mouseEvent('mouseover', 180, 140);
                mouseEvent('mouseout', 180, 140);
                expect(count).toEqual(1);
                done();
            }, 100);
        });
    });
});
