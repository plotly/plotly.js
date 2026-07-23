'use strict';

import isNumeric from 'fast-isnumeric';
import { BADNUM } from '../constants/numerical';

// precompile for speed
const JUNK = /^['"%,$#\s']+|[, ]|['"%,$#\s']+$/g;

/**
 * Remove common leading and trailing cruft from a value and coerce it to a number.
 * Always returns either a number or BADNUM.
 *
 * @param v - value to clean; strings have leading/trailing junk characters stripped before numeric coercion
 */
function cleanNumber(v: any): number | undefined {
    if (typeof v === 'string') v = v.replace(JUNK, '');
    if (isNumeric(v)) return Number(v);

    return BADNUM;
}

export default cleanNumber;
