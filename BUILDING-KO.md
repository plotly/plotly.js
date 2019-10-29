# plotly.js 구축

plotly.js를 어플리케이션에 번들로 묶는 가장 쉬운 방법은 npm에서 배포 된 plotly.js 패키지 중 하나를 사용하는 것입니다. 이러한 분산 패키지는 **모든** 빌드 프레임워크에서 작동해야합니다. 즉,  바이트를 절약하려면 프레임워크 구축에 해당하는 아래 섹션을 읽으세요.

## Webpack

plotly.js를 Webpack으로 빌드하려면 [ify-loader@v1.1.0+](https://github.com/hughsk/ify-loader) 를 설치하고 `webpack.config.json`.에 추가해야합니다. 이것은 일부 plotly.js 의존성에 필요한 Browserify 변환 호환성을 Webpack에 추가합니다. Webpack으로 plotly.js를 빌드하는 방법을 보여주는 저장소는 [here](https://github.com/plotly/plotly-webpack)에서 찾을 수 있습니다. 간단히 말해 `ify-loader` 를  `webpack.config.js`의 `module` 섹션에 추가하십시오 :

```
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

주어진 소스 파일 :

```
// file: index.js

var Plotly = require('plotly.js');

// ....
```

그 다음 간단히 실행,

```
browserify index.js > bundle.js
```

## Angular CLI

현재 Angular CLI는 후드 아래에서 Webpack을 사용하여 Angular 응용 프로그램을 번들로 만들고 빌드합니다.  안타깝게도 [Webpack](https://github.com/plotly/plotly.js/blob/master/BUILDING.md#webpack) 섹션에 언급 된 플러그인을 추가하기 위해 Webpack 구성을 재정의 할 수 없습니다.  이 플러그인이 없으면 WebGL 플롱세 대한 glslify를 빌드하려고 할 때 빌드가 실패합니다.

이 문제를 피하기 위해 현재 두 가지 해결책이 있습니다 :

1. WebGL 플롯을 사용해야 하는 경우 [ng eject](https://github.com/angular/angular-cli/wiki/eject)를 사용하여 Angular CLI 프로젝트에서 Webpack 구성을 만들 수 있습니다. 그러면 Webpack에 관한 지침을 따를 수 있습니다. 
2. WebGL 플롯을 사용할 필요가 없는 경우, 플롯에 필요한 module만 포함하는 사용자 정의 빌드를 작성할 수있습니다. Angular CLI를 사용하는 명확한 방법은 README의 [Modules](https://github.com/plotly/plotly.js/blob/master/README.md#modules) 섹션에 설명 된 방법이 아니라 다음을 따르십시오 :

```
// in the Component you want to create a graph
import * as Plotly from 'plotly.js';
// in src/tsconfig.app.json
// List here the modules you want to import
// this example is for scatter plots
{
    "compilerOptions": {
        "paths": {
            "plotly.js": [
                "../node_modules/plotly.js/lib/core.js",
                "../node_modules/plotly.js/lib/scatter.js"
            ]
        }
    }
}
```