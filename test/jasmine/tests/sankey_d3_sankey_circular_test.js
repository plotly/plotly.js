// var Plotly = require('@lib/index');
// var attributes = require('@src/traces/sankey/attributes');

var d3SankeyCircular = require('d3-sankey-circular');
var mockCircular = require('@mocks/sankey_circular.json');
var convertToD3Sankey = require('@src/traces/sankey/convert-to-d3-sankey');

describe('d3-sankey-ciruclar', function() {
    var data, sankey, graph;

    beforeEach(function() {
        data = convertToD3Sankey(mockCircular.data[0]);
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

    function checkArray(key, result) {
        var value = graph.nodes.map(function(obj) {
            return obj[key];
        });
        expect(value).toEqual(result, 'invalid property named ' + key);
    }

    function checkRoundedArray(key, result, msg) {
        var value = graph.nodes.map(function(obj) {
            return Math.round(obj[key]);
        });
        expect(value).toEqual(result, msg);
    }

    it('creates a graph with circular links', function() {
        expect(graph.nodes.length).toEqual(6, 'there are 6 nodes');
        var circularLinks = graph.links.filter(function(link) {
            return link.circular;
        });
        expect(circularLinks.length).toEqual(2, 'there are two circular links');
    });

    it('keep a list of nodes with positions in integer (col, height)', function() {
        checkArray('column', [0, 0, 2, 3, 1, 1]);
        checkArray('height', [1, 3, 1, 0, 2, 0]);
    });

    it('keep a list of nodes with positions in x and y', function() {
        checkRoundedArray('x0', [72, 72, 267, 365, 169, 169]);
        checkRoundedArray('y0', [303, 86, 72, 109, 86, 359]);
    });

    it('supports column reordering', function() {
        var reorder = [ 2, 2, 1, 1, 0, 0 ];

        var a = graph.nodes[0].x0;
        sankey.nodeAlign(function(node) {
            return reorder[node.pointNumber];
        });
        graph = sankey();
        checkArray('column', [2, 2, 1, 1, 0, 0]);
        checkArray('height', [1, 3, 1, 0, 2, 0]);
        var b = graph.nodes[0].x0;
        expect(a).not.toEqual(b);
    });

});
