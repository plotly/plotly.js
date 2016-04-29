var Plotly = require('@lib/index');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');

describe('config argument', function() {

    describe('showLink attribute', function() {

        var gd;

        beforeEach(function(done) {
            gd = createGraphDiv();
            done();
        });

        afterEach(destroyGraphDiv);

        it('should not display the edit link by default', function() {
            Plotly.plot(gd, [], {});

            var link = document.getElementsByClassName('js-plot-link-container')[0];

            expect(link.textContent).toBe('');

            var bBox = link.getBoundingClientRect();
            expect(bBox.width).toBe(0);
            expect(bBox.height).toBe(0);
        });

        it('should display a link when true', function() {
            Plotly.plot(gd, [], {}, { showLink: true });

            var link = document.getElementsByClassName('js-plot-link-container')[0];

            expect(link.textContent).toBe('Edit chart »');

            var bBox = link.getBoundingClientRect();
            expect(bBox.width).toBeGreaterThan(0);
            expect(bBox.height).toBeGreaterThan(0);
        });
    });


    describe('editable attribute', function() {

        var gd;

        beforeEach(function(done) {
            gd = createGraphDiv();

            Plotly.plot(gd, [
                { x: [1,2,3], y: [1,2,3] },
                { x: [1,2,3], y: [3,2,1] }
            ], {
                width: 600,
                height: 400
            }, { editable: true })
            .then(done);
        });

        afterEach(destroyGraphDiv);

        function checkIfEditable(elClass, text) {
            var label = document.getElementsByClassName(elClass)[0];

            expect(label.textContent).toBe(text);

            var labelBox = label.getBoundingClientRect(),
                labelX = labelBox.left + labelBox.width / 2,
                labelY = labelBox.top + labelBox.height / 2;

            mouseEvent('click', labelX, labelY);

            var editBox = document.getElementsByClassName('plugin-editable editable')[0];
            expect(editBox).toBeDefined();
            expect(editBox.textContent).toBe(text);
            expect(editBox.getAttribute('contenteditable')).toBe('true');
        }

        it('should make titles editable', function() {
            checkIfEditable('gtitle', 'Click to enter Plot title');
        });

        it('should make x axes labels editable', function() {
            checkIfEditable('g-xtitle', 'Click to enter X axis title');
        });

        it('should make y axes labels editable', function() {
            checkIfEditable('g-ytitle', 'Click to enter Y axis title');
        });

        it('should make legend labels editable', function() {
            checkIfEditable('legendtext', 'trace 0');
        });

        it('should make legends draggable', function() {

            var legend = document.getElementsByClassName('legend')[0],
                legendBox = legend.getBoundingClientRect(),
                legendX = legendBox.left + legendBox.width / 2,
                legendY = legendBox.top + legendBox.height / 2;

            mouseEvent('mousedown', legendX, legendY);
            mouseEvent('mousemove', legendX - 20, legendY + 20);
            mouseEvent('mouseup', legendX - 20, legendY + 20);

            var movedlegendBox = legend.getBoundingClientRect();

            expect(movedlegendBox.left).not.toBe(legendBox.left);
            expect(movedlegendBox.top).not.toBe(legendBox.top);

        });
    });
});
