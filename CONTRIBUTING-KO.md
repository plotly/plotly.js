# plotly.js에 기여하는 방법

## Opening issues

 [issue guidelines](https://github.com/plotly/plotly.js/blob/master/.github/ISSUE_TEMPLATE.md)을 참고해 주시기 바랍니다.

## Making pull requests

[pull request guidelines](https://github.com/plotly/plotly.js/blob/master/.github/PULL_REQUEST_TEMPLATE.md)을 참고해 주시기 바랍니다.

## GitHub labels

저희는 track issues와 PRs의 문제를 해결하기 위하여 다음과 같은 [labels](https://github.com/plotly/plotly.js/labels) 을 사용합니다.

| Label                       | 목적                                                         |
| --------------------------- | ------------------------------------------------------------ |
| `type: bug`                 | plotly의 팀 멤버에 의해 확인된 bug report                    |
| `type: regression`          | 버전의 변화로 인해 동작의 변화를 보이는 것으로 알려진 bug    |
| `type: feature`             | 계획된 기능의 추가                                           |
| `type: translation`         | 현지화 관련 업무                                             |
| `type: performance`         | 실행 관련 업무                                               |
| `type: maintenance`         | 소스 코드 정리의 결과로 사용자를 위한 기능 향상을 이루지 못함 |
| `type: documentation`       | API doc or attribute description 의 개선                     |
| `type: community`           | community 입력과 pull requests에 개방된 issue                |
| `type: duplicate`           | *부가적인 설명은 없음*                                       |
| `type: wontfix`             | *부가적인 설명은 없음*                                       |
| `status: discussion needed` | 진행하기전 maintainers와 논의가 필요한 Issue나 PR            |
| `status: in progress`       | 초기의 피드백이 필요하지만 merge할 준비가 되지 않은 PRs      |
| `status: reviewable`        | 저작자의 견해로 완벽한 PRs                                   |
| `status: on hold`           | 보류중인 PRs                                                 |

## 개발

#### 필수 구성 요소

- git
- [node.js](https://nodejs.org/en/). 우리는 node.js v10.x을 사용하는 것을 추천하지만, v6에서 시작하는 모든 버전이 작동되어야 합니다 . node version의 업그레이드 및 관리는  [`nvm`](https://github.com/creationix/nvm) 혹은  Windows alternatives를 사용하여 쉽게 수행할 수 있습니다..
- [package-lock.json`](https://docs.npmjs.com/files/package-lock.json) 파일이 올바르게 사용되고 업데이트 되도록 [`npm`](https://www.npmjs.com/) v6.x 이상의 버전 (기본적으로 node.js v10.x와 함께 제공되는 항목)을 사용해야 합니다.

#### Step 1: plotly.js 저장소의 clone을 생성 및 설치

```
git clone https://github.com/plotly/plotly.js.git
cd plotly.js
npm install
```

#### Step 2: Test 환경 구축

```
npm run pretest
```

#### Step 3: Test dashboard  시작

```
npm start
```

이 명령은 [browserify](https://github.com/substack/node-browserify)을 사용하여 소스 파일들을 소스 맵으로 묶어내고, 파일 감시자 [watchify](https://github.com/substack/watchify) (소스파일이 저장될 때마다 당신의 dev plotly.js번들 업데이트 수행)를 시작하고 당신의 브라우저에서 탭을 엽니다.

#### Step 4: 콘솔을 열어서 개발 시작

일반적인 workflow는 소스를 조금씩 수정하는 것이고, test dashboard를 업데이트 하며 변경 사항을 검사하고 디버그 하는 것을 반복합니다. test dashboard는 개발에 유용한 도구와 함께 제공되며,  `Tabs` 객체 아래 번들로 제공됩니다.

| Method/Property             | Description                                                  |
| --------------------------- | ------------------------------------------------------------ |
| `Tabs.fresh([id])`          | 새 그래프 분할을 만들고 반환합니다. (`graph`의 default).     |
| `Tabs.getGraph([id])`       | 기본 또는 지정된 그래프 분할을 반환합니다.                   |
| `Tabs.plotMock(mock, [id])` | 지정된 모형을 그립니다. (`.json` 연장은 필요하지 않습니다).  |
| `Tabs.snapshot([id])`       | plot의 png 스냅샷을 만들고 아래에 배치합니다.                |
| `Tabs.reload()`             | plotly.js 스크립트를 다시 로드하고 완료되면 `Tabs.onReload` 을 실행합니다. |
| `Tabs.onReload()`           | 기본적으로,  `noop` 으로 설정되지만 원하는 기능에`Tabs.onReload`를 설정할 수 있습니다 . 이 기능은 plotly.js 스크립트를 다시 로드할 때마다 복사본이나 테스트파일을 다시 생성하는데 유용합니다. |
| `Tabs.purge()`              | 모든 plots를 삭제합니다.                                     |

더 많은 정보가 필요하다면 [the source](https://github.com/plotly/plotly.js/blob/master/devtools/test_dashboard/devtools.js)를 확인하십시오. 

매초마다 갱신되는 세가지의 추가 helper가 존재합니다:

- `gd` - plot div의 기본형(default)
- `fullData` -  `gd._fullData`의 축약
- `fullLayout` -  `gd._fullLayout`의 축약

 dashboard의 오른쪽 상단에는 검색 표시줄이 있습니다.이 fuzzy-searches는 파일 이름 및 추적 유형을 기반으로 한 mock을 보여줍니다.

- `npm run preprocess`:  js에서 css 및 svg 소스 파일의 사전 처리를 진행합니다. css 및 svg 소스 파일을 업데이트 할 때에는 이 스크립트를 수동으로 실행해야 합니다.
- `npm run watch`: 테스트 대시보드와 마찬가지로 서버를 부팅하지 않고 watchify(파일 감시자)를 시작합니다.

## Testing

 이 repository로 push할 때마다 jasmine과 image 테스트는 모두 [CircleCI](https://circleci.com/gh/plotly/plotly.js) 에서 실행됩니다.

### Jasmine tests

Jasmine tests는 [karma](https://github.com/karma-runner/karma)을 사용하여 브라우저에서 실행됩니다. local에서 실행하는 방법은 다음과 같습니다:

```
npm run test-jasmine
```

특정 suite를 사용 및 실행하는 방법은 다음과 같습니다:

```
npm run test-jasmine -- <suite>
```

[`test/jasmine/tests/`](https://github.com/plotly/plotly.js/tree/master/test/jasmine/tests)에서 찾을 수 있는 suites의 file 명에 해당합니다.

예를 들면, 여러개의 suite를 동시에 테스트할 수 있습니다:

```
npm run test-jasmine -- bar axes scatter
```

 `bar_test.js`, `axes_test.js` 그리고 `scatter_test.js` suites에서 테스트를 실행합니다.

 `autoWatch` / auto-bundle / multiple run mode를 끄는 방법:

```
npm run test-jasmine -- <suite> --nowatch
```

특정한 상황에서는, default reporting이 테스트 실패의 원인을 파악할 수 있을 만큼 분명하지 않을 수 있습니다.  이런 경우에는 [karma-verbose-reporter](https://www.npmjs.com/package/karma-verbose-reporter)를 사용하는 것을 권장합니다:

```
npm run test-jasmine -- <suite> --verbose
```

karma / jasmine CLI에 대한 정보 및 도움말:

```
npm run test-jasmine -- --help
npm run test-jasmine -- --info
```

### 이미지 픽셀 비교 테스트(Image pixel comparison tests)

이미지 픽셀 비교 테스트는 docker container에서 실행됩니다. local에서 실행하는 방법에 대한 자세한 내용은 [image test README](https://github.com/plotly/plotly.js/blob/master/test/image/README.md)를 참조하십시오.

local에서 테스트를 실행하면 생성된 png 영상이 build/test_images/에 생성되고,` png diffs `는 build/test_images_diff/`에 생성됩니다. (두개의 git-ignored 디렉토리).

이미지 픽셀 비교 테스트의 결과를 보기위해 실행합니다.

```
npm run start-image_viewer
```

이는 baseline image, the generated image, 실패한 테스트 사례의 diff and the json 모형을 보여줍니다.

CircleCI에서의 실행 결과를 보려면,  `build/test_images/` 및 `build/test_images_diff/` 의 아티팩트를 local 저장소로 다운로드한 후, `npm run start-image_viewer`를 실행하십시오.

### 상호 작용 테스트 작성(Writing interaction tests)

상호작용하는 좌표계는 여백을 포함하고 그림의 왼쪽 상단 모서리에 상대적이라는 것을 유념하십시오. 신뢰할 수 있는 상호작용 테스트를 생성하기 위해서는 plot의 폭, 높이,여백,x축의 범위 및 y축의 범위를 수정해야 할 수도 있습니다. 예를 들면:

```
Plotly.newPlot(gd, [{
    x: [1, 1, 1, 2, 2, 2, 3, 3, 3],
    y: [1, 2, 3, 1, 2, 3, 1, 2, 3],
    mode: 'markers'
}], {
    width: 400, height: 400,
    margin: {l: 100, r: 100, t: 100, b: 100},
    xaxis: {range: [0, 4]},
    yaxis: {range: [0, 4]}
});
```

이것은 아래와 같은 plot을 생성하며, (175, 175) 와 (225, 225) 사이의 선택 경로를 시뮬레이션한다는 것을 나타냅니다:

[![img](https://user-images.githubusercontent.com/31989842/38890553-0bc6190c-4282-11e8-8efc-077bf05ca565.png)](https://user-images.githubusercontent.com/31989842/38890553-0bc6190c-4282-11e8-8efc-077bf05ca565.png)

## 저장소의 구성

- Distributed files 은 `dist/`에 위치합니다.
- CommonJS 에서 요구될 수 있는 모듈들은 `lib/`에 위치합니다.
- 소스파일은 index를 포함하여 `src/`에 위치합니다.
- 빌드 및 저장소 관리 스크립트는 `tasks/`에 위치합니다.
-  [`npm run-script`](https://docs.npmjs.com/cli/run-script) 명령어를 통해 모든 task를 실행할 수 있습니다.
- 테스트는 `test/`에 위치하고,  `image` 와 `jasmine` 테스트로 구분됩니다.
- Test dashboard 와 image viewer 코드는 `devtools/`에 있습니다.
- 빌드된 파일은 `build/`에 있습니다. (여기에 있는 대부분의 파일은 git-ignored이며, css 와 폰트 빌드 파일은 예외입니다.)

## 코딩 방법

정상적인 경우, `npm run lint`로 확인하십시오.

- 자세한 내용은 [eslintrc](https://github.com/plotly/plotly.js/blob/master/.eslintrc) 와 [list of rules](http://eslint.org/docs/rules/) 를 참조하십시오.
- eslintrc file 에 ignore flag `0`인 규칙은  추가된 새 코드에 권장되는 규칙입니다.