import { build } from 'esbuild';
import { localDevConfig } from '../../esbuild-config.js';

// Build plotly.js to be used locally, such as when generating the schema.
// This is the same process used in the test dashboard server script, but
// run only once.
build(localDevConfig);
