---
name: deploy
description: 4p-pacman 프로젝트를 Render.com에 배포한다. git 상태 확인 → 커밋 → push → 배포 상태 안내 순서로 진행.
user-invocable: true
allowed-tools: Bash, Read
---

4p-pacman 프로젝트를 Render.com에 배포하는 절차를 수행하라.

## 배포 전 체크리스트

1. **코드 상태 확인**
   - `git status` 로 변경된 파일 확인
   - `git diff` 로 내용 검토
   - `package.json` 에 `start` 스크립트가 있는지 확인
   - `render.yaml` 파일이 존재하는지 확인

2. **로컬 실행 확인** (서버가 실행 가능한지)
   - `node --check server/index.js` 로 문법 오류 확인

3. **Git 커밋 및 Push**
   - 스테이징: 관련 파일만 선택적으로 `git add`
   - 커밋 메시지는 변경 내용을 명확히 서술
   - `git push origin main` (또는 현재 브랜치)

## 배포 후 안내

Push 완료 후 사용자에게 안내:
- Render Dashboard에서 배포 로그 확인 방법
- 배포 완료까지 보통 2~3분 소요
- 무료 플랜 슬립 주의사항 (15분 비활성 시 슬립)
- 배포된 URL 확인 위치

## 주의사항

- `node_modules/`, `.env` 파일은 절대 커밋하지 않는다.
- `.gitignore` 에 해당 항목이 있는지 먼저 확인한다.
- force push 는 사용자 명시적 요청 없이 절대 하지 않는다.
