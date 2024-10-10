'use strict';

var Loggers = require('./lib/loggers');
var noop = require('./lib/noop');
var pushUnique = require('./lib/push_unique');
var isPlainObject = require('./lib/is_plain_object');
var addStyleRule = require('./lib/dom').addStyleRule;
var ExtendModule = require('./lib/extend');

var basePlotAttributes = require('./plots/attributes');
var baseLayoutAttributes = require('./plots/layout_attributes');

var extendFlat = ExtendModule.extendFlat;
var extendDeepAll = ExtendModule.extendDeepAll;

exports.modules = {};
exports.allCategories = {};
exports.allTypes = [];
exports.subplotsRegistry = {};
exports.componentsRegistry = {};
exports.layoutArrayContainers = [];
exports.layoutArrayRegexes = [];
exports.traceLayoutAttributes = {};
exports.localeRegistry = {};
exports.apiMethodRegistry = {};
exports.collectableSubplotTypes = null;

/**
 * Top-level register routine, exported as Plotly.register
 *
 * @param {object array or array of objects} _modules :
 *  module object or list of module object to register.
 *
 *  A valid `moduleType: 'trace'` module has fields:
 *  - name {string} : the trace type
 *  - categories {array} : categories associated with this trace type,
 *                         tested with Register.traceIs()
 *  - meta {object} : meta info (mostly for plot-schema)
 *
 *  A valid `moduleType: 'locale'` module has fields:
 *  - name {string} : the locale name. Should be a 2-digit language string ('en', 'de')
 *                    optionally with a country/region code ('en-GB', 'de-CH'). If a country
 *                    code is used but the base language locale has not yet been supplied,
 *                    we will use this locale for the base as well.
 *  - dictionary {object} : the dictionary mapping input strings to localized strings
 *                          generally the keys should be the literal input strings, but
 *                          if default translations are provided you can use any string as a key.
 *  - format {object} : a `d3.locale` format specifier for this locale
 *                      any omitted keys we'll fall back on en-US.
 *
 *  A valid `moduleType: 'transform'` module has fields:
 *  - name {string} : transform name
 *  - transform {function} : default-level transform function
 *  - calcTransform {function} : calc-level transform function
 *  - attributes {object} : transform attributes declarations
 *  - supplyDefaults {function} : attributes default-supply function
 *
 *  A valid `moduleType: 'component'` module has fields:
 *  - name {string} : the component name, used it with Register.getComponentMethod()
 *                    to employ component method.
 *
 *  A valid `moduleType: 'apiMethod'` module has fields:
 *  - name {string} : the api method name.
 *  - fn {function} : the api method called with Register.call();
 *
 */
exports.register = function register(_modules) {
    exports.collectableSubplotTypes = null;

    if(!_modules) {
        throw new Error('No argument passed to Plotly.register.');
    } else if(_modules && !Array.isArray(_modules)) {
        _modules = [_modules];
    }

    for(var i = 0; i < _modules.length; i++) {
        var newModule = _modules[i];

        if(!newModule) {
            throw new Error('Invalid module was attempted to be registered!');
        }

        switch(newModule.moduleType) {
            case 'trace':
                registerTraceModule(newModule);
                break;
            case 'transform':
                registerTransformModule(newModule);
                break;
            case 'component':
                registerComponentModule(newModule);
                break;
            case 'locale':
                registerLocale(newModule);
                break;
            case 'apiMethod':
                var name = newModule.name;
                exports.apiMethodRegistry[name] = newModule.fn;
                break;
            default:
                throw new Error('Invalid module was attempted to be registered!');
        }
    }
};

/**
 * Get registered module using trace object or trace type
 *
 * @param {object||string} trace
 *  trace object with prop 'type' or trace type as a string
 * @return {object}
 *  module object corresponding to trace type
 */
exports.getModule = function(trace) {
    var _module = exports.modules[getTraceType(trace)];
    if(!_module) return false;
    return _module._module;
};

/**
 * Determine if this trace type is in a given category
 *
 * @param {object||string} traceType
 *  a trace (object) or trace type (string)
 * @param {string} category
 *  category in question
 * @return {boolean}
 */
exports.traceIs = function(traceType, category) {
    traceType = getTraceType(traceType);

    // old Chart Studio Cloud workspace hack, nothing to see here
    if(traceType === 'various') return false;

    var _module = exports.modules[traceType];

    if(!_module) {
        if(traceType) {
            Loggers.log('Unrecognized trace type ' + traceType + '.');
        }

        _module = exports.modules[basePlotAttributes.type.dflt];
    }

    return !!_module.categories[category];
};

/**
 * Retrieve component module method. Falls back on noop if either the
 * module or the method is missing, so the result can always be safely called
 *
 * @param {string} name
 *  name of component (as declared in component module)
 * @param {string} method
 *  name of component module method
 * @return {function}
 */
exports.getComponentMethod = function(name, method) {
    var _module = exports.componentsRegistry[name];

    if(!_module) return noop;
    return _module[method] || noop;
};

/**
 * Call registered api method.
 *
 * @param {string} name : api method name
 * @param {...array} args : arguments passed to api method
 * @return {any} : returns api method output
 */
exports.call = function() {
    var name = arguments[0];
    var args = [].slice.call(arguments, 1);
    return exports.apiMethodRegistry[name].apply(null, args);
};

function registerTraceModule(_module) {
    var thisType = _module.name;
    var categoriesIn = _module.categories;
    var meta = _module.meta;

    if(exports.modules[thisType]) {
        Loggers.log('Type ' + thisType + ' already registered');
        return;
    }

    if(!exports.subplotsRegistry[_module.basePlotModule.name]) {
        registerSubplot(_module.basePlotModule);
    }

    var categoryObj = {};
    for(var i = 0; i < categoriesIn.length; i++) {
        categoryObj[categoriesIn[i]] = true;
        exports.allCategories[categoriesIn[i]] = true;
    }

    exports.modules[thisType] = {
        _module: _module,
        categories: categoryObj
    };

    if(meta && Object.keys(meta).length) {
        exports.modules[thisType].meta = meta;
    }

    exports.allTypes.push(thisType);

    for(var componentName in exports.componentsRegistry) {
        mergeComponentAttrsToTrace(componentName, thisType);
    }

    /*
     * Collect all trace layout attributes in one place for easier lookup later
     * but don't merge them into the base schema as it would confuse the docs
     * (at least after https://github.com/plotly/documentation/issues/202 gets done!)
     */
    if(_module.layoutAttributes) {
        extendFlat(exports.traceLayoutAttributes, _module.layoutAttributes);
    }

    var basePlotModule = _module.basePlotModule;
    var bpmName = basePlotModule.name;

    // add mapbox-gl CSS here to avoid console warning on instantiation
    if(bpmName === 'mapbox') {
        var styleRules = basePlotModule.constants.styleRules;
        for(var k in styleRules) {
            addStyleRule('.js-plotly-plot .plotly .mapboxgl-' + k, styleRules[k]);
        }
    }

    // add maplibre-gl CSS here to avoid console warning on instantiation
    if(bpmName === 'map') {
        require('maplibre-gl/dist/maplibre-gl.css');
    }

    // if `plotly-geo-assets.js` is not included,
    // add `PlotlyGeoAssets` global to stash references to all fetched
    // topojson / geojson data
    if((bpmName === 'geo' || bpmName === 'mapbox' || bpmName === 'map') &&
        (window.PlotlyGeoAssets === undefined)
    ) {
        window.PlotlyGeoAssets = {topojson: {}};
    }
}

function registerSubplot(_module) {
    var plotType = _module.name;

    if(exports.subplotsRegistry[plotType]) {
        Loggers.log('Plot type ' + plotType + ' already registered.');
        return;
    }

    // relayout array handling will look for component module methods with this
    // name and won't find them because this is a subplot module... but that
    // should be fine, it will just fall back on redrawing the plot.
    findArrayRegexps(_module);

    // not sure what's best for the 'cartesian' type at this point
    exports.subplotsRegistry[plotType] = _module;

    for(var componentName in exports.componentsRegistry) {
        mergeComponentAttrsToSubplot(componentName, _module.name);
    }
}

function registerComponentModule(_module) {
    if(typeof _module.name !== 'string') {
        throw new Error('Component module *name* must be a string.');
    }

    var name = _module.name;
    exports.componentsRegistry[name] = _module;

    if(_module.layoutAttributes) {
        if(_module.layoutAttributes._isLinkedToArray) {
            pushUnique(exports.layoutArrayContainers, name);
        }
        findArrayRegexps(_module);
    }

    for(var traceType in exports.modules) {
        mergeComponentAttrsToTrace(name, traceType);
    }

    for(var subplotName in exports.subplotsRegistry) {
        mergeComponentAttrsToSubplot(name, subplotName);
    }

    if(_module.schema && _module.schema.layout) {
        extendDeepAll(baseLayoutAttributes, _module.schema.layout);
    }
}

function registerTransformModule(_module) {
    if(typeof _module.name !== 'string') {
        throw new Error('Transform module *name* must be a string.');
    }

    var prefix = 'Transform module ' + _module.name;
    var hasTransform = typeof _module.transform === 'function';
    var hasCalcTransform = typeof _module.calcTransform === 'function';

    if(!hasTransform && !hasCalcTransform) {
        throw new Error(prefix + ' is missing a *transform* or *calcTransform* method.');
    }
    if(hasTransform && hasCalcTransform) {
        Loggers.log([
            prefix + ' has both a *transform* and *calcTransform* methods.',
            'Please note that all *transform* methods are executed',
            'before all *calcTransform* methods.'
        ].join(' '));
    }
    if(!isPlainObject(_module.attributes)) {
        Loggers.log(prefix + ' registered without an *attributes* object.');
    }
    if(typeof _module.supplyDefaults !== 'function') {
        Loggers.log(prefix + ' registered without a *supplyDefaults* method.');
    }
}

function registerLocale(_module) {
    var locale = _module.name;
    var baseLocale = locale.split('-')[0];

    var newDict = _module.dictionary;
    var newFormat = _module.format;
    var hasDict = newDict && Object.keys(newDict).length;
    var hasFormat = newFormat && Object.keys(newFormat).length;

    var locales = exports.localeRegistry;

    var localeObj = locales[locale];
    if(!localeObj) locales[locale] = localeObj = {};

    // Should we use this dict for the base locale?
    // In case we're overwriting a previous dict for this locale, check
    // whether the base matches the full locale dict now. If we're not
    // overwriting, locales[locale] is undefined so this just checks if
    // baseLocale already had a dict or not.
    // Same logic for dateFormats
    if(baseLocale !== locale) {
        var baseLocaleObj = locales[baseLocale];
        if(!baseLocaleObj) locales[baseLocale] = baseLocaleObj = {};

        if(hasDict && baseLocaleObj.dictionary === localeObj.dictionary) {
            baseLocaleObj.dictionary = newDict;
        }
        if(hasFormat && baseLocaleObj.format === localeObj.format) {
            baseLocaleObj.format = newFormat;
        }
    }

    if(hasDict) localeObj.dictionary = newDict;
    if(hasFormat) localeObj.format = newFormat;
}

function findArrayRegexps(_module) {
    if(_module.layoutAttributes) {
        var arrayAttrRegexps = _module.layoutAttributes._arrayAttrRegexps;
        if(arrayAttrRegexps) {
            for(var i = 0; i < arrayAttrRegexps.length; i++) {
                pushUnique(exports.layoutArrayRegexes, arrayAttrRegexps[i]);
            }
        }
    }
}

function mergeComponentAttrsToTrace(componentName, traceType) {
    var componentSchema = exports.componentsRegistry[componentName].schema;
    if(!componentSchema || !componentSchema.traces) return;

    var traceAttrs = componentSchema.traces[traceType];
    if(traceAttrs) {
        extendDeepAll(exports.modules[traceType]._module.attributes, traceAttrs);
    }
}

function mergeComponentAttrsToSubplot(componentName, subplotName) {
    var componentSchema = exports.componentsRegistry[componentName].schema;
    if(!componentSchema || !componentSchema.subplots) return;

    var subplotModule = exports.subplotsRegistry[subplotName];
    var subplotAttrs = subplotModule.layoutAttributes;
    var subplotAttr = subplotModule.attr === 'subplot' ? subplotModule.name : subplotModule.attr;
    if(Array.isArray(subplotAttr)) subplotAttr = subplotAttr[0];

    var componentLayoutAttrs = componentSchema.subplots[subplotAttr];
    if(subplotAttrs && componentLayoutAttrs) {
        extendDeepAll(subplotAttrs, componentLayoutAttrs);
    }
}

function getTraceType(traceType) {
    if(typeof traceType === 'object') traceType = traceType.type;
    return traceType;
}
