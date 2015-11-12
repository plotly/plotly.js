module.exports = {
    geo: {
        valType: 'geoid',
        role: 'info',
        dflt: 'geo',
        description: [
            'Sets a reference between this trace\'s geospatial coordinates and',
            'a geographic map.',
            'If *geo* (the default value), the geospatial coordinates refer to',
            '`layout.geo`.',
            'If *geo2*, the geospatial coordinates refer to `layout.geo2`,',
            'and so on.'
        ].join(' ')
    }
};
