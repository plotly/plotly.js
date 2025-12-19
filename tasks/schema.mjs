import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';
import { localDevConfig } from '../esbuild-config.js';

import constants from './util/constants.js';
import plotlyNode from './util/plotly_node.mjs';

const caseInsensitive = (a, b) => a.toLowerCase().localeCompare(b.toLowerCase());

const { isArray } = Array;

const isObject = (v) => typeof v === 'object' && v !== null && !isArray(v);

const isArrayOfObjects = (v) => isArray(v) && isObject(v[0]);

const typeHandle = (v) => (isArrayOfObjects(v) ? sortArrayOfObjects(v) : isObject(v) ? sortObject(v) : v);

function sortArrayOfObjects(list) {
    const newList = [];
    for (let i = 0; i < list.length; i++) {
        newList[i] = typeHandle(list[i]);
    }

    return newList;
}

function sortObject(obj) {
    const allKeys = Object.keys(obj);
    allKeys.sort(caseInsensitive);

    const newObj = {};
    for (let i = 0; i < allKeys.length; i++) {
        const key = allKeys[i];
        newObj[key] = typeHandle(obj[key]);
    }

    return newObj;
}

function makeSchema(plotlyPath, schemaPath) {
    const Plotly = plotlyNode(plotlyPath);
    const obj = Plotly.PlotSchema.get();
    const sortedObj = sortObject(obj);
    const plotSchemaRaw = JSON.stringify(obj, null, 2);
    const plotSchemaStr = JSON.stringify(sortedObj, null, 2);

    fs.writeFileSync(schemaPath, plotSchemaStr);

    const lenBeforeSort = plotSchemaRaw.length;
    const lenAfterSort = plotSchemaStr.length;
    const linesBeforeSort = plotSchemaRaw.split('\n').length;
    const linesAfterSort = plotSchemaStr.split('\n').length;
    if (linesAfterSort !== linesBeforeSort || lenAfterSort !== lenBeforeSort) {
        throw 'plot schema should have the same length & number of lines before and after sort';
    } else {
        console.log('ok ' + path.basename(schemaPath));
    }
}

const isDist = process.argv.indexOf('dist') !== -1;

const pathToSchema = isDist ? constants.pathToSchemaDist : constants.pathToSchemaDiff;

const pathToPlotly = isDist ? constants.pathToPlotlyDistWithMeta : constants.pathToPlotlyBuild;

// Build plotly.js to ensure changes to attributes are picked up. This is the same
// process used in the test dashboard server script, but run only once.
await build(localDevConfig);

// output plot-schema JSON
makeSchema(pathToPlotly, pathToSchema);
