var traceAttrs = {
    scattergeo: require('../../../src/traces/scattergeo/attributes'),
    scattermap: require('../../../src/traces/scattermap/attributes'),
    scattermapbox: require('../../../src/traces/scattermapbox/attributes')
};

describe('map trace colorbar edit types', function() {
    'use strict';

    Object.keys(traceAttrs).forEach(function(name) {
        var attrs = traceAttrs[name];

        it(name + ' should preserve colorbar edit types', function() {
            function assertColorbarEditTypes(obj, path) {
                Object.keys(obj).forEach(function(key) {
                    var val = obj[key];
                    var attrPath = path ? path + '.' + key : key;

                    if(val && typeof val === 'object') {
                        if(val.editType) {
                            expect(val.editType).withContext(attrPath).toBe('colorbars');
                        }
                        if(!val.valType) assertColorbarEditTypes(val, attrPath);
                    }
                });
            }

            assertColorbarEditTypes(attrs.marker.colorbar, 'marker.colorbar');
        });
    });
});
