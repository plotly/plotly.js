var Plotly = require('@lib/index');
var constants = require('@src/components/sliders/constants');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');

describe('populate-slider transform', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    describe('invalid usage without a filter transform', function() {
        beforeEach(function(done) {
            Plotly.plot(gd, [{
                x: [1, 2, 3, 4],
                y: [5, 6, 7, 8],
                ids: ['a', 'b', 'a', 'b'],
                transforms: [{type: 'populate-slider'}]
            }]).then(done);
        });

        it('ignores the transform', function() {
            expect(true).toBe(true);
        });
    });

    describe('a single trace grouped into two categories', function() {
        var slider, frames;
        var animationopts;

        beforeEach(function(done) {
            animationopts = {frame: {duration: 0}, transition: {duration: 0}};
            Plotly.plot(gd, [{
                x: [1, 2, 3, 4],
                y: [5, 6, 7, 8],
                ids: ['a', 'b', 'a', 'b'],
                transforms: [{
                    type: 'populate-slider',
                    animationopts: animationopts
                }, {
                    type: 'filter',
                    target: ['g1', 'g1', 'g2', 'g2']
                }]
            }]).then(function() {
                slider = gd.layout.sliders[0];
                frames = gd._transitionData._frames;
            }).then(done);
        });

        it('adds a slider to layout', function() {
            expect(gd.layout.sliders.length).toEqual(1);
        });

        it('adds two steps to the slider', function() {
            expect(slider.steps.length).toEqual(2);
            expect(slider.steps[0].label).toEqual('g1');
            expect(slider.steps[1].label).toEqual('g2');
        });

        it('sets the API commands to change the frame', function() {
            expect(slider.steps[0].method).toEqual('animate');
            expect(slider.steps[1].method).toEqual('animate');

            expect(slider.steps[0].args).toEqual([['slider-0-g1'], animationopts]);
            expect(slider.steps[1].args).toEqual([['slider-0-g2'], animationopts]);
        });

        it('creates two frames', function() {
            expect(frames.length).toEqual(2);

            // First frame:
            expect(frames[0].name).toEqual('slider-0-g1');
            expect(frames[0].group).toEqual('populate-slider-group-0');
            expect(frames[0].data).toEqual([{'transforms[1].value': ['g1']}]);
            expect(frames[0].traces).toEqual([0]);

            // Second frame:
            expect(frames[1].name).toEqual('slider-0-g2');
            expect(frames[1].group).toEqual('populate-slider-group-0');
            expect(frames[1].data).toEqual([{'transforms[1].value': ['g2']}]);
            expect(frames[1].traces).toEqual([0]);

            // Has updated the frame hash:
            expect(Object.keys(gd._transitionData._frameHash)).toEqual(['slider-0-g1', 'slider-0-g2']);
        });

        it('filters the data', function(done) {
            clickFirstSlider(1).then(function() {
                // Click the second step and confirm udpated:
                expect(gd._fullLayout._currentFrame).toEqual('slider-0-g2');
                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 3, y: 7}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 4, y: 8}));

                return clickFirstSlider(0);
            }).then(function() {
                // Click the first step and confirm udpated:
                expect(gd._fullLayout._currentFrame).toEqual('slider-0-g1');
                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 1, y: 5}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 2, y: 6}));
            }).catch(fail).then(done);
        });

        it('updates the slider steps when data changes', function(done) {
            expect(slider.steps.length).toEqual(2);

            Plotly.restyle(gd, {'transforms[1].target': [['g1', 'g1', 'g1', 'g1']]}).then(function() {
                expect(gd._fullLayout.sliders[0].steps.length).toEqual(1);

                return Plotly.restyle(gd, 'transforms[1].target', [['g1', 'g2', 'g3', 'g4']], [0]);
            }).then(function() {
                expect(gd._fullLayout.sliders[0].steps.length).toEqual(4);
            }).catch(fail).then(done);
        });
    });

    describe('two traces', function() {
        var animationopts;

        beforeEach(function(done) {
            animationopts = {frame: {duration: 0}, transition: {duration: 0}};
            Plotly.plot(gd, [{
                x: [1, 2, 3, 4],
                y: [5, 6, 7, 8],
                ids: ['a', 'b', 'a', 'b'],
                transforms: [{
                    type: 'populate-slider',
                    animationopts: animationopts
                }, {
                    type: 'filter',
                    target: ['g1', 'g1', 'g2', 'g2']
                }]
            }, {
                x: [9, 10, 11, 12],
                y: [13, 14, 15, 16],
                ids: ['a', 'b', 'a', 'b'],
                transforms: [{
                    type: 'populate-slider',
                    animationopts: animationopts
                }, {
                    type: 'filter',
                    target: ['g2', 'g3', 'g2', 'g3']
                }]
            }]).then(done);
        });

        it('merges groups', function() {
            var slider = gd._fullLayout.sliders[0];
            expect(slider.steps.length).toEqual(3);
            expect(slider.steps[0].args).toEqual([['slider-0-g1'], animationopts]);
            expect(slider.steps[1].args).toEqual([['slider-0-g2'], animationopts]);
            expect(slider.steps[2].args).toEqual([['slider-0-g3'], animationopts]);
        });

        it('filters the first trace', function(done) {
            clickFirstSlider(1).then(function() {
                // Click the second step and confirm udpated:
                expect(gd._fullLayout._currentFrame).toEqual('slider-0-g3');
                expect(gd.calcdata[0].length).toEqual(1);
                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: false, y: false}));

                return clickFirstSlider(0);
            }).then(function() {
                // Click the first step and confirm udpated:
                expect(gd._fullLayout._currentFrame).toEqual('slider-0-g1');
                expect(gd.calcdata[0].length).toEqual(2);
                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 1, y: 5}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 2, y: 6}));

                return clickFirstSlider(0.5);
            }).then(function() {
                // Click the second step and confirm udpated:
                expect(gd._fullLayout._currentFrame).toEqual('slider-0-g2');
                expect(gd.calcdata[0].length).toEqual(2);
                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 3, y: 7}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 4, y: 8}));
            }).catch(fail).then(done);
        });

        it('filters the second trace', function(done) {
            clickFirstSlider(1).then(function() {
                // Click the second step and confirm udpated:
                expect(gd._fullLayout._currentFrame).toEqual('slider-0-g3');
                expect(gd.calcdata[1].length).toEqual(2);
                expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 10, y: 14}));
                expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 12, y: 16}));

                return clickFirstSlider(0);
            }).then(function() {
                // Click the first step and confirm udpated:
                expect(gd._fullLayout._currentFrame).toEqual('slider-0-g1');
                expect(gd.calcdata[1].length).toEqual(1);
                expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: false, y: false}));

                return clickFirstSlider(0.5);
            }).then(function() {
                // Click the second step and confirm udpated:
                expect(gd._fullLayout._currentFrame).toEqual('slider-0-g2');
                expect(gd.calcdata[1].length).toEqual(2);
                expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 9, y: 13}));
                expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 11, y: 15}));
            }).catch(fail).then(done);
        });
    });

    function clickFirstSlider(fraction, eventName) {
        var firstGroup = gd._fullLayout._infolayer.select('.' + constants.railTouchRectClass);
        var railNode = firstGroup.node();
        var touchRect = railNode.getBoundingClientRect();

        // Dispatch a click on the right side of the bar:
        railNode.dispatchEvent(new MouseEvent('mousedown', {
            clientY: touchRect.top + 5,
            clientX: touchRect.left + touchRect.width * fraction,
        }));

        // TODO: fix this race condition with a one-time event listener (requires separate PR):
        return new Promise(function(resolve, reject) {
            gd.once(eventName || 'plotly_animated', resolve);

            // Set a timeout of 1000ms before it fails:
            setTimeout(reject, 1000);
        });
    }


    describe('with a realistic two-trace setup', function() {
        beforeEach(function(done) {
            Plotly.plot(gd, {
                'data': [{
                    'name': 'Asia',
                    'mode': 'markers',
                    'x': [
                        30.332, 53.832, 39.348, 41.366, 50.54896,
                        31.997, 56.923, 41.216, 43.415, 44.50136,
                        34.02, 59.923, 43.453, 45.415,
                    ],
                    'y': [
                        820.8530296, 11635.79945, 661.6374577, 434.0383364, 575.9870009,
                        853.10071, 12753.27514, 686.3415538, 496.9136476, 487.6740183,
                        836.1971382, 14804.6727, 721.1860862, 523.4323142,
                    ],
                    'ids': [
                        'Afghanistan', 'Bahrain', 'Bangladesh', 'Cambodia', 'China',
                        'Afghanistan', 'Bahrain', 'Bangladesh', 'Cambodia', 'China',
                        'Afghanistan', 'Bahrain', 'Bangladesh', 'Cambodia',
                    ],
                    'text': [
                        'Afghanistan', 'Bahrain', 'Bangladesh', 'Cambodia', 'China',
                        'Afghanistan', 'Bahrain', 'Bangladesh', 'Cambodia', 'China',
                        'Afghanistan', 'Bahrain', 'Bangladesh', 'Cambodia',
                    ],
                    'marker': {
                        'sizemode': 'area',
                        'sizeref': 200000,
                        'size': [
                            9240934, 138655, 51365468, 5322536, 637408000,
                            10267083, 171863, 56839289, 6083619, 665770000,
                            11537966, 202182, 62821884, 6960067,
                        ]
                    },
                    'transforms': [{
                        'type': 'populate-slider',
                        'sliderindex': 0,
                        'framegroup': 'frames-by-year',
                        'animationopts': {
                            'mode': 'immediate',
                            'frame': {'redraw': false},
                            'transition': {'duration': 400}
                        }
                    }, {
                        'type': 'filter',
                        'target': [
                            '1957', '1957', '1957', '1957', '1957',
                            '1962', '1962', '1962', '1962', '1962',
                            '1967', '1967', '1967', '1967',
                        ],
                        'operation': '{}',
                        'value': ['1952']
                    }]
                },
                {
                    'name': 'Europe',
                    'mode': 'markers',
                    'x': [
                        55.23, 66.8, 68, 53.82, 59.6,
                        59.28, 67.48, 69.24, 58.45, 66.61,
                        66.22, 70.14, 70.94, 70.42,
                        67.69, 70.63, 71.44, 67.45, 70.9
                    ],
                    'y': [
                        1601.056136, 6137.076492, 8343.105127, 973.5331948, 2444.286648,
                        1942.284244, 8842.59803, 9714.960623, 1353.989176, 3008.670727,
                        2760.196931, 12834.6024, 13149.04119, 5577.0028,
                        3313.422188, 16661.6256, 16672.14356, 2860.16975, 6597.494398
                    ],
                    'ids': [
                        'Albania', 'Austria', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria',
                        'Albania', 'Austria', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria',
                        'Albania', 'Austria', 'Belgium', 'Bulgaria',
                        'Albania', 'Austria', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria'
                    ],
                    'text': [
                        'Albania', 'Austria', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria',
                        'Albania', 'Austria', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria',
                        'Albania', 'Austria', 'Belgium', 'Bulgaria',
                        'Albania', 'Austria', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria'
                    ],
                    'marker': {
                        'sizemode': 'area',
                        'sizeref': 200000,
                        'size': [
                            1282697, 6927772, 8730405, 2791000, 7274900,
                            1476505, 6965860, 8989111, 3076000, 7651254,
                            1984060, 7376998, 9556500, 8310226,
                            2263554, 7544201, 9709100, 3819000, 8576200
                        ]
                    },
                    'transforms': [{
                        'type': 'populate-slider',
                        'sliderindex': 0,
                        'framegroup': 'frames-by-year',
                        'animationopts': {
                            'mode': 'immediate',
                            'frame': {'redraw': false},
                            'transition': {'duration': 0}
                        }
                    }, {
                        'type': 'filter',
                        'target': [
                            '1952', '1952', '1952', '1952', '1952',
                            '1957', '1957', '1957', '1957', '1957',
                            '1967', '1967', '1967', '1967',
                            '1972', '1972', '1972', '1972', '1972'
                        ],
                        'operation': '{}',
                        'value': ['1952']
                    }]
                }],
                'layout': {
                    'width': window.innerWidth,
                    'height': window.innerHeight,
                    'title': 'Life Expectancy vs. GDP Per Capita',
                    'xaxis': {
                        'autorange': false,
                        'range': [20, 80]
                    },
                    'yaxis': {
                        'type': 'log',
                        'autorange': false,
                        'range': [2, 5]
                    },
                    'updatemenus': [{
                        'type': 'buttons',
                        'transition': {'duration': 0},
                        'showactive': false,
                        'yanchor': 'top',
                        'xanchor': 'right',
                        'y': 0,
                        'x': -0.02,
                        'pad': {'t': 50},
                        'buttons': [{
                            'label': 'Play',
                            'method': 'animate',
                            'args': ['frames-by-year', {
                                'mode': 'immediate',
                                'frame': {'duration': 0, 'redraw': false},
                                'transition': {'duration': 0}
                            }]
                        }]
                    }],
                    'sliders': [{
                        'yanchor': 'top',
                        'y': 0,
                        'pad': {'t': 20}
                    }]
                }
            }).then(done);
        });

        it('creates slider options', function() {
            expect(gd._fullLayout.sliders[0].steps.length).toBe(5);
        });

        it('removes slider options when the first trace is hidden', function(done) {
            Plotly.restyle(gd, {visible: [false]}, [0]).then(function() {
                expect(gd._fullLayout.sliders[0].steps.length).toBe(4);
            }).catch(fail).then(done);
        });

        it('removes slider options when the second trace is hidden', function(done) {
            Plotly.restyle(gd, {visible: [true, false]}, [0, 1]).then(function() {
                expect(gd._fullLayout.sliders[0].steps.length).toBe(3);
            }).catch(fail).then(done);
        });

        it('adds slider options when traces are re-shown', function(done) {
            Plotly.restyle(gd, {visible: [true, false]}, [0, 1]).then(function() {
                expect(gd._fullLayout.sliders[0].steps.length).toBe(3);
                return Plotly.restyle(gd, {visible: [true, true]}, [0, 1]);
            }).then(function() {
                expect(gd._fullLayout.sliders[0].steps.length).toBe(5);
            }).catch(fail).then(done);
        });

        it('removes slider options when the target data changes', function(done) {
            // Set both target data sets to all one value:
            Plotly.restyle(gd, {'transforms[1].target': [[
                '1957', '1957', '1957', '1957', '1957', '1957', '1957', '1957', '1957', '1957',
                '1957', '1957', '1957', '1957',
            ], [
                '1957', '1957', '1957', '1957', '1957', '1957', '1957', '1957', '1957', '1957',
                '1957', '1957', '1957', '1957', '1957', '1957', '1957', '1957', '1957'
            ]]}, [0, 1]).then(function() {
                // Confirm the presence of only one option:
                expect(gd._fullLayout.sliders[0].steps.length).toBe(1);
            }).catch(fail).then(done);
        });

        it('adds slider options when the target data changes', function(done) {
            Plotly.restyle(gd, {'transforms[1].target': [[
                '1951', '1952', '1953', '1954', '1955', '1956', '1957', '1957', '1957', '1957',
                '1957', '1957', '1957', '1957', '1957', '1957', '1957', '1957', '1957'
            ]]}, [1]).then(function() {
                expect(gd._fullLayout.sliders[0].steps.length).toBe(9);
            }).catch(fail).then(done);
        });

        it('removes slider options when the transform is disabled', function(done) {
            Plotly.restyle(gd, {'transforms[0].enabled': [false]}, [1]).then(function() {
                expect(gd._fullLayout.sliders[0].steps.length).toBe(3);
            }).catch(fail).then(done);
        });

         /* it('removes slider options when all traces are hidden', function (done) {
            Plotly.restyle(gd, {visible: [false, false]}, [0, 1]).then(function () {
                expect(gd._fullLayout.sliders[0].steps.length).toBe(0);
            }).catch(fail).then(done);
        });*/

    });
});
