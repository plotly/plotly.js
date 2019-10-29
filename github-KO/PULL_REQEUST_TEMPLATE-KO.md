plotly.js에 관심을 가져주셔서 감사합니다!

### 번역:

- main repository에 직접 PR을 요청하세요.
- 번역에 도움을 준 다른 사용자들을 @를 사용하여 태그하세요.
- 만약  [dist/translation_keys.txt](https://github.com/plotly/plotly.js/blob/master/dist/translation-keys.txt) - 그것들이 다시 영어 텍스트로 대체됨을 의미하는 - 에서 어떤 키를 생략한다면, PR 설명에서 이유에 관해 간단한 설명을 적으세요 :  영문 텍스트는 귀하의 언어로 잘 작동하거나 다른 사람이 번역을 하는데 도움을 주거나 하는 어떤 이유든 적어주세요.
-  `lib/locales/` 에만 파일을 업데이트 해야하고,  `dist/` 에는 업데이트 하지 마세요.

### 특징, 버그 수정, 기타:

개발자는 fork를 한 자신의 plotly.js 에 먼저 PR을 하기를 강력히 권장하고, 관리자 중 한 명에게 수정 사항을 검토하도록 요청하세요. pull request가 만족스럽다고 간주되면, 관리자는 main plotly.js 레포지토리에 pull request 하도록 요구할 것이고, 어쩌면 그 전에 commit을 하도록 요구받을 수 있습니다.

pull request하기 전 개발자 의무사항:

- `git rebase`  `master `의 최신 버전에 branch를 만드세요 ,
- `dist/` 폴더에 `git add`를 하지 마세요 (the `dist/` is updated only on version bumps),
- `package-lock.json` file에 commit이 변경되도록 하세요 (if any),
- PR에 대한 간단한 개요을 적으세요,
- *관리자로부터 허용된 수정사항*  옵션을 선택하세요 (자세한 사항은 링크를 확인하세요 [article](https://help.github.com/articles/allowing-changes-to-a-pull-request-branch-created-from-a-fork/) ).

pull request가 가능한 원격 branch에 강제 push 옵션은 금지되어 있습니다 (i.e. `git push -f`) . 강제적인 push는 관리자들이 업데이트를 추적하기 어렵습니다. 그러므로, 필요하다면 PR 브랜치에 `git rebase master` 대신에 `git merge master`  를 해주세요.

