var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var drag = require('../assets/drag');

var scatterFillMock = require('@mocks/scatter_fill_self_next.json');
var templateMock = require('@mocks/template.json');


describe('makeTemplate', function() {
    it('does not template arrays', function() {
        var template = Plotly.makeTemplate(Lib.extendDeep({}, scatterFillMock));
        expect(template).toEqual({
            data: {scatter: [
                {fill: 'tonext', line: {shape: 'spline'}},
                {fill: 'tonext'},
                {fill: 'toself'}
            ] },
            layout: {
                title: 'Fill toself and tonext',
                width: 400,
                height: 400
            }
        });
    });

    it('does not modify the figure while extracting a template', function() {
        var mock = Lib.extendDeep({}, templateMock);
        Plotly.makeTemplate(mock);
        expect(mock).toEqual(templateMock);
    });

    it('templates scalar array_ok keys but not when they are arrays', function() {
        var figure = {data: [{
            marker: {color: 'red', size: [1, 2, 3]}
        }]};
        var template = Plotly.makeTemplate(figure);
        expect(template.data.scatter[0]).toEqual({
            marker: {color: 'red'}
        });
    });

    it('does not template invalid keys but does template invalid values', function() {
        var figure = {data: [{
            marker: {fugacity: 2, size: 'tiny'},
            smell: 'fruity'
        }]};
        var template = Plotly.makeTemplate(figure);
        expect(template.data.scatter[0]).toEqual({
            marker: {size: 'tiny'}
        });
    });

    it('pulls the first unnamed array item as defaults, plus one item of each distinct name', function() {
        var figure = {
            layout: {
                annotations: [
                    {name: 'abc', text: 'whee!'},
                    {text: 'boo', bgcolor: 'blue'},
                    {text: 'hoo', x: 1, y: 2},
                    {name: 'def', text: 'yoink', x: 3, y: 4},
                    {name: 'abc', x: 5, y: 6}
                ]
            }
        };
        var template = Plotly.makeTemplate(figure);
        expect(template.layout).toEqual({
            annotationdefaults: {text: 'boo', bgcolor: 'blue'},
            annotations: [
                {name: 'abc', text: 'whee!'},
                {name: 'def', text: 'yoink', x: 3, y: 4}
            ]
        });
    });

    it('merges in the template that was already in the figure', function() {
        var mock = Lib.extendDeep({}, templateMock);
        var template = Plotly.makeTemplate(mock);

        var expected = {
            data: {
                scatter: [
                    {mode: 'lines'},
                    {fill: 'tonexty', mode: 'markers'},
                    {mode: 'lines', xaxis: 'x2', yaxis: 'y2'},
                    {fill: 'tonexty', mode: 'markers', xaxis: 'x2', yaxis: 'y2'}
                ],
                bar: [
                    {insidetextfont: {color: 'white'}, textposition: 'inside'},
                    {textposition: 'outside', outsidetextfont: {color: 'red'}}
                ]
            },
            layout: {
                annotationdefaults: {
                    arrowcolor: '#8F8', arrowhead: 7, ax: 0,
                    text: 'Hi!', x: 0, y: 3.5
                },
                annotations: [{
                    // new name & font size vs the original template
                    name: 'new watermark', text: 'Plotly', textangle: 25,
                    xref: 'paper', yref: 'paper', x: 0.5, y: 0.5,
                    font: {size: 120, color: 'rgba(0,0,0,0.1)'},
                    showarrow: false
                }, {
                    name: 'warning', text: 'Be Cool',
                    xref: 'paper', yref: 'paper', x: 1, y: 0,
                    xanchor: 'left', yanchor: 'bottom', showarrow: false
                }, {
                    name: 'warning2', text: 'Stay in School',
                    xref: 'paper', yref: 'paper', x: 1, y: 0,
                    xanchor: 'left', yanchor: 'top', showarrow: false
                }],
                colorway: ['red', 'green', 'blue'],
                height: 500,
                legend: {bgcolor: 'rgba(0,0,0,0)'},
                // inherits from shapes[0] and template.shapedefaults
                shapedefaults: {
                    type: 'line',
                    x0: -0.1, x1: 1.15, y0: 1.05, y1: 1.05,
                    xref: 'paper', yref: 'paper',
                    line: {color: '#C60', width: 4}
                },
                shapes: [{
                    name: 'outline', type: 'rect',
                    xref: 'paper', yref: 'paper',
                    x0: -0.15, x1: 1.2, y0: -0.1, y1: 1.1,
                    fillcolor: 'rgba(160,160,0,0.1)',
                    line: {width: 2, color: 'rgba(160,160,0,0.25)'}
                }],
                width: 600,
                xaxis: {domain: [0, 0.45], color: '#CCC', title: 'XXX'},
                xaxis2: {domain: [0.55, 1], title: 'XXX222'},
                yaxis: {color: '#88F', title: 'y'},
                // inherits from both yaxis2 and template.yaxis
                yaxis2: {color: '#88F', title: 'y2', anchor: 'x2'}
            }
        };

        expect(template).toEqual(expected);
    });
});

// statics of template application are all covered by the template mock
// but we still need to manage the interactions
describe('template interactions', function() {
    var gd;

    beforeEach(function(done) {
        var mock = Lib.extendDeep({}, templateMock);
        gd = createGraphDiv();
        Plotly.newPlot(gd, mock)
        .catch(failTest)
        .then(done);
    });
    afterEach(destroyGraphDiv);

    it('makes a new annotation or edits the existing one as necessary', function(done) {
        function checkAnnotations(layoutCount, coolIndex, schoolIndex, schooly) {
            expect(gd.layout.annotations.length).toBe(layoutCount);
            expect(gd._fullLayout.annotations.length).toBe(7);
            var annotationElements = document.querySelectorAll('.annotation');
            var coolElement = annotationElements[coolIndex];
            var schoolElement = annotationElements[schoolIndex];
            expect(annotationElements.length).toBe(6); // one hidden
            expect(coolElement.textContent).toBe('Be Cool');
            expect(schoolElement.textContent).toBe('Stay in School');

            if(schooly) {
                var schoolItem = gd.layout.annotations[layoutCount - 1];
                expect(schoolItem).toEqual(jasmine.objectContaining({
                    templateitemname: 'warning2',
                    x: 1
                }));
                expect(schoolItem.y).toBeWithin(schooly, 0.001);
            }

            return schoolElement.querySelector('.cursor-pointer');
        }

        var schoolDragger = checkAnnotations(5, 4, 5);

        drag(schoolDragger, 0, -80)
        .then(function() {
            // added an item to layout.annotations and put that before the
            // remaining default item in the DOM
            schoolDragger = checkAnnotations(6, 5, 4, 0.25);

            return drag(schoolDragger, 0, -80);
        })
        .then(function() {
            // item count and order are unchanged now, item just moves.
            schoolDragger = checkAnnotations(6, 5, 4, 0.5);
        })
        .catch(failTest)
        .then(done);
    });

    it('makes a new shape or edits the existing one as necessary', function(done) {
        function checkShapes(layoutCount, recty0) {
            expect(gd.layout.shapes.length).toBe(layoutCount);
            expect(gd._fullLayout.shapes.length).toBe(2);
            var shapeElements = document.querySelectorAll('.shapelayer path[fill-rule=\'evenodd\']');
            var rectElement = shapeElements[1];
            expect(shapeElements.length).toBe(2);

            if(recty0) {
                var rectItem = gd.layout.shapes[layoutCount - 1];
                expect(rectItem).toEqual(jasmine.objectContaining({
                    templateitemname: 'outline',
                    x0: -0.15, x1: 1.2, y1: 1.1
                }));
                expect(rectItem.y0).toBeWithin(recty0, 0.001);
            }

            return rectElement;
        }

        var rectDragger = checkShapes(1);

        drag(rectDragger, 0, -80, 's')
        .then(function() {
            // added an item to layout.shapes
            rectDragger = checkShapes(2, 0.15);

            return drag(rectDragger, 0, -80, 's');
        })
        .then(function() {
            // item count and order are unchanged now, item just resizes.
            rectDragger = checkShapes(2, 0.4);
        })
        .catch(failTest)
        .then(done);
    });
});
