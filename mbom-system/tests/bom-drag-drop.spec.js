import { test, expect } from '@playwright/test';

test.describe('BOM Grid and Sidebar Synchronization', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the React app
    await page.goto('http://localhost:5173/index-react.html');

    // Login if needed
    const loginVisible = await page.locator('input[name="userId"]').isVisible();
    if (loginVisible) {
      await page.fill('input[name="userId"]', 'test');
      await page.fill('input[name="password"]', 'test');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    }

    // Wait for the grid to load
    await page.waitForSelector('.ag-theme-alpine', { timeout: 10000 });
  });

  test('should display initial BOM data in both grid and sidebar', async ({ page }) => {
    // Check that grid has data
    const gridRows = await page.locator('.ag-row').count();
    console.log(`Grid has ${gridRows} rows`);
    expect(gridRows).toBeGreaterThan(0);

    // Check that sidebar has data
    const sidebarItems = await page.locator('.sidebar-tree-item').count();
    console.log(`Sidebar has ${sidebarItems} items`);

    // Take screenshot for initial state
    await page.screenshot({ path: 'test-initial-state.png', fullPage: true });
  });

  test('should synchronize row drag between grid and sidebar', async ({ page }) => {
    // Get initial counts
    const initialGridRows = await page.locator('.ag-row').count();
    console.log(`Initial grid rows: ${initialGridRows}`);

    // Find a draggable row (not the first one as it might be root)
    const draggableRow = page.locator('.ag-row').nth(1);
    const dropTarget = page.locator('.ag-row').nth(0);

    // Take screenshot before drag
    await page.screenshot({ path: 'test-before-drag.png', fullPage: true });

    // Perform drag and drop
    await draggableRow.dragTo(dropTarget);

    // Wait for any animations to complete
    await page.waitForTimeout(1000);

    // Take screenshot after drag
    await page.screenshot({ path: 'test-after-drag.png', fullPage: true });

    // Check grid rows after drag
    const afterDragGridRows = await page.locator('.ag-row').count();
    console.log(`After drag grid rows: ${afterDragGridRows}`);

    // Check for duplication
    if (afterDragGridRows > initialGridRows) {
      console.error(`DUPLICATION DETECTED! Rows increased from ${initialGridRows} to ${afterDragGridRows}`);

      // Get all row texts to identify duplicates
      const rowTexts = await page.locator('.ag-row').allTextContents();
      const duplicates = rowTexts.filter((item, index) => rowTexts.indexOf(item) !== index);
      console.log('Duplicate rows:', duplicates);
    }

    // Verify sidebar is in sync
    await page.waitForTimeout(500);
    const sidebarAfterDrag = await page.locator('.sidebar-tree-item').count();
    console.log(`Sidebar items after drag: ${sidebarAfterDrag}`);
  });

  test('should not create duplicates on multiple drags', async ({ page }) => {
    const iterations = 3;
    const rowCounts = [];

    for (let i = 0; i < iterations; i++) {
      // Count rows before operation
      const currentRows = await page.locator('.ag-row').count();
      rowCounts.push(currentRows);
      console.log(`Iteration ${i + 1}: ${currentRows} rows`);

      // Perform drag operation
      const sourceRow = page.locator('.ag-row').nth(1);
      const targetRow = page.locator('.ag-row').nth(2);

      await sourceRow.dragTo(targetRow);
      await page.waitForTimeout(1000);

      // Take screenshot for each iteration
      await page.screenshot({ path: `test-iteration-${i + 1}.png`, fullPage: true });
    }

    // Check if row count increased (indicates duplication)
    const uniqueCounts = [...new Set(rowCounts)];
    if (uniqueCounts.length > 1) {
      console.error('Row count changed during iterations, indicating duplication!');
      console.error('Row counts:', rowCounts);
    }

    // Final verification
    const finalRows = await page.locator('.ag-row').count();
    expect(finalRows).toBe(rowCounts[0]); // Should match initial count
  });

  test('should maintain data integrity in sidebar tree', async ({ page }) => {
    // Expand sidebar items
    const expandButtons = page.locator('.chevron-right');
    const expandCount = await expandButtons.count();

    for (let i = 0; i < expandCount; i++) {
      await expandButtons.nth(i).click();
      await page.waitForTimeout(200);
    }

    // Get sidebar structure before drag
    const sidebarBefore = await page.locator('.sidebar-tree-item').allTextContents();
    console.log('Sidebar before:', sidebarBefore);

    // Perform drag in grid
    const sourceRow = page.locator('.ag-row').nth(2);
    const targetRow = page.locator('.ag-row').nth(0);
    await sourceRow.dragTo(targetRow);

    await page.waitForTimeout(1000);

    // Get sidebar structure after drag
    const sidebarAfter = await page.locator('.sidebar-tree-item').allTextContents();
    console.log('Sidebar after:', sidebarAfter);

    // Check for unexpected duplicates
    const beforeSet = new Set(sidebarBefore);
    const afterSet = new Set(sidebarAfter);

    if (afterSet.size !== beforeSet.size) {
      console.error('Sidebar item count changed!');
      console.error(`Before: ${beforeSet.size}, After: ${afterSet.size}`);
    }
  });
});

// Helper function to run the test
async function runTest() {
  console.log('Starting BOM drag-drop synchronization test...');
  console.log('Make sure the dev server is running on http://localhost:5173');
}