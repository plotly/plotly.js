'use strict'
var failTest = require('../assets/fail_test');
var domainRefComponents = require('../assets/domain_ref/components');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var Plotly = require('../../../lib/index');
var delay = require('../assets/delay');
// optionally specify a test number in a file to run just a single test
var testNumber = require('../assets/domain_ref/testnumber');

function makeTests(component, filter) {
    return function() {
        filter = filter === undefined ? function() {
            return true
        } : filter;
        var descriptions = component.descriptions().filter(filter);
        var tests = component.tests().filter(filter);
        var gd;
        beforeEach(function () { gd = createGraphDiv(); });
        afterEach(function () {
            Plotly.purge(gd);
            destroyGraphDiv(gd);
        });
        descriptions.forEach(function(d, i) {
            it(d, function(done) {
                tests[i](function(v) {
                        expect(v).toBe(true);
                    },gd)
                    .catch(failTest)
                    .then(done);
            });
        });
    };
}

describe('Test annotations', makeTests(domainRefComponents.annotations,
    function(f, i) {
        if (testNumber === undefined) { return true; }
        return i == testNumber;
    }));

describe('Test images', makeTests(domainRefComponents.images,
    function(f, i) {
        if (testNumber === undefined) { return true; }
        return i == testNumber;
    }));

fdescribe('Test shapes', makeTests(domainRefComponents.shapes,
    function(f, i) {
        if (testNumber === undefined) { return true; }
        return i == testNumber;
    }));
