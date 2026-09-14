import type { ChoroplethData, GeoLayout } from '../../types/generated/schema';

type GeoProjection = NonNullable<GeoLayout['projection']>;
/** A `geo.projection.type` value, such as `mercator` */
export type GeoProjectionType = NonNullable<GeoProjection['type']>;
/** A `[min, max]` range for `geo.lonaxis` or `geo.lataxis` */
export type LonLatRange = NonNullable<NonNullable<GeoLayout['lonaxis']>['range']>;
/** A `locationmode` value, such as `ISO-3` */
export type LocationMode = NonNullable<ChoroplethData['locationmode']>;

// Projection names to d3 function name
// These keys become the `geo.projection.type` values in the schema
export const projNames = {
    airy: 'airy',
    aitoff: 'aitoff',
    'albers usa': 'albersUsa',
    albers: 'albers',
    // 'armadillo': 'armadillo',
    august: 'august',
    'azimuthal equal area': 'azimuthalEqualArea',
    'azimuthal equidistant': 'azimuthalEquidistant',
    baker: 'baker',
    // 'berghaus': 'berghaus',
    bertin1953: 'bertin1953',
    boggs: 'boggs',
    bonne: 'bonne',
    bottomley: 'bottomley',
    bromley: 'bromley',
    // 'chamberlin africa': 'chamberlinAfrica',
    // 'chamberlin': 'chamberlin',
    collignon: 'collignon',
    'conic conformal': 'conicConformal',
    'conic equal area': 'conicEqualArea',
    'conic equidistant': 'conicEquidistant',
    craig: 'craig',
    craster: 'craster',
    'cylindrical equal area': 'cylindricalEqualArea',
    'cylindrical stereographic': 'cylindricalStereographic',
    eckert1: 'eckert1',
    eckert2: 'eckert2',
    eckert3: 'eckert3',
    eckert4: 'eckert4',
    eckert5: 'eckert5',
    eckert6: 'eckert6',
    eisenlohr: 'eisenlohr',
    'equal earth': 'equalEarth',
    equirectangular: 'equirectangular',
    fahey: 'fahey',
    'foucaut sinusoidal': 'foucautSinusoidal',
    foucaut: 'foucaut',
    // 'gilbert': 'gilbert',
    // 'gingery': 'gingery',
    ginzburg4: 'ginzburg4',
    ginzburg5: 'ginzburg5',
    ginzburg6: 'ginzburg6',
    ginzburg8: 'ginzburg8',
    ginzburg9: 'ginzburg9',
    gnomonic: 'gnomonic',
    'gringorten quincuncial': 'gringortenQuincuncial',
    gringorten: 'gringorten',
    guyou: 'guyou',
    // 'hammer retroazimuthal': 'hammerRetroazimuthal',
    hammer: 'hammer',
    // 'healpix': 'healpix',
    hill: 'hill',
    homolosine: 'homolosine',
    hufnagel: 'hufnagel',
    hyperelliptical: 'hyperelliptical',
    // 'interrupted boggs': 'interruptedBoggs',
    // 'interrupted homolosine': 'interruptedHomolosine',
    // 'interrupted mollweide hemispheres': 'interruptedMollweideHemispheres',
    // 'interrupted mollweide': 'interruptedMollweide',
    // 'interrupted quartic authalic': 'interruptedQuarticAuthalic',
    // 'interrupted sinu mollweide': 'interruptedSinuMollweide',
    // 'interrupted sinusoidal': 'interruptedSinusoidal',
    kavrayskiy7: 'kavrayskiy7',
    lagrange: 'lagrange',
    larrivee: 'larrivee',
    laskowski: 'laskowski',
    // 'littrow': 'littrow',
    loximuthal: 'loximuthal',
    mercator: 'mercator',
    miller: 'miller',
    // 'modified stereographic alaska': 'modifiedStereographicAlaska',
    // 'modified stereographic gs48': 'modifiedStereographicGs48',
    // 'modified stereographic gs50': 'modifiedStereographicGs50',
    // 'modified stereographic lee': 'modifiedStereographicLee',
    // 'modified stereographic miller': 'modifiedStereographicMiller',
    // 'modified stereographic': 'modifiedStereographic',
    mollweide: 'mollweide',
    'mt flat polar parabolic': 'mtFlatPolarParabolic',
    'mt flat polar quartic': 'mtFlatPolarQuartic',
    'mt flat polar sinusoidal': 'mtFlatPolarSinusoidal',
    'natural earth': 'naturalEarth',
    'natural earth1': 'naturalEarth1',
    'natural earth2': 'naturalEarth2',
    'nell hammer': 'nellHammer',
    nicolosi: 'nicolosi',
    orthographic: 'orthographic',
    patterson: 'patterson',
    'peirce quincuncial': 'peirceQuincuncial',
    polyconic: 'polyconic',
    // 'polyhedral butterfly': 'polyhedralButterfly',
    // 'polyhedral collignon': 'polyhedralCollignon',
    // 'polyhedral waterman': 'polyhedralWaterman',
    'rectangular polyconic': 'rectangularPolyconic',
    robinson: 'robinson',
    satellite: 'satellite',
    'sinu mollweide': 'sinuMollweide',
    sinusoidal: 'sinusoidal',
    stereographic: 'stereographic',
    times: 'times',
    'transverse mercator': 'transverseMercator',
    // 'two point azimuthalUsa': 'twoPointAzimuthalUsa',
    // 'two point azimuthal': 'twoPointAzimuthal',
    // 'two point equidistantUsa': 'twoPointEquidistantUsa',
    // 'two point equidistant': 'twoPointEquidistant',
    'van der grinten': 'vanDerGrinten',
    'van der grinten2': 'vanDerGrinten2',
    'van der grinten3': 'vanDerGrinten3',
    'van der grinten4': 'vanDerGrinten4',
    wagner4: 'wagner4',
    wagner6: 'wagner6',
    // 'wagner7': 'wagner7',
    // 'wagner': 'wagner',
    wiechel: 'wiechel',
    'winkel tripel': 'winkel3',
    winkel3: 'winkel3'
} as const satisfies Record<string, string>;

// Name of the axes
export const axesNames = ['lonaxis', 'lataxis'] as const;

/** Angular span per projection, with `*` as the span for every other projection */
export type ProjectionSpans = Partial<Record<GeoProjectionType, number>> & { '*': number };

// Max longitudinal angular span (EXPERIMENTAL)
export const lonaxisSpan = {
    orthographic: 180,
    'azimuthal equal area': 360,
    'azimuthal equidistant': 360,
    'conic conformal': 180,
    gnomonic: 160,
    stereographic: 180,
    'transverse mercator': 180,
    '*': 360
} as const satisfies ProjectionSpans;

// Max latitudinal angular span (EXPERIMENTAL)
export const lataxisSpan = {
    'conic conformal': 150,
    stereographic: 179.5,
    '*': 180
} as const satisfies ProjectionSpans;

// Projections whose math doesn't play well with fitbounds
export const fitboundsIncompatible: Set<GeoProjectionType> = new Set([
    'albers usa',
    'craig',
    'peirce quincuncial',
    'satellite'
]);

/** Starting axis ranges and projection settings for one `geo.scope` */
export interface ScopeDefaults {
    lonaxisRange: LonLatRange;
    lataxisRange: LonLatRange;
    projType: GeoProjectionType;
    // The schema models `projection.rotation` as an object, but this table holds [lon, lat, roll]
    projRotate?: [number, number, number];
    projParallels?: NonNullable<GeoProjection['parallels']>;
}

// Defaults for each scope
// These keys become the `geo.scope` values in the schema
export const scopeDefaults = {
    world: {
        lonaxisRange: [-180, 180],
        lataxisRange: [-90, 90],
        projType: 'equirectangular',
        projRotate: [0, 0, 0]
    },
    usa: {
        lonaxisRange: [-180, -50],
        lataxisRange: [15, 80],
        projType: 'albers usa'
    },
    europe: {
        lonaxisRange: [-30, 60],
        lataxisRange: [30, 85],
        projType: 'conic conformal',
        projRotate: [15, 0, 0],
        projParallels: [0, 60]
    },
    asia: {
        lonaxisRange: [22, 160],
        lataxisRange: [-15, 55],
        projType: 'mercator',
        projRotate: [0, 0, 0]
    },
    africa: {
        lonaxisRange: [-30, 60],
        lataxisRange: [-40, 40],
        projType: 'mercator',
        projRotate: [0, 0, 0]
    },
    'north america': {
        lonaxisRange: [-180, -45],
        lataxisRange: [5, 85],
        projType: 'conic conformal',
        projRotate: [-100, 0, 0],
        projParallels: [29.5, 45.5]
    },
    'south america': {
        lonaxisRange: [-100, -30],
        lataxisRange: [-60, 15],
        projType: 'mercator',
        projRotate: [0, 0, 0]
    },
    antarctica: {
        lonaxisRange: [-180, 180],
        lataxisRange: [-90, -60],
        projType: 'equirectangular',
        projRotate: [0, 0, 0]
    },
    oceania: {
        lonaxisRange: [-180, 180],
        lataxisRange: [-50, 25],
        projType: 'equirectangular',
        projRotate: [0, 0, 0]
    }
} as const satisfies Record<string, ScopeDefaults>;

// Angular pad to avoid rounding error around clip angles
export const clipPad = 1e-3;

// Map projection precision
export const precision = 0.1;

// Default land and water fill colors
export const landColor = '#F0DC82';
export const waterColor = '#3399FF';

// locationmode to layer name
export const locationmodeToLayer = {
    'ISO-3': 'countries',
    'USA-states': 'subunits',
    'country names': 'countries'
} as const satisfies Partial<Record<LocationMode, string>>;

// SVG element for a sphere (use to frame maps)
export const sphereSVG = { type: 'Sphere' } as const;

// N.B. base layer names must be the same as in the topojson files

// Base layer with a fill color
export const fillLayers = {
    ocean: 1,
    land: 1,
    lakes: 1
} as const satisfies Partial<Record<GeoLayer, number>>;

// Base layer with a only a line color
export const lineLayers = {
    subunits: 1,
    countries: 1,
    coastlines: 1,
    rivers: 1,
    frame: 1
} as const satisfies Partial<Record<GeoLayer, number>>;

/** A base layer drawn from topojson, such as `land` or `countries` */
export type GeoBaseLayer = keyof typeof fillLayers | keyof typeof lineLayers;

// Draw order, back to front
export const layers = [
    'bg',
    'ocean',
    'land',
    'lakes',
    'subunits',
    'countries',
    'coastlines',
    'rivers',
    'lataxis',
    'lonaxis',
    'frame',
    'backplot',
    'frontplot'
] as const;

/** Any layer of a geo subplot, base layers and plot layers alike */
export type GeoLayer = (typeof layers)[number];

// The mapped type is homomorphic only over a type parameter, so `T` cannot be inlined here
type SameLength<T extends readonly unknown[], V> = { [K in keyof T]: V };

/** A draw order holding the same layers as `layers`: same length, and every element is a layer */
type LayerOrder = SameLength<typeof layers, GeoLayer>;

// Same layers as `layers`, but rivers and lakes move above the choropleth so water stays visible
export const layersForChoropleth = [
    'bg',
    'ocean',
    'land',
    'subunits',
    'countries',
    'coastlines',
    'lataxis',
    'lonaxis',
    'frame',
    'backplot',
    'rivers',
    'lakes',
    'frontplot'
] as const satisfies LayerOrder;

// Every base layer needs an adjective, because `adjective + 'color'` names a public attribute
export const layerNameToAdjective = {
    ocean: 'ocean',
    land: 'land',
    lakes: 'lake',
    subunits: 'subunit',
    countries: 'country',
    coastlines: 'coastline',
    rivers: 'river',
    frame: 'frame'
} as const satisfies Record<GeoBaseLayer, string>;
