/**
 * Generated from lib/index-geo.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

/**
 * Type surface of `plotly.js/lib/index-geo`.
 *
 * It pre-registers the 3 trace modules of the geo bundle:
 * choropleth, scatter, scattergeo.
 *
 * The type surface is the same as the full bundle, so this re-exports the
 * main declaration. A trace that is not registered at runtime still
 * type-checks, which matches the `@types/plotly.js` declarations that this
 * replaces.
 */

export * from '../../../../lib/index';
export { default } from '../../../../lib/index';
