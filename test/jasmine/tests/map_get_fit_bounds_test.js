const { getMapFitBounds } = require('../../../src/plots/map/get_map_fit_bounds');

// Fabricate a fullData-shaped trace for testing without spinning up Plotly.
function scattermap(overrides) {
    return Object.assign(
        {
            type: 'scattermap',
            subplot: 'map',
            visible: true,
            lon: [],
            lat: []
        },
        overrides
    );
}

function densitymap(overrides) {
    return Object.assign({}, scattermap(overrides), { type: 'densitymap' });
}

function choroplethmap(overrides) {
    return Object.assign(
        {
            type: 'choroplethmap',
            subplot: 'map',
            visible: true,
            locations: ['USA']
        },
        overrides
    );
}

describe('Test getMapFitBounds', () => {
    it('returns a lon/lat box for a single scattermap trace', () => {
        const fullData = [
            scattermap({
                lon: [-10, 20, 5],
                lat: [40, 50, 45]
            })
        ];
        expect(getMapFitBounds(fullData, 'map')).toEqual({
            west: -10,
            east: 20,
            south: 40,
            north: 50
        });
    });

    it('combines lon/lat across multiple visible traces on the same subplot', () => {
        const fullData = [scattermap({ lon: [-10, 20], lat: [40, 50] }), scattermap({ lon: [5, 30], lat: [35, 45] })];
        expect(getMapFitBounds(fullData, 'map')).toEqual({
            west: -10,
            east: 30,
            south: 35,
            north: 50
        });
    });

    it('treats densitymap traces the same as scattermap for lon/lat contribution', () => {
        const fullData = [scattermap({ lon: [10, 20], lat: [40, 50] }), densitymap({ lon: [5, 25], lat: [30, 55] })];
        expect(getMapFitBounds(fullData, 'map')).toEqual({
            west: 5,
            east: 25,
            south: 30,
            north: 55
        });
    });

    it('uses the compact antimeridian-crossing range when data straddles ±180°', () => {
        const fullData = [
            scattermap({
                lon: [170, 175, -175, -170],
                lat: [-10, 0, 10, 20]
            })
        ];
        const bounds = getMapFitBounds(fullData, 'map');
        expect(bounds.west).toBe(170);
        expect(bounds.east).toBe(190);
        expect(bounds.south).toBe(-10);
        expect(bounds.north).toBe(20);
    });

    it('keeps the naive range when the interior gap is narrower than the antimeridian gap', () => {
        // Span = 200°, antimeridian gap = 160°. Widest interior gap (100°) fits
        // inside the antimeridian gap, so the naive [-100, 100] arc wins.
        const fullData = [
            scattermap({
                lon: [-100, 0, 100],
                lat: [0, 10, 20]
            })
        ];
        expect(getMapFitBounds(fullData, 'map')).toEqual({
            west: -100,
            east: 100,
            south: 0,
            north: 20
        });
    });

    it('ignores traces on other subplots', () => {
        const fullData = [
            scattermap({ subplot: 'map2', lon: [100, 110], lat: [10, 20] }),
            scattermap({ lon: [-10, 10], lat: [30, 40] })
        ];
        expect(getMapFitBounds(fullData, 'map')).toEqual({
            west: -10,
            east: 10,
            south: 30,
            north: 40
        });
    });

    it('computes bounds for the target subplot when data lives on multiple map subplots', () => {
        const fullData = [
            scattermap({ subplot: 'map', lon: [-10, 10], lat: [30, 40] }),
            scattermap({ subplot: 'map2', lon: [100, 120], lat: [50, 60] })
        ];
        expect(getMapFitBounds(fullData, 'map2')).toEqual({
            west: 100,
            east: 120,
            south: 50,
            north: 60
        });
    });

    it('ignores non-visible traces', () => {
        const fullData = [
            scattermap({ visible: false, lon: [100, 110], lat: [10, 20] }),
            scattermap({ lon: [-10, 10], lat: [30, 40] })
        ];
        expect(getMapFitBounds(fullData, 'map')).toEqual({
            west: -10,
            east: 10,
            south: 30,
            north: 40
        });
    });

    it("ignores traces with visible: 'legendonly'", () => {
        const fullData = [
            scattermap({ visible: 'legendonly', lon: [100, 110], lat: [10, 20] }),
            scattermap({ lon: [-10, 10], lat: [30, 40] })
        ];
        expect(getMapFitBounds(fullData, 'map')).toEqual({
            west: -10,
            east: 10,
            south: 30,
            north: 40
        });
    });

    it('returns null when a choroplethmap trace is present on the subplot', () => {
        const fullData = [scattermap({ lon: [-10, 10], lat: [30, 40] }), choroplethmap()];
        // location-based traces need geojson bbox handling — bail entirely
        expect(getMapFitBounds(fullData, 'map')).toBe(null);
    });

    it('returns null when no visible trace contributes lonlat data', () => {
        expect(getMapFitBounds([], 'map')).toBe(null);
        expect(getMapFitBounds([scattermap({ lon: [], lat: [] })], 'map')).toBe(null);
        expect(getMapFitBounds([scattermap({ lon: [NaN], lat: [NaN] })], 'map')).toBe(null);
    });

    it('skips non-finite lonlat entries in an otherwise valid trace', () => {
        const fullData = [
            scattermap({
                lon: [-10, NaN, 20, null],
                lat: [40, 50, NaN, 45]
            })
        ];
        // Only the (-10, 40) pair is fully finite → single-point box
        expect(getMapFitBounds(fullData, 'map')).toEqual({
            west: -10,
            east: -10,
            south: 40,
            north: 40
        });
    });
});
