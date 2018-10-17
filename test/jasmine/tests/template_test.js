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

    it('works on DOM element', function(done) {
        var mock = Lib.extendDeep({}, scatterFillMock);
        var gd = createGraphDiv();

        Plotly.newPlot(gd, mock)
        .then(function() {
            var template = Plotly.makeTemplate(gd);
            delete(template.layout.xaxis);
            delete(template.layout.yaxis);
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
        })
      .catch(failTest)
      .then(destroyGraphDiv)
      .then(done);
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
                expect(schoolItem.templateitemname).toBe('warning2');
                expect(schoolItem.x).toBeWithin(1, 0.001);
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
                expect(rectItem.templateitemname).toBe('outline');
                expect(rectItem.x0).toBeWithin(-0.15, 0.001);
                expect(rectItem.y0).toBeWithin(recty0, 0.001);
                expect(rectItem.x1).toBeWithin(1.2, 0.001);
                expect(rectItem.y1).toBeWithin(1.1, 0.001);
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

describe('validateTemplate', function() {

    function compareOutputs(out1, out2, expected, countToCheck) {
        expect(out2).toEqual(out1);
        if(expected) {
            expect(countToCheck ? out1.slice(0, countToCheck) : out1)
                .toEqual(expected);
        }
        else {
            expect(out1).toBeUndefined();
        }
    }

    function checkValidate(mock, expected, countToCheck) {
        var template = mock.layout.template;
        var mockNoTemplate = Lib.extendDeep({}, mock);
        delete mockNoTemplate.layout.template;

        // Test with objects as argument
        var out1 = Plotly.validateTemplate(mock);
        var out2 = Plotly.validateTemplate(mockNoTemplate, template);
        expect(out2).toEqual(out1);
        compareOutputs(out1, out2, expected, countToCheck);

        // Test with DOM elements as argument
        var gd = createGraphDiv();
        return Plotly.newPlot(gd, mock)
        .then(function() {out1 = Plotly.validateTemplate(gd);})
        .then(function() {return Plotly.newPlot(gd, mockNoTemplate);})
        .then(function() {out2 = Plotly.validateTemplate(gd, template);})
        .then(function() {compareOutputs(out1, out2, expected, countToCheck);})
        .catch(failTest)
        .then(destroyGraphDiv);
    }

    var cleanMock = Lib.extendDeep({}, templateMock);
    cleanMock.layout.annotations.pop();
    cleanMock.data.pop();
    cleanMock.data.splice(1, 1);
    cleanMock.layout.template.data.bar.pop();

    it('returns undefined when the template matches precisely', function(done) {
        checkValidate(cleanMock).then(done);
    });

    it('catches all classes of regular issue', function(done) {
        var messyMock = Lib.extendDeep({}, templateMock);
        messyMock.data.push({type: 'box', x0: 1, y: [1, 2, 3]});
        messyMock.layout.template.layout.geo = {projection: {type: 'orthographic'}};
        messyMock.layout.template.layout.xaxis3 = {nticks: 50};
        messyMock.layout.template.layout.xaxis.rangeslider = {yaxis3: {rangemode: 'fixed'}};
        messyMock.layout.xaxis = {rangeslider: {}};
        messyMock.layout.template.layout.xaxis2.rangeslider = {bgcolor: '#CCC'};
        messyMock.layout.template.data.violin = [{fillcolor: '#000'}];

        checkValidate(messyMock, [{
            code: 'unused',
            path: 'layout.xaxis.rangeslider.yaxis3',
            msg: 'The template item at layout.xaxis.rangeslider.yaxis3 was not used in constructing the plot.'
        }, {
            code: 'unused',
            path: 'layout.xaxis2.rangeslider',
            msg: 'The template item at layout.xaxis2.rangeslider was not used in constructing the plot.'
        }, {
            code: 'unused',
            path: 'layout.geo',
            msg: 'The template item at layout.geo was not used in constructing the plot.'
        }, {
            code: 'unused',
            path: 'layout.xaxis3',
            msg: 'The template item at layout.xaxis3 was not used in constructing the plot.'
        }, {
            code: 'missing',
            index: 5,
            traceType: 'box',
            msg: 'There are no templates for trace 5, of type box.'
        }, {
            code: 'reused',
            traceType: 'scatter',
            templateCount: 2,
            dataCount: 4,
            msg: 'Some of the templates of type scatter were used more than once.' +
                ' The template has 2 traces, the data has 4 of this type.'
        }, {
            code: 'unused',
            traceType: 'bar',
            templateCount: 2,
            dataCount: 1,
            msg: 'Some of the templates of type bar were not used.' +
                ' The template has 2 traces, the data only has 1 of this type.'
        }, {
            code: 'unused',
            traceType: 'violin',
            templateCount: 1,
            dataCount: 0,
            msg: 'The template has 1 traces of type violin' +
                ' but there are none in the data.'
        }, {
            code: 'missing',
            path: 'layout.annotations[4]',
            templateitemname: 'nope',
            msg: 'There are no templates for item layout.annotations[4] with name nope'
        }]).then(done);
    });

    it('catches missing template.data', function(done) {
        var noDataMock = Lib.extendDeep({}, cleanMock);
        delete noDataMock.layout.template.data;

        checkValidate(noDataMock, [{
            code: 'data',
            msg: 'The template has no key data.'
        }],
        // check only the first error - we don't care about the specifics
        // uncovered after we already know there's no template.data
        1).then(done);
    });

    it('catches missing template.layout', function(done) {
        var noLayoutMock = Lib.extendDeep({}, cleanMock);
        delete noLayoutMock.layout.template.layout;

        checkValidate(noLayoutMock, [{
            code: 'layout',
            msg: 'The template has no key layout.'
        }], 1).then(done);
    });

});
