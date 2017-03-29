var Sliders = require('@src/components/sliders');
var constants = require('@src/components/sliders/constants');

var d3 = require('d3');
var Plotly = require('@lib');
var Lib = require('@src/lib');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');

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
        expect(layoutOut.sliders[0].steps).toEqual([{
            method: 'relayout',
            label: 'Label #1',
            value: 'label-1'
        }, {
            method: 'update',
            label: 'Label #2',
            value: 'Label #2'
        }, {
            method: 'animate',
            label: 'step-2',
            value: 'lacks-label'
        }]);
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

        expect(layoutOut.sliders[0].steps.length).toEqual(1);
        expect(layoutOut.sliders[0].steps[0]).toEqual({
            method: 'relayout',
            args: ['title', 'Hello World'],
            label: 'step-1',
            value: 'step-1',
        });
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

        expect(layoutOut.sliders[0].steps.length).toEqual(1);
        expect(layoutOut.sliders[0].steps[0]).toEqual({
            method: 'relayout',
            args: ['title', 'Hello World'],
            label: 'step-1',
            value: 'step-1',
        });
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
        }).catch(fail).then(done);
    });
});

describe('sliders interactions', function() {
    'use strict';

    var mock = require('@mocks/sliders.json');
    var mockCopy;

    var gd;

    beforeEach(function(done) {
        gd = createGraphDiv();

        mockCopy = Lib.extendDeep({}, mock);

        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('should draw only visible sliders', function(done) {
        expect(gd._fullLayout._pushmargin['slider-0']).toBeDefined();
        expect(gd._fullLayout._pushmargin['slider-1']).toBeDefined();

        Plotly.relayout(gd, 'sliders[0].visible', false).then(function() {
            assertNodeCount('.' + constants.groupClassName, 1);
            expect(gd._fullLayout._pushmargin['slider-0']).toBeUndefined();
            expect(gd._fullLayout._pushmargin['slider-1']).toBeDefined();
            expect(gd.layout.sliders.length).toEqual(2);

            return Plotly.relayout(gd, 'sliders[1]', null);
        })
        .then(function() {
            assertNodeCount('.' + constants.groupClassName, 0);
            expect(gd._fullLayout._pushmargin['slider-0']).toBeUndefined();
            expect(gd._fullLayout._pushmargin['slider-1']).toBeUndefined();
            expect(gd.layout.sliders.length).toEqual(1);

            return Plotly.relayout(gd, {
                'sliders[0].visible': true,
                'sliders[1].visible': true
            });
        }).then(function() {
            assertNodeCount('.' + constants.groupClassName, 1);
            expect(gd._fullLayout._pushmargin['slider-0']).toBeDefined();
            expect(gd._fullLayout._pushmargin['slider-1']).toBeUndefined();

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
        .catch(fail).then(done);
    });

    it('should respond to mouse clicks', function(done) {
        var firstGroup = gd._fullLayout._infolayer.select('.' + constants.railTouchRectClass);
        var firstGrip = gd._fullLayout._infolayer.select('.' + constants.gripRectClass);
        var railNode = firstGroup.node();
        var touchRect = railNode.getBoundingClientRect();

        var originalFill = firstGrip.style('fill');

        // Dispatch a click on the right side of the bar:
        railNode.dispatchEvent(new MouseEvent('mousedown', {
            clientY: touchRect.top + 5,
            clientX: touchRect.left + touchRect.width - 5,
        }));

        expect(mockCopy.layout.sliders[0].active).toEqual(5);
        var mousedownFill = firstGrip.style('fill');
        expect(mousedownFill).not.toEqual(originalFill);

        // Drag to the left side:
        gd.dispatchEvent(new MouseEvent('mousemove', {
            clientY: touchRect.top + 5,
            clientX: touchRect.left + 5,
        }));

        var mousemoveFill = firstGrip.style('fill');
        expect(mousemoveFill).toEqual(mousedownFill);

        setTimeout(function() {
            expect(mockCopy.layout.sliders[0].active).toEqual(0);

            gd.dispatchEvent(new MouseEvent('mouseup'));

            var mouseupFill = firstGrip.style('fill');
            expect(mouseupFill).toEqual(originalFill);
            expect(mockCopy.layout.sliders[0].active).toEqual(0);

            done();
        }, 100);
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

        function assertEventCounts(starts, interactions, noninteractions, ends) {
            expect(
                [cntStart, cntInteraction, cntNonInteraction, cntEnd]
            ).toEqual(
                [starts, interactions, noninteractions, ends]
            );
        }

        assertEventCounts(0, 0, 0, 0);

        var firstGroup = gd._fullLayout._infolayer.select('.' + constants.railTouchRectClass);
        var railNode = firstGroup.node();
        var touchRect = railNode.getBoundingClientRect();

        // Dispatch a click on the right side of the bar:
        railNode.dispatchEvent(new MouseEvent('mousedown', {
            clientY: touchRect.top + 5,
            clientX: touchRect.left + touchRect.width - 5,
        }));

        setTimeout(function() {
            // One slider received a mousedown, one received an interaction, and one received a change:
            assertEventCounts(1, 1, 1, 0);

            // Drag to the left side:
            gd.dispatchEvent(new MouseEvent('mousemove', {
                clientY: touchRect.top + 5,
                clientX: touchRect.left + 5,
            }));

            setTimeout(function() {
                // On move, now to changes for the each slider, and no ends:
                assertEventCounts(1, 2, 2, 0);

                gd.dispatchEvent(new MouseEvent('mouseup'));

                setTimeout(function() {
                    // Now an end:
                    assertEventCounts(1, 2, 2, 1);

                    done();
                }, 50);
            }, 50);
        }, 50);
    });

    function assertNodeCount(query, cnt) {
        expect(d3.selectAll(query).size()).toEqual(cnt);
    }
});
