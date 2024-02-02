import plotlyNode from './util/plotly_node.mjs';
var Plotly = plotlyNode('build/plotly.js');

var assertValidate = function(fig, exp) {
    console.log(fig);

    var errorList = Plotly.validate(fig.data, fig.layout);

    if(exp) {
        if(errorList !== undefined) throw 'should be valid:';
    } else {
        if(errorList === undefined) throw 'should not be valid:';
    }
};

assertValidate({
    data: [{ y: [1] }],
    layout: {}
}, true);

assertValidate({
    data: [{ z: false }],
    layout: {}
}, false);
