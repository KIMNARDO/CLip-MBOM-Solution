import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { useBOMData } from '../../contexts/BOMDataContext';
import { useNotification } from '../../contexts/NotificationContext';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const CleanBOMGrid = ({ data }) => {
  const gridRef = useRef();
  const { updateBOMItem, addBOMItem, deleteBOMItem, moveItem } = useBOMData();
  const { showSuccess, showWarning, showError } = useNotification();
  const [gridApi, setGridApi] = useState(null);

  // Simple flat data conversion - no duplication
  const rowData = useMemo(() => {
    const result = [];
    let idCounter = 0;

    const processItem = (item, parentPath = []) => {
      const path = [...parentPath, item.partNumber];
      const gridRow = {
        ...item,
        path,
        gridId: `${item.id}_${idCounter++}` // Unique grid ID
      };
      result.push(gridRow);

      if (item.children && Array.isArray(item.children)) {
        item.children.forEach(child => processItem(child, path));
      }
    };

    if (data && Array.isArray(data)) {
      data.forEach(item => processItem(item, []));
    }

    console.log(`Grid data prepared: ${result.length} rows`);
    return result;
  }, [data]);

  // Column definitions
  const columnDefs = useMemo(() => [
    {
      headerName: 'Level',
      field: 'level',
      width: 80,
      pinned: 'left',
      cellClass: 'text-center',
      editable: false
    },
    {
      headerName: '품번',
      field: 'partNumber',
      width: 150,
      pinned: 'left',
      cellRenderer: 'agGroupCellRenderer'
    },
    {
      headerName: '품명',
      field: 'description',
      width: 200
    },
    {
      headerName: 'U/S',
      field: 'quantity',
      width: 80,
      type: 'numericColumn'
    },
    {
      headerName: '단위',
      field: 'unit',
      width: 60
    },
    {
      headerName: '재질',
      field: 'material',
      width: 150
    },
    {
      headerName: '중량(kg)',
      field: 'weight',
      width: 100,
      type: 'numericColumn',
      valueFormatter: params => params.value ? params.value.toFixed(2) : ''
    },
    {
      headerName: '공급업체',
      field: 'supplier',
      width: 150
    },
    {
      headerName: '단가',
      field: 'cost',
      width: 120,
      type: 'numericColumn',
      valueFormatter: params => {
        if (params.value) {
          return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
          }).format(params.value);
        }
        return '';
      }
    },
    {
      headerName: '상태',
      field: 'status',
      width: 100,
      cellRenderer: params => {
        const statusMap = {
          approved: { label: '승인', class: 'text-green-600' },
          review: { label: '검토중', class: 'text-yellow-600' },
          draft: { label: '작성중', class: 'text-gray-600' },
          rejected: { label: '반려', class: 'text-red-600' }
        };
        const status = statusMap[params.value] || { label: params.value, class: '' };
        return `<span class="${status.class}">${status.label}</span>`;
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

  // Grid event handlers
  const onGridReady = useCallback((params) => {
    setGridApi(params.api);
    console.log('Grid ready with', params.api.getDisplayedRowCount(), 'rows');
  }, []);

  const onCellValueChanged = useCallback((params) => {
    const { data, colDef, newValue, oldValue } = params;
    if (newValue !== oldValue) {
      updateBOMItem(data.id, { [colDef.field]: newValue });
      showSuccess(`${colDef.headerName} 업데이트됨`);
    }
  }, [updateBOMItem, showSuccess]);

  // Context menu
  const getContextMenuItems = useCallback((params) => {
    return [
      {
        name: '부품 추가',
        action: () => {
          const newPart = {
            partNumber: 'NEW-' + Date.now(),
            description: '새 부품',
            quantity: 1,
            unit: 'EA'
          };
          addBOMItem(params.node.data.id, newPart);
          showSuccess('새 부품 추가됨');
        }
      },
      {
        name: '부품 삭제',
        action: () => {
          deleteBOMItem(params.node.data.id);
          showSuccess('부품 삭제됨');
        }
      },
      'separator',
      'copy',
      'paste'
    ];
  }, [addBOMItem, deleteBOMItem, showSuccess]);

  // Row styling
  const getRowStyle = useCallback((params) => {
    if (params.data.status === 'rejected') {
      return { backgroundColor: '#fee2e2' };
    }
    if (params.data.status === 'draft') {
      return { backgroundColor: '#fef3c7' };
    }
    return null;
  }, []);

  // Grid options
  const gridOptions = useMemo(() => ({
    treeData: true,
    getDataPath: data => data.path,
    getRowId: params => params.data.gridId, // Use unique grid ID
    groupDefaultExpanded: 1,
    animateRows: true,
    rowSelection: 'multiple',
    enableCellChangeFlash: true,
    // Disable drag for now to prevent issues
    rowDragManaged: false,
    suppressMoveWhenRowDragging: true,
    // Use immutable data mode
    immutableData: true,
    // Prevent duplicate rendering
    suppressDuplicateRowDrags: true,
    deltaRowDataMode: false
  }), []);

  // Monitor data changes
  useEffect(() => {
    if (gridApi) {
      console.log('Grid update: Data changed, row count:', rowData.length);
    }
  }, [rowData, gridApi]);

  return (
    <div className="ag-theme-alpine" style={{ height: 'calc(100vh - 300px)', width: '100%' }}>
      <div style={{ marginBottom: '10px', padding: '10px', background: '#f0f0f0' }}>
        <strong>그리드 상태:</strong> {rowData.length} 행 표시 중
      </div>
      <AgGridReact
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={onGridReady}
        onCellValueChanged={onCellValueChanged}
        getContextMenuItems={getContextMenuItems}
        getRowStyle={getRowStyle}
        {...gridOptions}
      />
    </div>
  );
};

export default CleanBOMGrid;