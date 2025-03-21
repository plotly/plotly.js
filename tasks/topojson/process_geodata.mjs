import { simplify } from '@turf/simplify';
import fs from 'fs';
import mapshaper from 'mapshaper';
import path from 'path';
import config from './config.mjs';

const { inputDir, resolutions, scopes, shapefiles, simplifyTolerance } = config;

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

function getGeojsonFile(filename) {
    console.log(`📂 Loading GeoJSON file ${filename}...`);
    try {
        return JSON.parse(fs.readFileSync(filename, 'utf8'));
    } catch (err) {
        console.error(`❌ Failed to load GeoJSON input file '${filename}':`, err.message);
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

    return geojson.filter((feature) => {
        const hasAcceptedValue = acceptedFeatures.some(({ key, values }) =>
            values.includes(feature?.properties?.[key])
        );
        const hasExcludedValue = excludedFeatures.some(({ key, values }) =>
            values.includes(feature?.properties?.[key])
        );

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

async function createCountriesLayer({ acceptedFeatures, excludedFeatures, name, source }) {
    console.log(`Building countries layer for '${name}'`);
    const geojson = getGeojsonFile(`${outputDirGeojson}/${source.countries}.geojson`);
    const cleanedFeatures = cleanGeojson(geojson);
    const scopedFeatures = getScopedFeatures(cleanedFeatures, acceptedFeatures, excludedFeatures);

    const featureCollection = { type: 'FeatureCollection', features: scopedFeatures };
    const layer = 'countries';
    // TODO: Verify resolution of UN geodata
    // Save 50m resolution (raw)
    saveGeojson(name, 50, layer, featureCollection);

    // TODO: Verify tolerance to match 110m resolution
    // Save 110m resolution (simplified)
    const simplifiedFeatures = featureCollection.features.map((f) =>
        simplify(f, { tolerance: simplifyTolerance, highQuality: true })
    );
    const simplifiedCollection = { type: 'FeatureCollection', features: simplifiedFeatures };
    saveGeojson(name, 110, layer, simplifiedCollection);
}

async function createLandLayer({ name, source }) {
    console.log(`Building land layer for '${name}'`);
    for (const resolution of resolutions) {
        const inputFilePath = `${outputDirGeojson}/${name}_${resolution}m/${source.land}.geojson`;
        const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/land.geojson`;
        const commands = `${inputFilePath} -dissolve -o ${outputFilePath}`;
        await mapshaper.runCommands(commands);
    }
}

async function createCoastlinesLayer({ bounds, name, source }) {
    console.log(`Building coastlines layer for '${name}'`);
    for (const resolution of resolutions) {
        const inputFilePath = `${outputDirGeojson}/${source.coastlines}.geojson`;
        const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/coastlines.geojson`;
        const commands = `${inputFilePath} -lines ${bounds.length ? `-clip bbox=${bounds.join(',')}` : ''} -o ${outputFilePath}`;
        await mapshaper.runCommands(commands);
    }
}

async function createOceansLayer({ bounds, name, source }) {
    console.log(`Building oceans layer for '${name}'`);
    for (const resolution of resolutions) {
        const inputFilePath = `./tasks/topojson/world_rectangle.geojson`;
        const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/oceans.geojson`;
        const eraseFilePath = `${outputDirGeojson}/${source.oceans}.geojson`;
        const commands = `${inputFilePath} ${bounds.length ? `-clip bbox=${bounds.join(',')}` : ''} -erase ${eraseFilePath} -o ${outputFilePath}`;
        await mapshaper.runCommands(commands);
    }
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

for (const shapefile of shapefiles) {
    await convertShpToGeo(shapefile);
}
for (const {
    name,
    specs: { acceptedFeatures, bounds, excludedFeatures = [], source }
} of scopes) {
    await createCountriesLayer({ acceptedFeatures, excludedFeatures, name, source });
    await createLandLayer({ name, source });
    await createCoastlinesLayer({ bounds, name, source });
    await createOceansLayer({ bounds, name, source });
    await createWaterbodiesLayer({ bounds, name, source });
}

await combineFiles();
