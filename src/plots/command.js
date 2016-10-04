/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../plotly');
var helpers = require('../plot_api/helpers');

exports.executeAPICommand = function(gd, method, args) {
    var apiMethod = Plotly[method];

    var allArgs = [gd];
    for (var i = 0; i < args.length; i++) {
        allArgs.push(args[i]);
    }

    if (!apiMethod) {
        return Promise.reject();
    }

    return apiMethod.apply(null, allArgs);
};

exports.computeAPICommandBindings = function(gd, method, args) {

    switch(method) {
    case 'restyle':
        var traces

        // Logic copied from Plotly.restyle:
        var astr = args[0];
        var val = args[1];
        var traces = args[2];
        var aobj = {};
        if(typeof astr === 'string') aobj[astr] = val;
        else if(Lib.isPlainObject(astr)) {
            // the 3-arg form
            aobj = astr;
            if(traces === undefined) traces = val;
        } else {
            // This is the failure case, but it's not a concern of this method to fail
            // on bad input. This will just return no bindings:
            return [];
        }

        console.log('aobj:', aobj);

        return ['data[0].marker.size'];
        break;
    default:
        throw new Error('Unimplemented');
    }
};
