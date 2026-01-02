'use strict';

import isNumeric from 'fast-isnumeric';
import { BADNUM } from '../constants/numerical';

// precompile for speed
const JUNK = /^['"%,$#\s']+|[, ]|['"%,$#\s']+$/g;

/**
 * cleanNumber: remove common leading and trailing cruft
 * Always returns either a number or BADNUM.
 */
function cleanNumber(v: any): number | undefined {
    if (typeof v === 'string') v = v.replace(JUNK, '');
    if (isNumeric(v)) return Number(v);

    return BADNUM;
}

export default cleanNumber;
