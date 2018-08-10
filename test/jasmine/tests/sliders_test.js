var Sliders = require('@src/components/sliders');
var constants = require('@src/components/sliders/constants');

var d3 = require('d3');
var Plotly = require('@lib');
var Lib = require('@src/lib');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var delay = require('../assets/delay');
var assertPlotSize = require('../assets/custom_assertions').assertPlotSize;

describe('sliders defaults', function() {
    'use strict';

    var supply = Sliders.supplyLayoutDefaults;

    var layoutIn, layoutOut;

    beforeEach(function() {
        layoutIn = {};
        layoutOut = {};
    });

    it('should set \'visible\' to false when no steps are present', function() {
        layoutIn.sliders = [{
            steps: [{
                method: 'relayout',
                args: ['title', 'Hello World']
            }, {
                method: 'update',
                args: [ { 'marker.size': 20 }, { 'xaxis.range': [0, 10] }, [0, 1] ]
            }, {
                method: 'animate',
                args: [ 'frame1', { transition: { duration: 500, ease: 'cubic-in-out' }}]
            }]
        }, {
            bgcolor: 'red'
        }, {
            visible: false,
            steps: [{
                method: 'relayout',
                args: ['title', 'Hello World']
            }]
        }];

        supply(layoutIn, layoutOut);

        expect(layoutOut.sliders[0].visible).toBe(true);
        expect(layoutOut.sliders[0].active).toEqual(0);
        expect(layoutOut.sliders[0].steps[0].args.length).toEqual(2);
        expect(layoutOut.sliders[0].steps[1].args.length).toEqual(3);
        expect(layoutOut.sliders[0].steps[2].args.length).toEqual(2);

        expect(layoutOut.sliders[1].visible).toBe(false);
        expect(layoutOut.sliders[1].active).toBeUndefined();

        expect(layoutOut.sliders[2].visible).toBe(false);
        expect(layoutOut.sliders[2].active).toBeUndefined();
    });

    it('should not coerce currentvalue defaults unless currentvalue is visible', function() {
        layoutIn.sliders = [{
            currentvalue: {
                visible: false,
                xanchor: 'left'
            },
            steps: [
                {method: 'restyle', args: [], label: 'step0'},
                {method: 'restyle', args: [], label: 'step1'}
            ]
        }];

        supply(layoutIn, layoutOut);

        expect(layoutOut.sliders[0].currentvalue.xanchor).toBeUndefined();
        expect(layoutOut.sliders[0].currentvalue.prefix).toBeUndefined();
        expect(layoutOut.sliders[0].currentvalue.suffix).toBeUndefined();
        expect(layoutOut.sliders[0].currentvalue.offset).toBeUndefined();
        expect(layoutOut.sliders[0].currentvalue.font).toBeUndefined();
    });

    it('should set the default values equal to the labels', function() {
        layoutIn.sliders = [{
            steps: [{
                method: 'relayout', args: [],
                label: 'Label #1',
                value: 'label-1'
            }, {
                method: 'update', args: [],
                label: 'Label #2'
            }, {
                method: 'animate', args: [],
                value: 'lacks-label'
            }]
        }];

        supply(layoutIn, layoutOut);

        expect(layoutOut.sliders[0].steps.length).toEqual(3);
        expect(layoutOut.sliders[0].steps).toEqual([jasmine.objectContaining({
            method: 'relayout',
            label: 'Label #1',
            value: 'label-1',
            execute: true,
            args: []
        }), jasmine.objectContaining({
            method: 'update',
            label: 'Label #2',
            value: 'Label #2',
            execute: true,
            args: []
        }), jasmine.objectContaining({
            method: 'animate',
            label: 'step-2',
            value: 'lacks-label',
            execute: true,
            args: []
        })]);
    });

    it('should skip over non-object steps', function() {
        layoutIn.sliders = [{
            steps: [
                null,
                {
                    method: 'relayout',
                    args: ['title', 'Hello World']
                },
                'remove'
            ]
        }];

        supply(layoutIn, layoutOut);

        expect(layoutOut.sliders[0].steps).toEqual([jasmine.objectContaining({
            visible: false
        }), jasmine.objectContaining({
            method: 'relayout',
            args: ['title', 'Hello World'],
            label: 'step-1',
            value: 'step-1',
            execute: true
        }), jasmine.objectContaining({
            visible: false
        })]);
    });

    it('should skip over steps with non-array \'args\' field', function() {
        layoutIn.sliders = [{
            steps: [{
                method: 'restyle',
            }, {
                method: 'relayout',
                args: ['title', 'Hello World']
            }, {
                method: 'relayout',
                args: null
            }, {}]
        }];

        supply(layoutIn, layoutOut);

        expect(layoutOut.sliders[0].steps).toEqual([jasmine.objectContaining({
            visible: false
        }), jasmine.objectContaining({
            method: 'relayout',
            args: ['title', 'Hello World'],
            label: 'step-1',
            value: 'step-1',
            execute: true
        }), jasmine.objectContaining({
            visible: false
        }), jasmine.objectContaining({
            visible: false
        })]);
    });

    it('allows the `skip` method', function() {
        layoutIn.sliders = [{
            steps: [{
                method: 'skip',
            }, {
                method: 'skip',
                args: ['title', 'Hello World']
            }]
        }];

        supply(layoutIn, layoutOut);

        expect(layoutOut.sliders[0].steps).toEqual([jasmine.objectContaining({
            method: 'skip',
            label: 'step-0',
            value: 'step-0',
            execute: true,
        }), jasmine.objectContaining({
            method: 'skip',
            args: ['title', 'Hello World'],
            label: 'step-1',
            value: 'step-1',
            execute: true,
        })]);
    });


    it('should keep ref to input update menu container', function() {
        layoutIn.sliders = [{
            steps: [{
                method: 'relayout',
                args: ['title', 'Hello World']
            }]
        }, {
            bgcolor: 'red'
        }, {
            visible: false,
            steps: [{
                method: 'relayout',
                args: ['title', 'Hello World']
            }]
        }];

        supply(layoutIn, layoutOut);

        expect(layoutOut.sliders[0]._input).toBe(layoutIn.sliders[0]);
        expect(layoutOut.sliders[1]._input).toBe(layoutIn.sliders[1]);
        expect(layoutOut.sliders[2]._input).toBe(layoutIn.sliders[2]);
    });
});

describe('sliders initialization', function() {
    'use strict';
    var gd;

    beforeEach(function(done) {
        gd = createGraphDiv();

        Plotly.plot(gd, [{x: [1, 2, 3]}], {
            sliders: [{
                transition: {duration: 0},
                steps: [
                    {method: 'restyle', args: [], label: 'first'},
                    {method: 'restyle', args: [], label: 'second'},
                ]
            }]
        }).then(done);
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('does not set active on initial plot', function() {
        expect(gd.layout.sliders[0].active).toBeUndefined();
    });
});

describe('ugly internal manipulation of steps', function() {
    'use strict';
    var gd;

    beforeEach(function(done) {
        gd = createGraphDiv();

        Plotly.plot(gd, [{x: [1, 2, 3]}], {
            sliders: [{
                transition: {duration: 0},
                steps: [
                    {method: 'restyle', args: [], label: 'first'},
                    {method: 'restyle', args: [], label: 'second'},
                ]
            }]
        }).then(done);
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('adds and removes slider steps gracefully', function(done) {
        expect(gd._fullLayout.sliders[0].active).toEqual(0);

        // Set the active index higher than it can go:
        Plotly.relayout(gd, {'sliders[0].active': 2}).then(function() {
            // Confirm nothing changed
            expect(gd._fullLayout.sliders[0].active).toEqual(0);

            // Add an option manually without calling API functions:
            gd.layout.sliders[0].steps.push({method: 'restyle', args: [], label: 'first'});

            // Now that it's been added, restyle and try again:
            return Plotly.relayout(gd, {'sliders[0].active': 2});
        }).then(function() {
            // Confirm it's been changed:
            expect(gd._fullLayout.sliders[0].active).toEqual(2);

            // Remove the option:
            gd.layout.sliders[0].steps.pop();

            // And redraw the plot:
            return Plotly.redraw(gd);
        }).then(function() {
            // The selected option no longer exists, so confirm it's
            // been fixed during the process of updating/drawing it:
            expect(gd._fullLayout.sliders[0].active).toEqual(0);
        }).catch(failTest).then(done);
    });
});

describe('sliders interactions', function() {
    'use strict';

    var mock = require('@mocks/sliders.json');
    var mockCopy;

    var gd;

    beforeEach(function(done) {
        gd = createGraphDiv();

        mockCopy = Lib.extendDeep({}, mock, {layout: {sliders: [{x: 0.25}, {}]}});

        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('positions sliders repeatably when they push margins', function(done) {
        function checkPositions(msg) {
            d3.select(gd).selectAll('.slider-group').each(function(d, i) {
                var sliderBB = this.getBoundingClientRect();
                var gdBB = gd.getBoundingClientRect();
                if(i === 0) {
                    expect(sliderBB.left - gdBB.left)
                        .toBeWithin(12, 3, 'left: ' + msg);
                }
                else {
                    expect(gdBB.bottom - sliderBB.bottom)
                        .toBeWithin(8, 3, 'bottom: ' + msg);
                }
            });
        }

        checkPositions('initial');

        Plotly.relayout(gd, {'sliders[0].x': 0.35, 'sliders[1].y': -0.3})
        .then(function() {
            checkPositions('increased left & bottom');

            return Plotly.relayout(gd, {'sliders[0].x': 0.1, 'sliders[1].y': -0.1});
        })
        .then(function() {
            checkPositions('back to original');
        })
        .catch(failTest)
        .then(done);
    });

    it('should draw only visible sliders', function(done) {
        expect(gd._fullLayout._pushmargin['slider-0']).toBeDefined();
        expect(gd._fullLayout._pushmargin['slider-1']).toBeDefined();
        assertPlotSize({heightLessThan: 270}, 'initial');

        Plotly.relayout(gd, 'sliders[0].visible', false).then(function() {
            assertNodeCount('.' + constants.groupClassName, 1);
            expect(gd._fullLayout._pushmargin['slider-0']).toBeUndefined();
            expect(gd._fullLayout._pushmargin['slider-1']).toBeDefined();
            expect(gd.layout.sliders.length).toEqual(2);
            assertPlotSize({heightLessThan: 270}, 'hide 0');

            return Plotly.relayout(gd, 'sliders[1]', null);
        })
        .then(function() {
            assertNodeCount('.' + constants.groupClassName, 0);
            expect(gd._fullLayout._pushmargin['slider-0']).toBeUndefined();
            expect(gd._fullLayout._pushmargin['slider-1']).toBeUndefined();
            expect(gd.layout.sliders.length).toEqual(1);
            assertPlotSize({height: 270}, 'delete 1');

            return Plotly.relayout(gd, {
                'sliders[0].visible': true,
                'sliders[1].visible': true
            });
        }).then(function() {
            assertNodeCount('.' + constants.groupClassName, 1);
            expect(gd._fullLayout._pushmargin['slider-0']).toBeDefined();
            expect(gd._fullLayout._pushmargin['slider-1']).toBeUndefined();
            assertPlotSize({heightLessThan: 270}, 'reshow 0');

            return Plotly.relayout(gd, {
                'sliders[1]': {
                    steps: [{
                        method: 'relayout',
                        args: ['title', 'new title'],
                        label: '1970'
                    }, {
                        method: 'relayout',
                        args: ['title', 'new title'],
                        label: '1971'
                    }]
                }
            });
        })
        .then(function() {
            assertNodeCount('.' + constants.groupClassName, 2);
            expect(gd._fullLayout._pushmargin['slider-0']).toBeDefined();
            expect(gd._fullLayout._pushmargin['slider-1']).toBeDefined();
        })
        .catch(failTest)
        .then(done);
    });

    it('only draws visible steps', function(done) {
        function gripXFrac() {
            var grip = document.querySelector('.' + constants.gripRectClass);
            var transform = grip.attributes.transform.value;
            var gripX = +(transform.split('(')[1].split(',')[0]);
            var rail = document.querySelector('.' + constants.railRectClass);
            var railWidth = +rail.attributes.width.value;
            var railRX = +rail.attributes.rx.value;
            return gripX / (railWidth - 2 * railRX);
        }
        function assertSlider(ticks, labels, gripx, active) {
            assertNodeCount('.' + constants.groupClassName, 1);
            assertNodeCount('.' + constants.tickRectClass, ticks);
            assertNodeCount('.' + constants.labelGroupClass, labels);
            expect(gripXFrac()).toBeWithin(gripx, 0.01);
            expect(gd._fullLayout.sliders[1].active).toBe(active);
        }
        Plotly.relayout(gd, {'sliders[0].visible': false, 'sliders[1].active': 5})
        .then(function() {
            assertSlider(15, 8, 5 / 14, 5);

            // hide two before the grip - grip moves left
            return Plotly.relayout(gd, {
                'sliders[1].steps[0].visible': false,
                'sliders[1].steps[1].visible': false
            });
        })
        .then(function() {
            assertSlider(13, 7, 3 / 12, 5);

            // hide two after the grip - grip moves right, but not as far as
            // the initial position since there are more steps to the right
            return Plotly.relayout(gd, {
                'sliders[1].steps[12].visible': false,
                'sliders[1].steps[13].visible': false
            });
        })
        .then(function() {
            assertSlider(11, 6, 3 / 10, 5);

            // hide the active step - grip moves to 0, and first visible step is active
            return Plotly.relayout(gd, {
                'sliders[1].steps[5].visible': false
            });
        })
        .then(function() {
            assertSlider(10, 5, 0, 2);
        })
        .catch(failTest)
        .then(done);
    });

    it('should respond to mouse clicks', function(done) {
        var firstGroup = gd._fullLayout._infolayer.select('.' + constants.railTouchRectClass);
        var firstGrip = gd._fullLayout._infolayer.select('.' + constants.gripRectClass);
        var railNode = firstGroup.node();
        var touchRect = railNode.getBoundingClientRect();

        var originalFill = firstGrip.node().style.fill;

        // Dispatch a click on the right side of the bar:
        railNode.dispatchEvent(new MouseEvent('mousedown', {
            clientY: touchRect.top + 5,
            clientX: touchRect.left + touchRect.width - 5,
        }));

        expect(mockCopy.layout.sliders[0].active).toEqual(5);
        var mousedownFill = firstGrip.node().style.fill;
        expect(mousedownFill).not.toEqual(originalFill);

        // Drag to the left side:
        gd.dispatchEvent(new MouseEvent('mousemove', {
            clientY: touchRect.top + 5,
            clientX: touchRect.left + 5,
        }));

        var mousemoveFill = firstGrip.node().style.fill;
        expect(mousemoveFill).toEqual(mousedownFill);

        delay(100)()
        .then(function() {
            expect(mockCopy.layout.sliders[0].active).toEqual(0);

            gd.dispatchEvent(new MouseEvent('mouseup'));

            var mouseupFill = firstGrip.node().style.fill;
            expect(mouseupFill).toEqual(originalFill);
            expect(mockCopy.layout.sliders[0].active).toEqual(0);
        })
        .catch(failTest)
        .then(done);
    });

    it('should issue events on interaction', function(done) {
        var cntStart = 0;
        var cntInteraction = 0;
        var cntNonInteraction = 0;
        var cntEnd = 0;

        gd.on('plotly_sliderstart', function() {
            cntStart++;
        }).on('plotly_sliderchange', function(datum) {
            if(datum.interaction) {
                cntInteraction++;
            } else {
                cntNonInteraction++;
            }
        }).on('plotly_sliderend', function() {
            cntEnd++;
        });

        function assertEventCounts(starts, interactions, noninteractions, ends, msg) {
            expect(cntStart).toBe(starts, 'starts: ' + msg);
            expect(cntInteraction).toBe(interactions, 'interactions: ' + msg);
            expect(cntNonInteraction).toBe(noninteractions, 'noninteractions: ' + msg);
            expect(cntEnd).toBe(ends, 'ends: ' + msg);
        }

        assertEventCounts(0, 0, 0, 0, 'initial');

        var firstGroup = gd._fullLayout._infolayer.select('.' + constants.railTouchRectClass);
        var railNode = firstGroup.node();
        var touchRect = railNode.getBoundingClientRect();

        // Dispatch a click on the right side of the bar:
        railNode.dispatchEvent(new MouseEvent('mousedown', {
            clientY: touchRect.top + 5,
            clientX: touchRect.left + touchRect.width - 5,
        }));

        delay(50)()
        .then(function() {
            // One slider received a mousedown, one received an interaction, and one received a change:
            assertEventCounts(1, 1, 1, 0, 'mousedown');

            // Drag to the left side:
            gd.dispatchEvent(new MouseEvent('mousemove', {
                clientY: touchRect.top + 5,
                clientX: touchRect.left + 5,
            }));
        })
        .then(delay(50))
        .then(function() {
            // On move, now to changes for the each slider, and no ends:
            assertEventCounts(1, 2, 2, 0, 'mousemove');

            gd.dispatchEvent(new MouseEvent('mouseup'));
        })
        .then(delay(50))
        .then(function() {
            // Now an end:
            assertEventCounts(1, 2, 2, 1, 'mouseup');
        })
        .catch(failTest)
        .then(done);
    });

    function assertNodeCount(query, cnt) {
        expect(d3.selectAll(query).size()).toEqual(cnt);
    }
});
