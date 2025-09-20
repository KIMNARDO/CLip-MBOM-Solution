import React, { useState, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * TestGrid - 간단한 테스트 그리드 컴포넌트
 * ag-Grid가 제대로 작동하는지 확인하기 위한 컴포넌트
 */
const TestGrid = () => {
  const { theme } = useTheme();
  const gridRef = useRef();
  const gridTheme = theme === 'dark' ? 'ag-theme-alpine-dark' : 'ag-theme-alpine';
  const [rowData] = useState([
    { id: 1, partNumber: 'TEST-001', description: '테스트 부품 1', quantity: 1, unit: 'EA' },
    { id: 2, partNumber: 'TEST-002', description: '테스트 부품 2', quantity: 2, unit: 'SET' },
    { id: 3, partNumber: 'TEST-003', description: '테스트 부품 3', quantity: 3, unit: 'PCS' }
  ]);

  const [columnDefs] = useState([
    { headerName: 'ID', field: 'id', width: 80 },
    { headerName: '품번', field: 'partNumber', width: 150 },
    { headerName: '품명', field: 'description', width: 200 },
    { headerName: 'U/S', field: 'quantity', width: 100 },
    { headerName: '단위', field: 'unit', width: 80 }
  ]);

  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true
  };

  const onGridReady = useCallback(params => {
    console.log('TestGrid - Grid is ready!');
    console.log('TestGrid - Row count:', params.api.getDisplayedRowCount());
    params.api.sizeColumnsToFit();
  }, []);

  console.log('TestGrid - Rendering with rowData:', rowData);

  return (
    <div className="test-grid-container" style={{ height: '400px', width: '100%' }}>
      <h3 style={{ color: theme === 'dark' ? '#ffffff' : '#000000', marginBottom: '10px' }}>테스트 그리드</h3>
      <div className={gridTheme} style={{ height: '350px', width: '100%' }}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
        />
      </div>
    </div>
  );
};

export default TestGrid;