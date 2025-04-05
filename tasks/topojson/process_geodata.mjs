import fs from 'fs';
import mapshaper from 'mapshaper';
import path from 'path';
import config, { getNEFilename } from './config.mjs';

const { filters, inputDir, layers, resolutions, scopes, unFilename, vectors } = config;

// Create output directories
const outputDirGeojson = path.resolve(config.outputDirGeojson);
if (!fs.existsSync(outputDirGeojson)) fs.mkdirSync(outputDirGeojson, { recursive: true });
const outputDirTopojson = path.resolve(config.outputDirTopojson);
if (!fs.existsSync(outputDirTopojson)) fs.mkdirSync(outputDirTopojson, { recursive: true });

async function convertShpToGeo(filename) {
    const inputFilePath = `${inputDir}/${filename}.shp`;
    const outputFilePath = `${outputDirGeojson}/${filename}.geojson`;
    const commands = [inputFilePath, `-proj wgs84``-o format=geojson ${outputFilePath}`];
    await mapshaper.runCommands(commands);

    console.log(`GeoJSON saved to ${outputFilePath}`);
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

async function createCountriesLayer({ bounds, filter, name, resolution, source }) {
    console.log(`Building ${resolution}m countries layer for '${name}'`);
    const inputFilePath = `${outputDirGeojson}/${unFilename}_${resolution}m/${source}.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/countries.geojson`;
    const commands = [
        inputFilePath,
        bounds.length ? `-clip bbox=${bounds.join(',')}` : '',
        filter ? `-filter '${filter}'` : '',
        `-o ${outputFilePath}`
    ].join(' ');
    await mapshaper.runCommands(commands);
    // TODO: Add simplification command if on 110m resolution? Or take care of somewhere else?
}

async function createLandLayer({ bounds, name, resolution, source }) {
    // TODO: Figure out way to only include North and Central America via filter, dissolve
    console.log(`Building ${resolution}m land layer for '${name}'`);
    const inputFilePath = `${outputDirGeojson}/${unFilename}_${resolution}m/${source}.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/land.geojson`;
    const commands = [
        inputFilePath,
        '-dissolve',
        bounds.length ? `-clip bbox=${bounds.join(',')}` : '',
        `-o ${outputFilePath}`
    ].join(' ');
    await mapshaper.runCommands(commands);
}

async function createCoastlinesLayer({ bounds, name, resolution, source }) {
    console.log(`Building ${resolution}m coastlines layer for '${name}'`);
    // TODO: Update source to be a path?
    const inputFilePath = `${outputDirGeojson}/${unFilename}_${resolution}m/${source}.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/coastlines.geojson`;
    const commands = [
        inputFilePath,
        '-dissolve',
        '-lines',
        bounds.length ? `-clip bbox=${bounds.join(',')}` : '',
        `-o ${outputFilePath}`
    ].join(' ');
    await mapshaper.runCommands(commands);
}

async function createOceanLayer({ bounds, name, resolution, source }) {
    console.log(`Building ${resolution}m ocean layer for '${name}'`);
    const inputFilePath = `./tasks/topojson/world_rectangle.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/ocean.geojson`;
    const eraseFilePath = `${outputDirGeojson}/${unFilename}_${resolution}m/${source}.geojson`;
    const commands = [
        inputFilePath,
        bounds.length ? `-clip bbox=${bounds.join(',')}` : '',
        `-erase ${eraseFilePath}`,
        `-o ${outputFilePath}`
    ].join(' ');
    await mapshaper.runCommands(commands);
}

async function createRiversLayer({ name, resolution, source }) {
    console.log(`Building ${resolution}m rivers layer for '${name}'`);
    const inputFilePath = `${outputDirGeojson}/${getNEFilename({ resolution, source })}.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/rivers.geojson`;
    const commands = [
        inputFilePath,
        `-clip ${outputDirGeojson}/${name}_${resolution}m/countries.geojson`, // Clip to the continent
        `-o ${outputFilePath}`
    ].join(' ');
    await mapshaper.runCommands(commands);
}

async function createLakesLayer({ name, resolution, source }) {
    console.log(`Building ${resolution}m lakes layer for '${name}'`);
    const inputFilePath = `${outputDirGeojson}/${getNEFilename({ resolution, source })}.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/lakes.geojson`;
    const commands = [
        inputFilePath,
        `-clip ${outputDirGeojson}/${name}_${resolution}m/countries.geojson`, // Clip to the continent
        `-o ${outputFilePath}`
    ].join(' ');
    await mapshaper.runCommands(commands);
}

async function createSubunitsLayer({ name, resolution, source }) {
    console.log(`Building ${resolution}m subunits layer for '${name}'`);
    const filter = ['AUS', 'BRA', 'CAN', 'USA'].map((id) => `adm0_a3 === "${id}"`).join(' || ');
    const inputFilePath = `${outputDirGeojson}/${getNEFilename({ resolution, source })}.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/subunits.geojson`;
    const commands = [
        inputFilePath,
        `-filter "${filter}"`,
        `-clip ${outputDirGeojson}/${name}_${resolution}m/countries.geojson`, // Clip to the continent
        `-o ${outputFilePath}`
    ].join(' ');
    await mapshaper.runCommands(commands);
    // const geojson = getJsonFile(outputFilePath)
    // const prunedJsonFile = pruneProperties(geojson)
}

function pruneProperties(geojson) {
    const newFeatures = geojson.features.map((feature) => {
        const { properties } = feature;
        if (properties) {
            // Update id to three letter country code
            feature.id = properties.a3;
            for (const property in properties) {
                if (!['ct'].includes(property)) delete properties[property];
            }
        }

        return feature;
    });
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
            const commands = [`${regionDir}/*.geojson combine-files``-o format=topojson ${outputFile}`].join(' ');
            await mapshaper.runCommands(commands);

            console.log(`Topojson saved to: ${outputFile}`);
        }
    }
}

for (const resolution of resolutions) {
    for (const source of Object.values(vectors)) {
        await convertShpToGeo(getNEFilename({ resolution, source }));
    }

    // TODO: Update this to simplify the '50m' UN GeoJSON to '110m'
    // Get all polygon features layer from UN GeoJSON
    const inputFilePath = `${inputDir}/${unFilename}.geojson`;
    const outputFilePath = `${outputDirGeojson}/${unFilename}_${resolution}m/all_features.geojson`;
    const commandsAllFeatures = [inputFilePath, `-o target=1 ${outputFilePath}`].join(' ');
    await mapshaper.runCommands(commandsAllFeatures);

    // Get countries from all polygon features
    const inputFilePathCountries = `${outputDirGeojson}/${unFilename}_${resolution}m/all_features.geojson`;
    const outputFilePathCountries = `${outputDirGeojson}/${unFilename}_${resolution}m/countries.geojson`;
    const commandsCountries = [
        inputFilePathCountries,
        `-filter '${filters.countries}'`,
        `-o ${outputFilePathCountries}`
    ].join(' ');
    await mapshaper.runCommands(commandsCountries);

    // Get land from all polygon features
    const inputFilePathLand = `${outputDirGeojson}/${unFilename}_${resolution}m/all_features.geojson`;
    const outputFilePathLand = `${outputDirGeojson}/${unFilename}_${resolution}m/land.geojson`;
    const commandsLand = [inputFilePathLand, `-filter '${filters.land}'`, `-clean -o ${outputFilePathLand}`].join(' ');
    await mapshaper.runCommands(commandsLand);
}

for (const resolution of resolutions) {
    for (const {
        name,
        specs: { bounds, filter }
    } of scopes) {
        await createCountriesLayer({ bounds, filter, name, resolution, source: layers.countries });
        await createLandLayer({ bounds, name, resolution, source: layers.land });
        await createCoastlinesLayer({ bounds, name, resolution, source: layers.coastlines });
        await createOceanLayer({ bounds, name, resolution, source: layers.ocean });
        await createRiversLayer({ bounds, name, resolution, source: layers.rivers });
        await createLakesLayer({ bounds, name, resolution, source: layers.lakes });
        await createSubunitsLayer({ bounds, name, resolution, source: layers.subunits });
    }
}
await combineFiles();
// Prune topojson?
