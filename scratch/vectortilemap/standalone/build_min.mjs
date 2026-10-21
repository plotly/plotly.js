// Build a minified map bundle for the standalone page. Scratch only: the plugin swaps in a classic
// (IIFE) MapLibre worker, because Chromium refuses module workers from blob: URLs on file:// pages.
import esbuild from '/home/user/plotly.js/node_modules/esbuild/lib/main.js';
import fs from 'fs';
import { createRequire } from 'module';
import stripMeta from '/home/user/plotly.js/tasks/compress_attributes.js';
import { esbuildConfig } from '/home/user/plotly.js/esbuild-config.js';

const require = createRequire(import.meta.url);
const workerEntry = require.resolve('/home/user/plotly.js/node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs');
const classic = esbuild.buildSync({ entryPoints: [workerEntry], bundle: true, write: false, format: 'iife', platform: 'browser', minify: true, logLevel: 'warning' }).outputFiles[0].text;

const classicWorker = {
    name: 'classic-maplibre-worker',
    setup(build) {
        build.onLoad({ filter: /build[\\/]maplibre_worker\.js$/ }, () => ({ contents: `module.exports = ${JSON.stringify(classic)};`, loader: 'js' }));
        build.onLoad({ filter: /src[\\/]plots[\\/]map[\\/]map\.js$/ }, (args) => {
            const src = fs.readFileSync(args.path, 'utf8');
            const out = src.replace("{ type: 'text/javascript' })));", "{ type: 'text/javascript' })) + '#maplibre-worker.cjs');");
            if (out === src) throw new Error('setWorkerUrl line not found');
            return { contents: out, loader: 'js' };
        });
    }
};
const out = process.argv[2];
await esbuild.build({
    ...esbuildConfig,
    entryPoints: ['/home/user/plotly.js/lib/index-map.js'],
    outfile: out,
    minify: true,
    plugins: [classicWorker, ...esbuildConfig.plugins, stripMeta]
});
// the same wrapper as tasks/util/bundle_wrapper.mjs
const wrapped = '(function(root, factory) { if (typeof module === "object" && module.exports) { module.exports = factory(); } else { root.moduleName = factory(); } } (typeof self !== "undefined" ? self : this, () => {\n' +
    fs.readFileSync(out, 'utf8') + '\nwindow.Plotly = Plotly;\nreturn Plotly;\n}));\n';
fs.writeFileSync(out, wrapped);
