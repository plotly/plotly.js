import { computeBbox } from '../../lib/geo_location_utils';
import type { MapLayout, ScattermapData } from '../../types/generated/schema';

// Same shape as the user-facing `map.bounds` attribute, but with all fields required
type LonLatBox = Required<NonNullable<MapLayout['bounds']>>;

// `false` | 'locations' | 'geojson' - mirrors `layout.map.fitbounds`
type FitBounds = MapLayout['fitbounds'];

type GeoJson = Record<string, unknown>;

// Minimal shape of the fullData entries this helper reads
interface FitBoundsTrace extends Pick<ScattermapData, 'subplot' | 'visible'> {
    // Tighten lat/lon to be more specific than default
    lat?: ArrayLike<number>;
    lon?: ArrayLike<number>;
    // Broaden type since this could run against multiple trace types
    type?: string;
    // choroplethmap traces carry these instead of raw lon/lat
    locations?: ArrayLike<string | number>;
    geojson?: string | GeoJson;
    featureidkey?: string;
}

// Resolve a choroplethmap trace's geojson to a plain object without logging.
// `geojson` is either an inline object or a URL string that resolves against the
// global `PlotlyGeoAssets` cache once fetched. At supply-defaults time a URL may
// not be fetched yet, so return null quietly rather than error-logging the way
// `geoUtils.getTraceGeojson` does - the fit just skips this trace for now.
function resolveGeojson(trace: FitBoundsTrace): GeoJson | null {
    const g = trace.geojson;
    if (g && typeof g === 'object') return g;
    if (typeof g === 'string' && typeof window !== 'undefined') {
        const assets = (window as { PlotlyGeoAssets?: Record<string, GeoJson> }).PlotlyGeoAssets || {};
        const cached = assets[g];
        if (cached && typeof cached === 'object') return cached;
    }
    return null;
}

// Read a feature's id at `featureidkey` (default 'id'), walking a dotted path
// e.g. 'properties.name' - matches the lookup done in `extractTraceFeature`.
function getFeatureId(feature: GeoJson, featureidkey?: string): string | number | undefined {
    const parts = (featureidkey || 'id').split('.');
    let cur: unknown = feature;
    for (let i = 0; i < parts.length; i++) {
        if (cur === null || cur === undefined || typeof cur !== 'object') return undefined;
        cur = (cur as Record<string, unknown>)[parts[i]];
    }
    return typeof cur === 'string' || typeof cur === 'number' ? cur : undefined;
}

// Build a GeoJSON FeatureCollection of only the features a choroplethmap trace
// actually references via `locations`, so `fitbounds: 'locations'` frames the
// matched geometries rather than the whole input `geojson`.
function matchedFeatureCollection(geojsonIn: GeoJson, trace: FitBoundsTrace): GeoJson | null {
    const locations = trace.locations;
    if (!locations || !locations.length) return null;

    const wanted: Record<string, boolean> = {};
    for (let i = 0; i < locations.length; i++) wanted[String(locations[i])] = true;

    const featuresIn: GeoJson[] = geojsonIn.type === 'FeatureCollection' ?
        (geojsonIn.features as GeoJson[]) :
        geojsonIn.type === 'Feature' ? [geojsonIn] : [];

    const featuresOut: GeoJson[] = [];
    for (let j = 0; j < featuresIn.length; j++) {
        const id = getFeatureId(featuresIn[j], trace.featureidkey);
        if (id !== undefined && wanted[String(id)]) featuresOut.push(featuresIn[j]);
    }

    if (!featuresOut.length) return null;
    return { type: 'FeatureCollection', features: featuresOut };
}

// Add a choroplethmap trace's geometry bounds to the running coordinate list by
// pushing the box corners as two points. `fitbounds: 'geojson'` frames the whole
// input geojson; anything else frames just the matched `locations`. Skips
// silently when the geojson is unavailable (e.g. a URL not yet fetched) so the
// rest of the subplot's data still drives the fit.
function pushChoroplethBounds(
    coordinates: [number, number][],
    trace: FitBoundsTrace,
    fitbounds: FitBounds
): void {
    const geojsonIn = resolveGeojson(trace);
    if (!geojsonIn) return;

    const target = fitbounds === 'geojson' ? geojsonIn : matchedFeatureCollection(geojsonIn, trace);
    if (!target) return;

    const bbox = computeBbox(target);
    if (!bbox) return;

    const [west, south, east, north] = bbox;
    coordinates.push([west, south], [east, north]);
}

/**
 * Compute a lon/lat bounding box for the visible traces on a map subplot, to
 * feed MapLibre's auto-fit.
 *
 * Point traces (`scattermap`, `densitymap`) contribute their `lon`/`lat`
 * values. `choroplethmap` traces contribute the bounding box of either their
 * matched `locations` (default) or the entire input `geojson` (when
 * `fitbounds` is 'geojson'), analogous to `geo.fitbounds`.
 *
 * Returns null when no fittable data exists on the subplot.
 *
 * @param fullData - The full data array (post supply-defaults)
 * @param subplotId - e.g. `'map'`, `'map2'`
 * @param fitbounds - the subplot's `fitbounds` value ('locations' | 'geojson')
 */
export function getMapFitBounds(
    fullData: FitBoundsTrace[],
    subplotId: string,
    fitbounds: FitBounds
): LonLatBox | null {
    const coordinates: [number, number][] = [];

    for (const trace of fullData) {
        if (trace.subplot !== subplotId || trace.visible !== true) continue;

        if (trace.type === 'choroplethmap') {
            pushChoroplethBounds(coordinates, trace, fitbounds);
            continue;
        }

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
