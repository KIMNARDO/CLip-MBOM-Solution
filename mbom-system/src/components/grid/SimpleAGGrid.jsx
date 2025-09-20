import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const SimpleAGGrid = ({ data }) => {
  const gridRef = useRef();

  // 간단한 row data 생성
  const rowData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    const result = [];
    const processItem = (item, parentPath = []) => {
      const path = [...parentPath, item.partNumber];
      result.push({
        ...item,
        path,
        id: item.id || Math.random()
      });

      if (item.children && Array.isArray(item.children)) {
        item.children.forEach(child => processItem(child, path));
      }
    };

    data.forEach(item => processItem(item, []));
    console.log('SimpleAGGrid - Row data created:', result.length);
    return result;
  }, [data]);

  // 간단한 컬럼 정의
  const columnDefs = useMemo(() => [
    {
      headerName: 'Drag',
      field: 'drag',
      rowDrag: true,
      width: 50
    },
    {
      headerName: 'Level',
      field: 'level',
      width: 80
    },
    {
      headerName: '품번',
      field: 'partNumber',
      width: 200
    },
    {
      headerName: '품명',
      field: 'description',
      width: 250
    },
    {
      headerName: 'U/S',
      field: 'quantity',
      width: 100
    },
    {
      headerName: '단위',
      field: 'unit',
      width: 80
    },
    {
      headerName: '작업장',
      field: 'workcenter',
      width: 150
    },
    {
      headerName: '공급업체',
      field: 'supplier',
      width: 150
    },
    {
      headerName: '리드타임',
      field: 'leadtime',
      width: 100
    },
    {
      headerName: '상태',
      field: 'status',
      width: 100
    }
  ], []);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true
  }), []);

  const onGridReady = useCallback((params) => {
    console.log('Grid is ready!');
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div style={{ padding: '10px', background: '#2d2d30', color: '#cccccc', marginBottom: '10px' }}>
        <strong>데이터 그리드</strong> - {rowData.length}개 행
      </div>
      <div className="ag-theme-alpine-dark" style={{ height: 'calc(100% - 50px)', width: '100%' }}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          animateRows={true}
          rowSelection="multiple"
          onGridReady={onGridReady}
        />
      </div>
    </div>
  );
};

export default SimpleAGGrid;