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
                bounds: [-180, -90, 180, -50]
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
                filter: 'georeg === "EUR"',
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
                filter: '',
                bounds: []
            }
        }
    ],
    outputDirGeojson: './build/geodata/geojson',
    outputDirTopojson: './dist/topojson',
    inputDir: './build/geodata',
    vectors: {
        // 'coastlines', 'countries', and 'land' are derived from UN geodata
        ocean: 'ocean',
        lakes: 'lakes',
        rivers: 'rivers_lake_centerlines',
        subunits: 'admin_1_states_provinces_lakes'
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
        land: [
            '{839C9589-44D9-4BD5-A681-13E10ED03C5E}', // AME
            '{2EE1B4A5-9C3F-445C-A1AB-399715463785}', // ANT
            '{3D11547B-94D9-42C9-B849-14B389FE5F7F}', // OCE
            '{32DB79BE-0D53-46BD-995F-EBE7C30ED6B6}', // AFR
            '{3F3547E7-C7FB-4347-9D80-575C6485FD2E}', // EUR
            '{4351AA38-B383-44BF-8341-720DD74872B4}' // ASI
        ]
            .map((id) => `globalid === "${id}"`)
            .join(' || '),
        subunits: ['AUS', 'BRA', 'CAN', 'USA'].map((id) => `adm0_a3 === "${id}"`).join(' || ')
    }
};

export function getNEFilename({ resolution, source }) {
    return `ne_${resolution}m_${source}`;
}

export function getNEDownloadUrl({ resolution, vector: { source, type } }) {
    return `https://naciscdn.org/naturalearth/${resolution}m/${type}/${getNEFilename({ resolution, source })}.zip`;
}

export default config;
