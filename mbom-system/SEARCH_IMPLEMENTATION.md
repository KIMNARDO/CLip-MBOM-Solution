# BOM 검색 기능 구현 문서

## 개요
M-BOM Management System에 향상된 테이블 검색 기능이 구현되었습니다. 이 문서는 개발자를 위한 구현 세부사항과 사용 가이드를 제공합니다.

## 구현된 기능

### 1. 검색 기본 기능
- **실시간 검색**: 입력과 동시에 검색 수행
- **대소문자 구분 없음**: 모든 검색은 대소문자를 구분하지 않음
- **전체 행 검색**: 테이블의 모든 열에서 텍스트 검색

### 2. 검색 결과 표시

#### 2.1 하이라이트 효과
- **검색 매치 (노란색)**
  - 배경: 그라데이션 (#fff59d → #ffeb3b)
  - 테두리: 2px solid #ffc107
  - 그림자: 8px 반경의 빛나는 효과
  - 애니메이션: 2초 주기 펄스 효과

- **현재 선택 (주황색)**
  - 배경: 그라데이션 (#ffb74d → #ff9800)
  - 테두리: 3px solid #ff6f00
  - 그림자: 15px 반경의 강한 빛나는 효과
  - 크기: 1.02배 확대
  - 표시: 왼쪽에 화살표(▶) 아이콘

- **비매치 행**
  - 투명도: 25%
  - 필터: grayscale(70%) + blur(0.5px)

#### 2.2 검색 결과 드롭다운
- **위치**: 검색창 아래 절대 위치
- **최대 높이**: 300px (스크롤 가능)
- **각 항목 표시**:
  - 결과 번호 (파란색 배지)
  - 매칭된 텍스트 미리보기
  - 검색어 하이라이트

#### 2.3 검색 카운터
- **위치**: 검색창 오른쪽
- **형식**: "현재/전체" (예: 3/10)
- **스타일**: 파란색 그라데이션 배경의 라운드 배지

### 3. 네비게이션

#### 3.1 키보드 단축키
| 단축키 | 동작 |
|--------|------|
| `Ctrl+F` | 검색창 포커스 |
| `Enter` | 다음 결과로 이동 |
| `Shift+Enter` | 이전 결과로 이동 |
| `↑/↓` | 이전/다음 결과 네비게이션 |
| `F3` | 다음 결과로 이동 |
| `Shift+F3` | 이전 결과로 이동 |
| `ESC` | 검색 초기화 및 드롭다운 닫기 |

#### 3.2 마우스 인터랙션
- 드롭다운 항목 클릭으로 직접 이동
- 검색창 외부 클릭 시 드롭다운 자동 닫힘

### 4. 자동 스크롤
- 검색 결과 선택 시 자동으로 화면 중앙에 위치
- 부드러운 스크롤 애니메이션
- 스크롤 가능한 컨테이너 자동 감지

## 파일 구조

### 핵심 파일
```
mbom-system/
├── src/
│   ├── js/
│   │   └── enhanced-table-search.js    # 메인 검색 구현
│   └── pages/
│       ├── index.html                  # 메인 페이지
│       └── index-aggrid.html            # ag-Grid 버전 페이지
```

### 삭제된 파일 (정리됨)
- `bom-search.js` - 초기 구현 (대체됨)
- `sidebar-search-simple.js` - 간단한 버전 (대체됨)
- `simple-table-search.js` - 중간 버전 (대체됨)
- `backup-search/` 폴더 - 이전 버전들 (삭제됨)
- 테스트 HTML 파일들 (삭제됨)

## 코드 구조

### enhanced-table-search.js

```javascript
class EnhancedTableSearch {
    constructor() {
        // 초기화
        this.searchInput = null;          // 검색 입력 요소
        this.searchResults = [];          // 검색 결과 배열
        this.currentIndex = -1;           // 현재 선택 인덱스
        this.searchQuery = '';            // 검색어
        this.resultsDropdown = null;      // 드롭다운 요소
    }

    // 주요 메서드
    init()                    // 초기화 및 설정
    addStyles()               // CSS 스타일 주입
    addSearchCounter()        // 카운터 요소 생성
    createResultsDropdown()   // 드롭다운 생성
    setupEventListeners()     // 이벤트 바인딩

    // 검색 기능
    handleSearch(query)       // 검색 처리
    performSearch()           // 실제 검색 수행
    extractMatchedText(text)  // 매칭 텍스트 추출
    highlightSearchTerm(text) // 검색어 하이라이트

    // 네비게이션
    navigateNext()            // 다음 결과
    navigatePrevious()        // 이전 결과
    highlightCurrent()        // 현재 결과 하이라이트
    scrollToResult(element)   // 결과로 스크롤

    // UI 업데이트
    updateCounter()           // 카운터 업데이트
    updateResultsDropdown()   // 드롭다운 업데이트
    showResultsDropdown()     // 드롭다운 표시
    hideResultsDropdown()     // 드롭다운 숨김

    // 초기화
    clearSearch()             // 검색 초기화
    clearHighlights()         // 하이라이트 제거
}
```

## 사용 방법

### HTML 페이지에 적용

```html
<!DOCTYPE html>
<html>
<head>
    <!-- 기타 헤더 내용 -->
</head>
<body>
    <!-- 검색 입력창 (필수) -->
    <div class="sidebar">
        <input type="text" id="searchInput" placeholder="Search BOM...">
    </div>

    <!-- 검색 대상 테이블 -->
    <table id="bomTable">
        <tbody id="bomTableBody">
            <!-- 테이블 데이터 -->
        </tbody>
    </table>

    <!-- 검색 스크립트 로드 -->
    <script src="../js/enhanced-table-search.js"></script>
</body>
</html>
```

### 필수 요소
1. **검색 입력창**: `id="searchInput"` 필수
2. **테이블**: 다음 중 하나의 선택자 필요
   - `#bomTableBody tr`
   - `#bomTable tbody tr`
   - `.bom-table tbody tr`
   - 또는 일반 `table tbody tr`

## 지원 브라우저
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 성능 최적화

### 구현된 최적화
1. **디바운싱**: 입력 후 즉시 검색 (디바운싱 제거로 즉각적 반응)
2. **CSS 애니메이션**: JavaScript 대신 CSS로 처리
3. **이벤트 위임**: 드롭다운 항목에 개별 리스너 대신 위임 사용
4. **DOM 조작 최소화**: 배치 업데이트 및 Fragment 사용

### 권장 사항
- 대용량 테이블(1000행 이상)의 경우 가상 스크롤링 고려
- 필요 시 Web Worker를 사용한 검색 처리

## 커스터마이징

### CSS 변수 수정
```css
/* 색상 커스터마이징 */
.search-match {
    background: /* 원하는 색상 */;
}

.search-current {
    background: /* 원하는 색상 */;
}

/* 애니메이션 속도 조절 */
@keyframes pulseMatch {
    /* 애니메이션 수정 */
}
```

### 검색 로직 수정
```javascript
// performSearch() 메서드에서 검색 조건 변경
if (text.includes(this.searchQuery)) {
    // 기본: 부분 일치
    // 변경 예: 정확한 단어 일치
    // if (new RegExp(`\\b${this.searchQuery}\\b`).test(text))
}
```

## 문제 해결

### 검색이 작동하지 않는 경우
1. 콘솔에서 에러 확인
2. `searchInput` ID를 가진 요소 존재 확인
3. 테이블 구조 확인 (tbody > tr)

### 스타일이 적용되지 않는 경우
1. CSS 우선순위 충돌 확인
2. `!important` 플래그 확인
3. 브라우저 개발자 도구에서 스타일 검사

## 향후 개선 사항
- [ ] ag-Grid 네이티브 검색 통합
- [ ] 정규식 검색 지원
- [ ] 검색 히스토리 기능
- [ ] 검색 필터 (특정 열만 검색)
- [ ] 검색 결과 내보내기 기능

## 라이선스
이 코드는 M-BOM Management System의 일부로 FabsNet EPL Multi-BOM 시스템에 포함됩니다.

## 연락처
문제 보고 및 개선 제안은 시스템 관리자에게 문의하세요.

---
*마지막 업데이트: 2025-01-16*