var exec = require('child_process').exec;
var containerCommands = require('./util/container_commands');

var cmd = containerCommands([
    containerCommands.setup,
    'node test/image/make_baseline.js ' + process.argv.slice(2).join(' ')
]);

exec(cmd, function(err) {
    if(err) throw err;
})
.stdout.pipe(process.stdout);
