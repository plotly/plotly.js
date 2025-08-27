import { build } from 'esbuild';
import config from '../esbuild-config.js';

// Build the bundle that's used in the devtools server and when generating the schema
await build({
    ...config,
    outfile: './build/plotly.js'
});
