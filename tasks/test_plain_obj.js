var fs = require('fs');
var JSDOM = require('jsdom').JSDOM;

var window = new JSDOM('', {runScripts: 'dangerously'}).window;

// Mock a few things that jsdom doesn't support out-of-the-box
window.URL.createObjectURL = function() {};

var scriptEl = window.document.createElement('script');
scriptEl.textContent = fs.readFileSync('dist/plotly.js', { encoding: 'utf-8' });
window.document.body.appendChild(scriptEl);
var Plotly = window.Plotly;

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
