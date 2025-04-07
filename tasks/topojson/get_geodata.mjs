import { exec } from 'child_process';
import fs from 'fs';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import config, { getNEDownloadUrl, getNEFilename } from './config.mjs';

const { resolutions, unDownloadUrl, unFilename, vectors } = config;

const tasksPath = './tasks/topojson';
const outputPath = './build/geodata';

// Download Natural Earth vectors
for (const vector of Object.values(vectors)) {
    for (const resolution of resolutions) {
        const url = getNEDownloadUrl({ resolution, vector });
        const filename = getNEFilename({ resolution, source: vector.source });
        const archivePath = `${outputPath}/${filename}.zip`;

        if (fs.existsSync(archivePath)) {
            console.log(`File ${archivePath} already exists. Skipping download.`);
        } else {
            try {
                console.log(`Downloading data from ${url}`);

                const response = await fetch(url);
                if (!response.ok || !response.body) throw new Error(`Bad response: ${response.status}`);

                if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });
                const file = fs.createWriteStream(archivePath);
                await pipeline(Readable.fromWeb(response.body), file);

                console.log('Decompressing NE shapefile');
                // Use the shell to handle decompressing
                if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });
                exec(`unzip -o ${archivePath} -d ${outputPath}`);

                console.log(`NE Shapefile decompressed to ${outputPath}`);
            } catch (error) {
                console.error(`Error when downloading file '${archivePath}': ${error}`);
                continue;
            }
        }
    }
}

// Download UN GeoJSON file
const url = unDownloadUrl;
const archivePath = `${tasksPath}/${unFilename}.zip`;
const geojsonPath = `${outputPath}`;
const geojsonFilePath = `${geojsonPath}/${unFilename}.geojson`;

if (fs.existsSync(archivePath)) {
    console.log(`File ${archivePath} already exists. Skipping download.`);
    if (fs.existsSync(geojsonFilePath)) console.log(`File ${geojsonFilePath} already exists. Skipping decompression.`);
    else exec(`unzip -o ${archivePath} -d ${geojsonPath}`);
} else {
    try {
        console.log(`Downloading data from ${url}`);

        const response = await fetch(url);
        if (!response.ok || !response.body) throw new Error(`Bad response: ${response.status}`);

        // if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });
        const file = fs.createWriteStream(geojsonFilePath);
        await pipeline(Readable.fromWeb(response.body), file);
        console.log(`UN GeoJSON file saved to ${geojsonFilePath}`);

        console.log('Compressing UN GeoJSON for future use');
        // Use the shell to handle compression
        exec(`zip -j ${archivePath} ${geojsonFilePath}`);

        console.log(`UN GeoJSON archive saved to ${archivePath}`);
    } catch (error) {
        console.error(`Error when downloading file '${geojsonFilePath}': ${error}`);
    }
}
