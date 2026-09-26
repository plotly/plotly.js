import fs from 'node:fs';
import path from 'node:path';
import intoStream from 'into-stream';
import minify from 'minify-stream';

const prefix = 'var locale=';
const suffix =
    ";if(typeof Plotly === 'undefined') {window.PlotlyLocales = window.PlotlyLocales || []; window.PlotlyLocales.push(locale);} else {Plotly.register(locale);}";

const moduleMarker = 'module.exports = ';

/**
 * Wrap a locale json file into a standalone js file.
 *
 * @param {string} pathToInput - path to the locale json file
 * @param {string} pathToOutput - path to destination file
 *
 * Logs basename of bundle when completed.
 */
export default function wrapLocale(pathToInput, pathToOutput) {
    fs.readFile(pathToInput, 'utf8', (_err, data) => {
        const moduleStart = data.indexOf(moduleMarker) + moduleMarker.length;
        const moduleEnd = data.indexOf(';', moduleStart);

        const rawOut = `${prefix}${data.slice(moduleStart, moduleEnd)}${suffix}`;

        intoStream(rawOut)
            .pipe(
                minify({
                    ecma: 5,
                    mangle: true,
                    output: {
                        beautify: false,
                        ascii_only: true
                    },
                    sourceMap: false
                })
            )
            .pipe(fs.createWriteStream(pathToOutput))
            .on('finish', () => {
                console.log(`ok ${path.basename(pathToOutput)}`);
            });
    });
}
