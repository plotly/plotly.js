var Plotly = require('@lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');

describe('Plotly w/o WebGL support:', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    function checkNoWebGLMsg(visible) {
        var glDiv = gd.querySelector('div.gl-container');
        var msg = glDiv.querySelector('div.no-webgl');
        if(visible) {
            expect(msg.innerHTML.substr(0, 22)).toBe('WebGL is not supported');
        } else {
            expect(msg).toBe(null);
        }
    }

    it('gl3d subplots', function(done) {
        Plotly.react(gd, require('@mocks/gl3d_autocolorscale.json'))
        .then(function() {
            checkNoWebGLMsg(true);
            return Plotly.react(gd, require('@mocks/10.json'));
        })
        .then(function() {
            checkNoWebGLMsg(false);
        })
        .catch(failTest)
        .then(done);
    });
});
