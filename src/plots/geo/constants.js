'use strict';

// projection names to d3 function name
exports.projNames = {
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
    winkel3: 'winkel3',
};

// name of the axes
exports.axesNames = ['lonaxis', 'lataxis'];

// max longitudinal angular span (EXPERIMENTAL)
exports.lonaxisSpan = {
    orthographic: 180,
    'azimuthal equal area': 360,
    'azimuthal equidistant': 360,
    'conic conformal': 180,
    gnomonic: 160,
    stereographic: 180,
    'transverse mercator': 180,
    '*': 360
};

// max latitudinal angular span (EXPERIMENTAL)
exports.lataxisSpan = {
    'conic conformal': 150,
    stereographic: 179.5,
    '*': 180
};

// defaults for each scope
exports.scopeDefaults = {
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
    }
};

// angular pad to avoid rounding error around clip angles
exports.clipPad = 1e-3;

// map projection precision
exports.precision = 0.1;

// default land and water fill colors
exports.landColor = '#F0DC82';
exports.waterColor = '#3399FF';

// locationmode to layer name
exports.locationmodeToLayer = {
    'ISO-3': 'countries',
    'USA-states': 'subunits',
    'country names': 'countries'
};

// SVG element for a sphere (use to frame maps)
exports.sphereSVG = {type: 'Sphere'};

// N.B. base layer names must be the same as in the topojson files

// base layer with a fill color
exports.fillLayers = {
    ocean: 1,
    land: 1,
    lakes: 1
};

// base layer with a only a line color
exports.lineLayers = {
    subunits: 1,
    countries: 1,
    coastlines: 1,
    rivers: 1,
    frame: 1
};

exports.layers = [
    'bg',
    'ocean', 'land', 'lakes',
    'subunits', 'countries', 'coastlines', 'rivers',
    'lataxis', 'lonaxis', 'frame',
    'backplot',
    'frontplot'
];

exports.layersForChoropleth = [
    'bg',
    'ocean', 'land',
    'subunits', 'countries', 'coastlines',
    'lataxis', 'lonaxis', 'frame',
    'backplot',
    'rivers', 'lakes',
    'frontplot'
];

exports.layerNameToAdjective = {
    ocean: 'ocean',
    land: 'land',
    lakes: 'lake',
    subunits: 'subunit',
    countries: 'country',
    coastlines: 'coastline',
    rivers: 'river',
    frame: 'frame'
};
