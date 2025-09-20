import { chromium } from 'playwright';

async function testMBOMApplication() {
    console.log('🚀 Playwright로 M-BOM 애플리케이션 테스트 시작...');

    const browser = await chromium.launch({
        headless: false,  // 브라우저 창을 보이게 함
        args: ['--disable-web-security']
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    // 콘솔 메시지 수집
    const consoleMessages = [];
    page.on('console', msg => {
        consoleMessages.push({
            type: msg.type(),
            text: msg.text(),
            timestamp: new Date().toISOString()
        });
        console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
    });

    // 에러 수집
    const errors = [];
    page.on('pageerror', error => {
        errors.push(error.message);
        console.log(`[BROWSER ERROR] ${error.message}`);
    });

    try {
        console.log('📍 http://localhost:5174 로 이동 중...');
        await page.goto('http://localhost:5174', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // 페이지 로드 대기
        await page.waitForTimeout(3000);

        // 페이지 정보 출력
        const title = await page.title();
        const url = page.url();
        console.log(`📄 페이지 제목: ${title}`);
        console.log(`🔗 현재 URL: ${url}`);

        // 스크린샷 저장
        await page.screenshot({ path: 'mbom_initial.png', fullPage: true });
        console.log('📸 초기 화면 스크린샷 저장: mbom_initial.png');

        // AG Grid 요소 확인
        console.log('\n🔍 AG Grid 요소 확인 중...');

        const agGrid = await page.$('.ag-root-wrapper');
        if (agGrid) {
            console.log('✅ AG Grid 컴포넌트 발견됨');

            const rows = await page.$$('.ag-row');
            console.log(`📊 그리드 행 개수: ${rows.length}`);

            const headers = await page.$$('.ag-header-cell');
            console.log(`📋 컬럼 헤더 개수: ${headers.length}`);

            // AG Grid 스크린샷
            await agGrid.screenshot({ path: 'ag_grid_detail.png' });
            console.log('📸 AG Grid 상세 스크린샷 저장: ag_grid_detail.png');

            // 헤더 텍스트 확인
            for (let i = 0; i < Math.min(headers.length, 5); i++) {
                const headerText = await headers[i].textContent();
                console.log(`  컬럼 ${i+1}: ${headerText}`);
            }

        } else {
            console.log('❌ AG Grid 컴포넌트를 찾을 수 없음');
        }

        // 테스트 그리드 확인
        const testGrid = await page.$('.test-grid-container');
        if (testGrid) {
            console.log('✅ 테스트 그리드 발견됨');
            await testGrid.screenshot({ path: 'test_grid.png' });
            console.log('📸 테스트 그리드 스크린샷 저장: test_grid.png');
        }

        // Grid 테스트 버튼 클릭 시도
        console.log('\n🧪 Grid 테스트 버튼 찾는 중...');
        const testButton = await page.$('text=Grid 테스트');
        if (testButton) {
            console.log('🧪 Grid 테스트 버튼 클릭 중...');
            await testButton.click();
            await page.waitForTimeout(3000);
            await page.screenshot({ path: 'after_test_click.png' });
            console.log('📸 테스트 실행 후 스크린샷 저장: after_test_click.png');
        } else {
            console.log('⚠️ Grid 테스트 버튼을 찾을 수 없음');
        }

        // 에러 요소 확인
        const errorElements = await page.$$('.error, .alert-error, .text-red-500');
        if (errorElements.length > 0) {
            console.log(`⚠️ 화면에서 ${errorElements.length}개의 오류 요소 발견됨`);
        }

        // DOM 구조 확인
        console.log('\n🏗️ 주요 DOM 요소 확인:');
        const mainElements = await page.$$('main, .app, .dashboard, .grid');
        console.log(`  메인 요소 개수: ${mainElements.length}`);

        // 최종 스크린샷
        await page.screenshot({ path: 'mbom_final.png', fullPage: true });
        console.log('📸 최종 전체 페이지 스크린샷 저장: mbom_final.png');

    } catch (error) {
        console.log(`❌ 오류 발생: ${error.message}`);
        await page.screenshot({ path: 'error_screenshot.png' });
        console.log('📸 오류 시점 스크린샷 저장: error_screenshot.png');
    } finally {
        // 콘솔 메시지 요약
        console.log(`\n📝 콘솔 메시지 요약 (총 ${consoleMessages.length}개):`);
        const messageTypes = {};
        consoleMessages.forEach(msg => {
            messageTypes[msg.type] = (messageTypes[msg.type] || 0) + 1;
        });

        Object.entries(messageTypes).forEach(([type, count]) => {
            console.log(`  ${type}: ${count}개`);
        });

        // 에러 요약
        if (errors.length > 0) {
            console.log(`\n❌ JavaScript 오류 (${errors.length}개):`);
            errors.forEach((error, i) => {
                console.log(`  ${i+1}. ${error}`);
            });
        } else {
            console.log('\n✅ JavaScript 오류 없음');
        }

        console.log('\n⏰ 브라우저를 5초간 열어둡니다...');
        await page.waitForTimeout(5000);

        await browser.close();
        console.log('✅ 테스트 완료');
    }
}

testMBOMApplication().catch(console.error);