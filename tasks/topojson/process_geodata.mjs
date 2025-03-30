import { exec } from 'child_process';
import { promisify } from 'util'
import fs from 'fs';
import mapshaper from 'mapshaper';
import path from 'path';
import config, { getFilename } from './config.mjs';

const {
    inputDir,
    resolutions,
    scopes,
    shapefiles,
    simplifyTolerance,
    vectors,
    worldMapPaths
} = config;

// Create output directories
const outputDirGeojson = path.resolve(config.outputDirGeojson);
if (!fs.existsSync(outputDirGeojson)) fs.mkdirSync(outputDirGeojson, { recursive: true });
const outputDirTopojson = path.resolve(config.outputDirTopojson);
if (!fs.existsSync(outputDirTopojson)) fs.mkdirSync(outputDirTopojson, { recursive: true });

async function convertShpToGeo(filename) {
    const inputFilePath = `${inputDir}/${filename}.shp`;
    const outputFilePath = `${outputDirGeojson}/${filename}.geojson`;
    const commands = `-i ${inputFilePath} -proj wgs84 -o format=geojson ${outputFilePath}`;
    await mapshaper.runCommands(commands);

    console.log(`GeoJSON saved to ${outputFilePath}`);
}

async function convertGeoToJson({ resolution, source }) {
    const inputFilePath = `${outputDirGeojson}/${getFilename({ resolution, source})}.geojson`;
    const outputFilePath = `${outputDirGeojson}/${getFilename({ resolution, source})}.json`;
    const commands = `-i ${inputFilePath} -o format=json ${outputFilePath}`
    await mapshaper.runCommands(commands)
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

function cleanGeojson(geojson) {
    return geojson.features.filter((feature) => {
        const hasValidProperties = feature.properties != null;
        // Remove overlapping geometries (broader geographic regions & great lakes) identified as all rows with iso3cd == NULL.
        const hasValidIso3 = feature.properties?.iso3cd !== null;
        const hasValidGeometry = feature.geometry != null;

        // Remove Hawaii with specific globalid as there is an overlapping geometry
        const isHawaiiOverlap = feature.properties?.globalid === '{8B42E894-6AF5-4236-B04D-8F634A159724}';

        return hasValidProperties && hasValidIso3 && hasValidGeometry && !isHawaiiOverlap;
    });
}

function getScopedFeatures(geojson, acceptedFeatures, excludedFeatures) {
    if (!acceptedFeatures.length) return geojson;

    const neData = getJsonFile(`${outputDirGeojson}/${getFilename({ resolution: 50, source: vectors.find(v => v.name === "countries").source })}.json`)

    return geojson.filter((feature) => {
        const hasAcceptedValue = acceptedFeatures.some(({ key, values }) => {
            const { name } = feature.properties
            const neFeature = neData.find(item => item.NAME === name) || null
            return values.includes(neFeature?.[key])
        });
        const hasExcludedValue = excludedFeatures.some(({ key, values }) => {
            const { name } = feature.properties
            const neFeature = neData.find(item => item.NAME === name) || null
            return values.includes(neFeature?.[key])
        });

        return hasAcceptedValue && !hasExcludedValue;
    });
}

function saveGeojson(region, resolution, layer, geojson) {
    try {
        const regionDir = path.join(outputDirGeojson, `${region}_${resolution}m`);
        const filePath = path.join(regionDir, `${layer}.geojson`);
        if (!fs.existsSync(regionDir)) fs.mkdirSync(regionDir, { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(geojson));
        console.log(`🌐 Saved: ${filePath}`);
        return filePath;
    } catch (err) {
        console.error(`❌ Failed to save Geojson for ${region} (${resolution}m):`, err.message);
    }
}

async function createCountriesLayer({ acceptedFeatures, excludedFeatures, name, resolution, source }) {
    console.log(`Building countries layer for '${name}'`);
    const geojson = getJsonFile(`${outputDirGeojson}/${source.countries}_${resolution}m.geojson`);
    // const cleanedFeatures = cleanGeojson(geojson);
    const scopedFeatures = getScopedFeatures(geojson.features, acceptedFeatures, excludedFeatures);

    const featureCollection = { type: 'FeatureCollection', features: scopedFeatures };
    const layer = 'countries';
    saveGeojson(name, resolution, layer, featureCollection);
}

async function createLandLayer({ name, resolution, source }) {
    console.log(`Building land layer for '${name}'`);
    const inputFilePath = `${outputDirGeojson}/${name}_${resolution}m/${source.land}.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/land.geojson`;
    const commands = `${inputFilePath} -dissolve -o ${outputFilePath}`;
    await mapshaper.runCommands(commands);
}

async function createCoastlinesLayer({ bounds, name, resolution, source }) {
    console.log(`Building coastlines layer for '${name}'`);
    const inputFilePath = `${outputDirGeojson}/${source.coastlines}_${resolution}m.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/coastlines.geojson`;
    const commands = `${inputFilePath} encoding=utf8 -filter remove-empty -lines ${bounds.length ? `-clip bbox=${bounds.join(',')}` : ''} -o ${outputFilePath}`;
    // exec(`ogr2ogr -f GeoJSON ${bounds.length ? `-clipsrc ${bounds.join(' ')}` : ''} ${outputFilePath} ${inputFilePath}`)
    await mapshaper.runCommands(commands);
}

async function createOceanLayer({ bounds, name, resolution, source }) {
    console.log(`Building ocean layer for '${name}'`);
    const inputFilePath = `./tasks/topojson/world_rectangle.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/ocean.geojson`;
    const eraseFilePath = `${outputDirGeojson}/${source.ocean}_${resolution}m.geojson`;
    const commands = `${inputFilePath} ${bounds.length ? `-clip bbox=${bounds.join(',')}` : ''} -erase ${eraseFilePath} -o ${outputFilePath}`;
    await mapshaper.runCommands(commands);
}

async function createRiversLayer({ bounds, name, resolution, source }) {
    console.log(`Building rivers layer for '${name}'`);
    const inputFilePath = `${outputDirGeojson}/${getFilename({ resolution, source: vectors.find(v => v.name === 'rivers').source })}.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/rivers.geojson`;
    // Clip to the continent
    const commands = `${inputFilePath} -clip ${outputDirGeojson}/${name}_${resolution}m/countries.geojson -o ${outputFilePath}`;
    await mapshaper.runCommands(commands);
}

async function createLakesLayer({ bounds, name, resolution, source }) {
    console.log(`Building lakes layer for '${name}'`);
    const inputFilePath = `${outputDirGeojson}/${getFilename({ resolution, source: vectors.find(v => v.name === 'lakes').source })}.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/lakes.geojson`;
    // Clip to the continent
    const commands = `${inputFilePath} -clip ${outputDirGeojson}/${name}_${resolution}m/countries.geojson -o ${outputFilePath}`;
    await mapshaper.runCommands(commands);
}

async function createSubunitsLayer({ bounds, name, resolution, source }) {
    console.log(`Building lakes layer for '${name}'`);
    const inputFilePath = `${outputDirGeojson}/${getFilename({ resolution, source: vectors.find(v => v.name === 'subunits').source })}.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/subunits.geojson`;
    // Clip to the continent
    const commands = `${inputFilePath} -clip ${outputDirGeojson}/${name}_${resolution}m/countries.geojson -o ${outputFilePath}`;
    await mapshaper.runCommands(commands);
}

async function createWaterbodiesLayer({ bounds, name, source }) {
    // Clip the waterbodies shapefile to each continent
    console.log(`Building waterbodies layer for '${name}'`);
    for (const resolution of resolutions) {
        const inputFilePath = `${outputDirGeojson}/${source.waterbodies}.geojson`;
        const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/waterbodies.geojson`;
        const commands = `${inputFilePath} ${bounds.length ? `-clip bbox=${bounds.join(',')}` : ''} -o ${outputFilePath}`;
        await mapshaper.runCommands(commands);
    }
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

for (const { source } of vectors) {
    for (const resolution of resolutions) {
        await convertShpToGeo(getFilename({ resolution, source }));
    }
}

// Convert NE countries data into JSON
convertGeoToJson({resolution: 50, source: vectors.find(v => v.name === "countries").source })

async function extractCountriesLandLayers() {
    for (const resolution of resolutions) {
        for (const layer of ["countries", "land"]) {
            const worldMapPath = path.resolve(`./node_modules/visionscarto-world-atlas/world/${resolution}m.json`)
            const outputFilePath = `${outputDirGeojson}/world_atlas_${layer}_${resolution}m.geojson`
            const tempOutputFilePath = `${outputDirGeojson}/world_atlas_${layer}_${resolution}m_temp.geojson`
            const commands = `${worldMapPath} -o format=geojson target=${layer} ${tempOutputFilePath}`
            await mapshaper.runCommands(commands)
            const exec_promise = promisify(exec)
            if (fs.existsSync(outputFilePath)) fs.unlinkSync(outputFilePath)
            await exec_promise(`ogr2ogr ${outputFilePath} ${tempOutputFilePath} -wrapdateline`)
        }
    }
}

await extractCountriesLandLayers()

for (const resolution of resolutions) {
    for (const {
        name,
        specs: { acceptedFeatures, bounds, excludedFeatures = [], source }
    } of scopes) {
        await createCountriesLayer({ acceptedFeatures, excludedFeatures, name, resolution, source });
        await createLandLayer({ name, resolution, source });
        await createCoastlinesLayer({ bounds, name, resolution, source });
        await createOceanLayer({ bounds, name, resolution, source });
        await createRiversLayer({ bounds, name, resolution, source });
        await createLakesLayer({ bounds, name, resolution, source });
        await createSubunitsLayer({ bounds, name, resolution, source });
    }
}
await combineFiles();
