require('./util/common').testImageWrapper({
    msg: 'baseline generation',
    script: 'make_baseline.js',
    args: process.argv.slice(2)
});
