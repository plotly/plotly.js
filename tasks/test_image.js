require('./util/common').testImageWrapper({
    msg: 'image comparison test',
    script: 'compare_pixels_test.js',
    args: process.argv.slice(2)
});
