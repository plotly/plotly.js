import isNumeric from 'fast-isnumeric';
import colorscaleCalc from '../../components/colorscale/calc';
import { BADNUM } from '../../constants/numerical';
import arraysToCalcdata from '../scatter/arrays_to_calcdata';

/**
 * Convert `locations` and `z` to calcdata.
 *
 * The first calcdata item holds `t.locToIndex`, a Map from the string form of
 * each valid location to its index in `locations`. Hover uses the Map to find
 * the data point of a rendered tile feature.
 */
export default function calc(gd: any, trace: any) {
    const len = trace._length;
    const locations = trace.locations;
    const z = trace.z;
    const calcTrace: any[] = new Array(len);
    const locToIndex = new Map<string, number>();

    for (let i = 0; i < len; i++) {
        const loc = locations[i];
        const zi = z[i];
        const isValidLoc = (typeof loc === 'string' && loc !== '') || isNumeric(loc);

        if (isValidLoc && isNumeric(zi)) {
            calcTrace[i] = { loc, z: +zi, index: i };
            locToIndex.set(String(loc), i);
        } else {
            calcTrace[i] = { loc: null, z: BADNUM, index: i };
        }
    }

    if (len) calcTrace[0].t = { locToIndex };

    arraysToCalcdata(calcTrace, trace);
    colorscaleCalc(gd, trace, {
        vals: z,
        containerStr: '',
        cLetter: 'z'
    });

    return calcTrace;
}
