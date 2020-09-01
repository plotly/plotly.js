var domainRefTests = require('./domain_ref_shapes_test');
domainRefTests.runImageTests(
{start:0,stop:10},
function (combo) {
    return combo[1] === 'log';
});
