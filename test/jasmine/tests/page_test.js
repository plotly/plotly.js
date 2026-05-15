var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');

var d3Select = require('../../strict-d3').select;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('page rendering', function() {
    'use strict';

    var gd;

    afterEach(destroyGraphDiv);

    beforeEach(function() {
        gd = createGraphDiv();
    });

    it('should hide all elements if the div is hidden with visibility:hidden', function(done) {
        // Note: we don't need to test the case of display: none, because that
        // halts all rendering of children, regardless of their display/visibility properties
        // and interestingly, unlike `visibility` which gets inherited as a computed style,
        // display: none does not propagate through to children so we can't actually see
        // that they're invisible - I guess the only way to tell that would be

        // make a plot that has pretty much all kinds of plot elements
        // start with plot_types, because it has all the subplot types already
        var mock = Lib.extendDeep({}, require('../../image/mocks/plot_types.json'));

        mock.data.push(
            {type: 'contour', z: [[1, 2], [3, 4]], coloring: 'heatmap'}
        );

        mock.layout.annotations = [
            {x: 1, y: 1, text: '$x+y$'},
            {x: 1, y: 1, text: 'not math', ax: -20, ay: -20}
        ];

        mock.layout.shapes = [{x0: 0.5, x1: 1.5, y0: 0.5, y1: 1.5}];

        mock.layout.images = [{
            source: 'https://images.plot.ly/language-icons/api-home/python-logo.png',
            xref: 'paper',
            yref: 'paper',
            x: 0,
            y: 1,
            sizex: 0.2,
            sizey: 0.2,
            xanchor: 'right',
            yanchor: 'bottom'
        }];

        // then merge in a few more with other component types
        mock.layout.updatemenus = require('../../image/mocks/updatemenus.json').layout.updatemenus;
        mock.layout.sliders = require('../../image/mocks/sliders.json').layout.sliders;

        mock.layout.xaxis.title = {text: 'XXX'};
        mock.layout.showlegend = true;

        return Plotly.newPlot(gd, mock.data, mock.layout).then(function() {
            var gd3 = d3Select(gd);
            var allPresentationElements = gd3.selectAll('path,text,rect,image,canvas');

            gd3.style('visibility', 'hidden');

            // visibility: hidden is inherited by all children (unless overridden
            // somewhere in the tree)
            allPresentationElements.each(function() {
                expect(window.getComputedStyle(this).visibility).toBe('hidden');
            });

            gd3.style({visibility: null, display: 'none'});

            // display: none is not inherited, but will zero-out the bounding box
            // in principle we shouldn't need to do this test, as display: none
            // cannot be overridden in a child, but it's included here for completeness.
            allPresentationElements.each(function() {
                var bBox = this.getBoundingClientRect();
                expect(bBox.width).toBe(0);
                expect(bBox.height).toBe(0);
            });
        })
        .then(done, done.fail);
    });
});
