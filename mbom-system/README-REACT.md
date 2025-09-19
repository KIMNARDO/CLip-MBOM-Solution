# M-BOM System - React Version

## 개요

기존 Vanilla JavaScript 기반의 M-BOM 시스템을 React로 마이그레이션한 버전입니다.

## 주요 변경사항

### 1. 프로젝트 구조

```
src/
├── App.jsx                    # 메인 앱 컴포넌트
├── main.jsx                   # React 진입점
├── index-react.html           # React 앱 HTML
├── components/
│   ├── auth/
│   │   └── Login.jsx          # 로그인 컴포넌트
│   ├── dashboard/
│   │   └── MBOMDashboard.jsx  # 메인 대시보드
│   ├── grid/
│   │   └── BOMGrid.jsx        # ag-Grid React 컴포넌트
│   ├── layout/
│   │   ├── Header.jsx         # 헤더
│   │   └── Sidebar.jsx        # 사이드바
│   └── filters/
│       └── FilterPanel.jsx    # 필터 패널
├── contexts/
│   ├── AuthContext.jsx        # 인증 관리
│   ├── BOMDataContext.jsx     # BOM 데이터 관리
│   └── NotificationContext.jsx # 알림 시스템
└── hooks/                      # 커스텀 훅 (추후 추가)
```

### 2. 기술 스택

- **React 18**: UI 라이브러리
- **React Router v7**: 라우팅
- **ag-Grid React**: 데이터 그리드
- **Vite**: 빌드 도구
- **Tailwind CSS**: 스타일링
- **Lucide React**: 아이콘

### 3. 주요 기능 마이그레이션

#### Context API를 활용한 상태 관리
- `AuthContext`: 사용자 인증 상태 관리
- `BOMDataContext`: BOM 데이터 전역 관리
- `NotificationContext`: 알림 시스템 중앙화

#### React Hooks 활용
- `useState`: 로컬 상태 관리
- `useEffect`: 생명주기 관리
- `useContext`: Context 접근
- `useCallback`, `useMemo`: 성능 최적화

## 사용 방법

### 개발 서버 실행

```bash
# 의존성 설치 (이미 설치됨)
npm install

# 개발 서버 시작
npm run dev

# 브라우저에서 열기
http://localhost:5173/index-react.html
```

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 주요 컴포넌트 설명

### 1. App.jsx
- React Router 설정
- Context Provider 구성
- Protected Route 구현

### 2. Login.jsx
- 로그인 폼 UI
- 인증 처리
- 아이디 저장 기능

### 3. MBOMDashboard.jsx
- 메인 대시보드 레이아웃
- BOM 데이터 관리
- 툴바 및 필터 통합

### 4. BOMGrid.jsx
- ag-Grid React 통합
- Tree Data 구조
- 인라인 편집 기능
- 컨텍스트 메뉴

### 5. Context API
- **AuthContext**: 로그인/로그아웃, 사용자 정보
- **BOMDataContext**: CRUD 작업, 데이터 필터링
- **NotificationContext**: 토스트 알림

## 기존 코드와의 차이점

### Before (Vanilla JS)
```javascript
// Class 기반
class MBOMCore {
  constructor() {
    this.data = [];
    this.init();
  }

  loadData() {
    // DOM 조작
    document.getElementById('grid').innerHTML = ...
  }
}
```

### After (React)
```javascript
// Function Component + Hooks
const MBOMDashboard = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  return <BOMGrid data={data} />;
};
```

## 향후 개선사항

1. **TypeScript 도입**: 타입 안정성 향상
2. **State Management**: Redux 또는 Zustand 도입 검토
3. **API 통합**: 실제 백엔드 API 연동
4. **테스트**: Jest + React Testing Library
5. **성능 최적화**: React.memo, useMemo 확대 적용
6. **코드 분할**: React.lazy() 활용

## 트러블슈팅

### ESM 모듈 에러
`package.json`에 `"type": "module"` 추가로 해결

### PostCSS 설정 에러
`postcss.config.js`를 ESM 형식으로 변경

### ag-Grid 라이선스
Enterprise 기능은 라이선스가 필요함 (현재 평가판)

## 참고사항

- 기존 Vanilla JS 코드는 그대로 유지되어 있음
- React 버전은 `/index-react.html`로 접근
- 기존 버전은 `/pages/login.html`로 접근 가능