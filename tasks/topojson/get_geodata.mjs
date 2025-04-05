import { exec } from 'child_process';
import fs from 'fs';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import config, { getNEDownloadUrl, getNEFilename } from './config.mjs';

const { resolutions, unDownloadUrl, unFilename, vectors } = config;

const tasksPath = './tasks/topojson';
const outputPath = './build/geodata';

// Download Natural Earth vectors
for (const [vector, source] of Object.entries(vectors)) {
    for (const resolution of resolutions) {
        const url = getNEDownloadUrl({ resolution, vector });
        const filename = getNEFilename({ resolution, source });
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

                console.log('Unzipping NE shapefile');
                // Use the shell to handle unzipping
                if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });
                exec(`unzip -o ${archivePath} -d ${outputPath}`);

                console.log(`NE Shapefile unzipped to ${outputPath}`);
            } catch (error) {
                console.error(`Error when downloading file '${archivePath}': ${error}`);
                continue;
            }
        }
    }
}

// Download UN GeoJSON file
const url = unDownloadUrl;
const geojsonPath = `${tasksPath}/${unFilename}.geojson`;

if (fs.existsSync(geojsonPath)) {
    console.log(`File ${geojsonPath} already exists. Skipping download.`);
    fs.copyFileSync(geojsonPath, `${outputPath}/${unFilename}.geojson`);
} else {
    try {
        console.log(`Downloading data from ${url}`);

        const response = await fetch(url);
        if (!response.ok || !response.body) throw new Error(`Bad response: ${response.status}`);

        if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });
        const file = fs.createWriteStream(geojsonPath);
        await pipeline(Readable.fromWeb(response.body), file);
        fs.copyFileSync(geojsonPath, `${outputPath}/${unFilename}.geojson`);

        console.log(`UN GeoJSON file copied to ${outputPath}`);
    } catch (error) {
        console.error(`Error when downloading file '${geojsonPath}': ${error}`);
    }
}
