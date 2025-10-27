import ecstatic from 'ecstatic';
import { build, context } from 'esbuild';
import http from 'http';
import minimist from 'minimist';
import open from 'open';
import { devtoolsConfig, localDevConfig } from '../../esbuild-config.js';
import constants from '../../tasks/util/constants.js';
import { createMocksList, getMockFiles, readFiles, saveMockListToFile } from '../dashboard_utilities.mjs';

var args = minimist(process.argv.slice(2), {});
var PORT = args.port || 3000;
var strict = args.strict;
var mathjax3 = args.mathjax3;
var mathjax3chtml = args.mathjax3chtml;

if (strict) localDevConfig.entryPoints = ['./lib/index-strict.js'];

// mock list
await getMockFiles().then(readFiles).then(createMocksList).then(saveMockListToFile);

build(devtoolsConfig);

var ctx = await context(localDevConfig);
devServer();
console.log('watching esbuild...');
await ctx.watch();

function devServer() {
    const staticFilesHandler = ecstatic({
        root: constants.pathToRoot,
        cache: 0,
        gzip: true,
        cors: true
    });

    const server = http.createServer((req, res) => {
        if (strict) {
            res.setHeader(
                'Content-Security-Policy',
                // Comment/uncomment for testing CSP. Changes require a server restart.
                [
                    // "default-src 'self'",
                    "script-src 'self'",
                    "style-src 'self' 'unsafe-inline'",
                    // "img-src 'self' data: blob:",
                    // "font-src 'self' data:",
                    // "connect-src 'self'",
                    // "object-src 'none'",
                    // "base-uri 'self';",
                    'worker-src blob:'
                ].join('; ')
            );
        }

        staticFilesHandler(req, res);
    });

    // Start the server up!
    server.listen(PORT);

    let indexName = 'index';
    if (mathjax3) indexName += '-mathjax3';
    else if (mathjax3chtml) indexName += '-mathjax3chtml';
    indexName += '.html';

    // open up browser window
    open(`http://localhost:${PORT}/devtools/test_dashboard/${indexName}${strict ? '?strict=true' : ''}`);
}
