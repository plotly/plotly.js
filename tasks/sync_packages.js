const path = require('path');
const fs = require('fs-extra');
const { execFile, spawn } = require('child_process');
const { glob } = require('glob');

const common = require('./util/common');
const constants = require('./util/constants');
const pkg = require('../package.json');

const year = new Date().getFullYear();

const copyrightAndLicense = [
    '## Copyright and license',
    '',
    `Code and documentation copyright ${year} Plotly, Inc.`,
    '',
    'Code released under the [MIT license](https://github.com/plotly/plotly.js/blob/main/LICENSE).',
    '',
    'Docs released under the [Creative Commons license](https://github.com/plotly/documentation/blob/source/LICENSE).',
    ''
].join('\n');

// Type info for the packages that carry types (plotly.js-dist and plotly.js-dist-min)
const TYPES_MAIN = 'lib/index.d.ts';
const TYPES_FILES = [TYPES_MAIN, 'src/types'];

/**
 * Get the npm dist-tag for the packages.
 *
 * @returns The value of `--tag` when the caller passes one. Otherwise `rc` for `X.Y.Z-rc.N`, and `latest` for any other version.
 */
const getDistTag = () => {
    const i = process.argv.indexOf('--tag');
    if (i !== -1) {
        const tag = process.argv[i + 1];
        if (!tag || tag.startsWith('--')) throw new Error('Missing value for --tag');
        return tag;
    }

    const prerelease = pkg.version.split('-')[1];
    return prerelease ? prerelease.split('.')[0] : 'latest';
};

const partialBundlePaths = constants.partialBundleNames.map(constants.makePartialBundleOpts);

const distPackages = partialBundlePaths
    .map((d) => ({
        name: `plotly.js-${d.name}-dist`,
        main: `plotly-${d.name}.js`,
        dist: d.dist,
        desc: `Ready-to-use plotly.js ${d.name} distributed bundle.`,
        traceList: constants.partialBundleTraces[d.name]
    }))
    .concat([
        {
            name: 'plotly.js-dist',
            main: 'plotly.js',
            dist: constants.pathToPlotlyDist,
            desc: 'Ready-to-use plotly.js distributed bundle.',
            traceList: constants.allTraces,
            includeTypes: true
        }
    ]);

const distMinPackages = partialBundlePaths
    .map((d) => ({
        name: `plotly.js-${d.name}-dist-min`,
        main: `plotly-${d.name}.min.js`,
        dist: d.distMin,
        desc: `Ready-to-use minified plotly.js ${d.name} distributed bundle.`,
        traceList: constants.partialBundleTraces[d.name]
    }))
    .concat([
        {
            name: 'plotly.js-dist-min',
            main: 'plotly.min.js',
            dist: constants.pathToPlotlyDistMin,
            desc: 'Ready-to-use minified plotly.js distributed bundle.',
            traceList: constants.allTraces,
            includeTypes: true
        }
    ]);

const localesPackage = {
    name: 'plotly.js-locales',
    main: 'index.js',
    desc: 'Ready-to-use plotly.js locales'
};

const writePackageJSON = (pkgPath, d, files) => {
    const cnt = {
        name: d.name,
        version: pkg.version,
        description: d.desc,
        license: pkg.license,
        main: d.main,
        repository: pkg.repository,
        bugs: pkg.bugs,
        author: pkg.author,
        keywords: pkg.keywords,
        files
    };
    if (d.includeTypes) {
        cnt.types = TYPES_MAIN;
        cnt.files.push(...TYPES_FILES);
    }

    return fs.writeFile(path.join(pkgPath, 'package.json'), `${JSON.stringify(cnt, null, 2)}\n`);
};

const writeBundleREADME = (pkgPath, d) => {
    const cnt = [
        `# ${d.name}`,
        '',
        d.desc,
        '',
        `Contains trace modules ${common.formatEnumeration(d.traceList)}.`,
        '',
        'For more info on plotly.js, go to https://github.com/plotly/plotly.js#readme',
        '',
        '## Installation',
        '',
        '```',
        `npm install ${d.name}`,
        '```',
        '## Usage',
        '',
        '```js',
        '// ES6 module',
        `import Plotly from '${d.name}'`,
        '',
        '// CommonJS',
        `var Plotly = require('${d.name}')`,
        '```',
        '',
        ...(d.includeTypes
            ? [
                  '## TypeScript',
                  '',
                  'This package includes its own TypeScript declarations.',
                  '',
                  '```ts',
                  `import Plotly from '${d.name}'`,
                  `import type { Data, Layout } from '${d.name}'`,
                  '',
                  "const data: Data[] = [{ type: 'scatter', x: [1, 2, 3], y: [4, 5, 6] }]",
                  "const layout: Partial<Layout> = { title: { text: 'Demo' } }",
                  '',
                  'await Plotly.newPlot(div, data, layout)',
                  '```',
                  ''
              ]
            : []),
        copyrightAndLicense,
        `Please visit [complete list of dependencies](https://www.npmjs.com/package/plotly.js/v/${pkg.version}?activeTab=dependencies).`
    ];

    return fs.writeFile(path.join(pkgPath, 'README.md'), cnt.join('\n'));
};

const writeLocalesREADME = (pkgPath, d) => {
    const cnt = [
        `# ${d.name}`,
        '',
        d.desc,
        '',
        'For more info on plotly.js, go to https://github.com/plotly/plotly.js#readme',
        '',
        '## Installation',
        '',
        '```',
        `npm install ${d.name}`,
        '```',
        '## Usage',
        '',
        'For example to setup the `fr` locale:',
        '',
        '```js',
        '// ES6 module',
        "import Plotly from 'plotly.js'",
        `import locale from '${d.name}/fr'`,
        '',
        '// CommonJS',
        "var Plotly = require('plotly.js')",
        `var locale = require('${d.name}/fr')`,
        '',
        '// then',
        'Plotly.register(locale)',
        "Plotly.setPlotConfig({locale: 'fr'})",
        '```',
        '',
        copyrightAndLicense
    ];

    return fs.writeFile(path.join(pkgPath, 'README.md'), cnt.join('\n'));
};

const copyTypes = async (pkgPath) => {
    // Only include type related files in copy
    const isDeclaration = (src) => fs.statSync(src).isDirectory() || src.endsWith('.d.ts');

    // Match the type file structure from the full library
    await fs.copy(path.join(constants.pathToLib, 'index.d.ts'), path.join(pkgPath, TYPES_MAIN));
    await fs.copy(path.join(constants.pathToSrc, 'types'), path.join(pkgPath, 'src', 'types'), {
        filter: isDeclaration
    });
};

/**
 * Test whether npm already holds the current version of a package.
 *
 * @param name - The npm package name
 * @returns True when the registry lists `name@version`, false when the registry returns a 404
 */
const isPublished = (name) =>
    new Promise((resolve, reject) => {
        execFile('npm', ['view', `${name}@${pkg.version}`, 'version', '--json'], (err, stdout) => {
            if (!err) return resolve(stdout.trim() !== '');

            let code;
            try {
                code = JSON.parse(stdout).error.code;
            } catch {}
            if (code === 'E404') return resolve(false);
            reject(new Error(`Could not get ${name}@${pkg.version} from npm: ${err.message}`));
        });
    });

const runNpm = (args, cwd) =>
    new Promise((resolve, reject) => {
        spawn('npm', args, { cwd, stdio: 'inherit' })
            .on('error', reject)
            .on('exit', (code) =>
                code === 0 ? resolve() : reject(new Error(`npm ${args.join(' ')} exited with code ${code}`))
            );
    });

const publishToNPM = async (pkgPath, name, tag) => {
    if (process.env.DRYRUN) {
        console.log(`Dry run, did not publish ${name}`);
        await runNpm(['publish', '--dry-run', '--tag', tag], pkgPath);
        return;
    }

    if (await isPublished(name)) {
        console.log(`Skip ${name}@${pkg.version}, which is already on npm`);
        return;
    }

    await runNpm(['publish', '--tag', tag], pkgPath);
};

const syncBundlePkg = async (d, tag) => {
    const pkgPath = path.join(constants.pathToBuild, d.name);

    await fs.ensureDir(pkgPath);
    await writePackageJSON(pkgPath, d, ['LICENSE', 'README.md', d.main]);
    await writeBundleREADME(pkgPath, d);
    await fs.copy(d.dist, path.join(pkgPath, d.main));
    if (d.includeTypes) await copyTypes(pkgPath);
    await fs.copy(path.join(constants.pathToRoot, 'LICENSE'), path.join(pkgPath, 'LICENSE'));
    await publishToNPM(pkgPath, d.name, tag);
};

const syncLocalesPkg = async (d, tag) => {
    const pkgPath = path.join(constants.pathToBuild, d.name);
    const localeFiles = await glob(path.join(constants.pathToLib, 'locales', '*.js'));

    await fs.ensureDir(pkgPath);
    await writePackageJSON(pkgPath, d, ['LICENSE', 'README.md', d.main, ...localeFiles.map((f) => path.basename(f))]);
    await writeLocalesREADME(pkgPath, d);

    const main = [constants.licenseDist, ''];
    for (const f of localeFiles) {
        const n = path.basename(f, '.js');
        main.push(`exports['${n}'] = require('./${n}.js')`);
    }
    main.push('');
    await fs.writeFile(path.join(pkgPath, d.main), main.join('\n'));

    for (const f of localeFiles) await fs.copy(f, path.join(pkgPath, path.basename(f)));
    await fs.copy(path.join(constants.pathToRoot, 'LICENSE'), path.join(pkgPath, 'LICENSE'));
    await publishToNPM(pkgPath, d.name, tag);
};

const main = async () => {
    const tag = getDistTag();
    console.log(`Publish the plotly.js ${pkg.version} bundle packages with the "${tag}" dist-tag`);

    // Publish one package at a time, so that a failure stops the run with a clear cause
    for (const d of [...distPackages, ...distMinPackages]) await syncBundlePkg(d, tag);
    await syncLocalesPkg(localesPackage, tag);
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
