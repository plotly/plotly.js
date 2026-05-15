import { exec } from 'child_process';
import fs from 'fs';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import config, { getNEDownloadUrl, getNEFilename } from '../config.mjs';

const { inputDir, resolutions, unDownloadUrl, unFilename, vectors } = config;

const outputPath = inputDir;

// Download Natural Earth vector maps
for (const vector of Object.values(vectors)) {
    for (const resolution of resolutions) {
        const url = getNEDownloadUrl({ resolution, vector });
        const filename = getNEFilename({ resolution, source: vector.source });
        const archivePath = `${outputPath}/${filename}.zip`;

        if (!fs.existsSync(archivePath)) {
            try {
                const response = await fetch(url);
                if (!response.ok || !response.body) throw new Error(`Bad response: ${response.status}`);

                if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });
                const file = fs.createWriteStream(archivePath);
                await pipeline(Readable.fromWeb(response.body), file);

                // Use the shell to handle decompressing
                if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });
                exec(`unzip -o ${archivePath} -d ${outputPath}`);
            } catch (error) {
                console.error(`Error when downloading file '${archivePath}': ${error}`);
                continue;
            }
        }
    }
}

// Download UN GeoJSON file
const url = unDownloadUrl;
const archivePath = `${outputPath}/${unFilename}.zip`;
const geojsonPath = `${outputPath}`;
const geojsonFilePath = `${geojsonPath}/${unFilename}.geojson`;

if (fs.existsSync(archivePath)) {
    if (!fs.existsSync(geojsonFilePath)) exec(`unzip -o ${archivePath} -d ${geojsonPath}`);
} else {
    try {
        const response = await fetch(url);
        if (!response.ok || !response.body) throw new Error(`Bad response: ${response.status}`);

        const file = fs.createWriteStream(geojsonFilePath);
        await pipeline(Readable.fromWeb(response.body), file);

        // Use the shell to handle compression
        exec(`zip -j ${archivePath} ${geojsonFilePath}`);
    } catch (error) {
        console.error(`Error when downloading file '${geojsonFilePath}': ${error}`);
    }
}
