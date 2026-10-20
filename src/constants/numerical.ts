/**
 * Standardize all missing data in calcdata to use undefined
 * never null or NaN.
 * That way we can use !==undefined, or !== BADNUM,
 * to test for real data
 */
export const BADNUM = undefined;

/*
 * Limit certain operations to well below floating point max value
 * to avoid glitches: Make sure that even when you multiply it by the
 * number of pixels on a giant screen it still works
 */
export const FP_SAFE = Number.MAX_VALUE * 1e-4;

/*
 * Conversion of date units to milliseconds
 * year and month constants are marked "AVG"
 * to remind us that not all years and months
 * have the same length
 */
export const ONEMAXYEAR = 31622400000; // 366 * ONEDAY
export const ONEAVGYEAR = 31557600000; // 365.25 days
export const ONEMINYEAR = 31536000000; // 365 * ONEDAY
export const ONEMAXQUARTER = 7948800000; // 92 * ONEDAY
export const ONEAVGQUARTER = 7889400000; // 1/4 of ONEAVGYEAR
export const ONEMINQUARTER = 7689600000; // 89 * ONEDAY
export const ONEMAXMONTH = 2678400000; // 31 * ONEDAY
export const ONEAVGMONTH = 2629800000; // 1/12 of ONEAVGYEAR
export const ONEMINMONTH = 2419200000; // 28 * ONEDAY
export const ONEWEEK = 604800000; // 7 * ONEDAY
export const ONEDAY = 86400000; // 24 * ONEHOUR
export const ONEHOUR = 3600000;
export const ONEMIN = 60000;
export const ONESEC = 1000;
export const ONEMILLI = 1;
export const ONEMICROSEC = 0.001;

/*
 * For fast conversion btwn world calendars and epoch ms, the Julian Day Number
 * of the unix epoch. From calendars.instance().newDate(1970, 1, 1).toJD()
 */
export const EPOCHJD = 2440587.5;

/*
 * Are two values nearly equal? Compare to 1PPM
 */
export const ALMOST_EQUAL = 1 - 1e-6;

/*
 * If we're asked to clip a non-positive log value, how far off-screen
 * do we put it?
 */
export const LOG_CLIP = 10;

/*
 * Not a number, but for displaying numbers: the "minus sign" symbol is
 * wider than the regular ascii dash "-"
 */
export const MINUS_SIGN = '\u2212';
