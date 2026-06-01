/**
 * Data/Trace types
 *
 * The `Data` union covers every trace type from the schema. Use the trace's
 * `type` field as the discriminator to narrow to a specific trace shape:
 *
 *     if (trace.type === 'bar') { trace.marker?.cornerradius }
 *     if (trace.type === 'pie') { trace.marker?.colors }
 *
 * Per-trace interfaces (BarData, PieData, IndicatorData, etc.) are generated
 * directly from the schema and re-exported from `generated/schema`.
 */

import type {
    BarData,
    BarpolarData,
    BoxData,
    CandlestickData,
    CarpetData,
    ChoroplethData,
    ChoroplethmapboxData,
    ChoroplethmapData,
    ConeData,
    ContourcarpetData,
    ContourData,
    DensitymapboxData,
    DensitymapData,
    FunnelareaData,
    FunnelData,
    HeatmapData,
    Histogram2dcontourData,
    Histogram2dData,
    HistogramData,
    IcicleData,
    ImageData,
    IndicatorData,
    IsosurfaceData,
    Mesh3dData,
    OhlcData,
    ParcatsData,
    ParcoordsData,
    PieData,
    PlotType,
    SankeyData,
    Scatter3dData,
    ScattercarpetData,
    ScatterData,
    ScattergeoData,
    ScatterglData,
    ScattermapboxData,
    ScattermapData,
    ScatterpolarData,
    ScatterpolarglData,
    ScattersmithData,
    ScatterternaryData,
    SplomData,
    StreamtubeData,
    SunburstData,
    SurfaceData,
    TableData,
    TreemapData,
    ViolinData,
    VolumeData,
    WaterfallData
} from '../generated/schema';

export type { PlotType };

/**
 * Union of every trace shape. All fields are optional via `Partial<…>` —
 * narrow with the `type` discriminator before accessing trace-specific
 * attributes.
 */
export type Data =
    | Partial<BarData>
    | Partial<BarpolarData>
    | Partial<BoxData>
    | Partial<CandlestickData>
    | Partial<CarpetData>
    | Partial<ChoroplethData>
    | Partial<ChoroplethmapboxData>
    | Partial<ChoroplethmapData>
    | Partial<ConeData>
    | Partial<ContourcarpetData>
    | Partial<ContourData>
    | Partial<DensitymapboxData>
    | Partial<DensitymapData>
    | Partial<FunnelareaData>
    | Partial<FunnelData>
    | Partial<HeatmapData>
    | Partial<Histogram2dcontourData>
    | Partial<Histogram2dData>
    | Partial<HistogramData>
    | Partial<IcicleData>
    | Partial<ImageData>
    | Partial<IndicatorData>
    | Partial<IsosurfaceData>
    | Partial<Mesh3dData>
    | Partial<OhlcData>
    | Partial<ParcatsData>
    | Partial<ParcoordsData>
    | Partial<PieData>
    | Partial<SankeyData>
    | Partial<Scatter3dData>
    | Partial<ScattercarpetData>
    | Partial<ScatterData>
    | Partial<ScattergeoData>
    | Partial<ScatterglData>
    | Partial<ScattermapboxData>
    | Partial<ScattermapData>
    | Partial<ScatterpolarData>
    | Partial<ScatterpolarglData>
    | Partial<ScattersmithData>
    | Partial<ScatterternaryData>
    | Partial<SplomData>
    | Partial<StreamtubeData>
    | Partial<SunburstData>
    | Partial<SurfaceData>
    | Partial<TableData>
    | Partial<TreemapData>
    | Partial<ViolinData>
    | Partial<VolumeData>
    | Partial<WaterfallData>;
