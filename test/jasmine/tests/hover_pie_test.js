var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');

describe('pie hovering', function() {
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

            /*
             * expected = [{
             *         v: 4,
             *         label: '3',
             *         color: '#ff7f0e',
             *         i: 3,
             *         hidden: false,
             *         text: '26.7%',
             *         px1: [0,-60],
             *         pxmid: [-44.588689528643656,-40.14783638153149],
             *         midangle: -0.8377580409572781,
             *         px0: [-59.67131372209641,6.2717077960592],
             *         largeArc: 0,
             *         cxFinal: 200,
             *         cyFinal: 160
             *     }];
             */
            var futureData;


            gd.on('plotly_hover', function(data) {
                futureData = data;
            });

            mouseEvent('mouseover', width / 2, height / 2);
            expect(futureData.points.length).toEqual(1);
            expect(Object.keys(futureData.points[0])).toEqual([
                'v', 'label', 'color', 'i', 'hidden',
                'text', 'px1', 'pxmid', 'midangle',
                'px0', 'largeArc', 'cxFinal', 'cyFinal'
            ]);
            expect(futureData.points[0].i).toEqual(3);
        });

        it('should fire when moving from one slice to another', function(done) {
            var count = 0,
                futureData = [];

            gd.on('plotly_hover', function(data) {
                count++;
                futureData.push(data);
            });

            mouseEvent('mouseover', 180, 140);
            setTimeout(function() {
                mouseEvent('mouseover', 240, 200);
                expect(count).toEqual(2);
                expect(futureData[0]).not.toEqual(futureData[1]);
                done();
            }, 100);
        });
    });
});
