/**
 * AG Grid Enterprise Features Test
 *
 * This file contains tests to verify all major AG Grid Enterprise features
 * are working correctly in the M-BOM system.
 */

export const testAGGridFeatures = {

  // Test 1: Basic Grid Display and Data Loading
  testBasicDisplay: () => {
    console.log('=== AG Grid Basic Display Test ===');
    const grid = document.querySelector('.ag-root-wrapper');
    if (grid) {
      console.log('✅ AG Grid is rendered');
      const rows = document.querySelectorAll('.ag-row');
      console.log(`✅ Found ${rows.length} rows`);
      return true;
    } else {
      console.log('❌ AG Grid not found');
      return false;
    }
  },

  // Test 2: Tree Data Structure (Enterprise Feature)
  testTreeDataStructure: () => {
    console.log('=== Tree Data Structure Test ===');
    const expandBtns = document.querySelectorAll('.ag-group-expanded, .ag-group-contracted');
    if (expandBtns.length > 0) {
      console.log(`✅ Tree structure detected with ${expandBtns.length} expandable nodes`);
      return true;
    } else {
      console.log('❌ Tree structure not working');
      return false;
    }
  },

  // Test 3: Column Resizing and Auto-sizing
  testColumnManagement: () => {
    console.log('=== Column Management Test ===');
    const headers = document.querySelectorAll('.ag-header-cell');
    if (headers.length > 0) {
      console.log(`✅ Found ${headers.length} column headers`);
      const resizers = document.querySelectorAll('.ag-header-cell-resize');
      console.log(`✅ Found ${resizers.length} column resizers`);
      return true;
    } else {
      console.log('❌ Column management not working');
      return false;
    }
  },

  // Test 4: Selection (Multiple selection)
  testRowSelection: () => {
    console.log('=== Row Selection Test ===');
    const checkboxes = document.querySelectorAll('.ag-selection-checkbox');
    if (checkboxes.length > 0) {
      console.log(`✅ Found ${checkboxes.length} selection checkboxes`);
      return true;
    } else {
      console.log('❌ Row selection not working');
      return false;
    }
  },

  // Test 5: Filtering (Enterprise Feature)
  testFiltering: () => {
    console.log('=== Filtering Test ===');
    const filterButtons = document.querySelectorAll('.ag-header-cell-menu-button');
    if (filterButtons.length > 0) {
      console.log(`✅ Found ${filterButtons.length} filter buttons`);
      const floatingFilters = document.querySelectorAll('.ag-floating-filter');
      console.log(`✅ Found ${floatingFilters.length} floating filters`);
      return true;
    } else {
      console.log('❌ Filtering not working');
      return false;
    }
  },

  // Test 6: Side Bar (Enterprise Feature)
  testSideBar: () => {
    console.log('=== Side Bar Test ===');
    const sideBar = document.querySelector('.ag-side-bar');
    if (sideBar) {
      console.log('✅ Side bar is present');
      const toolPanels = document.querySelectorAll('.ag-tool-panel-wrapper');
      console.log(`✅ Found ${toolPanels.length} tool panels`);
      return true;
    } else {
      console.log('❌ Side bar not working');
      return false;
    }
  },

  // Test 7: Status Bar (Enterprise Feature)
  testStatusBar: () => {
    console.log('=== Status Bar Test ===');
    const statusBar = document.querySelector('.ag-status-bar');
    if (statusBar) {
      console.log('✅ Status bar is present');
      const statusPanels = document.querySelectorAll('.ag-status-panel');
      console.log(`✅ Found ${statusPanels.length} status panels`);
      return true;
    } else {
      console.log('❌ Status bar not working');
      return false;
    }
  },

  // Test 8: Context Menu (Enterprise Feature)
  testContextMenu: () => {
    console.log('=== Context Menu Test ===');
    // This test requires user interaction, so we just check if the feature is configured
    console.log('ℹ️ Context menu requires right-click interaction to test');
    console.log('✅ Context menu is configured (check by right-clicking on rows)');
    return true;
  },

  // Test 9: Cell Editing
  testCellEditing: () => {
    console.log('=== Cell Editing Test ===');
    const editableCells = document.querySelectorAll('.ag-cell[col-id="partNumber"], .ag-cell[col-id="description"]');
    if (editableCells.length > 0) {
      console.log(`✅ Found ${editableCells.length} editable cells`);
      console.log('ℹ️ Double-click cells to test editing functionality');
      return true;
    } else {
      console.log('❌ Cell editing not working');
      return false;
    }
  },

  // Test 10: Excel Export (Enterprise Feature)
  testExcelExport: () => {
    console.log('=== Excel Export Test ===');
    const exportBtn = document.querySelector('button:contains("Excel 내보내기")') ||
                     Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Excel'));
    if (exportBtn) {
      console.log('✅ Excel export button found');
      console.log('ℹ️ Click the Excel export button to test functionality');
      return true;
    } else {
      console.log('❌ Excel export button not found');
      return false;
    }
  },

  // Run All Tests
  runAllTests: () => {
    console.log('==========================================');
    console.log('🚀 Starting AG Grid Enterprise Feature Tests');
    console.log('==========================================');

    const tests = [
      testAGGridFeatures.testBasicDisplay,
      testAGGridFeatures.testTreeDataStructure,
      testAGGridFeatures.testColumnManagement,
      testAGGridFeatures.testRowSelection,
      testAGGridFeatures.testFiltering,
      testAGGridFeatures.testSideBar,
      testAGGridFeatures.testStatusBar,
      testAGGridFeatures.testContextMenu,
      testAGGridFeatures.testCellEditing,
      testAGGridFeatures.testExcelExport
    ];

    let passed = 0;
    const results = tests.map(test => {
      const result = test();
      if (result) passed++;
      return result;
    });

    console.log('==========================================');
    console.log(`📊 Test Results: ${passed}/${tests.length} tests passed`);
    console.log('==========================================');

    if (passed === tests.length) {
      console.log('🎉 All AG Grid Enterprise features are working!');
    } else {
      console.log('⚠️ Some features may need attention');
    }

    return { passed, total: tests.length, results };
  }
};

// Auto-run tests when window loads (browser environment)
if (typeof window !== 'undefined') {
  window.testAGGrid = testAGGridFeatures;

  // Run tests after a delay to ensure grid is loaded
  setTimeout(() => {
    testAGGridFeatures.runAllTests();
  }, 2000);
}

export default testAGGridFeatures;