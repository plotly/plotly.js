var jsdom = require('jsdom');
var fs = require('fs');

var plotlyServerDom = new jsdom.JSDOM('', { runScripts: 'dangerously'});
// Mock a few things that jsdom doesn't support out-of-the-box
plotlyServerDom.window.URL.createObjectURL = function() {};

// Run Plotly inside jsdom
var plotlyJsPath = require.resolve('../dist/plotly.js');
var plotlyJsSource = fs.readFileSync(plotlyJsPath, 'utf-8');
plotlyServerDom.window.eval(plotlyJsSource);

var assertValidate = function(fig, exp) {
    console.log(fig);

    var errorList = plotlyServerDom.window.Plotly.validate(fig.data, fig.layout);

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
