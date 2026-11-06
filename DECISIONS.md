# 결정 기록

되돌리기 어렵거나 나중에 이유를 다시 찾게 될 결정만 적습니다. 최신 항목이 위에 옵니다.

## 2026-11-06 · 앱 식별자(manifest `id`): `/laundry-time/`

**배경**: `public/manifest.webmanifest`의 `"id": "./"`는 manifest 위치가 아니라 **start_url의 출처**(`https://jeiel85.github.io`)를 기준으로 풀려 `https://jeiel85.github.io/`가 된다. 같은 출처의 다른 Pages 프로젝트 8개도 `"./"`라 Chrome은 이들을 모두 같은 앱으로 봤다. 하나가 설치돼 있으면 다른 프로젝트에서 설치 제안이 나오지 않고, 설치된 앱의 시작 주소가 다른 프로젝트로 덮어써지기도 했다. Chrome DevTools `Page.getAppId`도 `/laundry-time/`을 권한다.

**결정**: `"id": "/laundry-time/"`. 출처 안에서 이 앱만의 경로라 겹치지 않는다. `tests/pwa.test.js`가 이 값을 지킨다.

**바꾸면 생기는 일**: id는 앱의 정체성이라 이후에 바꾸면 이미 설치한 사람의 앱이 새 manifest를 더는 받지 못하고, 브라우저는 같은 앱을 새로 설치하라고 한다. 이번 변경 전에 설치한 앱도 그렇게 되지만, 옛 id는 다른 앱과 겹쳐 있어 어차피 바로잡아야 했다. 타이머 설정·기록(localStorage)은 출처 단위라 영향이 없다.

**서비스 워커는 그대로**: manifest는 `./assets/` 밖이라 네트워크 우선으로 받으므로, 고친 manifest가 서비스 워커 캐시에 막히지 않는다(Pages의 HTTP 캐시 10분만 지나면 닿는다).
