// var Plotly = require('@lib/index');
// var attributes = require('@src/traces/sankey/attributes');

var d3sankey = require('d3-sankey');

var data = {
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
    var sankey;
    var graph;
    var margin = {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
    };
    var width = 1200 - margin.left - margin.right;
    var height = 740 - margin.top - margin.bottom;

    beforeEach(function() {
        sankey = d3sankey
        .sankey()
        .nodeWidth(36)
        .nodePadding(10)
        .nodes(data.nodes)
        .links(data.links)
        .size([width, height])
        .iterations(32);

        graph = sankey();
    });

    function checkArray(key, result) {
        var value = graph.nodes.map(function(obj) {
            return obj[key];
        });
        expect(value).toEqual(result, 'invalid property named ' + key);
    }

    function checkRoundedArray(key, result) {
        var value = graph.nodes.map(function(obj) {
            return Math.round(obj[key]);
        });
        expect(value).toEqual(result, 'invalid property named ' + key);
    }

    it('controls the width of nodes', function() {
        expect(sankey.nodeWidth()).toEqual(36, 'incorrect nodeWidth');
    });

    it('controls the padding between nodes', function() {
        expect(sankey.nodePadding()).toEqual(10, 'incorrect nodePadding');
    });

    it('controls the padding between nodes', function() {
        expect(sankey.nodePadding()).toEqual(10, 'incorrect nodePadding');
    });

    it('keep a list of nodes', function() {
        checkArray('name', ['node0', 'node1', 'node2', 'node3', 'node4']);
    });

    it('keep a list of nodes with x and y values', function() {
        checkRoundedArray('x0', [0, 0, 381, 763, 1144]);
        checkRoundedArray('y0', [0, 365, 184, 253, 0]);
    });

    it('keep a list of nodes with positions in integer (depth, height)', function() {
        checkArray('depth', [0, 0, 1, 2, 3]);
        checkArray('height', [3, 3, 2, 1, 0]);
    });

    it('keep a list of links', function() {
        var linkWidths = sankey().links.map(function(obj) {
            return (obj.width);
        });
        expect(linkWidths).toEqual([177.5, 177.5, 177.5, 177.5, 177.5, 177.5, 355]);
    });

    it('controls the size of the figure', function() {
        expect(sankey.size()).toEqual([1180, 720], 'incorrect size');
    });
});
