import type { AttributeMap } from '../types/lib/attributes';

/**
 * Options for `Plotly.toImage` and `Plotly.downloadImage`.
 * `plot_config.js` reuses `format.values` for `config.toImageButtonOptions`.
 * A separate module prevents the require cycle that `plot_config.js` would
 * close through `to_image.js`.
 */
const attributes = {
    format: {
        valType: 'enumerated',
        values: ['png', 'jpeg', 'webp', 'svg', 'full-json'] as const,
        dflt: 'png',
        description: 'Sets the format of exported image.'
    },
    width: {
        valType: 'number',
        min: 1,
        description: [
            'Sets the exported image width.',
            'Defaults to the value found in `layout.width`',
            'If set to *null*, the exported image width will match the current graph width.'
        ].join(' ')
    },
    height: {
        valType: 'number',
        min: 1,
        description: [
            'Sets the exported image height.',
            'Defaults to the value found in `layout.height`',
            'If set to *null*, the exported image height will match the current graph height.'
        ].join(' ')
    },
    scale: {
        valType: 'number',
        min: 0,
        dflt: 1,
        description: [
            'Sets a scaling for the generated image.',
            'If set, all features of a graphs (e.g. text, line width)',
            'are scaled, unlike simply setting',
            'a bigger *width* and *height*.'
        ].join(' ')
    },
    setBackground: {
        valType: 'any',
        dflt: false,
        description: [
            'Sets the image background mode.',
            'By default, the image background is determined by `layout.paper_bgcolor`,',
            'the *transparent* mode.',
            'One might consider setting `setBackground` to *opaque*',
            'when exporting a *jpeg* image as JPEGs do not support opacity.'
        ].join(' ')
    },
    imageDataOnly: {
        valType: 'boolean',
        dflt: false,
        description: [
            'Determines whether or not the return value is prefixed by',
            "the image format's corresponding 'data:image;' spec."
        ].join(' ')
    }
} as const satisfies AttributeMap;

export default attributes;
