var fs = require('fs');
var path = require('path');
var JSDOM = require('jsdom').JSDOM;

var window = new JSDOM('', {runScripts: 'dangerously'}).window;

// Mock a few things that jsdom doesn't support out-of-the-box
window.URL.createObjectURL = function() {};

module.exports = function makeSchema(plotlyPath, schemaPath) {
    return function() {
        var scriptEl = window.document.createElement('script');
        scriptEl.textContent = fs.readFileSync(plotlyPath, { encoding: 'utf-8' });
        window.document.body.appendChild(scriptEl);
        var Plotly = window.Plotly;

        var plotSchema = Plotly.PlotSchema.get();
        var plotSchemaStr = JSON.stringify(plotSchema, null, 1);
        fs.writeFileSync(schemaPath, plotSchemaStr);

        console.log('ok ' + path.basename(schemaPath));
    };
};
