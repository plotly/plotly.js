import { geoIdentity, geoPath } from 'd3-geo';
import { geoStitch } from 'd3-geo-projection'
import fs from 'fs';
import mapshaper from 'mapshaper';
import path from 'path';
import config, { getNEFilename } from './config.mjs';
import { topology } from 'topojson-server';
import topojsonLib from 'topojson';
import rewind from '@mapbox/geojson-rewind'

const { filters, inputDir, layers, resolutions, scopes, unFilename, vectors } = config;

// Create output directories
const outputDirGeojson = path.resolve(config.outputDirGeojson);
if (!fs.existsSync(outputDirGeojson)) fs.mkdirSync(outputDirGeojson, { recursive: true });
const outputDirTopojson = path.resolve(config.outputDirTopojson);
if (!fs.existsSync(outputDirTopojson)) fs.mkdirSync(outputDirTopojson, { recursive: true });

async function convertShpToGeo(filename) {
    const inputFilePath = `${inputDir}/${filename}.shp`;
    const outputFilePath = `${outputDirGeojson}/${filename}.geojson`;
    const commands = [inputFilePath, `-proj wgs84`, `-o format=geojson ${outputFilePath}`].join(' ');
    await mapshaper.runCommands(commands);
}

function getJsonFile(filename) {
    try {
        return JSON.parse(fs.readFileSync(filename, 'utf8'));
    } catch (err) {
        console.error(`❌ Failed to load JSON input file '${filename}':`, err.message);
        process.exit(1);
    }
}

async function createCountriesLayer({ bounds, filter, name, resolution, source }) {
    const inputFilePath = `${outputDirGeojson}/${unFilename}_${resolution}m/${source}.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/countries.geojson`;
    const commands = [
        inputFilePath,
        bounds.length ? `-clip bbox=${bounds.join(',')}` : '',
        filter ? `-filter '${filter}'` : '',
        `-o ${outputFilePath}`
    ].join(' ');
    await mapshaper.runCommands(commands);
    addCentroidsToGeojson(outputFilePath);
}

function addCentroidsToGeojson(geojsonPath) {
    const geojson = getJsonFile(geojsonPath);
    if (!geojson.features) return;

    const features = geojson.features.map((feature) => {
        const centroid = getCentroid(feature);
        feature.properties.ct = centroid;

        return feature;
    });

    fs.writeFileSync(geojsonPath, JSON.stringify({ ...geojson, features }));
}

async function createLandLayer({ bounds, name, resolution, source }) {
    const inputFilePath = `${outputDirGeojson}/${name}_${resolution}m/countries.geojson`;
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
    // const inputFilePath = './tasks/topojson/world_rectangle.geojson';
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/ocean.geojson`;
    const eraseFilePath = `${outputDirGeojson}/${unFilename}_${resolution}m/${source}.geojson`;
    const commands = [
        '-rectangle bbox=-180,-90,180,90',
        bounds.length ? `-clip bbox=${bounds.join(',')}` : '',
        `-erase ${eraseFilePath}`,
        `-o ${outputFilePath}`
    ].join(' ');
    await mapshaper.runCommands(commands);
}

async function createRiversLayer({ name, resolution, source }) {
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
    addCentroidsToGeojson(outputFilePath);
}

function pruneProperties(topojson) {
    for (const layer in topojson.objects) {
        switch (layer) {
            case 'countries':
                topojson.objects[layer].geometries = topojson.objects[layer].geometries.map((geometry) => {
                    const { properties } = geometry;
                    if (properties) {
                        geometry.id = properties.iso3cd;
                        geometry.properties = {
                            ct: properties.ct
                        };
                    }

                    return geometry;
                });
                break;
            case 'subunits':
                topojson.objects[layer].geometries = topojson.objects[layer].geometries.map((geometry) => {
                    const { properties } = geometry;
                    if (properties) {
                        geometry.id = properties.postal;
                        geometry.properties = {
                            ct: properties.ct,
                            gu: properties.gu_a3
                        };
                    }

                    return geometry;
                });

                break;
            default:
                topojson.objects[layer].geometries = topojson.objects[layer].geometries.map((geometry) => {
                    delete geometry.id;
                    delete geometry.properties;

                    return geometry;
                });

                break;
        }
    }

    return topojson;
}

function getCentroid(feature) {
    const { type } = feature.geometry;
    const projection = geoIdentity();
    const path = geoPath(projection);

    if (type === 'MultiPolygon') {
        let maxArea = -Infinity;

        for (const coordinates of feature.geometry.coordinates) {
            const polygon = { type: 'Polygon', coordinates };
            const area = path.area(polygon);
            if (area > maxArea) {
                maxArea = area;
                feature = polygon;
            }
        }
    }

    return path.centroid(feature).map((coord) => +coord.toFixed(2));
}

async function convertLayersToTopojson({ name, resolution }) {
    const regionDir = path.join(outputDirGeojson, `${name}_${resolution}m`);
    if (!fs.existsSync(regionDir)) return;

    const outputFile = `${outputDirTopojson}/${name}_${resolution}m.json`;
    if (["antarctica", "world"].includes(name)) {
    // if (false) {
        const files = fs.readdirSync(regionDir)
        const geojsonObjects = {}
        for (const file of files) {
            const filePath = path.join(regionDir, file)
            const layer = file.split(".")[0]
            let stitchedGeojson = geoStitch(getJsonFile(filePath))
            stitchedGeojson = rewind(stitchedGeojson, true)
            // fs.writeFileSync(filePath, JSON.stringify(stitchedGeojson));
            geojsonObjects[layer] = stitchedGeojson
            // geojsonObjects[layer] = getJsonFile(filePath)
        }
        const topojsonTopology = topology(geojsonObjects)
        // const topojsonTopology = topojsonLib.topology(geojsonObjects, {
        //   verbose: true,
        //   'property-transform': f => f.properties
        // })
        fs.writeFileSync(outputFile, JSON.stringify(topojsonTopology));
    } else {
        // Layer names default to file names
        const commands = [`${regionDir}/*.geojson combine-files`, `-o format=topojson ${outputFile}`].join(' ');
        await mapshaper.runCommands(commands);
    }

    // Remove extra information from features
    // const topojson = getJsonFile(outputFile);
    // const prunedTopojson = pruneProperties(topojson);
    // fs.writeFileSync(outputFile, JSON.stringify(prunedTopojson));
}

// Get polygon features from UN GeoJSON and patch Antarctica gap
const inputFilePathUNGeojson = `${inputDir}/${unFilename}.geojson`;
const inputFilePathUNGeojsonCleaned = `${inputDir}/${unFilename}_cleaned.geojson`;
// TODO: Update all x-coords close to 180 to be exactly 180
function snapToAntimeridian(inputFilepath, outputFilepath) {
    const jsonString = fs.readFileSync(inputFilepath, 'utf8')
    const updatedString = jsonString
        .replaceAll(/179\.99\d+,/g, '180,')
        .replaceAll(/180\.00\d+,/g, '180,')

    fs.writeFileSync(outputFilepath, updatedString);
}
snapToAntimeridian(inputFilePathUNGeojson, inputFilePathUNGeojsonCleaned)
const commandsAllFeaturesCommon = [
    // TODO: Should I use the cleaned data or leave as is?
    inputFilePathUNGeojsonCleaned,
    // inputFilePathUNGeojson,
    `-filter 'iso3cd === "ATA"' target=1 + name=antarctica`,
    // Use 'snap-interval' to patch gap in Antarctica
    '-clean snap-interval=0.015 target=antarctica',
    // Add rectangle to extend Antarctica to bottom of world
    '-rectangle bbox=-180,-90,180,-89 name=antarctica_rectangle',
    '-merge-layers target=antarctica,antarctica_rectangle force',
    '-dissolve2 target=antarctica copy-fields=objectid,iso3cd,m49_cd,nam_en,lbl_en,georeg,geo_cd,sub_cd,int_cd,subreg,intreg,iso2cd,lbl_fr,name_fr,globalid,stscod,isoclr,ct,FID',
    // Remove unpatched Antarctica
    `-filter 'georeg !== "ANT"' target=1`,
    // Merge patched Antarctica
    '-merge-layers target=1,antarctica force name=all_features',
    // Erase Caspian Sea
    `-filter 'globalid === "{BBBEF27F-A6F4-4FBC-9729-77B3A8739409}"' target=all_features + name=caspian_sea`,
    '-erase source=caspian_sea target=all_features',
    // Update country codes for disputed territories at Egypt/Sudan border: https://en.wikipedia.org/wiki/Egypt%E2%80%93Sudan_border
    `-each 'if (globalid === "{CA12D116-7A19-41D1-9622-17C12CCC720D}") iso3cd = "XHT"'`, // Halaib Triangle
    `-each 'if (globalid === "{9FD54A50-0BFB-4385-B342-1C3BDEE5ED9B}") iso3cd = "XBT"'` // Bir Tawil
]

// Process 50m UN geodata
const outputFilePath50m = `${outputDirGeojson}/${unFilename}_50m/all_features.geojson`;
const commandsAllFeatures50m = [
    ...commandsAllFeaturesCommon,
    `-o target=1 ${outputFilePath50m}`
].join(" ")
await mapshaper.runCommands(commandsAllFeatures50m);

// Get countries from all polygon features
const inputFilePathCountries50m = outputFilePath50m;
const outputFilePathCountries50m = `${outputDirGeojson}/${unFilename}_50m/countries.geojson`;
const commandsCountries50m = [
    inputFilePathCountries50m,
    `-filter '${filters.countries}'`,
    '-clean',
    `-o ${outputFilePathCountries50m}`
].join(' ');
await mapshaper.runCommands(commandsCountries50m);

// Get land from all polygon features
const inputFilePathLand50m = outputFilePathCountries50m;
const outputFilePathLand50m = `${outputDirGeojson}/${unFilename}_50m/land.geojson`;
const commandsLand50m = [
    inputFilePathLand50m,
    '-dissolve2',
    `-o ${outputFilePathLand50m}`
].join(' ');
await mapshaper.runCommands(commandsLand50m);

// Create 110m geodata
const inputFilePath110m = outputFilePath50m;
const outputFilePath110m = `${outputDirGeojson}/${unFilename}_110m/all_features.geojson`;
const commandsAllFeatures110m = [
    // ...commandsAllFeaturesCommon,
    inputFilePath110m,
    '-simplify 10% rdp',
    `-o target=1 ${outputFilePath110m}`
].join(" ")
await mapshaper.runCommands(commandsAllFeatures110m);
console.log(commandsAllFeatures110m)

// Get countries from all polygon features
const inputFilePathCountries110m = outputFilePath110m;
const outputFilePathCountries110m = `${outputDirGeojson}/${unFilename}_110m/countries.geojson`;
const commandsCountries110m = [
    inputFilePathCountries110m,
    `-filter '${filters.countries}'`,
    // Use 'snap-interval' to fix alignment issues with USA and Alaska, Mexico
    '-clean snap-interval=0.015',
    `-o ${outputFilePathCountries110m}`
].join(' ');
await mapshaper.runCommands(commandsCountries110m);

// Get land from all polygon features
const inputFilePathLand110m = outputFilePathCountries110m;
const outputFilePathLand110m = `${outputDirGeojson}/${unFilename}_110m/land.geojson`;
const commandsLand110m = [
    inputFilePathLand110m,
    '-dissolve2',
    `-o ${outputFilePathLand110m}`
].join(' ');
await mapshaper.runCommands(commandsLand110m);

for (const resolution of resolutions) {
    for (const { source } of Object.values(vectors)) {
        await convertShpToGeo(getNEFilename({ resolution, source }));
    }
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
        await convertLayersToTopojson({ name, resolution });
    }
}
