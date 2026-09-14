export const attr = 'subplot';
export const name = 'smith';

export const axisNames = [
    'realaxis',
    'imaginaryaxis' // Imaginary axis should be second here so that the `tickvals` defaults could be inherited from realaxis
] as const;


/** The data array each axis of this subplot reads, keyed by axis name */
type AxisDataArrays = Record<(typeof axisNames)[number], string>;

export const axisName2dataArray = { imaginaryaxis: 'imag', realaxis: 'real' } as const satisfies AxisDataArrays;
