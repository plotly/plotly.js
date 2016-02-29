var Plotly = require('@lib/index');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('the range slider', function() {

    var gd;

    beforeEach(function(done) {
        gd = createGraphDiv();

        Plotly.plot(gd, [{ x: [1,2,3], y: [2,3,4] }], {})
          .then(done);
    });

    afterEach(destroyGraphDiv);

    it('should be added to the DOM when specified', function() {
        // where will the slider element div be inserted?
    });

    it('should match the width of its corresponding axis', function() {

    });

    it('should start with the default range', function() {

    });

    it('should react to moving the slidebox', function() {

    });

    it('should react to resizing the slidebox', function() {

    });

    it('should react to creating a new range', function() {

    });

    it('should change the range of the plot when changed', function() {

    });
});
