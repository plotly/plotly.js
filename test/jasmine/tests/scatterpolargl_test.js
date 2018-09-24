var Plotly = require('@lib');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var mouseEvent = require('../assets/mouse_event');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;

describe('Test scatterpolargl hover:', function() {
    var gd;

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    function run(specs) {
        gd = createGraphDiv();

        var fig = Lib.extendDeep(
            {width: 700, height: 500},
            specs.mock || require('@mocks/glpolar_scatter.json')
        );

        if(specs.patch) {
            fig = specs.patch(fig);
        }

        var pos = specs.pos || [200, 200];

        return Plotly.newPlot(gd, fig).then(function() {
            mouseEvent('mousemove', pos[0], pos[1]);
            assertHoverLabelContent(specs);
        });
    }

    [{
        desc: 'base',
        nums: 'r: 3.886013\nθ: 125.2822°',
        name: 'Trial 3'
    }, {
        desc: '(no labels - out of sector)',
        patch: function(fig) {
            fig.layout.polar.sector = [15, 75];
            return fig;
        },
        pos: [144, 350],
        nums: '',
        name: ''
    }, {
        desc: 'on a `thetaunit: radians` polar subplot',
        patch: function(fig) {
            fig.layout.polar.angularaxis.thetaunit = 'radians';
            return fig;
        },
        nums: 'r: 3.886013\nθ: 2.186586',
        name: 'Trial 3'
    }, {
        desc: 'on log radial axis',
        patch: function(fig) {
            fig.layout.polar.radialaxis.type = 'log';
            return fig;
        },
        nums: 'r: 1.108937\nθ: 115.4969°',
        name: 'Trial 3'
    }, {
        desc: 'on category axes',
        mock: require('@mocks/polar_categories.json'),
        patch: function(fig) {
            fig.data.forEach(function(t) {
                t.type = 'scatterpolargl';
                t.fill = 'none';
            });
            return fig;
        },
        pos: [470, 80],
        nums: 'r: 4\nθ: d',
        name: 'angular cate...'
    }, {
        desc: 'with custom text scalar',
        patch: function(fig) {
            fig.data.forEach(function(t) { t.text = 'a'; });
            return fig;
        },
        nums: 'r: 3.886013\nθ: 125.2822°\na',
        name: 'Trial 3'
    }, {
        desc: 'with custom text array',
        patch: function(fig) {
            fig.data.forEach(function(t) { t.text = t.r.map(String); });
            return fig;
        },
        nums: 'r: 3.886013\nθ: 125.2822°\n3.88601339194',
        name: 'Trial 3'
    }]
    .forEach(function(specs) {
        it('should generate correct hover labels ' + specs.desc, function(done) {
            run(specs).catch(failTest).then(done);
        });
    });
});
