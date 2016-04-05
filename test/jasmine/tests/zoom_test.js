var d3 = require('d3');

var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');


describe('zoom box element', function() {
    var mock = require('@mocks/14.json');

    var gd;
    beforeEach(function(done) {
        gd = createGraphDiv();

        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.dragmode = 'zoom';

        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
    });

    afterEach(destroyGraphDiv);

    it('should be appended to the zoom layer', function() {
        var x0 = 100;
        var y0 = 200;
        var x1 = 150;
        var y1 = 200;

        mouseEvent('mousemove', x0, y0);
        expect(d3.selectAll('.zoomlayer > .zoombox').size())
            .toEqual(0);
        expect(d3.selectAll('.zoomlayer > .zoombox-corners').size())
            .toEqual(0);

        mouseEvent('mousedown', x0, y0);
        mouseEvent('mousemove', x1, y1);
        expect(d3.selectAll('.zoomlayer > .zoombox').size())
            .toEqual(1);
        expect(d3.selectAll('.zoomlayer > .zoombox-corners').size())
            .toEqual(1);

        mouseEvent('mouseup', x1, y1);
        expect(d3.selectAll('.zoomlayer > .zoombox').size())
            .toEqual(0);
        expect(d3.selectAll('.zoomlayer > .zoombox-corners').size())
            .toEqual(0);
    });
});
