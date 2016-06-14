require('@src/plotly');
var Plots = require('@src/plots/plots');
var Annotations = require('@src/components/annotations');
var Dates = require('@src/lib/dates');

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
