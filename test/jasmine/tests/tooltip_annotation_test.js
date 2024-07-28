console.log('Testing Tooltip Feature');
var Plotly = require('../../../lib/index');
var modeBarButtons = require('../../../src/components/modebar/buttons');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var tooltipHeatmapMock = require('../../image/mocks/tooltip_heatmap.json');

describe('Tooltip interactions', function() {
    var gd;

    beforeAll(function(done) {
        console.log('Creating graph div and initializing plot...');
        gd = createGraphDiv();
        Plotly.newPlot(gd, tooltipHeatmapMock.data, tooltipHeatmapMock.layout, tooltipHeatmapMock.config)
        .then(function() {
            console.log('Plot initialized.');
            done();
        }).catch(function(error) {
            console.error('Error initializing plot:', error);
        });
    });

    afterAll(function() {
        console.log('Destroying graph div...');
        destroyGraphDiv();
    });

    it('should enable tooltip on button click', function(done) {
        console.log('Enabling tooltip...');
        modeBarButtons.tooltip.click(gd);
        setTimeout(function() {
            console.log('Checking if tooltip has been enabled...');
            expect(gd._fullLayout._tooltipEnabled).toBe('on');
            expect(gd._tooltipClickHandler).toBeDefined();
            console.log('Tooltip is enabled:', gd._fullLayout._tooltipEnabled);
            done();
        }, 100);
    });

    it('should create a tooltip annotation on plot click', function(done) {
        console.log('Simulating plot click for tooltip...');
        gd.emit('plotly_click', {
            points: [{
                x: 3,
                y: 4.5,
                z: 0.9677474816893965,
                curveNumber: 0,
                pointNumber: [9, 6],
                xaxis: gd._fullLayout.xaxis,
                yaxis: gd._fullLayout.yaxis
            }]
        });

        setTimeout(function() {
            console.log('Checking if annotation has been created...');
            expect(gd._fullLayout.annotations.length).toBe(1);
            var expectedText = 'x: 3.00,<br>y: 4.50,<br>z: 0.968';
            expect(gd._fullLayout.annotations[0].text).toBe(expectedText);
            console.log('Annotation created with text:', gd._fullLayout.annotations[0].text);
            done();
        }, 500);
    });

    it('should simulate user clearing annotation text and remove annotation', function(done) {
        console.log('Simulating user clearing annotation text...');
        // Find the specific DOM element or use Plotly's API to simulate the text being cleared
        gd._fullLayout.annotations[0].text = '';  // Directly setting it for simulation purposes
        Plotly.relayout(gd, { 'annotations[0].text': '' }); // Simulate relayout command that might be triggered by UI interaction

        setTimeout(function() {
            console.log('Checking if annotation has been removed...');
            expect(gd._fullLayout.annotations.length).toBe(0);
            console.log('Annotation successfully removed.');
            done();
        }, 100);
    });

    it('should deactivate tooltip on button click and stop creating tooltips', function(done) {
        console.log('Deactivating tooltip...');
        modeBarButtons.tooltip.click(gd);
        setTimeout(function() {
            expect(gd._fullLayout._tooltipEnabled).toBe('off');
            console.log('Tooltip is deactivated:', gd._fullLayout._tooltipEnabled);

            // Attempt to trigger a tooltip creation event
            console.log('Attempting to create tooltip when feature is deactivated...');
            gd.emit('plotly_click', {
                points: [{
                    x: 5,
                    y: 5,
                    curveNumber: 0,
                    pointNumber: [10, 7],
                    xaxis: gd._fullLayout.xaxis,
                    yaxis: gd._fullLayout.yaxis
                }]
            });

            setTimeout(function() {
                // Check that no new annotations were added
                expect(gd._fullLayout.annotations.length).toBe(0);
                console.log('No new annotations created.');
                done();
            }, 100);
        }, 100);
    });
});
