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
fs.mkdirSync(outputDirGeojson, { recursive: true });
const outputDirTopojson = path.resolve(config.outputDirTopojson);
fs.mkdirSync(outputDirTopojson, { recursive: true });

async function convertShpToGeo(filename) {
    const inputFilePath = `${inputDir}/${filename}.shp`;
    const outputFilePath = `${outputDirGeojson}/${filename}.geojson`;
    const commands = [inputFilePath, `-proj wgs84`, `-o format=geojson ${outputFilePath}`].join(' ');
    await mapshaper.runCommands(commands);
}

const getJsonFile = (filename) => {
    try {
        return JSON.parse(fs.readFileSync(filename, 'utf8'));
    } catch (err) {
        console.error(`Failed to load JSON input file '${filename}':`, err.message);
        process.exit(1);
    }
};

const createCountriesList = (geojsonPath, outputPath) => {
    const geojson = getJsonFile(geojsonPath);
    if (!geojson.features) return;

    const countryData = geojson.features
        .map((feature) => {
            const { iso3cd, nam_en } = feature.properties;
            return { iso3cd, name: nam_en };
        })
        // Without an explicit locale, the order depends on the locale of the machine
        .sort((a, b) => a.name.localeCompare(b.name, 'en'));

    fs.writeFileSync(outputPath, JSON.stringify(countryData));
};

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

// Wind the polygon rings in the correct direction to indicate what is solid and what is a hole
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
        // Make one feature for each country code, because plotly.js only finds the first feature with a given code.
        // Dissolve after the filter, because the parts of one country can be in different regions.
        '-dissolve iso3cd',
        `-o ${outputFilePath}`
    ].join(' ');
    await mapshaper.runCommands(commands);
    addCentroidsToGeojson(outputFilePath);
}

const createLandLayer = async ({ bounds, name, resolution }) => {
    const inputFilePath = `${outputDirGeojson}/${name}_${resolution}m/countries.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/land.geojson`;
    const commands = [
        inputFilePath,
        '-dissolve',
        bounds.length ? `-clip bbox=${bounds.join(',')}` : '',
        `-o ${outputFilePath}`
    ].join(' ');
    await mapshaper.runCommands(commands);
};

async function createCoastlinesLayer({ bounds, name, resolution, source }) {
    const inputFilePath = `${outputDirGeojson}/${unFilename}_${resolution}m/${source}.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/coastlines.geojson`;
    const commands = [
        inputFilePath,
        '-dissolve',
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
    const filter = name === 'usa' ? 'adm0_a3 === "USA"' : config.filters.subunits;
    const inputFilePath = `${outputDirGeojson}/${getNEFilename({ resolution, source })}.geojson`;
    const outputFilePath = `${outputDirGeojson}/${name}_${resolution}m/subunits.geojson`;
    const commands = [
        inputFilePath,
        `-filter '${filter}'`,
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

// Plate carree centered on the antimeridian. A sphere radius of 180 / pi makes x the degrees east of 180.
// Polygons that cross the antimeridian stay whole in this projection.
const antimeridianCrs = '+proj=eqc +lon_0=180 +R=57.29577951308232';
// A vertex nearer than this to the antimeridian goes onto it or out of the ring.
// A later snap with a smaller interval then cannot move the cut points of one side only.
const antimeridianSnapDegrees = 0.0002;

/**
 * Drop the near-antimeridian vertices where a ring only grazes it, and move the vertices of a crossing onto it.
 *
 * @param ring - Closed ring in `antimeridianCrs`
 * @returns Closed ring with each vertex on the antimeridian or `antimeridianSnapDegrees` or more away from it.
 * The input ring if fewer than three vertices remain.
 */
function settleRingAtAntimeridian(ring) {
    const points = ring.slice(0, -1);
    const isNear = ([x]) => Math.abs(x) < antimeridianSnapDegrees;
    const start = points.findIndex((point) => !isNear(point));
    if (start === -1) return ring;

    // Rotate the ring so that it starts away from the antimeridian, and every near stretch has a vertex on each side
    const rotated = [...points.slice(start), ...points.slice(0, start)];
    const settled = [];
    for (let i = 0; i < rotated.length; i++) {
        if (!isNear(rotated[i])) {
            settled.push(rotated[i]);
            continue;
        }
        let end = i;
        while (end + 1 < rotated.length && isNear(rotated[end + 1])) end++;
        const before = rotated[i - 1];
        const after = rotated[(end + 1) % rotated.length];
        // A stretch that returns to the same side only grazes the antimeridian, so drop it
        if (Math.sign(before[0]) !== Math.sign(after[0])) {
            for (let k = i; k <= end; k++) settled.push([0, rotated[k][1]]);
        }
        i = end;
    }
    return settled.length >= 3 ? [...settled, settled[0]] : ring;
}

function mapCoordinates(coordinates, fn) {
    return typeof coordinates[0] === 'number' ? fn(coordinates) : coordinates.map((c) => mapCoordinates(c, fn));
}

function polygonsOf(geojson) {
    return (geojson.features ?? []).flatMap(({ geometry }) => {
        if (!geometry) return [];
        return geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    });
}

/**
 * Cut the polygons of a file along the antimeridian, with identical cut points on the two sides.
 *
 * The function overwrites the file with one WGS84 feature, which keeps the properties of the first input feature.
 * It also writes two temporary files next to the input file.
 *
 * @param filePath - GeoJSON file in `antimeridianCrs`
 */
async function cutAtAntimeridian(filePath) {
    const geojson = getJsonFile(filePath);
    for (const { geometry } of geojson.features) {
        const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
        geometry.type = 'MultiPolygon';
        geometry.coordinates = polygons.map((rings) => rings.map(settleRingAtAntimeridian));
    }
    fs.writeFileSync(filePath, JSON.stringify(geojson));

    // Clip the two sides along the same line, so that both sides get the same cut points
    const westFilePath = filePath.replace('.geojson', '_west.geojson');
    const eastFilePath = filePath.replace('.geojson', '_east.geojson');
    await mapshaper.runCommands(`${filePath} -clip bbox=-180,-90,0,90 -o force ${westFilePath}`);
    await mapshaper.runCommands(`${filePath} -clip bbox=0,-90,180,90 -o force ${eastFilePath}`);

    const west = polygonsOf(getJsonFile(westFilePath)).map((p) => mapCoordinates(p, ([x, y]) => [x + 180, y]));
    const east = polygonsOf(getJsonFile(eastFilePath)).map((p) => mapCoordinates(p, ([x, y]) => [x - 180, y]));
    fs.rmSync(westFilePath);
    fs.rmSync(eastFilePath);

    const feature = {
        type: 'Feature',
        properties: geojson.features[0].properties,
        geometry: { type: 'MultiPolygon', coordinates: [...west, ...east] }
    };
    fs.writeFileSync(filePath, JSON.stringify({ type: 'FeatureCollection', features: [feature] }));
}

const pointsOf = (geometry) => geometry.coordinates.flat(geometry.type === 'Polygon' ? 1 : 2);

/**
 * Stop the build when the selected UN polygons are not the ones that the antimeridian fix-up expects.
 *
 * The fix-up selects polygons by their index in the exploded UN data, and a new UN release can reorder them.
 *
 * @param filePath - GeoJSON file of the selected polygons, with the `id` property from `-each 'id = this.id'`
 * @param ids - Indexes of the polygons that the fix-up expects
 * @returns The features of the file
 */
const getAntimeridianPieces = (filePath, ids) => {
    const { features } = getJsonFile(filePath);
    const foundIds = features.map(({ properties }) => properties.id);
    const touchesAntimeridian = ({ geometry }) => pointsOf(geometry).some(([x]) => Math.abs(x) > 179.999);
    if (foundIds.join() !== ids.join() || !features.every(touchesAntimeridian)) {
        throw new Error(`UN polygons ${ids.join(', ')} in '${filePath}' do not all touch the antimeridian`);
    }
    return features;
};

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
    `-dissolve target=antarctica copy-fields=${copyFieldsList}`,
    `-o force target=antarctica ${outputFilePathAntarctica50m}`
].join(' ');
await mapshaper.runCommands(commandsAntarctica);

// Fix up Fiji polygons
// Indexes of the exploded UN polygons at the antimeridian. Piece 43 is the eastern tip of Vanua Levu.
const fijiAntimeridianIds = [31, 36, 39, 40, 43];
// The UN data leaves a gap of about 3 km between Vanua Levu (piece 42) and its eastern tip (piece 43).
// This bridge shares the antimeridian edge of piece 43 and overlaps the end of piece 42.
const vanuaLevuBridge = [
    [179.95, -16.1905],
    [179.95, -16.1955],
    [180, -16.168199538999943],
    [180, -16.146331777999933],
    [179.95, -16.1905]
];
await mapshaper.runCommands(
    `${inputFilePathUNGeojson} -filter 'iso3cd === "FJI"' target=1 -o ${outputFilePathFiji50m}`
);
const commandsIsolateFijiAntimeridian = [
    outputFilePathFiji50m,
    '-explode',
    `-each 'id = this.id'`,
    `-filter '${JSON.stringify(fijiAntimeridianIds)}.includes(id)' target=fiji + name=fiji_antimeridian`,
    `-o target=fiji_antimeridian ${outputFilePathFijiAntimeridian50m}`
].join(' ');
await mapshaper.runCommands(commandsIsolateFijiAntimeridian);

const fijiAntimeridianPieces = getAntimeridianPieces(outputFilePathFijiAntimeridian50m, fijiAntimeridianIds);
// The bridge must share the exact antimeridian edge of piece 43, or the eck4 snap does not join them
const vanuaLevuTipLatitudes = pointsOf(fijiAntimeridianPieces.find(({ properties }) => properties.id === 43).geometry)
    .filter(([x]) => Math.abs(Math.abs(x) - 180) < 1e-9)
    .map(([, y]) => y);
if (!vanuaLevuBridge.filter(([x]) => x === 180).every(([, y]) => vanuaLevuTipLatitudes.includes(y))) {
    throw new Error('The antimeridian edge of the eastern tip of Vanua Levu does not match vanuaLevuBridge');
}
fijiAntimeridianPieces.push({
    type: 'Feature',
    properties: fijiAntimeridianPieces[0].properties,
    geometry: { type: 'Polygon', coordinates: [vanuaLevuBridge] }
});
fs.writeFileSync(
    outputFilePathFijiAntimeridian50m,
    JSON.stringify({ type: 'FeatureCollection', features: fijiAntimeridianPieces })
);

const commandsFixFijiAntimeridian = [
    outputFilePathFijiAntimeridian50m,
    '-proj +proj=eck4 +lon_0=11 +datum=WGS84',
    `-dissolve copy-fields=${copyFieldsList}`,
    '-clean snap-interval=951',
    `-proj ${antimeridianCrs}`,
    `-o force ${outputFilePathFijiAntimeridian50m}`
].join(' ');
await mapshaper.runCommands(commandsFixFijiAntimeridian);
await cutAtAntimeridian(outputFilePathFijiAntimeridian50m);

const commandsFiji = [
    `-i combine-files ${outputFilePathFiji50m} ${outputFilePathFijiAntimeridian50m}`,
    '-explode target=fiji',
    `-each 'id = this.id' target=fiji`,
    `-filter '!${JSON.stringify(fijiAntimeridianIds)}.includes(id)' target=fiji`,
    '-merge-layers target=fiji,fiji_antimeridian force name=fiji',
    `-dissolve target=fiji copy-fields=${copyFieldsList}`,
    `-o force target=fiji ${outputFilePathFiji50m}`
].join(' ');
await mapshaper.runCommands(commandsFiji);

// Fix up Russia polygons
// Indexes of the exploded UN polygons at the antimeridian. Piece 14 is a thin strip of Wrangel Island next to it.
const russiaAntimeridianIds = [13, 14, 15];
await mapshaper.runCommands(
    `${inputFilePathUNGeojson} -filter 'iso3cd === "RUS"' target=1 -o ${outputFilePathRussia50m}`
);
const commandsIsolateRussiaAntimeridian = [
    outputFilePathRussia50m,
    '-explode',
    `-each 'id = this.id'`,
    `-filter '${JSON.stringify(russiaAntimeridianIds)}.includes(id)' target=russia + name=russia_antimeridian`,
    `-o target=russia_antimeridian ${outputFilePathRussiaAntimeridian50m}`
].join(' ');
await mapshaper.runCommands(commandsIsolateRussiaAntimeridian);
getAntimeridianPieces(outputFilePathRussiaAntimeridian50m, russiaAntimeridianIds);

const commandsFixRussiaAntimeridian = [
    outputFilePathRussiaAntimeridian50m,
    '-proj +proj=eck4 +lon_0=11 +datum=WGS84',
    `-dissolve copy-fields=${copyFieldsList}`,
    '-clean snap-interval=257',
    `-proj ${antimeridianCrs}`,
    `-o force ${outputFilePathRussiaAntimeridian50m}`
].join(' ');
await mapshaper.runCommands(commandsFixRussiaAntimeridian);
await cutAtAntimeridian(outputFilePathRussiaAntimeridian50m);

const commandsRussia = [
    `-i combine-files ${outputFilePathRussia50m} ${outputFilePathRussiaAntimeridian50m}`,
    '-explode target=russia',
    `-each 'id = this.id' target=russia`,
    `-filter '!${JSON.stringify(russiaAntimeridianIds)}.includes(id)' target=russia`,
    '-merge-layers target=russia,russia_antimeridian force name=russia',
    `-dissolve target=russia copy-fields=${copyFieldsList}`,
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
const commandsLand50m = [inputFilePathLand50m, '-dissolve', `-o ${outputFilePathLand50m}`].join(' ');
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
const commandsLand110m = [inputFilePathLand110m, '-dissolve', `-o ${outputFilePathLand110m}`].join(' ');
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
        await createLandLayer({ bounds, name, resolution });
        await createCoastlinesLayer({ bounds, name, resolution, source: layers.coastlines });
        await createOceanLayer({ bounds, name, resolution, source: layers.ocean });
        await createRiversLayer({ name, resolution, source: layers.rivers });
        await createLakesLayer({ name, resolution, source: layers.lakes });
        await createSubunitsLayer({ name, resolution, source: layers.subunits });
        await convertLayersToTopojson({ name, resolution });
    }
}
