import { once } from 'node:events';
import fs from 'node:fs';
import http from 'node:http';
import { context } from 'esbuild';
import minimist from 'minimist';
import sirv from 'sirv';
import { devtoolsConfig, localDevConfig } from '../../esbuild-config.js';
import constants from '../../tasks/util/constants.js';
import { createMocksList, getMockFiles, readFiles, saveMockListToFile } from '../dashboard_utilities.mjs';

var args = minimist(process.argv.slice(2), {});
// An explicit --port is used as given. Without one, try PORT_ATTEMPTS consecutive ports from DEFAULT_PORT.
// This can be passed using the npm script as follows: npm start -- --port XXXX.
const DEFAULT_PORT = 3000;
const PORT_ATTEMPTS = 3;
const portIsExplicit = args.port !== undefined;
const firstPort = portIsExplicit ? Number(args.port) : DEFAULT_PORT;
if (portIsExplicit && !(/^\d+$/.test(String(args.port)) && firstPort >= 1 && firstPort <= 65535)) {
    console.error(`Invalid --port value "${args.port}". Pass an integer from 1 to 65535.`);
    process.exit(1);
}
var strict = args.strict;
var mathjax3 = args.mathjax3;
var mathjax3chtml = args.mathjax3chtml;
var mathjax4chtml = args.mathjax4chtml;

if (strict) localDevConfig.entryPoints = ['./lib/index-strict.js'];

let mockNames = new Set();

/**
 * Rewrite the mock list file from the mocks folder.
 *
 * @returns The names of the mocks that the previous list did not contain, and the names that it lost
 */
const updateMockList = async () => {
    const files = await readFiles(await getMockFiles());
    const mocksList = createMocksList(files);
    await saveMockListToFile(mocksList);

    const oldNames = mockNames;
    // createMocksList puts undefined in place of a mock that does not parse
    mockNames = new Set(mocksList.filter(Boolean).map((mock) => mock.name));
    return { added: [...mockNames.difference(oldNames)], removed: [...oldNames.difference(mockNames)] };
};
await updateMockList();

// The dashboard bundle imports the mock list, so this watch rebuilds the bundle when the list changes
// Log only problems, so that the watch output of the plotly.js bundle stays the only watch output
const devtoolsCtx = await context({ ...devtoolsConfig, logLevel: 'warning' });
await devtoolsCtx.watch();

// Wait for a burst of file events to end, so that one save rewrites the mock list only once
const MOCK_LIST_DELAY_MS = 200;
let mockListTimer;
fs.watch(constants.pathToTestImageMocks, (_, fileName) => {
    if (fileName && !fileName.endsWith('.json')) return;
    clearTimeout(mockListTimer);
    mockListTimer = setTimeout(async () => {
        try {
            const { added, removed } = await updateMockList();
            if (added.length) console.log(`Added mocks: ${added.join(', ')}. Reload the dashboard to search them.`);
            if (removed.length) console.log(`Removed mocks: ${removed.join(', ')}`);
        } catch (err) {
            console.error('Could not update the mock list:', err);
        }
    }, MOCK_LIST_DELAY_MS);
});

var ctx = await context(localDevConfig);
await devServer();
console.log('watching esbuild...');
await ctx.watch();

async function devServer() {
    const staticFilesHandler = sirv(constants.pathToRoot, {
        dev: true,
        maxAge: 0,
        gzip: true,
        setHeaders: (res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
        }
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
    const attempts = portIsExplicit ? 1 : PORT_ATTEMPTS;
    let port;
    for (let i = 0; i < attempts && port === undefined; i++) {
        const candidate = firstPort + i;
        try {
            server.listen(candidate);
            await once(server, 'listening');
            port = candidate;
        } catch (err) {
            if (err.code !== 'EADDRINUSE') throw err;
            console.warn(`Port ${candidate} is in use.`);
            if (i + 1 < attempts) console.warn(`Trying port ${candidate + 1}.`);
        }
    }
    if (port === undefined) {
        console.error(
            'All attempted ports are in use. Stop a process on one of those ports or pass a free port with --port.'
        );
        process.exit(1);
    }

    let indexName = 'index';
    if (mathjax3) indexName += '-mathjax3';
    else if (mathjax3chtml) indexName += '-mathjax3chtml';
    else if (mathjax4chtml) indexName += '-mathjax4chtml';
    indexName += '.html';

    // open up browser window
    const serverUrl = `http://localhost:${port}/devtools/test_dashboard/${indexName}${strict ? '?strict=true' : ''}`;
    console.log(`  \x1b[1m\x1b[32m➜\x1b[0m  \x1b[1mLocal:\x1b[0m   \x1b[1m\x1b[36m${serverUrl}\x1b[0m\n`);
}
