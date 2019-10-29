[![img](https://camo.githubusercontent.com/b48021e8685bc09fb2ca887f341d8c7645e71ae1/687474703a2f2f696d616765732e706c6f742e6c792f6c6f676f2f706c6f746c796a732d6c6f676f4032782e706e67)](https://plot.ly/javascript/)

[![npm version](https://camo.githubusercontent.com/366592849e322b16073581f62a8a25b5108197e3/68747470733a2f2f62616467652e667572792e696f2f6a732f706c6f746c792e6a732e737667)](https://badge.fury.io/js/plotly.js) [![circle ci](https://camo.githubusercontent.com/770102629aa86ab193c7cd1ba999ced83fd89688/68747470733a2f2f636972636c6563692e636f6d2f67682f706c6f746c792f706c6f746c792e6a732e706e673f267374796c653d736869656c6426636972636c652d746f6b656e3d31663432613033623234326264393639373536666333653533656465323034616639623530376330)](https://circleci.com/gh/plotly/plotly.js) [![MIT License](https://camo.githubusercontent.com/a2753323735099059bdc88b724534a1a6bd134ee/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f4c6963656e73652d4d49542d627269676874677265656e2e737667)](https://github.com/plotly/plotly.js/blob/master/LICENSE)

[d3.js](http://d3js.org/) 와 [stack.gl](http://stack.gl/) 위에 개발 된,  plotly.js 는 높은 수준의 선언적 chart 라이브러리 입니다 . plotly.js 는 과학적 차트, 3D 그래프 차트, 분석 차트, SVG 지도, 상업적 차트 등을 포함한 40개 이상의 차트를 포함하고 있습니다.

[![img](https://raw.githubusercontent.com/cldougl/plot_images/add_r_img/plotly_2017.png)](https://www.plot.ly/javascript)

Plotly.js의 대쉬보드 개발, 앱 통합, 기능 추가를 위한 상담은 [Contact us](https://plot.ly/products/consulting-and-oem/) 로 연락해주세요.

## Table of contents

- [Quick start options](https://github.com/plotly/plotly.js/blob/master/README.md#quick-start-options)
- [Modules](https://github.com/plotly/plotly.js/blob/master/README.md#modules)
- [Building plotly.js](https://github.com/plotly/plotly.js/blob/master/README.md#building-plotlyjs)
- [Bugs and feature requests](https://github.com/plotly/plotly.js/blob/master/README.md#bugs-and-feature-requests)
- [Documentation](https://github.com/plotly/plotly.js/blob/master/README.md#documentation)
- [Contributing](https://github.com/plotly/plotly.js/blob/master/README.md#contributing)
- [Community](https://github.com/plotly/plotly.js/blob/master/README.md#community)
- [Clients for R, Python, Node, and MATLAB](https://github.com/plotly/plotly.js/blob/master/README.md#clients-for-r-python-node-and-matlab)
- [Creators](https://github.com/plotly/plotly.js/blob/master/README.md#creators)
- [Copyright and license](https://github.com/plotly/plotly.js/blob/master/README.md#copyright-and-license)

## 빠른 시작 옵션

### npm 설치

```
npm install plotly.js-dist
```

and import plotly.js as `import Plotly from 'plotly.js-dist';` or `var Plotly = require('plotly.js-dist');`.

### Use the plotly.js CDN hosted by Fastly

```
<!-- Latest compiled and minified plotly.js JavaScript -->
<script src="https://cdn.plot.ly/plotly-latest.min.js"></script>

<!-- OR use a specific plotly.js release (e.g. version 1.5.0) -->
<script src="https://cdn.plot.ly/plotly-1.5.0.min.js"></script>

<!-- OR an un-minified version is also available -->
<script src="https://cdn.plot.ly/plotly-latest.js" charset="utf-8"></script>
```

그후, window scope 에서 `Plotly` 오브젝트를 생성하세요.

Fastly supports Plotly.js with free CDN service. Read more at https://www.fastly.com/open-source

### 최신버전 다운로드 

[Latest Release on GitHub](https://github.com/plotly/plotly.js/releases/)

and use the plotly.js `dist` file(s). More info [here](https://github.com/plotly/plotly.js/blob/master/dist/README.md).

####  [Getting started page](https://plot.ly/javascript/getting-started/) 를 통해서 예제를 만나보세요.

## 모듈설명

 `v1.15.0` 버전,  plotly.js 는 *부분* bundles들을 제공합니다. (더많은 내용 참고 [here](https://github.com/plotly/plotly.js/blob/master/dist/README.md#partial-bundles)).

 `v1.39.0` 버전, plotly.js는 dependencies 없이 분산된 npm를 출시합니다. 예를들어, run `npm install plotly.js-geo-dist` and add `import Plotly from 'plotly.js-geo-dist';`  plotly.js geo package를 코드에 적용시키도록 합니다.

만약 분산된 npm 패키지들이 어느 것도 needs를 충족시키지 못하고, 수동적으로 plotly.js 모듈들을 포함하고 싶다면, 당신읜 먼저 run `npm install plotly.js` 한 후, `plotly.js/lib/core` 를 이용하여 *custom* 번들을 생성하고, 당신이 원하는 trace type들을 로딩하면 됩니다.(e.g. `pie` or `choropleth`).

추천되는 방법은 *bundling file* 을 만드는 것입니다. 예시, in CommonJS:

```
// in custom-plotly.js
var Plotly = require('plotly.js/lib/core');

// Load in the trace types for pie, and choropleth
Plotly.register([
    require('plotly.js/lib/pie'),
    require('plotly.js/lib/choropleth')
]);

module.exports = Plotly;
```

그 후 당신의 코드에 추가합니다:

```
var Plotly = require('./path/to/custom-plotly');
```

더 많은 plotly/js 모듈 아키텍처를 배우고 싶다면 [modularizing monolithic JS projects](https://plot.ly/javascript/modularizing-monolithic-javascript-projects/)를 참고하세요



#### ASCII가 아닌 문자들

중요: plotyls.js 코드는 non-ascii 문자를 base로 포함하고 있습니다.

그러므로 `charset` 속성을 `"utf-8"` 로 sciprt tag를 설정 해주세요. 다음은 예시입니다.

```
<script src="my-plotly-bundle.js" charset="utf-8"></script>
```

## Building plotly.js

Building instructions using `webpack`, `browserify` 을 사용하기 위한 빌딩 명렁어나 다른 빌드 프레임워크는 [`BUILDING.md`](https://github.com/plotly/plotly.js/blob/master/BUILDING.md) 에 나와있습니다.

## Bugs and feature requests

버그나 feature 문제가 발견되면?  다음을 읽어보세요. [issues guidelines](https://github.com/plotly/plotly.js/blob/master/CONTRIBUTING.md#opening-issues).

## 문서작업

공식적으로 plotly.js 문서들은  [plot.ly/javascript ](https://plot.ly/javascript)에 host됩니다.



 이 페이지는  [Jekyll](http://jekyllrb.com/)  과 함께 구축되고 GitHub 페이지에서 공개적으로 호스팅되는 Plotly  [documentation repo](https://github.com/plotly/documentation/tree/gh-pages)  의해 생성된다.  더 많은 Plotly 문서화 기여 정보를 얻고싶다면,  [contributing guidelines](https://github.com/plotly/documentation/blob/source/Contributing.md) 를 읽어보세요.

[`plotly-js`](http://community.plot.ly/c/plotly-js). 태그를 붙여서 community.plot.ly에 [Codepen](http://codepen.io/tag/plotly/) 을 제출하여 더 많은 문서 예제를 제안할 수 있습니다.

## 기여하기

 [contributing guidelines](https://github.com/plotly/plotly.js/blob/master/CONTRIBUTING.md) 을 읽어보세요. 가이드라인과 issue 제기 등 plotly.js를 이용한 개발 기여 방법에 대해 나와있습니다.

## 커뮤니티

-  [@plotlygraphs](https://twitter.com/plotlygraphs) 를 팔로우하여 최신 Plotly 정보를 얻으세요
-  [@plotly_js](https://twitter.com/plotly_js) 를 팔로우하여 plotly.js의 release update를 확인하세요.
- 구현에 있어  community.plot.ly (tagged [`plotly-js`](http://community.plot.ly/c/plotly-js)) or on Stack Overflow (tagged [`plotly`](https://stackoverflow.com/questions/tagged/plotly)) 를 참고하여 도움을 받을 수 있습니다..
- plotly.js 를  [npm](https://www.npmjs.com/browse/keyword/plotly) 에 배포할 때, 패키지에서 개발자들은 `plotly` 키워드를 사용하여 기능들을 수정하거나 추가 할 수 있습니다.
- [Plotly Support Plan ](https://support.plot.ly/libraries/javascript) 를 통하여 개발자들은 email로 직접 도움을 받을 수 있습니다.

## 버전 수정

이 프로젝트는  [Semantic Versioning guidelines](http://semver.org/) 하에 관리되고 있습니다.

GitHub 프로젝트의 [Releases section](https://github.com/plotly/plotly.js/releases) 에서 plotly.js의 release 된 버전의 log 들을 확인해보세요.

## Clients for R, Python, Node, and MATLAB

아래 링크들을 이용하여 plotly.js API에 대한 Open-source client 정보를 얻을 수 있습니다:

|                                           | GitHub repo                                                  | Getting started                                              |
| ----------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| **R / RStudio**                           | [ropensci/plotly](https://github.com/ropensci/plotly)        | [plot.ly/r/getting-started](https://plot.ly/r/getting-started) |
| **Python / Pandas / IPython notebook**    | [plotly/plotly.py](https://github.com/plotly/plotly.py)      | [plot.ly/python/getting-started](https://plot.ly/python/getting-started) |
| **MATLAB**                                | [plotly/matlab-api](https://github.com/plotly/matlab-api)    | [plot.ly/matlab/getting-started](https://plot.ly/matlab/getting-started) |
| **node.js / Tonicdev / Jupyter notebook** | [plotly/plotly-notebook-js](https://github.com/plotly/plotly-notebook-js) |                                                              |
| **node.js cloud client**                  | [plotly/plotly-nodejs](https://github.com/plotly/plotly-nodejs) | [plot.ly/nodejs/getting-started](https://plot.ly/nodejs/getting-started) |
| **Julia**                                 | [plotly/Plotly.jl](https://github.com/plotly/Plotly.jl)      | [plot.ly/julia/getting-started](https://plot.ly/julia/getting-started) |

plotly.js 차트는 무료로  [plot.ly/create](https://plot.ly/create) 에서 만들어지거나 저장될 수 있습니다. 

## Creators

### Active

|                              | GitHub                                           | Twitter                                             |
| ---------------------------- | ------------------------------------------------ | --------------------------------------------------- |
| **Alex C. Johnson**          | [@alexcjohnson](https://github.com/alexcjohnson) |                                                     |
| **Étienne Tétreault-Pinard** | [@etpinard](https://github.com/etpinard)         | [@etpinard](https://twitter.com/etpinard)           |
| **Antoine Roy-Gobeil**       | [@antoinerg](https://github.com/antoinerg)       |                                                     |
| **Mojtaba Samimi**           | [@archmoj](https://github.com/archmoj)           | [@solarchvision](https://twitter.com/solarchvision) |

### Hall of Fame

|                       | GitHub                                                   | Twitter                                             |
| --------------------- | -------------------------------------------------------- | --------------------------------------------------- |
| **Mikola Lysenko**    | [@mikolalysenko](https://github.com/mikolalysenko)       | [@MikolaLysenko](https://twitter.com/MikolaLysenko) |
| **Ricky Reusser**     | [@rreusser](https://github.com/rreusser)                 | [@rickyreusser](https://twitter.com/rickyreusser)   |
| **Dmitry Yv.**        | [@dy](https://github.com/dy)                             | [@DimaYv](https://twitter.com/dimayv)               |
| **Robert Monfera**    | [@monfera](https://github.com/monfera)                   | [@monfera](https://twitter.com/monfera)             |
| **Robert Möstl**      | [@rmoestl](https://github.com/rmoestl)                   | [@rmoestl](https://twitter.com/rmoestl)             |
| **Nicolas Riesco**    | [@n-riesco](https://github.com/n-riesco)                 |                                                     |
| **Miklós Tusz**       | [@mdtusz](https://github.com/mdtusz)                     | [@mdtusz](https://twitter.com/mdtusz)               |
| **Chelsea Douglas**   | [@cldougl](https://github.com/cldougl)                   |                                                     |
| **Ben Postlethwaite** | [@bpostlethwaite](https://github.com/bpostlethwaite)     |                                                     |
| **Chris Parmer**      | [@chriddyp](https://github.com/chriddyp)                 |                                                     |
| **Alex Vados**        | [@alexander-daniel](https://github.com/alexander-daniel) |                                                     |

## 저작권과 라이선스

Code and documentation copyright 2019 Plotly, Inc.

Code released under the [MIT license](https://github.com/plotly/plotly.js/blob/master/LICENSE).

Docs released under the [Creative Commons license](https://github.com/plotly/documentation/blob/source/LICENSE).