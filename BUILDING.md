# Building plotly.js

The easiest way to bundle plotly.js into your application is to use one of the distributed plotly.js packages on npm. These distributed packages should just work with **any** build framework. That said, if you're looking to save a few bytes, read the section below corresponding to your building framework.

## Webpack

For plotly.js to build with Webpack you will need to install [ify-loader@v1.1.0+](https://github.com/hughsk/ify-loader) and add it to your `webpack.config.json`. This adds Browserify transform compatibility to Webpack which is necessary for some plotly.js dependencies.

A repo that demonstrates how to build plotly.js with Webpack can be found [here](https://github.com/plotly/plotly-webpack). In short add `ify-loader` to the `module` section in your `webpack.config.js`:

```js
...
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'ify-loader'
            }
        ]
    },
...
```

## Browserify

Given source file:

```js
// file: index.js

var Plotly = require('plotly.js');

// ....
```

then simply run,

```
browserify index.js > bundle.js
```

## Angular CLI

Since Angular uses webpack under the hood and doesn't allow easily to change it's webpack configuration, there is some work needed using a `custom-webpack` builder to get things going.

1. Install [`@angular-builders/custom-webpack`](https://www.npmjs.com/package/@angular-builders/custom-webpack) and [ify-loader@v1.1.0+](https://github.com/hughsk/ify-loader)
2. Create a new `extra-webpack.config.js` beside `angular.json`.

> extra-webpack.config.json
```javascript
module.exports = {
    module: {
        rules: [
            {
                test: /\.js$/,
                include: [
                    path.resolve(__dirname, "node_modules/plotly.js")
                ],
                loader: 'ify-loader'
            }
        ]
    },
};
```

3. Change the builder in `angular.json` to `"@angular-builders/custom-webpack:browser` and configure it correctly to use our new webpack config.

> angular.json
```json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "MY_PROJECT_NAME": {
      "root": "",
      "sourceRoot": "src",
      "projectType": "application",
      "prefix": "app",
      "schematics": {
        "@schematics/angular:component": {
          "styleext": "scss"
        }
      },
      "architect": {
        "build": {
          "builder": "@angular-builders/custom-webpack:browser",
          "options": {
            ....
            "customWebpackConfig": {
              "path": "./extra-webpack.config.js",
              "replaceDuplicatePlugins": true,
              "mergeStrategies": {"module.rules":  "merge"}
            }
          }
        }
...
```

It's important to set `projects.x.architect.build.builder` and `projects.x.architect.build.options.customWebpackConfig`.
If you have more projects in your `angular.json` make sure to adjust their settings accordingly.
