# 서버 배포 가이드 - BOM Grid UI 개선사항

## 배포 날짜: 2025-09-14

## 1. 수정된 파일 목록 (서버에 업로드 필요)

### 필수 파일 (2개)
```
📁 src/
  📁 js/
    📄 grid-config.js     [수정] - BOM 그리드 설정 파일
  📁 css/
    📄 grid.css          [수정] - 그리드 스타일시트
```

### 선택 파일 (테스트용)
```
📁 src/pages/
  📄 multi-bom-demo.html [신규] - 개선사항 테스트 페이지 (선택사항)
```

## 2. 주요 변경사항

### grid-config.js 변경내용:
- ✅ Level 0 PartNumber 정렬 수정
- ✅ getLevelColumns() 메서드 개선
- ✅ getRowStyle() 메서드 레벨별 색상 추가
- ✅ getRowClass() 메서드 신규 추가
- ✅ autoGroupColumnDef 설정 추가

### grid.css 변경내용:
- ✅ 트리 구조 라인 스타일 (굵은 흰색)
- ✅ 레벨별 배경색 클래스 추가
- ✅ 트리 셀 커스텀 스타일

## 3. 배포 절차

### Step 1: 백업
```bash
# 서버에서 기존 파일 백업
cp src/js/grid-config.js src/js/grid-config.js.backup.20250914
cp src/css/grid.css src/css/grid.css.backup.20250914
```

### Step 2: 파일 업로드
```bash
# 수정된 파일만 서버에 업로드
scp src/js/grid-config.js user@server:/path/to/mbom-system/src/js/
scp src/css/grid.css user@server:/path/to/mbom-system/src/css/
```

### Step 3: 캐시 초기화 (필요시)
```bash
# 브라우저 캐시 무효화를 위한 버전 태그 추가
# 또는 서버 캐시 클리어
```

## 4. 롤백 계획

문제 발생 시:
```bash
# 백업 파일로 복원
cp src/js/grid-config.js.backup.20250914 src/js/grid-config.js
cp src/css/grid.css.backup.20250914 src/css/grid.css
```

## 5. 테스트 체크리스트

배포 후 확인사항:
- [ ] Level 0 PartNumber가 올바른 컬럼에 표시되는지
- [ ] 트리 구조 라인이 굵은 흰색으로 표시되는지
- [ ] 각 레벨별로 다른 배경색이 적용되는지
- [ ] 기존 기능이 정상 작동하는지
- [ ] 성능 이슈가 없는지

## 6. 영향받는 페이지

다음 페이지들이 자동으로 개선사항 적용됨:
- `/pages/multi-bom.html` - 메인 Multi-BOM 페이지
- `/pages/mbom-main.html` - BOM 메인 페이지 (grid-config.js 사용 시)

## 7. 주의사항

⚠️ **중요**:
- `grid-config.js`와 `grid.css` 두 파일을 **반드시 함께** 배포해야 함
- 한 파일만 배포하면 스타일이 깨질 수 있음
- 배포 전 반드시 백업 수행

## 8. 변경사항 요약 (한글)

### 개선된 기능:
1. **Level 0 품번 정렬 문제 해결**: Level 0의 Part Number가 정확한 위치에 표시
2. **트리 구조 시각화 개선**: 굵은 흰색 라인으로 계층 구조 명확히 표시
3. **레벨별 색상 구분**: 각 레벨마다 고유한 배경색으로 가독성 향상
   - Level 0: 연한 파란색
   - Level 1: 연한 보라색
   - Level 2: 연한 초록색
   - Level 3: 연한 주황색
   - Level 4: 연한 분홍색