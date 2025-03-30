const resolutions = [50, 110];

const config = {
    resolutions,
    scopes: [
        {
            name: 'africa',
            specs: {
                filter: {
                    key: 'CONTINENT',
                    value: 'Africa'
                },
                bounds: [-30, -50, 60, 50]
            }
        },
        {
            name: 'antarctica',
            specs: {
                filter: {
                    key: 'REGION_WB',
                    value: 'Antarctica'
                },
                bounds: [-180, -90, 180, -50]
            }
        },
        {
            name: 'asia',
            specs: {
                filter: {
                    key: 'CONTINENT',
                    value: 'Asia'
                },
                bounds: [15, -90, 180, 85]
            }
        },
        {
            name: 'europe',
            specs: {
                filter: {
                    key: 'CONTINENT',
                    value: 'Europe'
                },
                bounds: [-30, 0, 60, 90]
            }
        },
        {
            name: 'north-america',
            specs: {
                filter: {
                    key: 'CONTINENT',
                    value: 'North America'
                },
                bounds: [-180, 0, -45, 85]
            }
        },
        {
            name: 'oceania',
            specs: {
                filter: {
                    key: 'CONTINENT',
                    value: 'Oceania'
                },
                bounds: [-180, -50, 180, 25]
            }
        },
        {
            name: 'south-america',
            specs: {
                filter: {
                    key: 'CONTINENT',
                    value: 'South America'
                },
                bounds: [-100, -70, -30, 25]
            }
        },
        {
            name: 'usa',
            specs: {
                filter: {
                    key: 'ISO_A3',
                    value: 'USA'
                },
                bounds: [-180, 0, -45, 85]
            }
        },
        {
            name: 'world',
            specs: {
                filter: {},
                bounds: []
            }
        }
    ],
    outputDirGeojson: './build/geodata/geojson',
    outputDirTopojson: './dist/topojson',
    inputDir: './build/geodata',
    vectors: {
        // 'coastlines' and 'land' not required because those come from Visionscarto
        countries: 'admin_0_countries', // Only to be used to generate the JSON info file
        ocean: 'ocean',
        lakes: 'lakes',
        rivers: 'rivers_lake_centerlines',
        subunits: 'admin_1_states_provinces_lakes'
    },
    layers: {
        coastlines: 'world_atlas_land',
        countries: 'world_atlas_countries',
        ocean: 'world_atlas_land',
        lakes: 'lakes',
        land: 'countries',
        rivers: 'rivers_lake_centerlines',
        subunits: 'admin_1_states_provinces_lakes'
    }
};

export function getFilename({ resolution, source }) {
    return `ne_${resolution}m_${source}`;
}

export function getDownloadUrl({ resolution, vector: { source, type } }) {
    return `https://naciscdn.org/naturalearth/${resolution}m/${type}/${getFilename({ resolution, source })}.zip`;
}

export default config;
