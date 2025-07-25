const config = {
    resolutions: [50, 110],
    scopes: [
        {
            name: 'africa',
            specs: {
                filter: 'georeg === "AFR"',
                bounds: [-30, -50, 60, 50]
            }
        },
        {
            name: 'antarctica',
            specs: {
                filter: 'georeg === "ANT"',
                bounds: [-180, -90, 180, -60]
            }
        },
        {
            name: 'asia',
            specs: {
                filter: 'georeg === "ASI"',
                bounds: [15, -90, 180, 85]
            }
        },
        {
            name: 'europe',
            specs: {
                filter: 'georeg === "EUR" && iso3cd !== "GRL"',
                bounds: [-30, 0, 60, 90]
            }
        },
        {
            name: 'north-america',
            specs: {
                filter: 'subreg === "Northern America" || ["Central America", "Caribbean"].includes(intreg)',
                bounds: [-180, 0, -45, 85]
            }
        },
        {
            name: 'oceania',
            specs: {
                filter: 'georeg === "OCE"',
                bounds: [-180, -50, 180, 25]
            }
        },
        {
            name: 'south-america',
            specs: {
                filter: 'intreg === "South America"',
                bounds: [-100, -70, -30, 25]
            }
        },
        {
            name: 'usa',
            specs: {
                filter: 'iso3cd === "USA" && ![4, undefined].includes(stscod)',
                bounds: [-180, 0, -45, 85]
            }
        },
        {
            name: 'world',
            specs: {
                filter: '!(iso3cd === "USA" && stscod === 4)',
                bounds: []
            }
        }
    ],
    outputDirGeojson: './build/geojson',
    outputDirTopojson: './dist',
    inputDir: './build',
    vectors: {
        // 'coastlines', 'countries', 'land', and 'ocean' are derived from UN geodata
        lakes: {
            source: 'lakes',
            type: 'physical'
        },
        rivers: {
            source: 'rivers_lake_centerlines',
            type: 'physical'
        },
        subunits: {
            source: 'admin_1_states_provinces_lakes',
            type: 'cultural'
        }
    },
    layers: {
        coastlines: 'land',
        countries: 'countries',
        ocean: 'land',
        lakes: 'lakes',
        land: 'land',
        rivers: 'rivers_lake_centerlines',
        subunits: 'admin_1_states_provinces_lakes'
    },
    unFilename: 'un_geodata_simplified',
    unDownloadUrl: 'https://geoportal.un.org/arcgis/sharing/rest/content/items/d7caaff3ef4b4f7c82689b7c4694ad92/data',
    filters: {
        countries: 'stscod !== undefined',
        subunits: ['AUS', 'BRA', 'CAN', 'USA'].map((id) => `adm0_a3 === "${id}"`).join(' || ')
    }
};

export const getNEFilename = ({ resolution, source }) => `ne_${resolution}m_${source}`;

export function getNEDownloadUrl({ resolution, vector: { source, type } }) {
    return `https://naciscdn.org/naturalearth/${resolution}m/${type}/${getNEFilename({ resolution, source })}.zip`;
}

export default config;
