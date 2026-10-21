/**
 * Add the feature id, the location, the `z` value and the tile feature
 * properties to the hover, click and selection event data. The properties come
 * from the rendered tile, so the server decides which properties they hold.
 *
 * A trace without `locations` has no data index, so `pointNumber` is null and
 * `id` identifies the feature.
 */
export default function eventData(out: any, pt: any) {
    if (pt.id !== undefined) out.id = pt.id;
    if (pt.location !== undefined) out.location = pt.location;
    if (pt.z !== undefined) out.z = pt.z;
    if (pt.properties) out.properties = pt.properties;
    if (pt.lon !== undefined) {
        out.lon = pt.lon;
        out.lat = pt.lat;
    }

    return out;
}
