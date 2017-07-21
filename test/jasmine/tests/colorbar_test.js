var Plotly = require('@lib/index');
var Colorbar = require('@src/components/colorbar');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Test colorbar:', function() {
    'use strict';

    describe('hasColorbar', function() {
        var hasColorbar = Colorbar.hasColorbar,
            trace;

        it('should return true when marker colorbar is defined', function() {
            trace = {
                marker: {
                    colorbar: {},
                    line: {
                        colorbar: {}
                    }
                }
            };
            expect(hasColorbar(trace.marker)).toBe(true);
            expect(hasColorbar(trace.marker.line)).toBe(true);

            trace = {
                marker: {
                    line: {}
                }
            };
            expect(hasColorbar(trace.marker)).toBe(false);
            expect(hasColorbar(trace.marker.line)).toBe(false);
        });
    });

    describe('floating point limits', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('does not lock up on tiny fractional ranges', function(done) {
            var z = [
                [9607345622458638.0, 9607345622458652.0, 9607345622458652.0, 9607345622458646.0, 9607345622458652.0, 9607345622458650.0, 9607345622458650.0, 9607345622458646.0],
                [9607345622458654.0, 9607345622458640.0, 9607345622458650.0, 9607345622458652.0, 9607345622458652.0, 9607345622458654.0, 9607345622458650.0, 9607345622458652.0],
                [9607345622458654.0, 9607345622458652.0, 9607345622458638.0, 9607345622458652.0, 9607345622458650.0, 9607345622458652.0, 9607345622458654.0, 9607345622458650.0],
                [9607345622458650.0, 9607345622458652.0, 9607345622458650.0, 9607345622458632.0, 9607345622458644.0, 9607345622458646.0, 9607345622458646.0, 9607345622458650.0],
                [9607345622458654.0, 9607345622458652.0, 9607345622458650.0, 9607345622458650.0, 9607345622458638.0, 9607345622458654.0, 9607345622458654.0, 9607345622458650.0],
                [9607345622458650.0, 9607345622458654.0, 9607345622458650.0, 9607345622458646.0, 9607345622458652.0, 9607345622458638.0, 9607345622458646.0, 9607345622458652.0],
                [9607345622458654.0, 9607345622458652.0, 9607345622458654.0, 9607345622458650.0, 9607345622458654.0, 9607345622458652.0, 9607345622458640.0, 9607345622458654.0],
                [9607345622458650.0, 9607345622458652.0, 9607345622458650.0, 9607345622458652.0, 9607345622458650.0, 9607345622458654.0, 9607345622458654.0, 9607345622458638.0]
            ];
            Plotly.newPlot(gd, [{type: 'heatmap', z: z}]).then(done);
        });
    });
});
