var fs = require('fs');

fs.readFile(__dirname + '/build/plotlyjs-style.css', {encoding: 'utf8'}, function(err, data) {
    'use strict';
    if(err) throw err;

    var rules = {};

    data.split(/\s*\}\s*/).forEach(function(chunk) {
        if(!chunk) return;

        var parts = chunk.split(/\s*\{\s*/),
            selectorList = parts[0],
            rule = parts[1];

        // take off ".js-plotly-plot .plotly", which should be on every selector
        selectorList.split(/,\s*/).forEach(function(selector) {
            if(!selector.match(/^([\.]js-plotly-plot [\.]plotly|[\.]plotly-notifier)/)) {
                throw new Error('all plotlyjs-style selectors must start ' +
                    '.js-plotly-plot .plotly or .plotly-notifier\n' +
                    'found: ' + selectorList);
            }
        });
        selectorList = selectorList
            .replace(/[\.]js-plotly-plot [\.]plotly/g, 'X')
            .replace(/[\.]plotly-notifier/g, 'Y');

        // take out newlines in rule, and make sure it ends in a semicolon
        rule = rule.replace(/;\s*/g,';').replace(/;?\s*$/,';');

        // omit blank rules (why do we get these occasionally?)
        if(rule.match(/^[\s;]*$/)) return;

        rules[selectorList] = rules[selectorList] || '' + rule;
    });

    var rulesStr = JSON.stringify(rules, null, 4)
            .replace(/\"(\w+)\":/g, '$1:');

    fs.writeFile(__dirname + '/build/plotcss.js',
        '\'use strict\';\n\nvar Plotly = require(\'../src/plotly\');\nvar rules = ' + rulesStr + ';\n\n' +
        'for(var selector in rules) {\n' +
        '    var fullSelector = selector.replace(/^,/,\' ,\')\n' +
        '        .replace(/X/g, \'.js-plotly-plot .plotly\')\n' +
        '        .replace(/Y/g, \'.plotly-notifier\');\n' +
        '    Plotly.Lib.addStyleRule(fullSelector, rules[selector]);\n' +
        '}\n',
        function(err2) { if(err2) throw err2; }
    );

});
