var Plotly = require('@lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


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
        var msg = gd.querySelector('div.no-webgl > p');
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
        .then(done, done.fail);
    });

    it('gl2d subplots', function(done) {
        Plotly.react(gd, require('@mocks/gl2d_pointcloud-basic.json'))
        .then(function() {
            checkNoWebGLMsg(true);
            return Plotly.react(gd, require('@mocks/10.json'));
        })
        .then(function() {
            checkNoWebGLMsg(false);
        })
        .then(done, done.fail);
    });

    it('scattergl subplots', function(done) {
        Plotly.react(gd, require('@mocks/gl2d_12.json'))
        .then(function() {
            checkNoWebGLMsg(true);
            return Plotly.react(gd, require('@mocks/10.json'));
        })
        .then(function() {
            checkNoWebGLMsg(false);

            // one with all regl2d modules
            return Plotly.react(gd, [{
                type: 'scattergl',
                mode: 'lines+markers',
                fill: 'tozerox',
                y: [1, 2, 1],
                error_x: { value: 10 },
                error_y: { value: 10 }
            }]);
        })
        .then(function() {
            checkNoWebGLMsg(true);
            return Plotly.react(gd, require('@mocks/10.json'));
        })
        .then(function() {
            checkNoWebGLMsg(false);
        })
        .then(done, done.fail);
    });

    it('scatterpolargl subplots', function(done) {
        Plotly.react(gd, require('@mocks/glpolar_scatter.json'))
        .then(function() {
            checkNoWebGLMsg(true);
            return Plotly.react(gd, require('@mocks/10.json'));
        })
        .then(function() {
            checkNoWebGLMsg(false);
        })
        .then(done, done.fail);
    });

    it('splom subplots', function(done) {
        Plotly.react(gd, require('@mocks/splom_0.json'))
        .then(function() {
            checkNoWebGLMsg(true);
            return Plotly.react(gd, require('@mocks/10.json'));
        })
        .then(function() {
            checkNoWebGLMsg(false);
        })
        .then(done, done.fail);
    });

    it('parcoords subplots', function(done) {
        Plotly.react(gd, require('@mocks/gl2d_parcoords_2.json'))
        .then(function() {
            checkNoWebGLMsg(true);
            return Plotly.react(gd, require('@mocks/10.json'));
        })
        .then(function() {
            checkNoWebGLMsg(false);
        })
        .then(done, done.fail);
    });
});
