# 분산된 파일 사용법

모든 plotly.js dist 번들들은 전역 범위에 객체`Plotly`를 주입합니다.

plotly.js 가져오기:

```
<script src="plotly.min.js"></script>
```

또는 축소되지 않은 버전:

```
<script src="plotly.js" charset="utf-8"></script>
```

### IE9를 지원하려면

plotly.js 스크립트 태그 *사용 전에*  추가해야 할 것:

```
<script>if(typeof window.Int16Array !== 'function')document.write("<scri"+"pt src='extras/typedarray.min.js'></scr"+"ipt>");</script>
<script>document.write("<scri"+"pt src='extras/request_animation_frame.js'></scr"+"ipt>");</script>
```

### MathJax를 지원하려면

plotly.js 스크립트 태그 *사용 전에*  추가해야 할 것:

```
<script src="mathjax/MathJax.js?config=TeX-AMS-MML_SVG"></script>
```

`./dist/extras/mathjax/`에서 관련 MathJax 파일들을 가져올 수 있습니다.

기본적으로, plotly.js는 로드 시에 전역 MathJax 구성을 수정할 것입니다. 이는 plot.js가  Math.js에 의존하는 다른 라이브러리와 함께 로드되는 경우에 바람직하지 않은 동작으로 이어질 수 있습니다. 이 전역 환경설정 프로세스를 비활성화 하려면, `window.PlotlyConfig`객체에서 `MathJaxConfig`속성을 `'local'`로 설정하십시오. 이 특성은 스크립트 태그 전에 반드시 설정해야 합니다, 예시 :

```
<script>
   window.PlotlyConfig = {MathJaxConfig: 'local'}
</script>
<script src="plotly.min.js"></script>
```

### 지역화를 포함하려면

Plotly.js 기본적으로 미국 영어 (en-US)로 표준 번들에 영국 영어 (en)를 포함합니다. 많은 다른 지역화도 가능합니다 - 이건 스위스-독일어 (de-CH)를 활용한 예시인데, 전체 목록은 이 디렉토리의 내용을 참조하십시오. 그것들은 또한 우리 CDN에서 https://cdn.plot.ly/plotly-locale-de-ch-latest.js OR https://cdn.plot.ly/plotly-locale-de-ch-1.50.1.js으로 이용할 수 있다. 로캘을 적용할 때, 영역이 대문자임에도 불구하고 파일 이름들은 모두 소문자임을 유의하십시오.

plotly.js 스크립트 태그 *사용 후에*  추가해야 할 것:

```
<script src="plotly-locale-de-ch.js"></script>
<script>Plotly.setPlotConfig({locale: 'de-CH'})</script>
```

첫 줄은 plotly.js를 등록하고 로캘 정의로 등록하고, 두 번째 줄은 모든 Plotly의 plot에 대한 기본값으로 설정한다. 또한 다수의 로캘 정의를 포함하고 이를 각 플롯에 개별적으로 `config` 매개변수로 적용할 수 있다:

```
Plotly.newPlot(graphDiv, data, layout, {locale: 'de-CH'})
```

# 번들 정보

주 plotly.js 번들은 모든 공식(비 베타) 추적 모듈이 포함된다.

축소된 javascript로도 불러와질 수 있다.

- dist 파일인 `dist/plotly.min.js` 사용
- CDN URL인 https://cdn.plot.ly/plotly-latest.min.js 또는 https://cdn.plot.ly/plotly-1.50.1.min.js 사용

또는 원시 javascript 로서:

- `plotly.js-dist` npm 패키지 사용 (`v1.39.0`부터)
- dist 파일인 `dist/plotly.js` 사용
- CDN URL인 https://cdn.plot.ly/plotly-latest.js 또는 https://cdn.plot.ly/plotly-1.50.1.js 사용
- `require('plotly.js')`와 함께 CommonJS 사용

속성 메타 정보 ([schema reference page](https://plot.ly/javascript/reference/)의 속성 설명 포함)에 접속하려고 한다면, dist 파일인 `dist/plotly-with-meta.js`사용하십시오.

주 plotly.js 번들은 다음과 같은 크기를 갖는다:

| plotly.js | plotly.min.js | plotly.min.js + gzip | plotly-with-meta.js |
| --------- | ------------- | -------------------- | ------------------- |
| 6.8 MB    | 3.1 MB        | 948.8 kB             | 7.1 MB              |

## 부분 번들들

`v1.15.0`부터, plotly.js는 또한 몇몇의 *부분* 번들과 함께 배송된다:

- [basic](https://github.com/plotly/plotly.js/blob/master/dist/README.md#plotlyjs-basic)
- [cartesian](https://github.com/plotly/plotly.js/blob/master/dist/README.md#plotlyjs-cartesian)
- [geo](https://github.com/plotly/plotly.js/blob/master/dist/README.md#plotlyjs-geo)
- [gl3d](https://github.com/plotly/plotly.js/blob/master/dist/README.md#plotlyjs-gl3d)
- [gl2d](https://github.com/plotly/plotly.js/blob/master/dist/README.md#plotlyjs-gl2d)
- [mapbox](https://github.com/plotly/plotly.js/blob/master/dist/README.md#plotlyjs-mapbox)
- [finance](https://github.com/plotly/plotly.js/blob/master/dist/README.md#plotlyjs-finance)

`v1.39.0`부터, 각 plotly.js 부분 번들은 의존성이 없는 해당 npm package 를 가지고 있다.

`v1.50.0`부터, 각 부분 번들의 최소화된 버전은 별도의 "dist min" 패키지로 npm에 게시된다.

### 기본적인 plotly.js

`기본` 부분 번들은 추적 모듈 `scatter`, `bar` and `pie`를 포함합니다..

#### 상태

| Raw size | Minified size | Minified + gzip size |
| -------- | ------------- | -------------------- |
| 2.3 MB   | 841 kB        | 276.1 kB             |

#### CDN 링크

| Flavor          | URL                                            |
| --------------- | ---------------------------------------------- |
| Latest          | https://cdn.plot.ly/plotly-basic-latest.js     |
| Latest minified | https://cdn.plot.ly/plotly-basic-latest.min.js |
| Tagged          | https://cdn.plot.ly/plotly-basic-1.50.1.js     |
| Tagged minified | https://cdn.plot.ly/plotly-basic-1.50.1.min.js |

#### npm 패키지 (starting in `v1.39.0`)

[`plotly.js-basic-dist`](https://www.npmjs.com/package/plotly.js-basic-dist) 설치:

```
npm install plotly.js-basic-dist
```

ES6 모듈 사용:

```
import Plotly from 'plotly.js-basic-dist'
```

CommonJS 사용:

```
var Plotly = require('plotly.js-basic-dist');
```

#### dist min npm package (`v1.50.0`부터)

[`plotly.js-basic-dist-min`](https://www.npmjs.com/package/plotly.js-basic-dist-min) 설치

```
npm install plotly.js-basic-dist-min
```

#### 다른 plotly.js 진입 포인트

| Flavor                 | 주소                                             |
| ---------------------- | ------------------------------------------------ |
| dist bundle            | `dist/plotly-basic.js`                           |
| dist bundle (minified) | `dist/plotly-basic.min.js`                       |
| ES6 module             | `import Plotly from 'plotly.js/lib/index-basic'` |
| CommonJS               | `require('plotly.js/lib/index-basic')`           |

### plotly.js cartesian

`cartesian` 부분 번들은 추적 모듈인 `scatter`, `bar`, `box`, `heatmap`, `histogram`, `histogram2d`, `histogram2dcontour`, `pie`, `contour`, `scatterternary` 그리고 `violin`를 포함한다.

#### 상태

| Raw size | Minified size | Minified + gzip size |
| -------- | ------------- | -------------------- |
| 2.7 MB   | 958.7 kB      | 313.5 kB             |

#### CDN 링크

| Flavor          | URL                                                |
| --------------- | -------------------------------------------------- |
| Latest          | https://cdn.plot.ly/plotly-cartesian-latest.js     |
| Latest minified | https://cdn.plot.ly/plotly-cartesian-latest.min.js |
| Tagged          | https://cdn.plot.ly/plotly-cartesian-1.50.1.js     |
| Tagged minified | https://cdn.plot.ly/plotly-cartesian-1.50.1.min.js |

#### npm package (`v1.39.0`부터)

[`plotly.js-cartesian-dist`](https://www.npmjs.com/package/plotly.js-cartesian-dist) 설치 :

```
npm install plotly.js-cartesian-dist
```

ES6 모듈 사용 :

```
import Plotly from 'plotly.js-cartesian-dist'
```

CommonJS 사용 :

```
var Plotly = require('plotly.js-cartesian-dist');
```

#### dist min npm package (`v1.50.0`부터)

[`plotly.js-cartesian-dist-min`](https://www.npmjs.com/package/plotly.js-cartesian-dist-min) 설치 :

```
npm install plotly.js-cartesian-dist-min
```

#### 다른 plotly.js 진입 포인트

| Flavor                 | 주소                                                 |
| ---------------------- | ---------------------------------------------------- |
| dist bundle            | `dist/plotly-cartesian.js`                           |
| dist bundle (minified) | `dist/plotly-cartesian.min.js`                       |
| ES6 module             | `import Plotly from 'plotly.js/lib/index-cartesian'` |
| CommonJS               | `require('plotly.js/lib/index-cartesian')`           |

### plotly.js geo

`geo` 부분 번들은 추적 모듈인 `scatter`, `scattergeo` 그리고 `choropleth`를 포함합니다..

#### 상태

| Raw size | Minified size | Minified + gzip size |
| -------- | ------------- | -------------------- |
| 2.3 MB   | 852.8 kB      | 281.7 kB             |

#### CDN 링크

| Flavor          | URL                                          |
| --------------- | -------------------------------------------- |
| Latest          | https://cdn.plot.ly/plotly-geo-latest.js     |
| Latest minified | https://cdn.plot.ly/plotly-geo-latest.min.js |
| Tagged          | https://cdn.plot.ly/plotly-geo-1.50.1.js     |
| Tagged minified | https://cdn.plot.ly/plotly-geo-1.50.1.min.js |

#### npm package (`v1.39.0`부터)

[`plotly.js-geo-dist`](https://www.npmjs.com/package/plotly.js-geo-dist) 설치 : 

```
npm install plotly.js-geo-dist
```

ES6 모듈 사용:

```
import Plotly from 'plotly.js-geo-dist'
```

CommonJS 사용 :

```
var Plotly = require('plotly.js-geo-dist');
```

#### dist min npm package (`v1.50.0`부터)

[`plotly.js-geo-dist-min`](https://www.npmjs.com/package/plotly.js-geo-dist-min) 설치 :

```
npm install plotly.js-geo-dist-min
```

#### 다른 plotly.js 진입 포인트

| Flavor                 | 주소                                           |
| ---------------------- | ---------------------------------------------- |
| dist bundle            | `dist/plotly-geo.js`                           |
| dist bundle (minified) | `dist/plotly-geo.min.js`                       |
| ES6 module             | `import Plotly from 'plotly.js/lib/index-geo'` |
| CommonJS               | `require('plotly.js/lib/index-geo')`           |

### plotly.js gl3d

`gl3d` 부분 번들은 추적 모듈인 `scatter`, `scatter3d`, `surface`, `mesh3d`, `isosurface`, `volume`, `cone` 그리고 `streamtube` 를 포함한다.

#### 상태

| Raw size | Minified size | Minified + gzip size |
| -------- | ------------- | -------------------- |
| 3.5 MB   | 1.4 MB        | 438.4 kB             |

#### CDN 링크

| Flavor          | URL                                           |
| --------------- | --------------------------------------------- |
| Latest          | https://cdn.plot.ly/plotly-gl3d-latest.js     |
| Latest minified | https://cdn.plot.ly/plotly-gl3d-latest.min.js |
| Tagged          | https://cdn.plot.ly/plotly-gl3d-1.50.1.js     |
| Tagged minified | https://cdn.plot.ly/plotly-gl3d-1.50.1.min.js |

#### npm package (`v1.39.0`부터)

[`plotly.js-gl3d-dist`](https://www.npmjs.com/package/plotly.js-gl3d-dist) 설치 :

```
npm install plotly.js-gl3d-dist
```

ES6 모듈 사용 :

```
import Plotly from 'plotly.js-gl3d-dist'
```

CommonJS 사용 :

```
var Plotly = require('plotly.js-gl3d-dist');
```

#### dist min npm package (`v1.50.0`부터)

[`plotly.js-gl3d-dist-min`](https://www.npmjs.com/package/plotly.js-gl3d-dist-min) 설치 :

```
npm install plotly.js-gl3d-dist-min
```

#### 다른 plotly.js 진입 포인트

| Flavor                 | 주소                                            |
| ---------------------- | ----------------------------------------------- |
| dist bundle            | `dist/plotly-gl3d.js`                           |
| dist bundle (minified) | `dist/plotly-gl3d.min.js`                       |
| ES6 module             | `import Plotly from 'plotly.js/lib/index-gl3d'` |
| CommonJS               | `require('plotly.js/lib/index-gl3d')`           |

### plotly.js gl2d

`gl2d` 부분 번들은 추적 모듈인 `scatter`, `scattergl`, `splom`, `pointcloud`, `heatmapgl`, `contourgl` 그리고 `parcoords`를 포함합니다.

#### 상태

| Raw size | Minified size | Minified + gzip size |
| -------- | ------------- | -------------------- |
| 3.5 MB   | 1.4 MB        | 456.4 kB             |

#### CDN 링크

| Flavor          | URL                                           |
| --------------- | --------------------------------------------- |
| Latest          | https://cdn.plot.ly/plotly-gl2d-latest.js     |
| Latest minified | https://cdn.plot.ly/plotly-gl2d-latest.min.js |
| Tagged          | https://cdn.plot.ly/plotly-gl2d-1.50.1.js     |
| Tagged minified | https://cdn.plot.ly/plotly-gl2d-1.50.1.min.js |

#### npm package (`v1.39.0`부터)

[`plotly.js-gl2d-dist`](https://www.npmjs.com/package/plotly.js-gl2d-dist) 설치 :

```
npm install plotly.js-gl2d-dist
```

ES6 모듈 사용:

```
import Plotly from 'plotly.js-gl2d-dist'
```

CommonJS 사용:

```
var Plotly = require('plotly.js-gl2d-dist');
```

#### dist min npm package (`v1.50.0`부터)

[`plotly.js-gl2d-dist-min`](https://www.npmjs.com/package/plotly.js-gl2d-dist-min) 설치 :

```
npm install plotly.js-gl2d-dist-min
```

#### 다른 plotly.js 진입 포인트

| Flavor                 | 주소                                            |
| ---------------------- | ----------------------------------------------- |
| dist bundle            | `dist/plotly-gl2d.js`                           |
| dist bundle (minified) | `dist/plotly-gl2d.min.js`                       |
| ES6 module             | `import Plotly from 'plotly.js/lib/index-gl2d'` |
| CommonJS               | `require('plotly.js/lib/index-gl2d')`           |

### plotly.js mapbox

`mapbox` 부분 번들은 추적 모듈인 `scatter`, `scattermapbox`, `choroplethmapbox` 그리고 `densitymapbox`를 포함합니다.

#### 상태

| Raw size | Minified size | Minified + gzip size |
| -------- | ------------- | -------------------- |
| 3.1 MB   | 1.5 MB        | 461.7 kB             |

#### CDN 링크

| Flavor          | URL                                             |
| --------------- | ----------------------------------------------- |
| Latest          | https://cdn.plot.ly/plotly-mapbox-latest.js     |
| Latest minified | https://cdn.plot.ly/plotly-mapbox-latest.min.js |
| Tagged          | https://cdn.plot.ly/plotly-mapbox-1.50.1.js     |
| Tagged minified | https://cdn.plot.ly/plotly-mapbox-1.50.1.min.js |

#### npm package (`v1.39.0`부터)

[`plotly.js-mapbox-dist`](https://www.npmjs.com/package/plotly.js-mapbox-dist) 설치 :

```
npm install plotly.js-mapbox-dist
```

ES6 모듈 사용 :

```
import Plotly from 'plotly.js-mapbox-dist'
```

CommonJS 사용:

```
var Plotly = require('plotly.js-mapbox-dist');
```

#### dist min npm package (`v1.50.0`부터)

[`plotly.js-mapbox-dist-min`](https://www.npmjs.com/package/plotly.js-mapbox-dist-min) 설치 :

```
npm install plotly.js-mapbox-dist-min
```

#### 다른 plotly.js 진입 포인트

| Flavor                 | 주소                                              |
| ---------------------- | ------------------------------------------------- |
| dist bundle            | `dist/plotly-mapbox.js`                           |
| dist bundle (minified) | `dist/plotly-mapbox.min.js`                       |
| ES6 module             | `import Plotly from 'plotly.js/lib/index-mapbox'` |
| CommonJS               | `require('plotly.js/lib/index-mapbox')`           |

### plotly.js finance

`finance` 부분번들은 추적 모듈인 `scatter`, `bar`, `histogram`, `pie`, `funnelarea`, `ohlc`, `candlestick`, `funnel`, `waterfall` 그리고 `indicator`를 포함합니다..

#### 상태

| Raw size | Minified size | Minified + gzip size |
| -------- | ------------- | -------------------- |
| 2.5 MB   | 926.9 kB      | 300.7 kB             |

#### CDN 링크

| Flavor          | URL                                              |
| --------------- | ------------------------------------------------ |
| Latest          | https://cdn.plot.ly/plotly-finance-latest.js     |
| Latest minified | https://cdn.plot.ly/plotly-finance-latest.min.js |
| Tagged          | https://cdn.plot.ly/plotly-finance-1.50.1.js     |
| Tagged minified | https://cdn.plot.ly/plotly-finance-1.50.1.min.js |

#### npm package (`v1.39.0`부터)

[`plotly.js-finance-dist`](https://www.npmjs.com/package/plotly.js-finance-dist) 설치 :

```
npm install plotly.js-finance-dist
```

ES6 모듈 사용:

```
import Plotly from 'plotly.js-finance-dist'
```

CommonJS 사용:

```
var Plotly = require('plotly.js-finance-dist');
```

#### dist min npm package (`v1.50.0`부터)

[`plotly.js-finance-dist-min`](https://www.npmjs.com/package/plotly.js-finance-dist-min) 설치

```
npm install plotly.js-finance-dist-min
```

#### 다른 plotly.js 진입 포인트

| Flavor                 | 주소                                               |
| ---------------------- | -------------------------------------------------- |
| dist bundle            | `dist/plotly-finance.js`                           |
| dist bundle (minified) | `dist/plotly-finance.min.js`                       |
| ES6 module             | `import Plotly from 'plotly.js/lib/index-finance'` |
| CommonJS               | `require('plotly.js/lib/index-finance')`           |

------

*이 파일은 자동으로 `npm run stats`에 의해 자동으로 생성됩니다. 이 파일을 직접 편집하지 마십시오.*