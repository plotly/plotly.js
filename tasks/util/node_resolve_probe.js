// Loads plotly.js the way a Node consumer does.
//
// Takes the directory holding a `node_modules` with the packed tarball in it.
// `createRequire` bases resolution there, so the require below behaves as if
// this file sat in that directory: it goes through the package name, the `main`
// field, and the published file layout.
//
// plotly.js needs a browser, so even a complete load ends in a DOM error. The
// caller reads the single line this prints on stdout.

const { createRequire } = require('node:module');
const path = require('node:path');

const consumerDir = process.argv[2];
const consumerRequire = createRequire(path.join(consumerDir, 'index.js'));

globalThis.self = globalThis;
globalThis.window = globalThis;

try {
    consumerRequire('plotly.js');
    console.log('LOADED');
} catch (err) {
    console.log(err.code === undefined ? 'RUNTIME:' + err.name : 'CODE:' + err.code);
    console.error(err.message.split('\n')[0]);
}
