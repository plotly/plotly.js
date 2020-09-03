var failTest = require('../assets/fail_test');
var domainRefComponents = require('../assets/domain_ref_components');

function makeTests(component, filter) {
    return function() {
        filter = filter === undefined ? function() {
            return true
        } : filter;
        var descriptions = component.descriptions().filter(filter);
        var tests = component.tests().filter(filter);
        descriptions.forEach(function(d, i) {
            it(d, function(done) {
                tests[i](false, function(v) {
                        expect(v).toBe(true);
                    })
                    .catch(failTest)
                    .then(done);
            });
        });
    };
}

describe('Test annotations', makeTests(domainRefComponents.annotations,
undefined));
//    function(f, i) {
//        return i == 565;
//    }));
