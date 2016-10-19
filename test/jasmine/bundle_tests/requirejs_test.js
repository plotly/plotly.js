describe('plotly.js + require.js', function() {
    'use strict';

    it('should preserve require.js globals', function() {
        expect(window.requirejs).toBeDefined();
        expect(window.define).toBeDefined();
        expect(window.require).toBeDefined();
    });

    it('should be able to import plotly.min.js', function(done) {
        require(['plotly'], function(Plotly) {
            expect(Plotly).toBeDefined();
            done();
        });
    });
});
