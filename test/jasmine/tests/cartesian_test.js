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

describe('relayout', function() {

    describe('axis category attributes', function() {
        var mock = require('@mocks/basic_bar.json');

        var gd, mockCopy;

        beforeEach(function() {
            mockCopy = Lib.extendDeep({}, mock);
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should response to \'categoryarray\' and \'categoryorder\' updates', function(done) {
            function assertCategories(list) {
                d3.selectAll('g.xtick').each(function(_, i) {
                    var tick = d3.select(this).select('text');
                    expect(tick.html()).toEqual(list[i]);
                });
            }

            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
                assertCategories(['giraffes', 'orangutans', 'monkeys']);

                return Plotly.relayout(gd, 'xaxis.categoryorder', 'category descending');
            }).then(function() {
                var list = ['orangutans', 'monkeys', 'giraffes'];

                expect(gd._fullLayout.xaxis._initialCategories).toEqual(list);
                assertCategories(list);

                return Plotly.relayout(gd, 'xaxis.categoryorder', null);
            }).then(function() {
                assertCategories(['giraffes', 'orangutans', 'monkeys']);

                return Plotly.relayout(gd, {
                    'xaxis.categoryarray': ['monkeys', 'giraffes', 'orangutans']
                });
            }).then(function() {
                var list = ['monkeys', 'giraffes', 'orangutans'];

                expect(gd.layout.xaxis.categoryarray).toEqual(list);
                expect(gd._fullLayout.xaxis.categoryarray).toEqual(list);
                expect(gd._fullLayout.xaxis._initialCategories).toEqual(list);
                assertCategories(list);

                done();
            });
        });
    });

});
