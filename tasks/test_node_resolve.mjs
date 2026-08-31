import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { pathToRoot } from './util/constants.js';

// Bundlers resolve a `.ts` extension, so `npm run build` hides a package that
// Node alone cannot load. This test packs the real tarball and loads it the way
// a Node consumer does: `require('plotly.js')` under the CommonJS resolver.
// See https://github.com/plotly/plotly.js/issues/7995.
//
// The package needs a browser, so the load always ends in a DOM error. That is
// the pass condition. Any resolution error is the regression.

// tsc overwrites a hand-written `foo.js` when a `foo.ts` sits beside it, and it
// reports no error. Such a pair is already ambiguous, because esbuild picks the
// `.ts` and the local build silently ignores the `.js`. Fail here instead.
const collisions = fs
    .globSync('src/**/*.ts', { cwd: pathToRoot })
    .filter((file) => !file.endsWith('.d.ts'))
    .filter((file) => fs.existsSync(path.join(pathToRoot, file.replace(/\.ts$/, '.js'))));

if (collisions.length) {
    throw new Error(
        [
            'A TypeScript source shares a basename with a JavaScript file:',
            ...collisions.map((file) => '  ' + file),
            'The pack step would overwrite the JavaScript file. Rename one of the two.'
        ].join('\n')
    );
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'plotly-node-resolve-'));

try {
    console.log('Packing the tarball');
    const packed = execFileSync('npm', ['pack', '--pack-destination', tmp, '--silent'], {
        cwd: pathToRoot,
        encoding: 'utf8'
    })
        .trim()
        .split('\n')
        .pop();

    // Install the tarball the way npm would, so that `require('plotly.js')`
    // goes through the package name, the `main` field, and the published file
    // layout.
    const pkg = path.join(tmp, 'node_modules', 'plotly.js');

    fs.mkdirSync(pkg, { recursive: true });
    execFileSync('tar', ['-xzf', path.join(tmp, packed), '-C', pkg, '--strip-components=1']);

    // The tarball carries no dependencies. Borrow the ones already installed.
    fs.symlinkSync(path.join(pathToRoot, 'node_modules'), path.join(pkg, 'node_modules'), 'dir');

    // The probe resolves from `tmp`, which is where the tarball is installed.
    // It runs in its own process so that it starts with a clean module registry
    // and its own globals.
    const probe = path.join(pathToRoot, 'tasks', 'util', 'node_resolve_probe.js');
    const result = execFileSync(process.execPath, [probe, tmp], { encoding: 'utf8' }).trim();

    // A ReferenceError means every `require` in the graph resolved, and the
    // package only then reached for a browser API.
    if (result === 'LOADED' || result === 'RUNTIME:ReferenceError') {
        console.log('OK: the published package resolves under Node (' + result + ')');
    } else {
        throw new Error(
            [
                'The published package does not resolve under Node: ' + result,
                'Every src/**/*.ts needs a generated .js sibling in the tarball.',
                'See tsconfig.build.json and the prepack script in package.json.'
            ].join('\n')
        );
    }
} finally {
    fs.rmSync(tmp, { recursive: true, force: true });
}
