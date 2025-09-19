const { chromium } = require('playwright');

async function diagnoseGrid() {
    console.log('🔍 그리드 정렬 진단 시작...\n');

    const browser = await chromium.launch({
        headless: false,
        devtools: false
    });

    const page = await browser.newPage();

    try {
        // 페이지 로드
        console.log('📄 페이지 로딩...');
        await page.goto('http://localhost:5174/pages/');

        // 페이지가 완전히 로드될 때까지 대기
        await page.waitForTimeout(3000);

        // 테이블 존재 확인
        const tableExists = await page.$('#bomTable');
        if (!tableExists) {
            console.log('❌ 테이블을 찾을 수 없습니다. 페이지를 확인하세요.');

            // 페이지 내용 확인
            const bodyText = await page.textContent('body');
            console.log('페이지 내용 일부:', bodyText.substring(0, 200));

            return;
        }

        console.log('✅ 테이블 발견\n');

        // 진단 스크립트 실행
        const diagnostics = await page.evaluate(() => {
            const result = {
                tableFound: false,
                headerInfo: null,
                rowCount: 0,
                levelIssues: [],
                columnMismatch: false
            };

            const table = document.getElementById('bomTable');
            if (!table) {
                return result;
            }

            result.tableFound = true;

            // 헤더 정보
            const thead = table.querySelector('thead');
            if (thead) {
                const headerRows = thead.querySelectorAll('tr');
                result.headerInfo = {
                    rowCount: headerRows.length,
                    lastRowCells: headerRows[headerRows.length - 1]?.querySelectorAll('th').length || 0
                };
            }

            // 바디 정보
            const tbody = table.querySelector('tbody');
            if (tbody) {
                const rows = tbody.querySelectorAll('tr');
                result.rowCount = rows.length;

                // 각 행 검사
                rows.forEach((row, index) => {
                    const cells = row.querySelectorAll('td');
                    const levelCells = row.querySelectorAll('.level-cell');
                    const dataLevel = row.dataset.level;

                    // 레벨 위치 확인
                    let actualLevelPosition = -1;
                    levelCells.forEach((cell, cellIndex) => {
                        if (cell.textContent.trim() !== '') {
                            actualLevelPosition = cellIndex;
                        }
                    });

                    // 문제가 있는 경우만 기록
                    if (dataLevel && actualLevelPosition !== -1 && actualLevelPosition != dataLevel) {
                        result.levelIssues.push({
                            row: index + 1,
                            expectedLevel: dataLevel,
                            actualPosition: actualLevelPosition
                        });
                    }

                    // 첫 번째 행의 셀 수와 헤더 셀 수 비교
                    if (index === 0 && result.headerInfo) {
                        if (cells.length !== result.headerInfo.lastRowCells) {
                            result.columnMismatch = true;
                            result.columnDetails = {
                                headerCells: result.headerInfo.lastRowCells,
                                bodyCells: cells.length
                            };
                        }
                    }
                });
            }

            return result;
        });

        // 진단 결과 출력
        console.log('📊 진단 결과:');
        console.log('  테이블 발견:', diagnostics.tableFound ? '✅' : '❌');

        if (diagnostics.headerInfo) {
            console.log('  헤더 행 수:', diagnostics.headerInfo.rowCount);
            console.log('  헤더 셀 수:', diagnostics.headerInfo.lastRowCells);
        }

        console.log('  데이터 행 수:', diagnostics.rowCount);

        if (diagnostics.columnMismatch) {
            console.log('\n⚠️ 컬럼 수 불일치:');
            console.log('  헤더:', diagnostics.columnDetails.headerCells);
            console.log('  바디:', diagnostics.columnDetails.bodyCells);
        }

        if (diagnostics.levelIssues.length > 0) {
            console.log('\n⚠️ 레벨 위치 문제:');
            diagnostics.levelIssues.forEach(issue => {
                console.log(`  행 ${issue.row}: 예상 레벨 ${issue.expectedLevel}, 실제 위치 ${issue.actualPosition}`);
            });
        } else {
            console.log('\n✅ 레벨 위치 정상');
        }

        // 수정 스크립트 주입
        console.log('\n🔧 정렬 문제 수정 중...');

        await page.evaluate(() => {
            // mbom-ui.js의 generateLevelColumns 함수를 직접 수정
            if (window.mbomUI && window.mbomUI.generateLevelColumns) {
                // 원래 함수 백업
                window.mbomUI._originalGenerateLevelColumns = window.mbomUI.generateLevelColumns;

                // 수정된 함수로 교체
                window.mbomUI.generateLevelColumns = function(level) {
                    const maxLevels = this.getMaxLevelColumns();
                    const columns = [];

                    for (let i = 0; i < maxLevels; i++) {
                        if (i === level) {
                            // 정확한 위치에 레벨 표시
                            const levelColor = this.getLevelColor(level);
                            const textColor = this.getLevelTextColor(level);
                            columns.push(`<td class="level-cell level-${level} level-active" style="background-color: ${levelColor}; color: ${textColor}; text-align: center; font-weight: bold; border: 1px solid #3e3e42; width: 45px;">${level}</td>`);
                        } else {
                            // 빈 셀
                            const emptyColor = this.getLevelEmptyColor(i);
                            columns.push(`<td class="level-cell level-empty level-position-${i}" style="background-color: ${emptyColor}; border: 1px solid #2a2a2e; width: 45px;"></td>`);
                        }
                    }

                    return columns;
                };

                // 테이블 다시 렌더링
                window.mbomUI.renderTable();
                console.log('✅ generateLevelColumns 함수 수정 및 테이블 재렌더링 완료');
            }
        });

        // 수정 후 재검사
        await page.waitForTimeout(2000);

        const afterFix = await page.evaluate(() => {
            const tbody = document.querySelector('#bomTable tbody');
            if (!tbody) return { fixed: false };

            const rows = tbody.querySelectorAll('tr');
            let issueCount = 0;

            rows.forEach((row) => {
                const dataLevel = parseInt(row.dataset.level);
                const levelCells = row.querySelectorAll('.level-cell');

                let actualPosition = -1;
                levelCells.forEach((cell, index) => {
                    if (cell.textContent.trim() !== '') {
                        actualPosition = index;
                    }
                });

                if (actualPosition !== -1 && actualPosition !== dataLevel) {
                    issueCount++;
                }
            });

            return {
                fixed: issueCount === 0,
                remainingIssues: issueCount
            };
        });

        console.log('\n📊 수정 후 결과:');
        if (afterFix.fixed) {
            console.log('  ✅ 모든 레벨 정렬 문제 해결됨');
        } else {
            console.log(`  ⚠️ ${afterFix.remainingIssues}개의 문제가 남아있음`);
        }

        // 스크린샷 캡처
        await page.screenshot({
            path: 'grid-diagnosis.png',
            fullPage: false
        });
        console.log('\n📸 스크린샷 저장: grid-diagnosis.png');

        // 10초 대기
        console.log('\n⏸️ 10초 후 브라우저 종료...');
        await page.waitForTimeout(10000);

    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
    } finally {
        await browser.close();
        console.log('\n✅ 진단 완료');
    }
}

// 실행
diagnoseGrid().catch(console.error);