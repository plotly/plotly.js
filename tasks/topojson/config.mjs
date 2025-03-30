const source = {
    coastlines: 'world_atlas_land',
    countries: 'world_atlas_countries',
    lakes: '',
    land: 'countries',
    ocean: 'world_atlas_land',
    rivers: '',
    waterbodies: 'WBYA_simplified'
};

const resolutions = [50, 110]

const config = {
    resolutions,
    scopes: [
        {
            name: 'africa',
            specs: {
                source,
                acceptedFeatures: [
                    {
                        key: 'CONTINENT',
                        values: ['Africa']
                    }
                ],
                bounds: [-30, -50, 60, 50]
            }
        },
        {
            name: 'antarctica',
            specs: {
                source,
                acceptedFeatures: [
                    {
                        key: 'REGION_WB',
                        values: ['Antarctica']
                    }
                ],
                bounds: [-180, -90, 180, -50]
            }
        },
        {
            name: 'asia',
            specs: {
                source,
                acceptedFeatures: [
                    {
                        key: 'CONTINENT',
                        values: ['Asia']
                    }
                ],
                bounds: [15, -90, 180, 85]
            }
        },
        {
            name: 'europe',
            specs: {
                source,
                acceptedFeatures: [
                    {
                        key: 'CONTINENT',
                        values: ['Europe']
                    }
                ],
                bounds: [-30, 0, 60, 90]
            }
        },
        {
            name: 'north-america',
            specs: {
                source,
                acceptedFeatures: [
                    {
                        key: 'CONTINENT',
                        values: ['North America']
                    }
                ],
                // excludedFeatures: [
                //     {
                //         key: 'CONTINENT',
                //         values: ['South America']
                //     }
                // ],
                bounds: [-180, 0, -45, 85]
            }
        },
        {
            name: 'oceania',
            specs: {
                source,
                acceptedFeatures: [
                    {
                        key: 'CONTINENT',
                        values: ['Oceania']
                    }
                ],
                bounds: [-180, -50, 180, 25]
            }
        },
        {
            name: 'south-america',
            specs: {
                source,
                acceptedFeatures: [
                    {
                        key: 'CONTINENT',
                        values: ['South America']
                    }
                ],
                bounds: [-100, -70, -30, 25]
            }
        },
        {
            name: 'usa',
            specs: {
                source,
                acceptedFeatures: [
                    {
                        key: 'ISO_A3',
                        values: ['USA']
                    }
                ],
                bounds: [-180, 0, -45, 85]
            }
        },
        {
            name: 'world',
            specs: {
                source,
                acceptedFeatures: [],
                bounds: []
            }
        }
    ],
    simplifyTolerance: 0.01,
    outputDirGeojson: './build/geodata/geojson',
    outputDirTopojson: './dist/topojson',
    inputDir: './build/geodata',
    shapefiles: ['BNDA_simplified', 'GEOA_simplified', 'WBYA_simplified'],
    vectors: [
        {
            name: "coastlines",
            source: "coastline",
            type: "physical"
        },
        {
            // Only to be used to generate the JSON info file
            name: "countries",
            source: "admin_0_countries",
            type: "cultural"
        },
        {
            name: "ocean",
            source: "ocean",
            type: "physical"
        },
        {
            name: "lakes",
            source: "lakes",
            type: "physical"
        },
        {
            name: "rivers",
            source: "rivers_lake_centerlines",
            type: "physical"
        },
        {
            name: "subunits",
            source: "admin_1_states_provinces_lakes",
            type: "cultural"
        },
    ],
    downloadUrl: 'https://geoportal.un.org/arcgis/sharing/rest/content/items/f86966528d5943efbdb83fd521dc0943/data',
    // countries, land provided by visionscarto maps
    worldMapPaths: resolutions.map(r => `./node_modules/visioncarto-world-atlas/world/${r}m.json`)
};

export function getFilename({ resolution, source }) {
    return `ne_${resolution}m_${source}`
}

export function getDownloadUrl({ resolution, vector: { source, type} }) {
    return `https://naciscdn.org/naturalearth/${resolution}m/${type}/${getFilename({ resolution, source })}.zip`
}

export default config;
