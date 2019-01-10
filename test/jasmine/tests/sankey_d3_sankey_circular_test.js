var Plotly = require('@lib/index');
var attributes = require('@src/traces/sankey/attributes');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var Lib = require('@src/lib');

var d3SankeyCircular = require('d3-sankey-circular');
var mockCircular = require('@mocks/sankey_circular.json');
var convertToD3Sankey = require('@src/traces/sankey/convert-to-d3-sankey');

describe('d3-sankey-ciruclar', function() {
    var data, sankey, graph;

    beforeEach(function() {
        var mock = Lib.extendDeep({}, mockCircular)
        data = convertToD3Sankey(mock.data[0]);
        sankey = d3SankeyCircular
          .sankeyCircular()
          .iterations(32)
          .circularLinkGap(2)
          .nodePadding(10)
          .size([500, 500])
          .nodeId(function(d) {
              return d.pointNumber;
          })
          .nodes(data.nodes)
          .links(data.links);

        graph = sankey();
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

    it('removes nodes that are unlinked', function() {
        // The mock has 7 nodes but one is unlinked
        expect(graph.nodes.length).toBe(6);
    });

    it('creates a graph containing circular links', function() {
        var circularLinks = graph.links.filter(function(link) {
            return link.circular;
        });
        expect(circularLinks.length).toEqual(2, 'there are two circular links');
    });

    it('keep a list of nodes with positions in integer (col, height)', function() {
        checkArray(graph.nodes, 'depth', [0, 0, 2, 3, 1, 1]);
        checkArray(graph.nodes, 'height', [1, 3, 1, 0, 2, 0]);
    });

    it('keep a list of nodes with positions in x and y', function() {
        checkRoundedArray(graph.nodes, 'x0', [72, 72, 267, 365, 169, 169]);
        checkRoundedArray(graph.nodes, 'y0', [303, 86, 72, 109, 86, 359]);
    });

    it('supports reordering nodes in different columns', function() {
        var reorder = [ 2, 2, 1, 1, 0, 0 ];

        var a = graph.nodes[0].x0;
        sankey.nodeAlign(function(node) {
            return reorder[node.pointNumber];
        });
        graph = sankey();
        checkArray(graph.nodes, 'column', [2, 2, 1, 1, 0, 0]);
        checkArray(graph.nodes, 'height', [1, 3, 1, 0, 2, 0]);
        var b = graph.nodes[0].x0;
        expect(a).not.toEqual(b);
    });

    it('keep a list of links', function() {
        checkArray(graph.links, 'value', [1, 2, 1, 1, 1, 1, 1]);
        checkArray(graph.links, 'concentration', [1 / 3, 2 / 3, 1, 1, 1, 1, 1]);
    });

    it('can create groups', function(done) {
        var gd = createGraphDiv();
        mockCircular.data[0].groups = [[2, 3], [0, 1]];
        Plotly.plot(gd, mockCircular)
          .then(function() {
              expect(gd._fullData[0].groups).toEqual([[2, 3], [0, 1]]);
              return Plotly.restyle(gd, {groups: [[[3, 4]]]});
          })
          .then(function() {
              expect(gd._fullData[0].groups).toEqual([[3, 4]]);
              destroyGraphDiv();
              done();
          });
    });
});
