var exec = require('child_process').exec;
var containerCommands = require('./util/container_commands');

var cmd = containerCommands[process.env.CIRCLECI ? 'runCI' : 'runLocal']([
    containerCommands.setup,
    'node test/image/compare_pixels_test.js ' + process.argv.slice(2).join(' ')
]);

exec(cmd, function(err) {
    if(err) throw err;
})
.stdout.pipe(process.stdout);
