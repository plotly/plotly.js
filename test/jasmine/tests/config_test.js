var Plotly = require('@lib/index');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('config argument', function() {

    var gd;

    beforeEach(function(done) {
        gd = createGraphDiv();
        done();
    });

    afterEach(destroyGraphDiv);

    describe('showLink attribute', function() {

        it('should not display the edit link by default', function() {
            Plotly.plot(gd, [], {});

            var link = document.getElementsByClassName('js-plot-link-container')[0];

            expect(link.textContent).toBe('');

            var bBox = link.getBoundingClientRect();
            expect(bBox.width).toBe(0);
            expect(bBox.height).toBe(0);
        });

        it('should display a link when true', function() {
            Plotly.plot(gd, [], {}, { showLink: true });

            var link = document.getElementsByClassName('js-plot-link-container')[0];

            expect(link.textContent).toBe('Edit chart »');

            var bBox = link.getBoundingClientRect();
            expect(bBox.width).toBeGreaterThan(0);
            expect(bBox.height).toBeGreaterThan(0);
        });
    });
});
