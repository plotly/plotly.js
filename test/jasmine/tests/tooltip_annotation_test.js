console.log('Testing Tooltip Feature');
var Plotly = require('../../../lib/index');
var modeBarButtons = require('../../../src/components/modebar/buttons');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var tooltipHeatmapMock = require('../../image/mocks/tooltip_template_heatmap.json');
var tooltipHistogramSubplotsMock = require('../../image/mocks/tooltip_histogram_subplots.json');
var tooltipLogScatterMock = require('../../image/mocks/tooltip_log_scatter.json');
var click = require('../assets/click');

describe('Tooltip interactions', function() {
    var gd;

    beforeAll(function(done) {
        console.log('Creating graph div and initializing plot...');
        Object.defineProperty(document, 'visibilityState', {value: 'visible', writable: true});
        Object.defineProperty(document, 'hidden', {value: false, writable: true});
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
        click(249, 242);

        setTimeout(function() {
            console.log('Checking if annotation has been created...');
            expect(gd._fullLayout.annotations.length).toBe(1);
            var expectedText = 'x: 3<br>y: 4.5<br>z: 0.9677';
            expect(gd._fullLayout.annotations[0].text).toBe(expectedText);
            console.log('Annotation created with text:', gd._fullLayout.annotations[0].text);
            done();
        }, 20);
    });

    it('should not add a second tooltip on same point', function(done) {
        console.log('Simulating second tooltip on same point...');
        click(237, 242);// click on same data point but out of the drag cursor zone of the tooltip arrow

        setTimeout(function() {
            console.log('Checking if annotation has NOT been created...');
            expect(gd._fullLayout.annotations.length).toBe(1);// No extra tooltip annotation
            done();
        }, 20);
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
        }, 20);
    });

    it('should deactivate tooltip on button click and stop creating tooltips', function(done) {
        console.log('Deactivating tooltip...');
        modeBarButtons.tooltip.click(gd);
        setTimeout(function() {
            expect(gd._fullLayout._tooltipEnabled).toBe('off');
            console.log('Tooltip is deactivated:', gd._fullLayout._tooltipEnabled);

            // Attempt to trigger a tooltip creation event
            console.log('Attempting to create tooltip when feature is deactivated...');
            click(250, 250);

            setTimeout(function() {
                // Check that no new annotations were added
                expect(gd._fullLayout.annotations.length).toBe(0);
                console.log('No new annotations created.');
                done();
            }, 20);
        }, 20);
    });
});

describe('Histogram Tooltip interactions', function() {
    var gd;

    beforeAll(function(done) {
        console.log('Creating Histogram graph div and initializing plot...');
        Object.defineProperty(document, 'visibilityState', {value: 'visible', writable: true});
        Object.defineProperty(document, 'hidden', {value: false, writable: true});
        gd = createGraphDiv();
        Plotly.newPlot(gd, tooltipHistogramSubplotsMock.data, tooltipHistogramSubplotsMock.layout, tooltipHistogramSubplotsMock.config)
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

    it('should create a tooltip annotation on H plot click', function(done) {
        console.log('Simulating plot click for tooltip...');
        click(134, 332);

        setTimeout(function() {
            console.log('Checking if annotation has been created...');
            expect(gd._fullLayout.annotations.length).toBe(1);
            var expectedText = 'x: 6<br>y: 7.5';
            expect(gd._fullLayout.annotations[0].text).toBe(expectedText);
            console.log('Annotation created with text:', gd._fullLayout.annotations[0].text);
            done();
        }, 100);// needed more time for next tooltip correct placement
    });

    it('should create a tooltip annotation on second V plot click', function(done) {
        console.log('Simulating plot click for tooltip...');
        click(456, 149);

        setTimeout(function() {
            console.log('Checking if annotation has been created...');
            expect(gd._fullLayout.annotations.length).toBe(2);
            var expectedText = 'x: 7.5<br>y: 5';
            expect(gd._fullLayout.annotations[1].text).toBe(expectedText);
            console.log('Annotation created with text:', gd._fullLayout.annotations[1].text);
            done();
        }, 20);
    });
});

describe('Log Tooltip interactions', function() {
    var gd;

    beforeAll(function(done) {
        console.log('Creating log axis graph div and initializing plot...');
        gd = createGraphDiv();
        Plotly.newPlot(gd, tooltipLogScatterMock.data, tooltipLogScatterMock.layout, tooltipLogScatterMock.config)
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

    it('should create a tooltip annotation on first log plot click', function(done) {
        console.log('Simulating plot click for tooltip...');
        click(232, 293);

        setTimeout(function() {
            console.log('Checking if annotation has been created...');
            expect(gd._fullLayout.annotations.length).toBe(1);
            var expectedText = 'x: 1000<br>y: 10';
            expect(gd._fullLayout.annotations[0].text).toBe(expectedText);
            console.log('Annotation created with text:', gd._fullLayout.annotations[0].text);
            done();
        }, 100);// needed more time for next tooltip correct placement
    });

    it('should create a tooltip annotation on second log plot click', function(done) {
        console.log('Simulating plot click for tooltip...');
        click(540, 117);

        setTimeout(function() {
            console.log('Checking if another annotation has been created...');
            expect(gd._fullLayout.annotations.length).toBe(2);
            var expectedText = 'x: 25<br>y: 1e+4';
            expect(gd._fullLayout.annotations[1].text).toBe(expectedText);
            console.log('Annotation created with text:', gd._fullLayout.annotations[1].text);
            done();
        }, 20);
    });
});
