var d3 = require('d3');

var Plotly = require('@src/index');

/*
 * The following test cases fail on the CircleCI
 * most likely due to a WebGL/driver issue
 *
 */


describe('Test plot structure', function () {
    'use strict';

    function createGraphDiv() {
        var gd = document.createElement('div');
        gd.id = 'graph';
        document.body.appendChild(gd);
        return gd;
    }

    function destroyGraphDiv() {
        var gd = document.getElementById('graph');
        document.body.removeChild(gd);
    }

    afterEach(destroyGraphDiv);

    describe('gl3d plots', function() {
        var mock = require('@mocks/gl3d_marker-arrays.json');

        beforeEach(function(done) {
            Plotly.plot(createGraphDiv(), mock.data, mock.layout).then(done);
        });

        it('has one *canvas* node', function() {
            var nodes = d3.selectAll('canvas');
            expect(nodes[0].length).toEqual(1);
        });
    });

    describe('gl2d plots', function() {
        var mock = require('@mocks/gl2d_10.json');

        beforeEach(function(done) {
            Plotly.plot(createGraphDiv(), mock.data, mock.layout).then(done);
        });

        it('has one *canvas* node', function() {
            var nodes = d3.selectAll('canvas');
            expect(nodes[0].length).toEqual(1);
        });
    });

});
