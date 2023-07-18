'use strict';

var domainRefComponents = require('../assets/domain_ref_components');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var Plotly = require('../../../lib/index');
// optionally specify a test number to run just a single test
var testNumber;

function makeTests(component, filter) {
    return function() {
        filter = filter === undefined ? function() {
            return true;
        } : filter;
        var descriptions = component.descriptions().filter(filter);
        var tests = component.tests().filter(filter);
        var gd;
        beforeEach(function() {
            gd = createGraphDiv();
        });
        afterEach(function() {
            Plotly.purge(gd);
            destroyGraphDiv(gd);
            gd = null;
        });
        descriptions.forEach(function(d, i) {
            it(d, function(done) {
                // console.log('testing ' + d);
                gd.id = 'graph-' + i;
                tests[i](function(v) {
                    expect(v).toBe(true);
                }, gd)
                    .then(done, done.fail);
            });
        });
    };
}

['annotations', 'images', 'shapes'].forEach(function(componentName) {
    describe('Test ' + componentName, makeTests(domainRefComponents[componentName],
        function(f, i) {
            if(testNumber === undefined) {
                return true;
            }
            return i === testNumber;
        }));
});
