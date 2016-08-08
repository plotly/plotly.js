var Annotations = require('@src/components/annotations');

var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');
var Dates = require('@src/lib/dates');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('Test annotations', function() {
    'use strict';

    describe('supplyLayoutDefaults', function() {
        it('should default to pixel for axref/ayref', function() {
            var annotationDefaults = {};
            annotationDefaults._has = Plots._hasPlotType.bind(annotationDefaults);

            Annotations.supplyLayoutDefaults({ annotations: [{ showarrow: true, arrowhead: 2}] }, annotationDefaults);

            expect(annotationDefaults.annotations[0].axref).toEqual('pixel');
            expect(annotationDefaults.annotations[0].ayref).toEqual('pixel');
        });

        it('should convert ax/ay date coordinates to milliseconds if tail is in axis terms and axis is a date', function() {
            var annotationOut = { xaxis: { type: 'date', range: ['2000-01-01', '2016-01-01'] }};
            annotationOut._has = Plots._hasPlotType.bind(annotationOut);

            var annotationIn = {
                annotations: [{ showarrow: true, axref: 'x', ayref: 'y', x: '2008-07-01', ax: '2004-07-01', y: 0, ay: 50}]
            };

            Annotations.supplyLayoutDefaults(annotationIn, annotationOut);

            expect(annotationIn.annotations[0].ax).toEqual(Dates.dateTime2ms('2004-07-01'));
        });
    });
});

describe('annotations relayout', function() {
    'use strict';

    var mock = require('@mocks/annotations.json');
    var len = mock.layout.annotations.length;
    var gd;

    beforeEach(function(done) {
        gd = createGraphDiv();

        var mockData = Lib.extendDeep([], mock.data),
            mockLayout = Lib.extendDeep({}, mock.layout);

        Plotly.plot(gd, mockData, mockLayout).then(done);
    });

    afterEach(destroyGraphDiv);

    function countAnnotations() {
        return d3.selectAll('g.annotation').size();
    }

    it('should be able to add /remove annotations', function(done) {
        expect(countAnnotations()).toEqual(len);

        var ann = { text: '' };

        Plotly.relayout(gd, 'annotations[' + len + ']', ann).then(function() {
            expect(countAnnotations()).toEqual(len + 1);

            return Plotly.relayout(gd, 'annotations[' + 0 + ']', 'remove');
        }).then(function() {
            expect(countAnnotations()).toEqual(len);

            return Plotly.relayout(gd, { annotations: [] });
        }).then(function() {
            expect(countAnnotations()).toEqual(0);

            done();
        });
    });
});
