# plotly.js 보안 정책

오픈 소스 plotly.js 라이브러리는 "있는 그대로" 제공되며, 보안이 보장되지 않습니다. 자세한 내용은 [license](https://raw.githubusercontent.com/plotly/plotly.js/master/LICENSE) 를 참조하십시오.

plotly.js의 1.x 릴리스에서는 신뢰할 수 없는 데이터가 plotly.js에 의해 그래프로 표시되어 발생하는 xss공격(및 유사한 문제)으로부터 보호하려고합니다. 그러나 xss 또는 다른 문제가 여전히 존재할 수 있습니다.

plotly.js의 일반적인 사용사례는 신뢰할 수 있는 소스의 데이터를 시각화하는 것입니다. 예를 들어, plotly.js를 사용하여 사이트에 대시 보드를 추가하고 plotly.js로 전송되는 모든 입력 데이터를 제어하는 경우 xss 보호를 위해 plotly.js에 의존하지 않습니다.

보다 높은 수준의 보안이 필요한 경우 [Plotly On-Premise](https://plot.ly/product/enterprise/) 제품을 구매하거나,  [contact the Plotly sales team](mailto:sales@plot.ly) 에 문의하십시오.

## 취약점 보고

보안 취약점을 보고하려면 [security@plot.ly](mailto:security@plot.ly) 로 문제를 재현하는 단계를 이메일로 보내십시오. 최초 응답에 최대 24시간이 소요됩니다.

## 보상

경우에 따라 보안 취약성 보고서에 대해 금전적 보상(bounties)을 제공합니다. 자세한 내용은 [Plotly Security Vulnerability Bounty Program](http://help.plot.ly/security/) 페이지를 참조하십시오.

## Release Process

plotly.js 보안 수정은 일반적으로 plotly.js 버전 위에 "패치" 릴리스로 릴리스됩니다. 예를 들어 현재 plotly.js 버전이 1.1.4.0이고 보안 문제를 해결하는 경우 수정 사항과 함께 1.14.1을 릴리스합니다. 또는 수정이 일반적인 릴리스주기와 일치하는 경우 보안 수정이 major 또는 minor plotly.js릴리스의  일부로 이루어 질 수 있습니다 . 예를 들어 현재 plotly.js 버전이 1.14.0인 경우 1.14.1 대신 수정 버전 1.15.0을 릴리스 할 수 있습니다.

Plotly On-Premise를 지불한 고객 또는 Plotly Cloud 고객에게 보안 수정 사항이 필요에 따라 plotly.js의 이전 버전으로 backport 됩니다.  이 수정 사항은 "패치" 릴리스로 릴리스되며 영향을 받는 고객이 업그레이드 되면 커뮤니티에서 사용 할 수 있습니다. 또한 커뮤니티 회원이 제공한 이전 버전의 backport도 허용합니다.

일반적인 plotly.js 사용경우에는 신뢰할 수 있는 데이터가 포함되므로 GitHub 저장소 또는 CDN에서 잠재적으로 취약한 이전 버전을 제거하지 않습니다.

## 권고사항

2016년 8월 1일 이후에 릴리스 된 모든 plotly.js 보안 권고는 [Plotly Security Advisories](http://help.plot.ly/security-advisories/) 페이지에서 제공 됩니다.