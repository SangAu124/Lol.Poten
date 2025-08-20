# Lol.Poten - 롤 전적 잠재력 분석

리그 오브 레전드 전적을 분석하여 플레이어의 잠재력을 한 줄로 평가하는 웹사이트입니다.

## 🎮 주요 기능

- **즉시 분석**: 소환사명만 입력하면 바로 잠재력 분석 결과 제공
- **종합 평가**: 랭크, 승률, 최근 경기 데이터를 종합한 객관적 분석
- **한 줄 평가**: 복잡한 통계를 간단하고 명확한 한 줄로 요약
- **성장 추이**: 상승세/안정/하락세 트렌드 분석
- **개선점 제시**: 실력 향상을 위한 구체적인 조언 제공

## 🚀 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **API**: Riot Games API
- **SEO**: Next.js App Router, Sitemap, Robots.txt

## 📦 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.example` 파일을 복사하여 `.env.local` 파일을 생성하고 환경 변수를 설정하세요.

```bash
cp .env.example .env.local
```

`.env.local` 파일에서 다음 값들을 설정하세요:
```env
NEXT_PUBLIC_RIOT_API_KEY=your_riot_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Riot API 키 발급
1. [Riot Developer Portal](https://developer.riotgames.com/)에 접속
2. 계정 로그인 후 API 키 발급
3. 발급받은 키를 `.env.local` 파일에 추가

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하여 확인할 수 있습니다.

## 🏗️ 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── analysis/          # 분석 결과 페이지
│   ├── globals.css        # 전역 스타일
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 메인 페이지
│   ├── robots.ts          # SEO 로봇 설정
│   └── sitemap.ts         # SEO 사이트맵
├── components/            # 재사용 가능한 컴포넌트
│   ├── LoadingSpinner.tsx
│   ├── PotentialCard.tsx
│   └── StatsCard.tsx
├── types/                 # TypeScript 타입 정의
│   └── index.ts
└── utils/                 # 유틸리티 함수
    ├── potentialAnalyzer.ts
    └── riotApi.ts
```

## 🎯 사용법

1. 메인 페이지에서 소환사명 입력
2. 검색 버튼 클릭 또는 Enter 키 입력
3. 분석 결과 페이지에서 잠재력 평가 확인
4. 강점과 개선점 참고하여 실력 향상

## 📊 분석 지표

- **랭크 정보**: 현재 티어, LP, 승률
- **최근 성과**: 최근 20경기 분석
- **잠재력 점수**: 0-100점 스케일
- **성장 트렌드**: 상승세/안정/하락세
- **플레이 스타일**: KDA, CS, 시야 점수 등

## 🔧 빌드 및 배포

### 프로덕션 빌드
```bash
npm run build
```

### 정적 파일 서빙
```bash
npm start
```

### 타입 체크
```bash
npm run type-check
```

### 린팅
```bash
npm run lint
```

## 🌟 특징

- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 기기 지원
- **SEO 최적화**: 검색 엔진 최적화를 위한 메타데이터 설정
- **League of Legends 테마**: 게임의 분위기를 살린 디자인
- **빠른 로딩**: Next.js의 최적화 기능 활용
- **타입 안전성**: TypeScript로 개발하여 런타임 오류 최소화

## 📝 라이선스

이 프로젝트는 개인 프로젝트로 제작되었습니다.

## 🤝 기여

버그 리포트나 기능 제안은 이슈로 등록해 주세요.

---

**Lol.Poten**은 리그 오브 레전드 플레이어들의 성장을 돕기 위해 만들어진 분석 도구입니다.
