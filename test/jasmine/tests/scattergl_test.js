var Plotly = require('@lib/index');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');

describe('end-to-end scattergl tests', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('should create a plot with text labels', function(done) {
        Plotly.react(gd, [{
            type: 'scattergl',
            mode: 'text+lines',
            x: [1, 2, 3, 4, 5, 6, 7],
            y: [2, 3, 4, 5, 6, 7, 8],
            text: 'Test'
        }]).then(function() {
            var fullLayout = gd._fullLayout;
            var subplot = fullLayout._plots.xy;
            var scene = subplot._scene;
            expect(scene.glText.length).toEqual(1);
        }).catch(failTest).then(done);
    });

    it('should update a plot with text labels', function(done) {
        Plotly.react(gd, [{
            type: 'scattergl',
            mode: 'text+lines',
            x: [1, 2, 3, 4, 5, 6, 7],
            y: [2, 3, 4, 5, 6, 7, 8],
            text: 'Test'
        }]).then(function() {
            var fullLayout = gd._fullLayout;
            var subplot = fullLayout._plots.xy;
            var scene = subplot._scene;
            expect(scene.glText.length).toEqual(1);

            // add plots
            return Plotly.react(gd, [
                {
                    type: 'scattergl',
                    mode: 'text+lines',
                    x: [1, 2, 3, 4, 5, 6, 7],
                    y: [2, 3, 4, 5, 6, 7, 8],
                    text: 'Test'
                },
                {
                    type: 'scattergl',
                    mode: 'text+lines',
                    x: [1, 2, 3, 4, 5, 6, 7],
                    y: [3, 4, 5, 6, 7, 8, 9],
                    text: 'Test 2'
                },
                {
                    type: 'scattergl',
                    mode: 'text+lines',
                    x: [1, 2, 3, 4, 5, 6, 7],
                    y: [4, 5, 6, 7, 8, 9, 10],
                    text: 'Test 3'
                }
            ]);
        }).then(function() {
            var fullLayout = gd._fullLayout;
            var subplot = fullLayout._plots.xy;
            var scene = subplot._scene;
            expect(scene.glText.length).toEqual(3);

            // remove plots
            return Plotly.react(gd, [
                {
                    type: 'scattergl',
                    mode: 'text+lines',
                    x: [1, 2, 3, 4, 5, 6, 7],
                    y: [2, 3, 4, 5, 6, 7, 8],
                    text: 'Test'
                },
                {
                    type: 'scattergl',
                    mode: 'text+lines',
                    x: [1, 2, 3, 4, 5, 6, 7],
                    y: [3, 4, 5, 6, 7, 8, 9],
                    text: 'Test 2'
                }
            ]);
        }).then(function() {
            var fullLayout = gd._fullLayout;
            var subplot = fullLayout._plots.xy;
            var scene = subplot._scene;
            expect(scene.glText.length).toEqual(2);
        }).catch(failTest).then(done);
    });
});
