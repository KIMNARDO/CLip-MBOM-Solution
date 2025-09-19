from playwright.sync_api import sync_playwright
import time

def test_mbom_app():
    with sync_playwright() as p:
        # 브라우저 실행
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        print("브라우저 시작...")

        # 페이지 로드
        try:
            page.goto("http://localhost:5173", timeout=10000)
            print(f"✅ 페이지 로드 성공: {page.title()}")

            # 페이지가 완전히 로드될 때까지 대기
            page.wait_for_load_state("networkidle")

            # React 앱이 마운트되었는지 확인
            root_element = page.query_selector("#root")
            if root_element:
                print("✅ React root element 발견")

                # root 내부 콘텐츠 확인
                root_content = page.evaluate("() => document.querySelector('#root').innerHTML")
                if root_content:
                    print(f"✅ React 앱이 렌더링됨 (콘텐츠 길이: {len(root_content)})")
                else:
                    print("⚠️ React root는 있지만 콘텐츠가 비어있음")
            else:
                print("❌ React root element를 찾을 수 없음")

            # ag-Grid가 로드되었는지 확인
            time.sleep(2)  # 그리드 로드 대기
            grid = page.query_selector(".ag-root")
            if grid:
                print("✅ ag-Grid가 로드됨")

                # 그리드 행 개수 확인
                rows = page.query_selector_all(".ag-row")
                print(f"  - 그리드 행 개수: {len(rows)}")

                # 드래그 가능한 요소 확인
                draggable_elements = page.query_selector_all("[row-draggable='true']")
                print(f"  - 드래그 가능한 요소: {len(draggable_elements)}개")
            else:
                print("⚠️ ag-Grid를 찾을 수 없음")

            # 사이드바 확인
            sidebar = page.query_selector(".sidebar")
            if sidebar:
                print("✅ 사이드바가 로드됨")
            else:
                print("⚠️ 사이드바를 찾을 수 없음")

            # 콘솔 에러 확인
            page.on("console", lambda msg: print(f"콘솔 {msg.type}: {msg.text}") if msg.type in ["error", "warning"] else None)

            # 스크린샷 캡처
            page.screenshot(path="mbom_app_status.png")
            print("📸 스크린샷 저장: mbom_app_status.png")

            # 5초 대기 (사용자가 확인할 수 있도록)
            time.sleep(5)

        except Exception as e:
            print(f"❌ 페이지 로드 실패: {str(e)}")

            # 에러 상황에서도 스크린샷 캡처
            page.screenshot(path="mbom_app_error.png")
            print("📸 에러 스크린샷 저장: mbom_app_error.png")

        finally:
            browser.close()
            print("브라우저 종료")

# 테스트 실행
if __name__ == "__main__":
    test_mbom_app()