var Annotations = require('@src/components/annotations');
var Plots = require('@src/plots/plots');

describe('Test annotations', function() {
    'use strict';

    describe('supplyLayoutDefaults', function() {
        it('should default to not use absolute arrow tail', function() {
            var annotationDefaults = {};
            annotationDefaults._has = Plots._hasPlotType.bind(annotationDefaults);

            Annotations.supplyLayoutDefaults({ annotations: [{ showarrow: true, arrowhead: 2}] }, annotationDefaults);

            expect(annotationDefaults.annotations[0].absoluteArrowTail).toBe(false);
        });

        it('should convert ax/ay date coordinates to milliseconds if absoluteArrowTail is true', function() {
            var annotationOut = { xaxis: { type: 'date', range: ['2000-01-01', '2016-01-01'] }};
            annotationOut._has = Plots._hasPlotType.bind(annotationOut);

            var annotationIn = {
                annotations: [{ showarrow: true, absoluteArrowTail: true, x: '2008-07-01', ax: '2004-07-01', y: 0, ay: 50}]
            };

            Annotations.supplyLayoutDefaults(annotationIn, annotationOut);

            expect(annotationIn.annotations[0].ax).toEqual(1088654400000);
        });
    });
});
