/**
 * Add the location, the `z` value and the tile feature properties to the
 * hover and click event data. The properties come from the rendered tile, so
 * the server decides which properties they hold.
 */
export default function eventData(out: any, pt: any) {
    out.location = pt.location;
    out.z = pt.z;
    if (pt.properties) out.properties = pt.properties;

    return out;
}
