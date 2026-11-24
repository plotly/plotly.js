import type { ImageData } from '../../types/generated/schema';

type ColorModelName = NonNullable<ImageData['colormodel']>;

/** How one `colormodel` maps pixel channels onto a CSS color string */
interface ColorModel {
    /** CSS color model to use, when it differs from the plotly colormodel name */
    colormodel?: ColorModelName;
    /** Default `zmin`, when the accepted CSS range is not the data range */
    zminDflt?: number[];
    /** Default `zmax`, when the accepted CSS range is not the data range */
    zmaxDflt?: number[];
    min: number[];
    max: number[];
    /** Take one pixel and return the channel values to join into a CSS color */
    fmt: (c: number[]) => (number | string)[];
    suffix: string[];
}

// min and max define the numerical range accepted in CSS
// If z(min|max)Dflt are not defined, z(min|max) will default to min/max
export const colormodel = {
    rgb: {
        min: [0, 0, 0],
        max: [255, 255, 255],
        fmt: (c) => c.slice(0, 3),
        suffix: ['', '', '']
    },
    rgba: {
        min: [0, 0, 0, 0],
        max: [255, 255, 255, 1],
        fmt: (c) => c.slice(0, 4),
        suffix: ['', '', '', '']
    },
    rgba256: {
        colormodel: 'rgba', // Because rgba256 is not an accept colormodel in CSS
        zminDflt: [0, 0, 0, 0],
        zmaxDflt: [255, 255, 255, 255],
        min: [0, 0, 0, 0],
        max: [255, 255, 255, 1],
        fmt: (c) => c.slice(0, 4),
        suffix: ['', '', '', '']
    },
    hsl: {
        min: [0, 0, 0],
        max: [360, 100, 100],
        fmt: (c) => {
            const p: (number | string)[] = c.slice(0, 3);
            p[1] = p[1] + '%';
            p[2] = p[2] + '%';
            return p;
        },
        suffix: ['°', '%', '%']
    },
    hsla: {
        min: [0, 0, 0, 0],
        max: [360, 100, 100, 1],
        fmt: (c) => {
            const p: (number | string)[] = c.slice(0, 4);
            p[1] = p[1] + '%';
            p[2] = p[2] + '%';
            return p;
        },
        suffix: ['°', '%', '%', '']
    }
} as const satisfies Record<ColorModelName, ColorModel>;
