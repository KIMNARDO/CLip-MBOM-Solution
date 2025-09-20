import React, { useState, useRef, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { useBOMData } from '../../contexts/BOMDataContext';
import { useNotification } from '../../contexts/NotificationContext';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const BOMGrid = ({ data }) => {
  const gridRef = useRef();
  const { updateBOMItem, addBOMItem, deleteBOMItem } = useBOMData();
  const { showSuccess, showWarning } = useNotification();
  const [gridApi, setGridApi] = useState(null);
  const [columnApi, setColumnApi] = useState(null);

  // Convert nested data to flat structure for ag-Grid tree data
  // Added unique key generation to prevent duplication
  const flattenData = useCallback((items, parentPath = []) => {
    if (!items || !Array.isArray(items)) return [];

    const result = [];
    const processedIds = new Set(); // Track processed items to prevent duplicates

    const processItem = (item, currentPath) => {
      // Create unique key for this item
      const uniqueKey = `${item.id}_${currentPath.join('_')}`;

      // Skip if already processed
      if (processedIds.has(uniqueKey)) {
        return;
      }

      processedIds.add(uniqueKey);
      const path = [...currentPath, item.partNumber];

      result.push({
        ...item,
        path,
        parentPath: currentPath,
        uniqueKey // Add unique identifier
      });

      if (item.children && Array.isArray(item.children) && item.children.length > 0) {
        item.children.forEach(child => processItem(child, path));
      }
    };

    items.forEach(item => processItem(item, parentPath));
    return result;
  }, []);

  const rowData = useMemo(() => {
    const flattened = flattenData(data);
    return flattened;
  }, [data, flattenData]);

  // Column definitions
  const columnDefs = [
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
      headerName: '납기(일)',
      field: 'leadTime',
      width: 80,
      type: 'numericColumn'
    },
    {
      headerName: '상태',
      field: 'status',
      width: 100,
      cellRenderer: params => {
        const statusMap = {
          approved: { label: '승인', class: 'text-green-600 font-semibold' },
          review: { label: '검토중', class: 'text-yellow-600 font-semibold' },
          draft: { label: '작성중', class: 'text-gray-600' },
          rejected: { label: '반려', class: 'text-red-600 font-semibold' }
        };
        const status = statusMap[params.value] || { label: params.value, class: '' };
        return `<span class="${status.class}">${status.label}</span>`;
      }
    },
    {
      headerName: '비고',
      field: 'notes',
      width: 200
    },
    {
      headerName: '최종수정',
      field: 'lastModified',
      width: 150,
      valueFormatter: params => {
        if (params.value) {
          return new Date(params.value).toLocaleString('ko-KR');
        }
        return '';
      }
    }
  ];

  // Default column properties
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    editable: true
  }), []);

  // Grid options - Improved with unique row IDs
  const gridOptions = {
    treeData: true,
    getDataPath: data => data.path,
    getRowId: params => params.data.uniqueKey || `${params.data.id}_${Date.now()}`, // Use unique key
    groupDefaultExpanded: 1,
    animateRows: true,
    rowSelection: 'multiple',
    rowMultiSelectWithClick: true,
    enableCellChangeFlash: true,
    // Temporarily disable row dragging to prevent tree structure issues
    rowDragManaged: false,
    suppressMoveWhenRowDragging: true,
    suppressDuplicateRowDrags: true, // Prevent duplicate drag events
    immutableData: true // Treat data as immutable for better performance
  };

  // Grid event handlers
  const onGridReady = useCallback((params) => {
    setGridApi(params.api);
    setColumnApi(params.columnApi);
  }, []);

  const onCellValueChanged = useCallback((params) => {
    const { data, colDef, newValue, oldValue } = params;

    if (newValue !== oldValue) {
      updateBOMItem(data.id, { [colDef.field]: newValue });
      showSuccess(`${colDef.headerName} 값이 업데이트되었습니다.`);
    }
  }, [updateBOMItem, showSuccess]);

  const onRowDragEnd = useCallback((params) => {
    // Handle row reordering
    showWarning('행 순서가 변경되었습니다. 저장 버튼을 눌러 변경사항을 저장하세요.');
  }, [showWarning]);

  // Context menu
  const getContextMenuItems = useCallback((params) => {
    const result = [
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
          showSuccess('새 부품이 추가되었습니다.');
        },
        icon: '<i class="fas fa-plus"></i>'
      },
      {
        name: '부품 삭제',
        action: () => {
          deleteBOMItem(params.node.data.id);
          showSuccess('부품이 삭제되었습니다.');
        },
        icon: '<i class="fas fa-trash"></i>'
      },
      'separator',
      'copy',
      'paste',
      'separator',
      'export'
    ];

    return result;
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

  return (
    <div className="ag-theme-alpine" style={{ height: 'calc(100vh - 300px)', width: '100%' }}>
      <AgGridReact
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={onGridReady}
        onCellValueChanged={onCellValueChanged}
        onRowDragEnd={onRowDragEnd}
        getContextMenuItems={getContextMenuItems}
        getRowStyle={getRowStyle}
        {...gridOptions}
      />
    </div>
  );
};

export default BOMGrid;