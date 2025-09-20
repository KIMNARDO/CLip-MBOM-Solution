import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

const AGGridWrapper = ({ data, onRowDragEnd, onCellValueChanged, getContextMenuItems }) => {
  const gridRef = useRef();
  const [gridApi, setGridApi] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);

  // Convert nested data to flat structure for grid
  const rowData = useMemo(() => {
    const result = [];
    let idCounter = 0;

    const processItem = (item, parentPath = []) => {
      const path = [...parentPath, item.partNumber];
      const gridRow = {
        ...item,
        path,
        gridId: `${item.id}_${idCounter++}`,
        originalId: item.id
      };
      result.push(gridRow);

      if (item.children && Array.isArray(item.children)) {
        item.children.forEach(child => processItem(child, path));
      }
    };

    if (data && Array.isArray(data)) {
      data.forEach(item => processItem(item, []));
    }

    console.log('AGGridWrapper - Grid rows:', result.length, result);
    return result;
  }, [data]);

  // Column definitions
  const columnDefs = useMemo(() => [
    {
      headerName: '',
      field: 'drag',
      rowDrag: true,
      width: 40,
      suppressMenu: true,
      cellClass: 'text-center',
      rowDragText: (params) => {
        return `${params.rowNode.data.partNumber}`;
      }
    },
    {
      headerName: 'Level',
      field: 'level',
      width: 60,
      cellClass: 'text-center font-bold',
      editable: false,
      cellStyle: params => ({
        backgroundColor: params.value === 0 ? '#e8f5e9' :
                        params.value === 1 ? '#fff3e0' :
                        params.value === 2 ? '#f3e5f5' : '#fce4ec',
        color: params.value === 0 ? '#2e7d32' : '#424242'
      })
    },
    {
      headerName: '품번',
      field: 'partNumber',
      width: 180,
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: (params) => {
          const icon = params.data.icon || '';
          const changed = params.data.changed ? '🔴' : '';
          return `${icon} ${params.value} ${changed}`;
        }
      }
    },
    {
      headerName: '품명',
      field: 'description',
      width: 250,
      tooltipField: 'description'
    },
    {
      headerName: 'U/S',
      field: 'quantity',
      width: 70,
      type: 'numericColumn',
      cellClass: 'text-right'
    },
    {
      headerName: '단위',
      field: 'unit',
      width: 60,
      cellClass: 'text-center'
    },
    {
      headerName: '작업',
      field: 'operation',
      width: 90,
      cellClass: 'text-center'
    },
    {
      headerName: '작업장',
      field: 'workcenter',
      width: 120
    },
    {
      headerName: '공급업체',
      field: 'supplier',
      width: 120
    },
    {
      headerName: 'L/T',
      field: 'leadtime',
      width: 60,
      type: 'numericColumn',
      cellClass: 'text-center',
      cellStyle: params => ({
        backgroundColor: params.value > 30 ? '#ffebee' :
                        params.value > 14 ? '#fff8e1' :
                        params.value > 7 ? '#e8f5e9' : 'transparent',
        fontWeight: params.value > 30 ? 'bold' : 'normal'
      })
    },
    {
      headerName: '재질',
      field: 'material',
      width: 130
    },
    {
      headerName: '중량(kg)',
      field: 'weight',
      width: 90,
      type: 'numericColumn',
      cellClass: 'text-right',
      valueFormatter: params => params.value ? params.value.toFixed(1) : ''
    },
    {
      headerName: '단가',
      field: 'cost',
      width: 120,
      type: 'numericColumn',
      cellClass: 'text-right',
      valueFormatter: params => {
        if (params.value) {
          return new Intl.NumberFormat('ko-KR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(params.value) + '원';
        }
        return '';
      }
    },
    {
      headerName: '상태',
      field: 'status',
      width: 90,
      cellClass: 'text-center',
      cellRenderer: params => {
        const statusMap = {
          approved: { label: '승인', color: '#27AE60', bg: '#d5f4e6' },
          review: { label: '검토중', color: '#F39C12', bg: '#fef9e7' },
          draft: { label: '작성중', color: '#95A5A6', bg: '#ecf0f1' },
          rejected: { label: '반려', color: '#E74C3C', bg: '#fadbd8' }
        };
        const status = statusMap[params.value] || { label: params.value, color: '#666', bg: '#f5f5f5' };
        return `<div style="
          background: ${status.bg};
          color: ${status.color};
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          display: inline-block;
        ">${status.label}</div>`;
      }
    }
  ], []);

  // Default column properties
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    editable: true
  }), []);

  // Grid options
  const gridOptions = useMemo(() => ({
    treeData: true,
    getDataPath: data => data.path,
    getRowId: params => params.data.gridId,
    groupDefaultExpanded: 1,
    animateRows: true,
    rowSelection: 'multiple',
    enableCellChangeFlash: true,
    rowDragManaged: false,
    suppressMoveWhenRowDragging: true,
    suppressDuplicateRowDrags: true,
    immutableData: true
  }), []);

  // Grid event handlers
  const onGridReady = useCallback((params) => {
    setGridApi(params.api);
    console.log('AG Grid ready with', params.api.getDisplayedRowCount(), 'rows');
  }, []);

  const handleRowDragEnd = useCallback((event) => {
    if (onRowDragEnd) {
      onRowDragEnd(event);
    }
  }, [onRowDragEnd]);

  const handleCellValueChanged = useCallback((params) => {
    if (onCellValueChanged) {
      onCellValueChanged(params);
    }
  }, [onCellValueChanged]);

  // Row styling
  const getRowStyle = useCallback((params) => {
    if (draggedNode && params.node.id === draggedNode.id) {
      return {
        backgroundColor: '#e3f2fd',
        opacity: 0.7,
        borderLeft: '3px solid #2196f3'
      };
    }

    if (params.data.status === 'rejected') {
      return { backgroundColor: '#fee2e2' };
    }
    if (params.data.status === 'draft') {
      return { backgroundColor: '#fef3c7' };
    }
    return null;
  }, [draggedNode]);

  // Monitor data changes
  useEffect(() => {
    if (gridApi && rowData.length > 0) {
      console.log('AGGrid - Data updated, refreshing grid');
      gridApi.setRowData(rowData);
    }
  }, [rowData, gridApi]);

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '10px', padding: '10px', background: '#2d2d30', borderRadius: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cccccc' }}>
          <div>
            <strong>그리드 상태:</strong> {rowData.length} 행 |
            <strong> 모드:</strong> 잘라내기-붙여넣기 (이동)
          </div>
          {draggedNode && (
            <div style={{ color: '#2196f3' }}>
              <i className="fas fa-cut"></i> 잘라내기 모드 활성
            </div>
          )}
        </div>
      </div>
      <div className="ag-theme-alpine-dark" style={{ flex: 1, width: '100%' }}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          onCellValueChanged={handleCellValueChanged}
          getContextMenuItems={getContextMenuItems}
          getRowStyle={getRowStyle}
          onRowDragEnd={handleRowDragEnd}
          {...gridOptions}
        />
      </div>
    </div>
  );
};

export default AGGridWrapper;