var fs = require('fs');
var path = require('path');
var jsdom = require('jsdom');

module.exports = function makeSchema(plotlyPath, schemaPath) {
    return function() {
        var plotlyjsCode = fs.readFileSync(plotlyPath, 'utf-8');
        jsdom.env({
            html: '<div></div>',
            src: [plotlyjsCode],
            done: function(err, window) {
                if(err) {
                    console.log(err);
                    return;
                }

                var plotSchema = window.Plotly.PlotSchema.get();
                var plotSchemaStr = JSON.stringify(plotSchema, null, 4);
                fs.writeFileSync(schemaPath, plotSchemaStr);

                console.log('ok ' + path.basename(schemaPath));
            }
        });
    };
};
