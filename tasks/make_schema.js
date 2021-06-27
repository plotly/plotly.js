var fs = require('fs');
var path = require('path');

var constants = require('./util/constants');
var plotlyNode = require('./util/plotly_node');

function makeSchema(plotlyPath, schemaPath) {
    var Plotly = plotlyNode(plotlyPath);

    var plotSchema = Plotly.PlotSchema.get();
    var plotSchemaStr = JSON.stringify(plotSchema, null, 1);
    fs.writeFileSync(schemaPath, plotSchemaStr);

    console.log('ok ' + path.basename(schemaPath));
}

var isDist = process.argv[2] === 'dist';

var pathToSchema = isDist ?
    constants.pathToSchemaDist :
    constants.pathToSchemaBuild;

var pathToPlotly = isDist ?
    constants.pathToPlotlyDistWithMeta :
    constants.pathToPlotlyBuild;

// output plot-schema JSON
makeSchema(pathToPlotly, pathToSchema);
