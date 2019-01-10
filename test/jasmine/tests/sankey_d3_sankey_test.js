// var Plotly = require('@lib/index');
// var attributes = require('@src/traces/sankey/attributes');

var d3sankey = require('d3-sankey');

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
    };
    var width = 1200 - margin.left - margin.right;
    var height = 740 - margin.top - margin.bottom;

    var nodeWidth = 36;

    var s;

    beforeEach(function() {
        s = d3sankey
        .sankey()
        .nodeWidth(nodeWidth)
        .nodePadding(10)
        .nodes(graph.nodes)
        .links(graph.links)
        .size([width, height])
        .iterations(32);
    });

    function checkArray(arr, key, result) {
        var value = arr.map(function(obj) {
            return obj[key];
        });
        expect(value).toEqual(result, 'invalid property named ' + key);
    }

    function checkRoundedArray(arr, key, result, msg) {
        var value = arr.map(function(obj) {
            return Math.round(obj[key]);
        });
        expect(value).toEqual(result, msg);
    }


    it('controls the width of nodes', function() {
        expect(s.nodeWidth()).toEqual(36, 'incorrect nodeWidth');
    });

    it('controls the padding between nodes', function() {
        expect(s.nodePadding()).toEqual(10, 'incorrect nodePadding');
    });

    it('keep a list of nodes', function() {
        var nodeNames = s().nodes.map(function(obj) {
            return obj.name;
        });
        expect(nodeNames).toEqual(['node0', 'node1', 'node2', 'node3', 'node4']);
    });

    it('keep a list of nodes with x0, x1 values', function() {
        var x0 = [0, 0, 381, 763, 1144];
        var x1 = x0.map(function(x) {return x + nodeWidth;});
        checkRoundedArray(graph.nodes, 'x0', x0);
        checkRoundedArray(graph.nodes, 'x1', x1);
    });

    it('keep a list of nodes with positions in integer (col, height)', function() {
        checkArray(graph.nodes, 'depth', [0, 0, 1, 2, 3]);
        checkArray(graph.nodes, 'height', [3, 3, 2, 1, 0]);
    });

    it('keep a list of links', function() {
        checkArray(graph.links, 'width', [177.5, 177.5, 177.5, 177.5, 177.5, 177.5, 355]);
    });

    it('controls the size of the figure', function() {
        expect(s.size()).toEqual([1180, 720], 'incorrect size');
    });
});
