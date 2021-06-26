var fs = require('fs');
var path = require('path');
var plotlyNode = require('./plotly_node');

module.exports = function makeSchema(plotlyPath, schemaPath) {
    var Plotly = plotlyNode(plotlyPath);

    var plotSchema = Plotly.PlotSchema.get();
    var plotSchemaStr = JSON.stringify(plotSchema, null, 1);
    fs.writeFileSync(schemaPath, plotSchemaStr);

    console.log('ok ' + path.basename(schemaPath));
};
