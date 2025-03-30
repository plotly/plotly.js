import { exec } from 'child_process';
import fs from 'fs';
import mapshaper from 'mapshaper';
import path from 'path';
import { promisify } from 'util';
import config, { getFilename } from './config.mjs';

const { inputDir, layers, resolutions, scopes, vectors } = config;

// Create output directories
const outputDirGeojson = path.resolve(config.outputDirGeojson);
if (!fs.existsSync(outputDirGeojson)) fs.mkdirSync(outputDirGeojson, { recursive: true });
const outputDirTopojson = path.resolve(config.outputDirTopojson);
if (!fs.existsSync(outputDirTopojson)) fs.mkdirSync(outputDirTopojson, { recursive: true });

async function convertShpToGeo(filename) {
    const inputFilePath = `${inputDir}/${filename}.shp`;
    const outputFilePath = `${outputDirGeojson}/${filename}.geojson`;
    const commands = `${inputFilePath} -proj wgs84 -o format=geojson ${outputFilePath}`;
    await mapshaper.runCommands(commands);

    console.log(`GeoJSON saved to ${outputFilePath}`);
}

async function convertGeoToJson({ resolution, source }) {
    const inputFilePath = `${outputDirGeojson}/${getFilename({ resolution, source })}.geojson`;
    const outputFilePath = `${outputDirGeojson}/${getFilename({ resolution, source })}.json`;
    const commands = `-i ${inputFilePath} -o format=json ${outputFilePath}`;
    await mapshaper.runCommands(commands);
}

function getJsonFile(filename) {
    console.log(`📂 Loading JSON file ${filename}...`);
    try {
        return JSON.parse(fs.readFileSync(filename, 'utf8'));
    } catch (err) {
        console.error(`❌ Failed to load JSON input file '${filename}':`, err.message);
        process.exit(1);
    }
}

async function createCountriesLayer({ bounds, filter: { key, value }, name, resolution, source }) {
    console.log(`Building ${resolution}m countries layer for '${name}'`);
    const inputFilePath = `${outputDirGeojson}/${source}_${resolution}m.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/countries.geojson`;
    const filterCommand =
        key && value
            ? getJsonFile(`${outputDirGeojson}/${getFilename({ resolution: 50, source: vectors.countries })}.json`)
                  .filter((item) => item[key] === value)
                  .map((item) => `name === "${item.NAME}"`)
                  .join(' || ')
                  .replace("'", "\\'") // Handle Côte d'Ivoire
            : '';
    const commands = `${inputFilePath} ${bounds.length ? `-clip bbox=${bounds.join(',')}` : ''} ${filterCommand ? `-filter '${filterCommand}'` : ''} -o ${outputFilePath}`;
    await mapshaper.runCommands(commands);
}

async function createLandLayer({ name, resolution, source }) {
    console.log(`Building ${resolution}m land layer for '${name}'`);
    const inputFilePath = `${outputDirGeojson}/${name}_${resolution}m/${source}.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/land.geojson`;
    const commands = `${inputFilePath} -dissolve -o ${outputFilePath}`;
    await mapshaper.runCommands(commands);
}

async function createCoastlinesLayer({ bounds, name, resolution, source }) {
    console.log(`Building ${resolution}m coastlines layer for '${name}'`);
    const inputFilePath = `${outputDirGeojson}/${source}_${resolution}m.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/coastlines.geojson`;
    const commands = `${inputFilePath} -lines ${bounds.length ? `-clip bbox=${bounds.join(',')}` : ''} -o ${outputFilePath}`;
    await mapshaper.runCommands(commands);
}

async function createOceanLayer({ bounds, name, resolution, source }) {
    console.log(`Building ${resolution}m ocean layer for '${name}'`);
    const inputFilePath = `./tasks/topojson/world_rectangle.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/ocean.geojson`;
    const eraseFilePath = `${outputDirGeojson}/${source}_${resolution}m.geojson`;
    const commands = `${inputFilePath} ${bounds.length ? `-clip bbox=${bounds.join(',')}` : ''} -erase ${eraseFilePath} -o ${outputFilePath}`;
    await mapshaper.runCommands(commands);
}

async function createRiversLayer({ bounds, name, resolution, source }) {
    console.log(`Building ${resolution}m rivers layer for '${name}'`);
    const inputFilePath = `${outputDirGeojson}/${getFilename({ resolution, source })}.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/rivers.geojson`;
    // Clip to the continent
    const commands = `${inputFilePath} -clip ${outputDirGeojson}/${name}_${resolution}m/countries.geojson -o ${outputFilePath}`;
    await mapshaper.runCommands(commands);
}

async function createLakesLayer({ bounds, name, resolution, source }) {
    console.log(`Building ${resolution}m lakes layer for '${name}'`);
    const inputFilePath = `${outputDirGeojson}/${getFilename({ resolution, source })}.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/lakes.geojson`;
    // Clip to the continent
    const commands = `${inputFilePath} -clip ${outputDirGeojson}/${name}_${resolution}m/countries.geojson -o ${outputFilePath}`;
    await mapshaper.runCommands(commands);
}

async function createSubunitsLayer({ bounds, name, resolution, source }) {
    console.log(`Building ${resolution}m subunits layer for '${name}'`);
    const inputFilePath = `${outputDirGeojson}/${getFilename({ resolution, source })}.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/subunits.geojson`;
    // Clip to the continent
    const commands = `${inputFilePath} -clip ${outputDirGeojson}/${name}_${resolution}m/countries.geojson -o ${outputFilePath}`;
    await mapshaper.runCommands(commands);
}

async function combineFiles() {
    // TODO: Update properties to only include relevant info (see formatProperties in sane-topojson)
    for (const resolution of resolutions) {
        for (const { name } of scopes) {
            const regionDir = path.join(outputDirGeojson, `${name}_${resolution}m`);
            if (!fs.existsSync(regionDir)) {
                console.log(`Couldn't find ${regionDir}`);
                continue;
            }

            const outputFile = `${outputDirTopojson}/${name}_${resolution}m.json`;
            // Layer names default to file names
            const commands = `-i ${regionDir}/*.geojson combine-files -o format=topojson ${outputFile}`;
            await mapshaper.runCommands(commands);

            console.log(`Topojson saved to: ${outputFile}`);
        }
    }
}

for (const resolution of resolutions) {
    for (const source of Object.values(vectors)) {
        await convertShpToGeo(getFilename({ resolution, source }));
    }
}

// Convert NE countries data into JSON
convertGeoToJson({ resolution: 50, source: vectors.countries });

async function extractCountriesLandLayers() {
    for (const resolution of resolutions) {
        for (const layer of ['countries', 'land']) {
            const worldMapPath = path.resolve(`./node_modules/visionscarto-world-atlas/world/${resolution}m.json`);
            const outputFilePath = `${outputDirGeojson}/world_atlas_${layer}_${resolution}m.geojson`;
            const tempOutputFilePath = `${outputDirGeojson}/world_atlas_${layer}_${resolution}m_temp.geojson`;
            const commands = `${worldMapPath} -o format=geojson target=${layer} ${tempOutputFilePath}`;
            await mapshaper.runCommands(commands);
            const exec_promise = promisify(exec);
            if (fs.existsSync(outputFilePath)) fs.unlinkSync(outputFilePath);
            await exec_promise(`ogr2ogr ${outputFilePath} ${tempOutputFilePath} -wrapdateline`);
        }
    }
}

await extractCountriesLandLayers();

for (const resolution of resolutions) {
    for (const {
        name,
        specs: { bounds, filter = {} }
    } of scopes) {
        await createCountriesLayer({ bounds, filter, name, resolution, source: layers.countries });
        await createLandLayer({ name, resolution, source: layers.land });
        await createCoastlinesLayer({ bounds, name, resolution, source: layers.coastlines });
        await createOceanLayer({ bounds, name, resolution, source: layers.ocean });
        await createRiversLayer({ bounds, name, resolution, source: layers.rivers });
        await createLakesLayer({ bounds, name, resolution, source: layers.lakes });
        await createSubunitsLayer({ bounds, name, resolution, source: layers.subunits });
    }
}
await combineFiles();
