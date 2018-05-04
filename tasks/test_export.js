require('./util/common').testImageWrapper({
    msg: 'image export test',
    script: 'export_test.js',
    args: process.argv.slice(2)
});
