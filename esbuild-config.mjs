import { glsl } from 'esbuild-plugin-glsl';
import { environmentPlugin } from 'esbuild-plugin-environment';
import babel from 'esbuild-plugin-babel';

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
            minify: true,
        }),
        environmentPlugin({
            NODE_DEBUG: false,
        }),
        babel({
            modules: 'umd',
            config: {
                presets: ['@babel/preset-env'],
            }
        }),
    ],
    alias: {
        stream: 'stream-browserify',
    },
    define: {
        global: 'window',
    },
    target: 'es5',
    logLevel: 'info',
};
