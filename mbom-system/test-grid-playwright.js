import { chromium } from 'playwright';

(async () => {
  console.log('🚀 Playwright 테스트 시작...');

  // 브라우저 실행
  const browser = await chromium.launch({
    headless: false,  // 브라우저를 보이게 설정
    slowMo: 500      // 동작을 천천히 보기 위해
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('📍 http://localhost:5173 접속 중...');

  try {
    // 로컬 서버 접속
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // 로그인 페이지 확인
    const loginButton = await page.locator('button:has-text("로그인")').first();
    if (await loginButton.isVisible()) {
      console.log('✅ 로그인 페이지 확인됨');

      // 로그인 수행
      await page.fill('input[type="text"]', 'admin');
      await page.fill('input[type="password"]', 'admin123');
      await loginButton.click();

      console.log('🔐 로그인 시도...');
      await page.waitForTimeout(2000);
    }

    // 대시보드 페이지 대기
    await page.waitForSelector('.vscode-titlebar', { timeout: 10000 });
    console.log('✅ 대시보드 페이지 로드됨');

    // BOM Structure 탭 클릭
    const structureTab = await page.locator('.tab-item:has-text("BOM Structure")').first();
    if (await structureTab.isVisible()) {
      await structureTab.click();
      console.log('📊 BOM Structure 탭 클릭됨');
    }

    // 페이지 콘솔 로그 수집 설정
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Grid') || text.includes('BOM') || text.includes('AGGrid')) {
        console.log(`🖥️ 브라우저 콘솔: ${text}`);
      }
    });

    // 페이지 에러 수집
    page.on('pageerror', error => {
      console.error('❌ 페이지 에러:', error.message);
    });

    // HTML 테이블 그리드 확인
    await page.waitForTimeout(3000); // Grid 초기화 대기

    // HTML 테이블 확인
    const table = await page.locator('table').first();
    const tableVisible = await table.isVisible();

    if (tableVisible) {
      console.log('✅ HTML 테이블이 표시됨!');

      // 테이블 헤더 확인
      const headers = await page.locator('thead th').all();
      console.log(`📋 발견된 헤더 수: ${headers.length}`);

      for (let i = 0; i < Math.min(headers.length, 5); i++) {
        const headerText = await headers[i].textContent();
        console.log(`   - 헤더 ${i+1}: ${headerText}`);
      }

      // 테이블 행 확인
      const rows = await page.locator('tbody tr').all();
      console.log(`📊 발견된 데이터 행 수: ${rows.length}`);

      if (rows.length > 0) {
        console.log('✅ 데이터 그리드에 행이 표시됨!');

        // 첫 번째 행의 데이터 확인
        const firstRowCells = await rows[0].locator('td').all();
        console.log(`   첫 번째 행의 셀 수: ${firstRowCells.length}`);

        for (let i = 0; i < Math.min(firstRowCells.length, 5); i++) {
          const cellText = await firstRowCells[i].textContent();
          console.log(`   - 셀 ${i+1}: ${cellText}`);
        }

        // 레벨 계층 구조 확인
        console.log('\n📊 레벨 계층 구조 확인 (전체 15개 행):');
        for (let i = 0; i < rows.length; i++) {
          const levelCell = await rows[i].locator('td:nth-child(2)').textContent();
          const partNumber = await rows[i].locator('td:nth-child(3)').textContent();
          const indent = '  '.repeat(parseInt(levelCell));
          console.log(`   행 ${(i+1).toString().padStart(2)}: ${indent}Level ${levelCell} - ${partNumber.trim()}`);
        }

        // 드래그 핸들 확인
        const dragHandles = await page.locator('tbody tr[draggable="true"]').all();
        console.log(`🔄 드래그 가능한 행 수: ${dragHandles.length}`);

        if (dragHandles.length > 0) {
          console.log('✅ 드래그 앤 드롭 기능이 활성화됨!');
        }

        // 드래그 앤 드롭 테스트
        if (rows.length >= 2) {
          console.log('🧪 드래그 앤 드롭 테스트 시작...');

          // 첫 번째 행의 드래그 핸들 찾기
          const firstRow = rows[0];
          const secondRow = rows[1];

          // 첫 번째 행의 품번 확인
          const firstPartNumber = await firstRow.locator('td:nth-child(3)').textContent();
          console.log(`   첫 번째 행 품번: ${firstPartNumber}`);

          // 드래그 앤 드롭 수행
          await firstRow.dragTo(secondRow);
          await page.waitForTimeout(1000);

          console.log('   드래그 앤 드롭 완료');
        }
      } else {
        console.log('⚠️ 데이터 행이 없습니다. 데이터 로딩 문제일 수 있습니다.');
      }

      // 스크린샷 캡처
      await page.screenshot({
        path: 'grid-screenshot.png',
        fullPage: true
      });
      console.log('📸 스크린샷 저장됨: grid-screenshot.png');

      // 콘솔 로그 확인
      page.on('console', msg => {
        if (msg.type() === 'log' && (msg.text().includes('Grid') || msg.text().includes('BOM'))) {
          console.log(`🖥️ 브라우저 콘솔: ${msg.text()}`);
        }
      });

      // 잠시 대기하여 콘솔 로그 수집
      await page.waitForTimeout(2000);

    } else {
      console.log('❌ HTML 테이블이 표시되지 않음!');

      // 에러 스크린샷
      await page.screenshot({
        path: 'error-screenshot.png',
        fullPage: true
      });
      console.log('📸 에러 스크린샷 저장됨: error-screenshot.png');
    }

    // 트리뷰 확인
    const treeItems = await page.locator('.tree-item').all();
    console.log(`\n🌳 트리뷰 아이템 수: ${treeItems.length}`);

    if (treeItems.length > 0) {
      const firstTreeItem = await treeItems[0].textContent();
      console.log(`   첫 번째 트리 아이템: ${firstTreeItem}`);
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);

    // 오류 발생 시 스크린샷
    await page.screenshot({
      path: 'error-screenshot.png',
      fullPage: true
    });
    console.log('📸 오류 스크린샷 저장됨: error-screenshot.png');
  }

  console.log('\n⏳ 10초 후 브라우저를 닫습니다...');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('✅ 테스트 완료!');
})();