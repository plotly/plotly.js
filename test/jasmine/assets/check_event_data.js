var Plotly = require('@lib/index');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var Lib = require('@src/lib');

var hover = require('../assets/hover');

'use strict';

module.exports = function checkEventData(mock, x, y, additionalFields) {
    var mockCopy = Lib.extendDeep({}, mock);
    var gd;

    beforeEach(function(done) {
        gd = createGraphDiv();

        Plotly.plot(gd, mockCopy.data, mockCopy.layout)
                .then(done);
    });

    afterEach(destroyGraphDiv);

    it('should contain the correct fields', function() {
        var hoverData;

        gd.on('plotly_hover', function(data) {
            hoverData = data;
        });

        hover(x, y);

        var fields = [
            'curveNumber',
            'data', 'fullData',
            'xaxis', 'yaxis', 'x', 'y',
        ].concat(additionalFields);

        fields.forEach(function(field) {
            expect(Object.keys(hoverData.points[0])).toContain(field);
        });
    });
};
