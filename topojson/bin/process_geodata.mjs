import rewind from '@mapbox/geojson-rewind';
import { geoIdentity, geoPath } from 'd3-geo';
import { geoStitch } from 'd3-geo-projection';
import fs from 'fs';
import mapshaper from 'mapshaper';
import path from 'path';
import { topology } from 'topojson-server';
import config, { getNEFilename } from '../config.mjs';

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

function createCountriesList(geojsonPath, outputPath) {
    const geojson = getJsonFile(geojsonPath);
    if (!geojson.features) return;

    const countryData = geojson.features
        .map((feature) => {
            const { iso3cd, nam_en } = feature.properties;
            return { iso3cd, name: nam_en };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    fs.writeFileSync(outputPath, JSON.stringify(countryData));
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

// Wind the polygon rings in the correct direction to indicate what is solid and what is whole
const rewindGeojson = (geojson, clockwise = true) => rewind(geojson, clockwise);

// Clamp x-coordinates to the antimeridian
function clampToAntimeridian(inputFilepath, outputFilepath) {
    outputFilepath ||= inputFilepath;
    const jsonString = fs.readFileSync(inputFilepath, 'utf8');
    const updatedString = jsonString.replaceAll(/179\.9999\d+,/g, '180,').replaceAll(/180\.0000\d+,/g, '180,');

    fs.writeFileSync(outputFilepath, updatedString);
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
    const geoPathGenerator = geoPath(projection);

    if (type === 'MultiPolygon') {
        let maxArea = -Infinity;

        for (const coordinates of feature.geometry.coordinates) {
            const polygon = { type: 'Polygon', coordinates };
            const area = geoPathGenerator.area(polygon);
            if (area > maxArea) {
                maxArea = area;
                feature = polygon;
            }
        }
    }

    return geoPathGenerator.centroid(feature).map((coord) => +coord.toFixed(2));
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

async function createLandLayer({ bounds, name, resolution, source }) {
    const inputFilePath = `${outputDirGeojson}/${name}_${resolution}m/countries.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/land.geojson`;
    const commands = [
        inputFilePath,
        '-dissolve2',
        bounds.length ? `-clip bbox=${bounds.join(',')}` : '',
        `-o ${outputFilePath}`
    ].join(' ');
    await mapshaper.runCommands(commands);
}

async function createCoastlinesLayer({ bounds, name, resolution, source }) {
    const inputFilePath = `${outputDirGeojson}/${unFilename}_${resolution}m/${source}.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/coastlines.geojson`;
    const commands = [
        inputFilePath,
        '-dissolve2',
        '-lines',
        bounds.length ? `-clip bbox=${bounds.join(',')}` : '',
        // Erase world border to avoid unpleasant lines through polygons crossing the border.
        '-clip bbox=-179.99999,-89.99999,179.99999,89.99999',
        `-o ${outputFilePath}`
    ].join(' ');
    await mapshaper.runCommands(commands);
    clampToAntimeridian(outputFilePath);
}

async function createOceanLayer({ bounds, name, resolution, source }) {
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
    // Only include USA for 'usa' scope since the UN and NE borders don't match exactly and slivers of Canada creep in
    const filter = (name === 'usa' ? ['USA'] : ['AUS', 'BRA', 'CAN', 'USA'])
        .map((id) => `adm0_a3 === "${id}"`)
        .join(' || ');
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

async function convertLayersToTopojson({ name, resolution }) {
    const regionDir = path.join(outputDirGeojson, `${name}_${resolution}m`);
    if (!fs.existsSync(regionDir)) return;

    const outputFile = `${outputDirTopojson}/${name}_${resolution}m.json`;
    // Scopes with polygons that cross the antimeridian need to be stitched
    if (['antarctica', 'world'].includes(name)) {
        const geojsonObjects = {};
        for (const layer of Object.keys(config.layers)) {
            const filePath = path.join(regionDir, `${layer}.geojson`);
            geojsonObjects[layer] = geoStitch(rewindGeojson(getJsonFile(filePath)));
        }
        // Convert geojson to topojson
        const topojsonTopology = topology(geojsonObjects, 1000000);
        fs.writeFileSync(outputFile, JSON.stringify(topojsonTopology));
    } else {
        // In Mapshaper, layer names default to file names
        const commands = [`${regionDir}/*.geojson combine-files`, `-o format=topojson ${outputFile}`].join(' ');
        await mapshaper.runCommands(commands);
    }

    // Remove extra information from features
    const topojson = getJsonFile(outputFile);
    const prunedTopojson = pruneProperties(topojson);
    fs.writeFileSync(outputFile, JSON.stringify(prunedTopojson));
}

// Get required polygon features from UN GeoJSON
const inputFilePathUNGeojson = `${inputDir}/${unFilename}.geojson`;
const outputFilePathAntarctica50m = `${outputDirGeojson}/${unFilename}_50m/antarctica.geojson`;
const outputFilePathFiji50m = `${outputDirGeojson}/${unFilename}_50m/fiji.geojson`;
const outputFilePathFijiAntimeridian50m = `${outputDirGeojson}/${unFilename}_50m/fiji_antimeridian.geojson`;
const outputFilePathRussia50m = `${outputDirGeojson}/${unFilename}_50m/russia.geojson`;
const outputFilePathRussiaAntimeridian50m = `${outputDirGeojson}/${unFilename}_50m/russia_antimeridian.geojson`;
const copyFieldsList =
    'objectid,iso3cd,m49_cd,nam_en,lbl_en,georeg,geo_cd,sub_cd,int_cd,subreg,intreg,iso2cd,lbl_fr,name_fr,globalid,stscod,isoclr,ct,FID';
// The following fix up code is necessary to isolate/join/cut the polygons that cross the antimeridian.
// This is necessary for two reasons: the UN geojson is poor around the antimeridian and Mapshaper
// doesn't handle antimeridian cutting.

// Fix up Antarctica polygons
await mapshaper.runCommands(
    `${inputFilePathUNGeojson} -filter 'iso3cd === "ATA"' target=1 -o ${outputFilePathAntarctica50m}`
);
const commandsAntarctica = [
    outputFilePathAntarctica50m,
    // Use 'snap-interval' to patch gap in Antarctica
    '-clean snap-interval=0.015 target=antarctica',
    // Add rectangle to extend Antarctica to bottom of world
    '-rectangle bbox=-180,-90,180,-89 name=antarctica_rectangle',
    '-merge-layers target=antarctica,antarctica_rectangle force',
    `-dissolve2 target=antarctica copy-fields=${copyFieldsList}`,
    `-o force target=antarctica ${outputFilePathAntarctica50m}`
].join(' ');
await mapshaper.runCommands(commandsAntarctica);

// Fix up Fiji polygons
await mapshaper.runCommands(
    `${inputFilePathUNGeojson} -filter 'iso3cd === "FJI"' target=1 -o ${outputFilePathFiji50m}`
);
const commandsIsolateFijiAntimeridian = [
    outputFilePathFiji50m,
    '-explode',
    `-each 'id = this.id'`,
    `-filter '[31, 36, 39, 40].includes(id)' target=fiji + name=fiji_antimeridian`,
    `-o target=fiji_antimeridian ${outputFilePathFijiAntimeridian50m}`
].join(' ');
await mapshaper.runCommands(commandsIsolateFijiAntimeridian);

const commandsFixFijiAntimeridian = [
    outputFilePathFijiAntimeridian50m,
    '-proj +proj=eck4 +lon_0=11 +datum=WGS84',
    `-dissolve2 copy-fields=${copyFieldsList}`,
    '-clean snap-interval=951',
    `-proj +proj=webmerc +datum=WGS84 +lon_0=11`,
    '-erase bbox=18812993.94,-22000000,20000000,16500000 target=1 + name=east',
    '-erase bbox=972000,-22000000,18812993.95,16500000 target=1 + name=west',
    '-merge-layers target=east,west name=complete',
    `-dissolve2 target=complete copy-fields=${copyFieldsList}`,
    '-proj wgs84',
    `-o force target=complete ${outputFilePathFijiAntimeridian50m}`
].join(' ');
await mapshaper.runCommands(commandsFixFijiAntimeridian);

const commandsFiji = [
    `-i combine-files ${outputFilePathFiji50m} ${outputFilePathFijiAntimeridian50m}`,
    '-explode target=fiji',
    `-each 'id = this.id' target=fiji`,
    `-filter '![31, 36, 39, 40].includes(id)' target=fiji`,
    '-merge-layers target=fiji,fiji_antimeridian force name=fiji',
    `-dissolve2 target=fiji copy-fields=${copyFieldsList}`,
    `-o force target=fiji ${outputFilePathFiji50m}`
].join(' ');
await mapshaper.runCommands(commandsFiji);

// Fix up Russia polygons
await mapshaper.runCommands(
    `${inputFilePathUNGeojson} -filter 'iso3cd === "RUS"' target=1 -o ${outputFilePathRussia50m}`
);
const commandsIsolateRussiaAntimeridian = [
    outputFilePathRussia50m,
    '-explode',
    `-each 'id = this.id'`,
    `-filter '[13, 15].includes(id)' target=russia + name=russia_antimeridian`,
    `-o target=russia_antimeridian ${outputFilePathRussiaAntimeridian50m}`
].join(' ');
await mapshaper.runCommands(commandsIsolateRussiaAntimeridian);

const commandsFixRussiaAntimeridian = [
    outputFilePathRussiaAntimeridian50m,
    '-proj +proj=eck4 +lon_0=11 +datum=WGS84',
    `-dissolve2 copy-fields=${copyFieldsList}`,
    '-clean snap-interval=257',
    `-proj +proj=webmerc +datum=WGS84 +lon_0=11`,
    '-erase bbox=18812993.94,-22000000,20000000,16500000 target=1 + name=east',
    '-erase bbox=972000,-22000000,18812993.95,16500000 target=1 + name=west',
    '-merge-layers target=east,west name=complete',
    `-dissolve2 target=complete copy-fields=${copyFieldsList}`,
    '-proj wgs84',
    `-o force target=complete ${outputFilePathRussiaAntimeridian50m}`
].join(' ');
await mapshaper.runCommands(commandsFixRussiaAntimeridian);

const commandsRussia = [
    `-i combine-files ${outputFilePathRussia50m} ${outputFilePathRussiaAntimeridian50m}`,
    '-explode target=russia',
    `-each 'id = this.id' target=russia`,
    `-filter '![13, 15].includes(id)' target=russia`,
    '-merge-layers target=russia,russia_antimeridian force name=russia',
    `-dissolve2 target=russia copy-fields=${copyFieldsList}`,
    `-o force target=russia ${outputFilePathRussia50m}`
].join(' ');
await mapshaper.runCommands(commandsRussia);

// Process 50m UN geodata

// Get countries from all polygon features
const outputFilePathCountries50m = `${outputDirGeojson}/${unFilename}_50m/countries.geojson`;
const commandsCountries50m = [
    `-i combine-files ${inputFilePathUNGeojson} ${outputFilePathAntarctica50m} ${outputFilePathFiji50m} ${outputFilePathRussia50m}`,
    `-rename-layers un_polygons,un_polylines,antarctica,fiji,russia`,
    // Remove country polygons with bad geometry
    `-filter '!["ATA", "FJI", "RUS"].includes(iso3cd)' target=un_polygons`,
    '-merge-layers target=un_polygons,antarctica,fiji,russia force name=all_features',
    // Subtract Caspian Sea from country polygons
    `-filter 'globalid === "{BBBEF27F-A6F4-4FBC-9729-77B3A8739409}"' target=all_features + name=caspian_sea`,
    '-erase source=caspian_sea target=all_features',
    // Update country codes, names for disputed territories
    // https://en.wikipedia.org/wiki/Ilemi_Triangle
    `-each 'if (globalid === "{CAB4B11D-5D1D-495E-AC9C-8A18A5A4370B}") { iso3cd = "XIT"; nam_en = "Ilemi Triangle"; }'`,
    // https://en.wikipedia.org/wiki/Egypt%E2%80%93Sudan_border
    `-each 'if (globalid === "{CA12D116-7A19-41D1-9622-17C12CCC720D}") { iso3cd = "XHT"; nam_en = "Halaib Triangle"; }'`,
    `-each 'if (globalid === "{9FD54A50-0BFB-4385-B342-1C3BDEE5ED9B}") { iso3cd = "XBT"; nam_en = "Bir Tawil"; }'`,
    // https://en.wikipedia.org/wiki/Sino-Indian_border_dispute
    `-each 'if (globalid === "{9AB8E07B-A251-47AB-9B0C-F969DBE07558}") nam_en = "Aksai Chin"'`,
    `-each 'if (globalid === "{F180660F-073C-402E-AF75-1E448B4C30F1}") nam_en = "Arunachal Pradesh"'`,
    `-each 'if (iso3cd) iso3cd = iso3cd.toUpperCase()'`,
    `-filter '${filters.countries}'`,
    // Snap polygons to clean up land, coastlines layers
    '-clean snap-interval=0.000125',
    `-o ${outputFilePathCountries50m}`
].join(' ');
await mapshaper.runCommands(commandsCountries50m);
clampToAntimeridian(outputFilePathCountries50m);

// Build list of countries, ISO codes for documentation
createCountriesList(outputFilePathCountries50m, `${outputDirTopojson}/country_names_iso_codes.json`);

// Get land from all polygon features
const inputFilePathLand50m = outputFilePathCountries50m;
const outputFilePathLand50m = `${outputDirGeojson}/${unFilename}_50m/land.geojson`;
const commandsLand50m = [inputFilePathLand50m, '-dissolve2', `-o ${outputFilePathLand50m}`].join(' ');
await mapshaper.runCommands(commandsLand50m);

// Process 110m UN geodata

// Get countries from all polygon features
const inputFilePathCountries110m = outputFilePathCountries50m;
const outputFilePathCountries110m = `${outputDirGeojson}/${unFilename}_110m/countries.geojson`;
const commandsCountries110m = [
    inputFilePathCountries110m,
    '-simplify 21%',
    '-clean',
    `-o ${outputFilePathCountries110m}`
].join(' ');
await mapshaper.runCommands(commandsCountries110m);

// Get land from all polygon features
const inputFilePathLand110m = outputFilePathCountries110m;
const outputFilePathLand110m = `${outputDirGeojson}/${unFilename}_110m/land.geojson`;
const commandsLand110m = [inputFilePathLand110m, '-dissolve2', `-o ${outputFilePathLand110m}`].join(' ');
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
