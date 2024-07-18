'use strict';

var Lib = require('../../lib');
var strTranslate = Lib.strTranslate;
var strScale = Lib.strScale;
var getSubplotCalcData = require('../get_data').getSubplotCalcData;
var xmlnsNamespaces = require('../../constants/xmlns_namespaces');
var d3 = require('@plotly/d3');
var Drawing = require('../../components/drawing');
var svgTextUtils = require('../../lib/svg_text_utils');

var Mapnew = require('./mapnew');

var MAPNEW = 'mapnew';

exports.name = MAPNEW;

exports.attr = 'subplot';

exports.idRoot = MAPNEW;

exports.idRegex = exports.attrRegex = Lib.counterRegex(MAPNEW);

exports.attributes = {
    subplot: {
        valType: 'subplotid',
        dflt: 'mapnew',
        editType: 'calc',
        description: [
            'Sets a reference between this trace\'s data coordinates and',
            'a mapnew subplot.',
            'If *mapnew* (the default value), the data refer to `layout.mapnew`.',
            'If *mapnew2*, the data refer to `layout.mapnew2`, and so on.'
        ].join(' ')
    }
};

exports.layoutAttributes = require('./layout_attributes');

exports.supplyLayoutDefaults = require('./layout_defaults');

exports.plot = function plot(gd) {
    var fullLayout = gd._fullLayout;
    var calcData = gd.calcdata;
    var mapnewIds = fullLayout._subplots[MAPNEW];

    for(var i = 0; i < mapnewIds.length; i++) {
        var id = mapnewIds[i];
        var subplotCalcData = getSubplotCalcData(calcData, MAPNEW, id);
        var opts = fullLayout[id];
        var mapnew = opts._subplot;

        if(!mapnew) {
            mapnew = new Mapnew(gd, id);
            fullLayout[id]._subplot = mapnew;
        }

        if(!mapnew.viewInitial) {
            mapnew.viewInitial = {
                center: Lib.extendFlat({}, opts.center),
                zoom: opts.zoom,
                bearing: opts.bearing,
                pitch: opts.pitch
            };
        }

        mapnew.plot(subplotCalcData, fullLayout, gd._promises);
    }
};

exports.clean = function(newFullData, newFullLayout, oldFullData, oldFullLayout) {
    var oldMapnewKeys = oldFullLayout._subplots[MAPNEW] || [];

    for(var i = 0; i < oldMapnewKeys.length; i++) {
        var oldMapnewKey = oldMapnewKeys[i];

        if(!newFullLayout[oldMapnewKey] && !!oldFullLayout[oldMapnewKey]._subplot) {
            oldFullLayout[oldMapnewKey]._subplot.destroy();
        }
    }
};

exports.toSVG = function(gd) {
    var fullLayout = gd._fullLayout;
    var subplotIds = fullLayout._subplots[MAPNEW];
    var size = fullLayout._size;

    for(var i = 0; i < subplotIds.length; i++) {
        var opts = fullLayout[subplotIds[i]];
        var domain = opts.domain;
        var mapnew = opts._subplot;

        var imageData = mapnew.toImage('png');
        var image = fullLayout._glimages.append('svg:image');

        image.attr({
            xmlns: xmlnsNamespaces.svg,
            'xlink:href': imageData,
            x: size.l + size.w * domain.x[0],
            y: size.t + size.h * (1 - domain.y[1]),
            width: size.w * (domain.x[1] - domain.x[0]),
            height: size.h * (domain.y[1] - domain.y[0]),
            preserveAspectRatio: 'none'
        });

        var subplotDiv = d3.select(opts._subplot.div);

        // Add attributions
        var attributions = subplotDiv
                              .select('.maplibregl-ctrl-attrib').text()
                              .replace('Improve this map', '');

        var attributionGroup = fullLayout._glimages.append('g');

        var attributionText = attributionGroup.append('text');
        attributionText
          .text(attributions)
          .classed('static-attribution', true)
          .attr({
              'font-size': 12,
              'font-family': 'Arial',
              color: 'rgba(0, 0, 0, 0.75)',
              'text-anchor': 'end',
              'data-unformatted': attributions
          });

        var bBox = Drawing.bBox(attributionText.node());

        // Break into multiple lines twice larger than domain
        var maxWidth = size.w * (domain.x[1] - domain.x[0]);
        if((bBox.width > maxWidth / 2)) {
            var multilineAttributions = attributions.split('|').join('<br>');
            attributionText
              .text(multilineAttributions)
              .attr('data-unformatted', multilineAttributions)
              .call(svgTextUtils.convertToTspans, gd);

            bBox = Drawing.bBox(attributionText.node());
        }
        attributionText.attr('transform', strTranslate(-3, -bBox.height + 8));

        // Draw white rectangle behind text
        attributionGroup
          .insert('rect', '.static-attribution')
          .attr({
              x: -bBox.width - 6,
              y: -bBox.height - 3,
              width: bBox.width + 6,
              height: bBox.height + 3,
              fill: 'rgba(255, 255, 255, 0.75)'
          });

        // Scale down if larger than domain
        var scaleRatio = 1;
        if((bBox.width + 6) > maxWidth) scaleRatio = maxWidth / (bBox.width + 6);

        var offset = [(size.l + size.w * domain.x[1]), (size.t + size.h * (1 - domain.y[0]))];
        attributionGroup.attr('transform', strTranslate(offset[0], offset[1]) + strScale(scaleRatio));
    }
};

exports.updateFx = function(gd) {
    var fullLayout = gd._fullLayout;
    var subplotIds = fullLayout._subplots[MAPNEW];

    for(var i = 0; i < subplotIds.length; i++) {
        var subplotObj = fullLayout[subplotIds[i]]._subplot;
        subplotObj.updateFx(fullLayout);
    }
};
