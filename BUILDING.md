# Alternative ways to require or build plotly.js
Depending on your needs you may require/import one of [the distributed plotly.js packages](https://github.com/plotly/plotly.js/blob/master/dist/README.md) or [a plotly.js/lib index file](https://github.com/plotly/plotly.js/tree/master/lib) and integrate it into your application.

The sections below provide additional info in respect to alternative building frameworks.

---
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
---
