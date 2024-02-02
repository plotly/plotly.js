import { glsl } from 'esbuild-plugin-glsl';
import { environmentPlugin } from 'esbuild-plugin-environment';

export default {
    entryPoints: ['./lib/index.js'],
    outfile: './build/plotly.js',
    format: 'iife',
    globalName: 'Plotly',
    bundle: true,
    minify: true,
    sourcemap: true,
    plugins: [
        glsl({
            minify: true
        }),
        environmentPlugin({
            NODE_DEBUG: false
        }),
    ],
    alias: {
        stream: 'stream-browserify',
    },
    define: {
        global: 'window',
    },
    target: 'es2016',
    logLevel: 'info',
};
