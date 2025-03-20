import { exec } from 'child_process';
import fs from 'fs';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import config from './config.json' assert { type: 'json' };

try {
    // Download data from UN
    const dataPath = './build/geodata';
    const outputPath = dataPath;
    const filePath = `${outputPath}/geodata.zip`;

    if (fs.existsSync(filePath)) {
        console.log('Data file already exists. Skipping download.');
    } else {
        console.log(`Downloading data from ${config.downloadUrl}`);
        const unResponse = await fetch(config.downloadUrl);
        if (!unResponse.ok || !unResponse.body) throw new Error(`Bad response: ${unResponse.status}`);

        console.log('Processing data');
        if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath, { recursive: true });
        const file = fs.createWriteStream(filePath);
        await pipeline(Readable.fromWeb(unResponse.body), file);

        console.log(`Download complete. File saved to: ${filePath}`);
    }

    // Unzip archive
    console.log('Unzipping shapefiles', `unzip -o ${filePath} -d ${outputPath}`);
    // Use the shell to handle unzipping
    if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });
    exec(`unzip -o ${filePath} -d ${outputPath}`);

    console.log(`Shapefiles unzipped to ${outputPath}`);
} catch (error) {
    console.error(`Error when downloading file!: ${error}`);
}
