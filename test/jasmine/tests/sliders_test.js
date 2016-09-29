var Sliders = require('@src/components/sliders');
// var constants = require('@src/components/sliders/constants');

// var d3 = require('d3');
// var Plotly = require('@lib');
// var Lib = require('@src/lib');
// var createGraphDiv = require('../assets/create_graph_div');
// var destroyGraphDiv = require('../assets/destroy_graph_div');

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
            label: '',
            _index: 1
        });
    });

    it('should skip over steps with array \'args\' field', function() {
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
            label: '',
            _index: 1
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

    it('should default \'bgcolor\' to layout \'paper_bgcolor\'', function() {
        var steps = [{
            method: 'relayout',
            args: ['title', 'Hello World']
        }];

        layoutIn.sliders = [{
            steps: steps,
        }, {
            bgcolor: 'red',
            steps: steps
        }];

        layoutOut.paper_bgcolor = 'blue';

        supply(layoutIn, layoutOut);

        expect(layoutOut.sliders[0].bgcolor).toEqual('blue');
        expect(layoutOut.sliders[1].bgcolor).toEqual('red');
    });
});
