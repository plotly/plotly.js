import { exec } from 'child_process';
import fs from 'fs';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import config, { getDownloadUrl, getFilename } from './config.mjs';

const { resolutions, vectors } = config;

const tasksPath = './tasks/topojson';
const outputPath = './build/geodata';

for (const vector of vectors) {
    for (const resolution of resolutions) {
        const url = getDownloadUrl({ resolution, vector });
        const filename = getFilename({ resolution, source: vector.source });
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
            } catch (error) {
                console.error(`Error when downloading file '${archivePath}': ${error}`);
                continue;
            }

            console.log('Unzipping shapefiles', `unzip -o ${archivePath} -d ${outputPath}`);
            // Use the shell to handle unzipping
            if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });
            exec(`unzip -o ${archivePath} -d ${outputPath}`);

            console.log(`Shapefiles unzipped to ${outputPath}`);
        }
    }
}
