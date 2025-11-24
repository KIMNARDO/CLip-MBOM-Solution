# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

제조업 BOM(Bill of Materials) 관리 솔루션. Excel과 유사한 기능으로 다단계 BOM 관리를 제공하는 FabsNet의 EPL(Engineering Parts List) Multi-BOM 시스템. React 18 기반.

## 개발 명령어

```bash
# 전체 의존성 설치 (루트에서 실행)
npm run install:all

# 개발 서버 시작 (포트 5173)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 빌드 미리보기
npm run preview

# Tailwind CSS 컴파일 (감시 모드)
npm run tailwind
```

모든 명령어는 루트에서 `--prefix`로 `mbom-system/`에 위임됨.

## 아키텍처

### 기술 스택
- **React 18** + React Router v7 (UI 및 라우팅)
- **Vite** (빌드 도구)
- **Tailwind CSS** (스타일링, class 기반 다크모드)
- **Lucide React** (아이콘)
- **Recharts** (데이터 시각화)
- **XLSX** (Excel 가져오기/내보내기)

### 애플리케이션 구조

```
mbom-system/src/
├── App.jsx              # Provider 중첩 + 라우팅
├── main.jsx             # React 진입점
├── components/          # 27개 React 컴포넌트
│   ├── TreeGrid.jsx     # 메인 계층형 그리드 (핵심)
│   ├── GridRow.jsx      # 개별 행 렌더링
│   ├── layout/          # Header, Sidebar, RightSidebar, Toolbar
│   ├── dashboard/       # CompleteMBOMDashboard (메인 UI)
│   ├── dialogs/         # 모달 다이얼로그
│   ├── level/           # 레벨 관리 컴포넌트
│   └── comparison/      # E-BOM vs M-BOM 비교
├── contexts/            # 6개 Context Provider
├── hooks/               # 커스텀 훅
├── data/                # 샘플 BOM 데이터
└── css/                 # 18개 CSS 파일 (테마 포함)
```

### 상태 관리 (Context API)

`App.jsx`에서 Provider 중첩 순서:
1. **ThemeProvider** - 라이트/다크 테마 (localStorage 저장)
2. **AuthProvider** - 사용자 인증 (개발용 자동 로그인 활성화)
3. **NotificationProvider** - 토스트 알림
4. **BOMDataProvider** - BOM CRUD 작업, 변경 이력
5. **BOMProvider** - 트리 구조 관리
6. **ApprovalProvider** - 문서 승인 워크플로우

### 핵심 컴포넌트

| 컴포넌트 | 용도 |
|---------|------|
| `CompleteMBOMDashboard.jsx` | 메인 애플리케이션 인터페이스 (83KB) |
| `TreeGrid.jsx` | 드래그앤드롭 지원 계층형 트리 그리드 (35KB) |
| `GridRow.jsx` | 인라인 편집 지원 행 렌더링 |
| `useTrackedBOM.js` | 변경 추적 기능의 BOM 트리 작업 커스텀 훅 |

### 데이터 흐름

```
사용자 액션 → Grid 컴포넌트 → useTrackedBOM 훅 → BOMDataContext → localStorage → 리렌더링
```

## BOM 데이터 구조

### 계층 레벨
```
Level 0: Assembly (ASSY) - 최상위, 수량 항상 1
├── Level 1: Sub-assembly (서브어셈블리)
│   └── Level 2: Components (부품)
│       └── Level 3+: Sub-components (하위 부품)
```

### BOM 아이템 객체
```javascript
{
  id: string,              // 고유 식별자
  parentId: string | null, // 루트 아이템은 null
  children: string[],      // 자식 아이템 ID 배열
  level: number,           // 0-3+
  data: {
    partNumber: string,    // 품번
    partName: string,      // 품명
    quantity: number,      // 수량
    unit: string,          // 단위 ('EA', 'SET')
    status: 'approved' | 'review' | 'draft' | 'rejected',
    diff_status: string,   // E-BOM vs M-BOM 비교 상태
    // ... 추가 필드: customer, carModel, project, material 등
  }
}
```

### 상태 색상 코드
- 파란색: 검색 결과 강조
- 노란색: 수정된 항목
- 빨간색: 삭제된 항목
- 초록색: 현재 EONO와 일치
- 분홍색: 필수값 누락
- 주황색: PDM에 이미 등록됨

## 핵심 커스텀 훅: useTrackedBOM

`src/hooks/useTrackedBOM.js`에 위치한 BOM 조작 핵심 훅:

```javascript
// 주요 작업
expandToLevel(level)     // 특정 레벨까지 트리 확장
collapseFromLevel(level) // 특정 레벨부터 접기
moveAfterTracked(id)     // 변경 추적과 함께 아이템 이동
copyItem(id) / pasteItem(parentId)  // 복사/붙여넣기
duplicateItem(id)        // 아이템 복제
deleteItemTracked(id)    // 추적과 함께 삭제
```

## 새 기능 추가 가이드

### 새 컬럼 추가
1. `TreeGrid.jsx`에서 컬럼 정의 업데이트
2. `BOMDataContext.jsx`에서 BOM 아이템 데이터 구조에 필드 추가
3. 필요시 `sampleBOMData.js`에 기본값 추가

### 새 다이얼로그 추가
1. `src/components/dialogs/`에 컴포넌트 생성
2. 부모 컴포넌트에서 import 후 조건부 렌더링
3. 기존 다이얼로그 패턴 참고 (`ConfirmDialog.jsx`)

### Excel 가져오기/내보내기
`ExcelSync.jsx`에서 `xlsx` 라이브러리 사용:
- 내보내기: BOM 트리를 평면 계층 형식으로 변환
- 가져오기: Level 컬럼 파싱하여 트리 재구성

## 중요 사항

- **백엔드 없음**: 모든 데이터는 localStorage에만 저장됨
- **자동 로그인**: 개발 모드에서 자동 로그인 활성화 (`AuthContext.jsx` 참고)
- **테마**: Tailwind class 기반 다크모드 사용
- **라우팅**: `/login` (공개), `/dashboard` (보호됨, 기본)

## Git 설정

```bash
# GitHub CLI 사용 가능 - gh 명령어로 GitHub 작업 처리
gh auth status

# 저장소
https://github.com/KIMNARDO/CLip-MBOM-Solution

# 대용량 푸시 시 버퍼 크기 증가
git config http.postBuffer 524288000
```

원격 저장소에 푸시할 때, 먼저 HTTP 버퍼 크기를 늘리고 작은 단위로 나누어 푸시할 것. 에러 시 작은 변경사항만 포함하는 새 커밋을 만들어 푸시.
