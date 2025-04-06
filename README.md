# 🧾 back README

## 👥 팀원 소개  
| 이름 | 역할 | 담당 영역 |
|------|------|-----------|
| 강민경 | 프론트엔드 |  |
| 김성윤 | 프론트엔드 | |
| 김예진 | 백엔드 |  |
| 김지성 | 백엔드 |  |
| 김태진 | 프론트엔드 |  |
| 이정은 | 백엔드 |  |
| 이하은 | 백엔드 |  |

---

## 🎯 프로젝트 목표  
- 사용자 중심 중고거래 플랫폼 개발  
- 로그인/회원 관리부터 상품 등록/조회, 마이페이지 기능까지 구현  
- 실시간 거래 메시지 및 좋아요 기반 추천 UX 구축  

---

## 🛠️ 사용 기술 및 도구  

| 항목 | 사용 도구 |
|------|-----------|
| 코드 에디터 | Visual Studio Code |
| DB 도구 | MySQL Workbench |
| API 테스트 | Postman |
| 컨테이너 환경 | Docker Desktop |
| 디자인 툴 | Figma |
| 협업 도구 | Notion, Slack |

### 📦 백엔드 주요 라이브러리 (`package-lock.json`)
- dotenv  
- express  
- express-validator  
- http-status-codes  
- mysql2  

---

## 📁 Git 컨벤션

### 브랜치 네이밍 규칙  
(수정옵션)/기능설명
ex) feat/login-api

### 커밋 규칙  

**Body**는 Header에서 표현할 수 없는 **상세한 내용**을 적는다.

Header에서 충분히 표현할 수 있다면 **생략 가능**하다.

**Footer**는 바닥글로 어떤 이슈에서 왔는지 같은 **참조 정보들을 추가**하는 용도로 사용한다.

예를 들어 특정 이슈를 참조하려면 Issues #1234 와 같이 작성하면 된다.

Footer는 **생략 가능**하다.

### 메세지 구조
```
// Header, Body, Footer는 빈 행으로 구분한다.
타입(스코프): 주제(제목) // Header(헤더)
본문 // Body(바디)
바닥글 // Footer

//예시
git commit -m "fix: Safari에서 모달을 띄웠을 때 스크롤 이슈 수정
모바일 사파리에서 Carousel 모달을 띄웠을 때,
모달 밖의 상하 스크롤이 움직이는 이슈 수정.
resolves: #1137
```

### 커밋 타입 목록

| 타입  | 설명                              |
|-------|-----------------------------------|
| feat  | 새로운 기능에 대한 커밋           |
| fix   | 버그 수정에 대한 커밋             |
| build | 빌드 관련 파일 수정/모듈 설치, 삭제 |
| chore | 기타 자잘한 수정                  |
| ci    | CI 설정 수정                      |
| docs  | 문서 수정                         |
| style | 코드 스타일/포맷 수정             |
| test  | 테스트 코드 수정                  |
| perf  | 성능 개선에 대한 커밋             |

## 📅 프로젝트 일정

| 기간              | 주요 내용                     |
|-------------------|-------------------------------|
| 2025.03.31        | 피그마 디자인 제작            |
| 2025.04.01 ~ 04.04 | 기능 명세서 작성             |
| 2025.04.03 ~ 04.04 | ERD 설계                     |
| 2025.04.07 ~ 04.11 | 회원 관리 페이지 개발        |
| 2025.04.14 ~ 04.18 | 상품 등록 및 조회 페이지 개발 |
| 2025.04.21 ~ 04.25 | 마이페이지 개발              |

## 🔌 주요 API 목록

### 🧑‍💼 사용자(User) 관련

- **POST** /join → 회원가입
- **POST** /login → 로그인
- **POST** /findid → 아이디 찾기
- **POST** /reset → 비밀번호 수정 요청
- **PUT** /reset → 비밀번호 수정
- **DELETE** /unsubscribe → 회원 탈퇴

### 🙋 마이페이지

- **DELETE** (URL 미정) → 좋아요 취소
- **GET** /users/info/likes → 좋아요 조회
- **PUT** /users/myPage → 유저 정보 수정
- **GET** /users/myPage → 유저 정보 조회

### 🏪 사용자 프로필 조회

- **GET** /store/:userId → 특정 유저의 스토어 정보 조회

### 🛍️ 상품 관련

- **GET** /items → 최근 등록 상품 조회
- **GET** /items?q={검색어}&category={카테고리} → 상품 검색
- **POST** /items → 상품 등록
- **GET** /items/:id → 상품 상세 정보 조회
- **PUT** /items → 상품 수정

### 💬 거래 메시지

- **POST** (URL 미정) → 거래 메시지 전송

### ❤️ 좋아요

- **GET** /likes → 좋아요 추가
- **DELETE** /likes → 좋아요 삭제

### 🗂️ 카테고리

- **GET** /category → 카테고리 목록 조회
