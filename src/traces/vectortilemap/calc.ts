import isNumeric from 'fast-isnumeric';
import colorscaleCalc from '../../components/colorscale/calc';
import { BADNUM } from '../../constants/numerical';
import arraysToCalcdata from '../scatter/arrays_to_calcdata';

/**
 * Return the key that identifies a feature id or a location, with the rule
 * that MapLibre uses to match feature state: a numeric value or a numeric
 * string becomes a number, so `'001'`, `'1'` and `1` give the same key.
 */
export const featureKey = (v: unknown): string => {
    const n = Number(v);
    return v !== '' && v !== null && !Number.isNaN(n) && n <= Number.MAX_SAFE_INTEGER ? String(n) : String(v);
};

/**
 * Convert `locations` and `z` to calcdata.
 *
 * The first calcdata item holds `t.locToIndex`, a Map from the `featureKey` of
 * each valid location to its index in `locations`. Hover uses the Map to find
 * the data point of a rendered tile feature.
 *
 * A trace without `locations` returns one placeholder item, with an empty Map.
 */
export default function calc(gd: any, trace: any) {
    const len = trace._length;
    const locations = trace.locations;
    const z = trace.z;
    const locToIndex = new Map<string, number>();

    if (!len) {
        if (trace._hasColorscale) {
            colorscaleCalc(gd, trace, { vals: [trace.zmin, trace.zmax], containerStr: '', cLetter: 'z' });
        }
        return [{ loc: null, z: BADNUM, index: 0, t: { locToIndex } }];
    }

    const calcTrace: any[] = new Array(len);

    for (let i = 0; i < len; i++) {
        const loc = locations[i];
        const zi = z[i];
        const isValidLoc = (typeof loc === 'string' && loc !== '') || isNumeric(loc);

        if (isValidLoc && isNumeric(zi)) {
            calcTrace[i] = { loc, z: +zi, index: i };
            locToIndex.set(featureKey(loc), i);
        } else {
            calcTrace[i] = { loc: null, z: BADNUM, index: i };
        }
    }

    calcTrace[0].t = { locToIndex };

    arraysToCalcdata(calcTrace, trace);
    colorscaleCalc(gd, trace, {
        vals: z,
        containerStr: '',
        cLetter: 'z'
    });

    return calcTrace;
}
