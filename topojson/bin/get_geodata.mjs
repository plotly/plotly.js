import { execFile } from 'child_process';
import fs from 'fs';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { promisify } from 'util';
import config, { getNEDownloadUrl, getNEFilename } from '../config.mjs';

const execFileAsync = promisify(execFile);
const { inputDir, resolutions, unDownloadUrl, unFilename, vectors } = config;

fs.mkdirSync(inputDir, { recursive: true });

/**
 * Download a URL to a file.
 *
 * The function writes to a temporary file and renames it at the end, so a failed download leaves no partial file.
 *
 * @param url - URL to download
 * @param filePath - Path of the output file
 */
const download = async (url, filePath) => {
    console.log(`Downloading '${url}'`);
    const response = await fetch(url);
    if (!response.ok || !response.body) throw new Error(`Bad response: ${response.status}`);

    const partialFilePath = `${filePath}.part`;
    try {
        await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(partialFilePath));
        fs.renameSync(partialFilePath, filePath);
    } finally {
        fs.rmSync(partialFilePath, { force: true });
    }
    const { size } = fs.statSync(filePath);
    const formattedSize = size < 1e6 ? `${(size / 1e3).toFixed(1)} kB` : `${(size / 1e6).toFixed(1)} MB`;
    console.log(`Saved '${filePath}' (${formattedSize})`);
};

const extract = async (archivePath) => {
    console.log(`Extracting '${archivePath}'`);
    await execFileAsync('unzip', ['-o', archivePath, '-d', inputDir]);
};

// Download and extract Natural Earth vector maps
for (const vector of Object.values(vectors)) {
    for (const resolution of resolutions) {
        const filename = getNEFilename({ resolution, source: vector.source });
        const archivePath = `${inputDir}/${filename}.zip`;
        try {
            if (fs.existsSync(archivePath)) {
                console.log(`Using the cached archive '${archivePath}'`);
            } else {
                await download(getNEDownloadUrl({ resolution, vector }), archivePath);
            }
            // Also extract an archive that an earlier run downloaded but did not extract
            if (!fs.existsSync(`${inputDir}/${filename}.shp`)) await extract(archivePath);
        } catch (error) {
            console.error(`Failed to get '${archivePath}': ${error.message}`);
            process.exitCode = 1;
        }
    }
}

// Download the UN GeoJSON file, and keep a zipped copy of it as the cache
const unArchivePath = `${inputDir}/${unFilename}.zip`;
const unGeojsonPath = `${inputDir}/${unFilename}.geojson`;
try {
    if (fs.existsSync(unArchivePath)) {
        console.log(`Using the cached archive '${unArchivePath}'`);
        if (!fs.existsSync(unGeojsonPath)) await extract(unArchivePath);
    } else {
        await download(unDownloadUrl, unGeojsonPath);
        console.log(`Saving a zipped copy as the cache at '${unArchivePath}'`);
        await execFileAsync('zip', ['-j', unArchivePath, unGeojsonPath]);
    }
} catch (error) {
    console.error(`Failed to get '${unGeojsonPath}': ${error.message}`);
    process.exitCode = 1;
}

if (process.exitCode) console.error('Finished with errors. Fix the errors above, then run the script again.');
else console.log(`Finished. The geodata is in '${inputDir}'.`);
