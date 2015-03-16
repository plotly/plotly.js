describe('Test scatter', function () {
    'use strict';

    /* global Plotly */

    describe('isBubble', function() {
        it('should return true when marker.size is an Array', function() {
            var trace = {
                marker: {
                    size: [1, 4, 2, 10]
                }
            },
            isBubble = Plotly.Scatter.isBubble(trace);

            expect(isBubble).toBe(true);
        });

        it('should return false when marker.size is an number', function() {
            var trace = {
                marker: {
                    size: 10
                }
            },
            isBubble = Plotly.Scatter.isBubble(trace);

            expect(isBubble).toBe(false);
        });

        it('should return false when marker.size is not defined', function() {
            var trace = {
                marker: {
                    color: 'red'
                }
            },
            isBubble = Plotly.Scatter.isBubble(trace);

            expect(isBubble).toBe(false);
        });

        it('should return false when marker is not defined', function() {
            var trace = {
                line: {
                    color: 'red'
                }
            },
            isBubble = Plotly.Scatter.isBubble(trace);

            expect(isBubble).toBe(false);
        });

    });
});
