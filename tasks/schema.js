var fs = require('fs');
var path = require('path');

var constants = require('./util/constants');
var plotlyNode = require('./util/plotly_node');

function caseInsensitive(a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
}

function isArray(v) {
    return Array.isArray(v);
}

function isObject(v) {
    return typeof v === 'object' && v !== null && !(isArray(v));
}

function isArrayOfObjects(v) {
    return isArray(v) && isObject(v[0]);
}

function typeHandle(v) {
    return (
        isArrayOfObjects(v) ? sortArrayOfObjects(v) :
        isObject(v) ? sortObject(v) :
        v
    );
}

function sortArrayOfObjects(list) {
    var newList = [];
    for(var i = 0; i < list.length; i++) {
        newList[i] = typeHandle(list[i]);
    }

    return newList;
}

function sortObject(obj) {
    var allKeys = Object.keys(obj);
    allKeys.sort(caseInsensitive);

    var newObj = {};
    for(var i = 0; i < allKeys.length; i++) {
        var key = allKeys[i];
        newObj[key] = typeHandle(obj[key]);
    }

    return newObj;
}

function makeSchema(plotlyPath, schemaPath) {
    var Plotly = plotlyNode(plotlyPath);

    var obj = Plotly.PlotSchema.get();
    var sortedObj = sortObject(obj);
    var plotSchemaRaw = JSON.stringify(obj, null, 1);
    var plotSchemaStr = JSON.stringify(sortedObj, null, 1);

    fs.writeFileSync(schemaPath, plotSchemaStr);

    var lenBeforeSort = plotSchemaRaw.length;
    var lenAfterSort = plotSchemaStr.length;
    var linesBeforeSort = plotSchemaRaw.split('\n').length;
    var linesAfterSort = plotSchemaStr.split('\n').length;
    if(linesAfterSort !== linesBeforeSort || lenAfterSort !== lenBeforeSort) {
        throw 'plot schema should have the same length & number of lines before and after sort';
    } else {
        console.log('ok ' + path.basename(schemaPath));
    }
}

var isDist = process.argv.indexOf('dist') !== -1;

var pathToSchema = isDist ?
    constants.pathToSchemaDist :
    constants.pathToSchemaDiff;

var pathToPlotly = isDist ?
    constants.pathToPlotlyDistWithMeta :
    constants.pathToPlotlyBuild;

// output plot-schema JSON
makeSchema(pathToPlotly, pathToSchema);
