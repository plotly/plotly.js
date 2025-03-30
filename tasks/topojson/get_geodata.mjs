import { exec } from 'child_process';
import fs from 'fs';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import config, { getDownloadUrl, getFilename } from './config.mjs';

const { resolutions, vectors } = config

const tasksPath = './tasks/topojson';
const outputPath = './build/geodata';

for (const vector of vectors) {
    for (const resolution of resolutions) {
        const url = getDownloadUrl({ resolution, vector })
        const filename = getFilename({ resolution, source: vector.source })
        const archivePath = `${outputPath}/${filename}.zip`

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
            } catch(error) {
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

// try {
//     // Download data from UN
//     // const tasksPath = './tasks/topojson';
//     // const outputPath = './build/geodata';
//     const archivePath = `${tasksPath}/geodata.zip`;

//     if (fs.existsSync(archivePath)) {
//         console.log('Data file already exists. Skipping download.');
//     } else {
//         console.log(`Downloading data from ${config.downloadUrl}`);
//         const unResponse = await fetch(config.downloadUrl);
//         if (!unResponse.ok || !unResponse.body) throw new Error(`Bad response: ${unResponse.status}`);

//         console.log('Processing data');
//         if (!fs.existsSync(archivePath)) fs.mkdirSync(archivePath, { recursive: true });
//         const file = fs.createWriteStream(archivePath);
//         await pipeline(Readable.fromWeb(unResponse.body), file);

//         console.log(`Download complete. File saved to: ${archivePath}`);
//     }

//     // Unzip archive
//     if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });
//     console.log('Unzipping shapefiles', `unzip -o ${archivePath} -d ${outputPath}`);
//     // Use the shell to handle unzipping
//     if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });
//     exec(`unzip -o ${archivePath} -d ${outputPath}`);

//     console.log(`Shapefiles unzipped to ${outputPath}`);
// } catch (error) {
//     console.error(`Error when downloading file!: ${error}`);
// }
