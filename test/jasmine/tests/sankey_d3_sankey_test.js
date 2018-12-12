// var Plotly = require('@lib/index');
// var attributes = require('@src/traces/sankey/attributes');

var d3sankey = require('@src/traces/sankey/d3-sankey');

var graph = {
    'nodes': [{
        'node': 0,
        'name': 'node0'
    }, {
        'node': 1,
        'name': 'node1'
    }, {
        'node': 2,
        'name': 'node2'
    }, {
        'node': 3,
        'name': 'node3'
    }, {
        'node': 4,
        'name': 'node4'
    }],
    'links': [{
        'source': 0,
        'target': 2,
        'value': 2
    }, {
        'source': 1,
        'target': 2,
        'value': 2
    }, {
        'source': 1,
        'target': 3,
        'value': 2
    }, {
        'source': 0,
        'target': 4,
        'value': 2
    }, {
        'source': 2,
        'target': 3,
        'value': 2
    }, {
        'source': 2,
        'target': 4,
        'value': 2
    }, {
        'source': 3,
        'target': 4,
        'value': 4
    }]
};


describe('d3-sankey', function() {
    var margin = {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10
        },
        width = 1200 - margin.left - margin.right,
        height = 740 - margin.top - margin.bottom;

    var s;

    beforeEach(function() {
        s = d3sankey()
        .nodeWidth(36)
        .nodePadding(10)
        .nodes(graph.nodes)
        .links(graph.links)
        .size([width, height])
        .layout(32);
    });

    it('controls the width of nodes', function() {
        expect(s.nodeWidth()).toEqual(36, 'incorrect nodeWidth');
    });

    it('controls the padding between nodes', function() {
        expect(s.nodePadding()).toEqual(10, 'incorrect nodePadding');
    });

    it('controls the padding between nodes', function() {
        expect(s.nodePadding()).toEqual(10, 'incorrect nodePadding');
    });

    it('keep a list of nodes', function() {
        var node_names = s.nodes().map(function(obj) {
            return obj.name;
        });
        expect(node_names).toEqual(['node0', 'node1', 'node2', 'node3', 'node4']);
    });

    it('keep a list of links', function() {
        var link_widths = s.links().map(function(obj) {
            return obj.dy;
        });
        expect(link_widths).toEqual([177.5, 177.5, 177.5, 177.5, 177.5, 177.5, 355]);
    });

    it('controls the size of the figure', function() {
        expect(s.size()).toEqual([1180, 720], 'incorrect size');
    });
});
