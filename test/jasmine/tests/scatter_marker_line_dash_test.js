var Plotly = require('../../../lib/index');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('Test scatter marker line dash:', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('should support marker line dash', function(done) {
        Plotly.newPlot(gd, [{
            mode: 'markers',
            x: [1, 2, 3],
            y: [1, 2, 3],
            marker: {
                size: 20,
                line: {
                    color: 'red',
                    width: 2,
                    dash: 'dash'
                }
            }
        }]).then(function() {
            var markers = gd.querySelectorAll('.point');
            expect(markers.length).toBe(3);

            markers.forEach(function(node) {
                // In plotly.js, dash is applied via stroke-dasharray
                expect(node.style.strokeDasharray).not.toBe('');
            });
        })
        .then(done, done.fail);
    });

    it('should support array marker line dash', function(done) {
         Plotly.newPlot(gd, [{
            mode: 'markers',
            x: [1, 2, 3],
            y: [1, 2, 3],
            marker: {
                size: 20,
                line: {
                    color: 'red',
                    width: 2,
                    dash: ['solid', 'dot', 'dash']
                }
            }
        }]).then(function() {
            var markers = gd.querySelectorAll('.point');
            expect(markers.length).toBe(3);

            // 'solid' should have no dasharray or 'none' (represented as empty string in node.style.strokeDasharray)
            // 'dot' and 'dash' should have numerical dasharrays
            expect(markers[0].style.strokeDasharray).toBe('');
            expect(markers[1].style.strokeDasharray).not.toBe('');
            expect(markers[2].style.strokeDasharray).not.toBe('');
        })
        .then(done, done.fail);
    });

    it('should show marker line dash in the legend', function(done) {
        Plotly.newPlot(gd, [{
            mode: 'markers',
            x: [1, 2, 3],
            y: [1, 2, 3],
            marker: {
                line: {
                    color: 'red',
                    width: 2,
                    dash: 'dash'
                }
            }
        }]).then(function() {
            var legendPoints = gd.querySelectorAll('.legendpoints path.point');
            expect(legendPoints.length).toBe(1);
            expect(legendPoints[0].style.strokeDasharray).not.toBe('');
        })
        .then(done, done.fail);
    });

    it('should update marker line dash via restyle', function(done) {
        Plotly.newPlot(gd, [{
            mode: 'markers',
            x: [1, 2, 3],
            y: [1, 2, 3],
            marker: {
                line: {
                    color: 'red',
                    width: 2,
                    dash: 'solid'
                }
            }
        }]).then(function() {
            var markers = gd.querySelectorAll('.point');
            expect(markers[0].style.strokeDasharray).toBe('');

            return Plotly.restyle(gd, {'marker.line.dash': 'dot'});
        }).then(function() {
            var markers = gd.querySelectorAll('.point');
            expect(markers[0].style.strokeDasharray).not.toBe('');
        })
        .then(done, done.fail);
    });
    it('should support marker line dash on open markers', function(done) {
        Plotly.newPlot(gd, [{
            mode: 'markers',
            x: [1, 2, 3],
            y: [1, 2, 3],
            marker: {
                symbol: 'circle-open',
                line: {
                    color: 'red',
                    width: 2,
                    dash: 'dash'
                }
            }
        }]).then(function() {
            var markers = gd.querySelectorAll('.point');
            expect(markers.length).toBe(3);

            markers.forEach(function(node) {
                expect(node.style.strokeDasharray).not.toBe('');
            });
        })
        .then(done, done.fail);
    });});
