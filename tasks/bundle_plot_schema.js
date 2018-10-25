var constants = require('./util/constants');
var _bundle = require('./util/browserify_wrapper');
var makeSchema = require('./util/make_schema');

/*
 * Trimmed down version of ./bundle.js for CI testing
 *
 * Outputs:
 *
 *  - plotly-with-meta.js bundle in dist/
 *  - plot-schema.json in dist/ (for reference)
 */

_bundle(constants.pathToPlotlyIndex, constants.pathToPlotlyDistWithMeta, {
    standalone: 'Plotly',
    noCompress: true
}, function() {
    makeSchema(constants.pathToPlotlyDistWithMeta, constants.pathToSchema)();
});
