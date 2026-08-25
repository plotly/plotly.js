import { computeBbox } from '../../lib/geo_location_utils';
import type { MapLayout, ScattermapData } from '../../types/generated/schema';

// Same shape as the user-facing `map.bounds` attribute, but with all fields required
type LonLatBox = Required<NonNullable<MapLayout['bounds']>>;

// Minimal shape of the fullData entries this helper reads
interface FitBoundsTrace extends Pick<ScattermapData, 'subplot' | 'visible'> {
    // Tighten lat/lon to be more specific than default
    lat?: ArrayLike<number>;
    lon?: ArrayLike<number>;
    // Broaden type since this could run against multiple trace types
    type?: string;
}

/**
 * Compute a lon/lat bounding box from lonlat-bearing traces (`scattermap`,
 * `densitymap`) on the given map subplot.
 *
 * Returns null when:
 *   - no fittable data exists on the subplot;
 *   - a location-based trace (`choroplethmap`) is present — those carry
 *     `locations`/`geojson`, not raw lon/lat, and need geojson bbox handling
 *     that isn't implemented here.
 *
 * @param fullData - The full data array (post supply-defaults)
 * @param subplotId - e.g. `'map'`, `'map2'`
 */
export function getMapFitBounds(fullData: FitBoundsTrace[], subplotId: string): LonLatBox | null {
    const coordinates: [number, number][] = [];

    for (const trace of fullData) {
        if (trace.subplot !== subplotId || trace.visible !== true) continue;

        // choroplethmap traces carry locations/geojson, not raw lon/lat; bail
        // out rather than frame around a subset of the subplot's data.
        if (trace.type === 'choroplethmap') return null;

        const { lat, lon } = trace;
        if (!lon || !lat) continue;

        const len = Math.min(lon.length, lat.length);
        for (let j = 0; j < len; j++) {
            const lo = lon[j];
            const la = lat[j];
            if (Number.isFinite(lo) && Number.isFinite(la)) coordinates.push([lo, la]);
        }
    }

    const bbox = computeBbox({ type: 'MultiPoint', coordinates });
    if (!bbox) return null;

    const [west, south, east, north] = bbox;
    return { west, east, south, north };
}
