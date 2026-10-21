import colorScaleAttrs from '../../components/colorscale/attributes';
import { extendFlat } from '../../lib/extend';
import { templatedArray } from '../../plot_api/plot_template';
import mapLayoutAttrs from '../../plots/map/layout_attributes';
import { hovertemplateAttrs, templatefallbackAttrs } from '../../plots/template_attributes';
import choroplethmapAttrs from '../choroplethmap/attributes';
import scattermapAttrs from '../scattermap/attributes';

const layerAttrs = (mapLayoutAttrs as any).layers;

// [zoom, value] pairs, as MapLibre zoom stops
const zoomStops = (what: string, unit: string) => ({
    valType: 'info_array',
    freeLength: true,
    dimensions: 2,
    items: [
        { valType: 'number', min: 0, max: 24, editType: 'plot' },
        { valType: 'number', min: 0, editType: 'plot' }
    ],
    editType: 'plot',
    description: [
        `Sets the ${what} at zoom levels, as [zoom, ${unit}] pairs, for example [[5, 2], [12, 8]].`,
        `Between two zoom levels the ${what} changes linearly. Outside them it stays at the nearest pair.`,
        `When set, it replaces the single value.`
    ].join(' ')
});

const attributes = extendFlat(
    {
        source: {
            valType: 'any',
            editType: 'calc',
            description: [
                'Sets the vector tile source for this trace.',
                'It can be a URL to a TileJSON document,',
                'or an array of tile URL templates with `{z}`, `{x}` and `{y}` placeholders.',
                'Tiles must be in the Mapbox Vector Tile format.'
            ].join(' ')
        },
        sourcelayer: {
            valType: 'string',
            dflt: '',
            editType: 'calc',
            description: 'Sets the layer of the vector tile source to draw (map.layer.source-layer).'
        },
        sourceattribution: extendFlat({}, layerAttrs.sourceattribution, { editType: 'calc' }),
        layertype: {
            valType: 'enumerated',
            values: ['fill', 'line', 'circle'],
            dflt: 'fill',
            editType: 'calc',
            description: [
                'Sets how the trace draws the features of `sourcelayer` (map.layer.type).',
                'Use *fill* for polygons, *line* for lines and polygon outlines,',
                'and *circle* for points.'
            ].join(' ')
        },

        locations: {
            valType: 'data_array',
            editType: 'calc',
            description: [
                'Sets which tile features to color, using the value of',
                'the tile feature property set in `featureidkey`.'
            ].join(' ')
        },
        z: {
            valType: 'data_array',
            editType: 'calc',
            description: [
                'Sets the color values.',
                'The values apply to tile features through feature state,',
                'so a change to `z` does not fetch the tiles again.'
            ].join(' ')
        },
        featureidkey: {
            valType: 'string',
            dflt: 'id',
            editType: 'calc',
            description: [
                'Sets the tile feature property to match with the items in `locations`.',
                'The default *id* uses the feature id stored in the tile.',
                'Any other value names a feature property (map.source.promoteId),',
                'for example *GEOID*. A *properties.* prefix is permitted and ignored.'
            ].join(' ')
        },

        zkey: {
            valType: 'string',
            editType: 'calc',
            description: [
                'Sets the tile feature property that holds the color values,',
                'for a trace without `locations` and `z`.',
                'The browser cannot read the range of a tile property,',
                'so `zmin` and `zmax` must also be set.',
                'Features with no numeric value in this property are hidden.'
            ].join(' ')
        },

        filters: templatedArray('filter', {
            enabled: {
                valType: 'boolean',
                dflt: true,
                editType: 'plot',
                description: 'Determines whether this filter applies.'
            },
            key: {
                valType: 'string',
                editType: 'plot',
                description: 'Sets the tile feature property that the filter tests.'
            },
            operation: {
                valType: 'enumerated',
                values: ['=', '!=', '<', '>=', '>', '<=', '[]', '()', '[)', '(]', '][', ')(', '](', ')[', '{}', '}{'],
                dflt: '=',
                editType: 'plot',
                description: [
                    'Sets the filter operation.',
                    '*=* keeps features with a property equal to `value`. *!=* keeps the others.',
                    '*<*, *>=*, *>* and *<=* compare the property with `value`.',
                    '*[]*, *()*, *[)* and *(]* keep a property inside the range [`value[0]`, `value[1]`],',
                    'with *[* and *]* for an included bound and *(* and *)* for an excluded one.',
                    '*][*, *)(*, *](* and *)[* keep a property outside the range.',
                    '*{}* keeps a property that is one of the items of `value`. *}{* keeps the others.'
                ].join(' ')
            },
            value: {
                valType: 'any',
                dflt: 0,
                editType: 'plot',
                description: [
                    'Sets the value that the filter compares with:',
                    'a number or a string, an array of two for a range operation,',
                    'or an array for *{}* and *}{*.'
                ].join(' ')
            },
            editType: 'plot',
            description: [
                'Keeps only the tile features that pass every enabled filter, in the browser.',
                'A change to a filter fetches no tile.',
                'Hover and selection see only the features that pass.'
            ].join(' ')
        }),

        minzoom: extendFlat({}, layerAttrs.minzoom, { editType: 'plot' }),
        maxzoom: extendFlat({}, layerAttrs.maxzoom, { editType: 'plot' }),

        below: extendFlat({}, (choroplethmapAttrs as any).below, {
            description: [
                'Determines if the trace layers will be inserted',
                'before the layer with the specified ID.',
                'By default, vectortilemap traces are placed above the water layers.',
                "If set to '',",
                'the layers will be inserted above every existing layer.'
            ].join(' ')
        }),

        text: (choroplethmapAttrs as any).text,
        hovertext: (choroplethmapAttrs as any).hovertext,

        marker: {
            color: {
                valType: 'color',
                editType: 'plot',
                description: [
                    'Sets the fill or circle color, for a trace without `z` or `zkey`.',
                    'Defaults to the trace color.'
                ].join(' ')
            },
            size: extendFlat({}, (scattermapAttrs as any).marker.size, {
                arrayOk: false,
                dflt: 4,
                editType: 'plot',
                description: 'Sets the circle diameter, in pixels. Has an effect only when `layertype` is *circle*.'
            }),
            sizestops: zoomStops('circle diameter', 'pixels'),
            line: {
                color: extendFlat({}, (choroplethmapAttrs as any).marker.line.color, {
                    arrayOk: false,
                    editType: 'plot'
                }),
                width: extendFlat({}, (choroplethmapAttrs as any).marker.line.width, {
                    arrayOk: false,
                    editType: 'plot'
                }),
                editType: 'plot'
            },
            opacity: extendFlat({}, (choroplethmapAttrs as any).marker.opacity, {
                arrayOk: false,
                editType: 'plot',
                description: 'Sets the opacity of the fills, circles or lines.'
            }),
            editType: 'plot'
        },

        line: {
            color: extendFlat({}, (scattermapAttrs as any).line.color, {
                editType: 'plot',
                description: [
                    'Sets the line color, for a trace without `z` or `zkey`.',
                    'Has an effect only when `layertype` is *line*.'
                ].join(' ')
            }),
            width: extendFlat({}, (scattermapAttrs as any).line.width, {
                dflt: 1.5,
                editType: 'plot',
                description: 'Sets the line width, in pixels. Has an effect only when `layertype` is *line*.'
            }),
            widthstops: zoomStops('line width', 'pixels'),
            editType: 'plot'
        },

        selected: (choroplethmapAttrs as any).selected,
        unselected: (choroplethmapAttrs as any).unselected,

        hoverinfo: (choroplethmapAttrs as any).hoverinfo,
        hovertemplate: hovertemplateAttrs({}, { keys: ['properties'] }),
        hovertemplatefallback: templatefallbackAttrs()
    },

    colorScaleAttrs('', {
        cLetter: 'z',
        editTypeOverride: 'calc'
    })
);

export default attributes;
