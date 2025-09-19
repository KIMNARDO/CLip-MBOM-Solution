import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { useBOMData } from '../../contexts/BOMDataContext';
import { useNotification } from '../../contexts/NotificationContext';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const SafeBOMGrid = ({ data }) => {
  const gridRef = useRef();
  const { updateBOMItem, addBOMItem, deleteBOMItem, moveItem } = useBOMData();
  const { showSuccess, showWarning, showError } = useNotification();
  const [gridApi, setGridApi] = useState(null);
  const [columnApi, setColumnApi] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);

  // Convert nested data to flat structure - with deduplication
  const flattenData = useCallback((items, parentPath = []) => {
    if (!items || !Array.isArray(items)) return [];

    const result = [];
    const seenIds = new Map(); // Track seen IDs with their paths

    const processItem = (item, currentPath) => {
      const pathKey = currentPath.join('/');
      const itemKey = `${item.id}-${pathKey}`;

      // Check if we've already processed this exact item at this path
      if (seenIds.has(itemKey)) {
        console.warn(`Skipping duplicate item: ${itemKey}`);
        return;
      }

      seenIds.set(itemKey, true);
      const path = [...currentPath, item.partNumber];

      result.push({
        ...item,
        path,
        parentPath: currentPath,
        rowId: itemKey // Unique row identifier
      });

      if (item.children && Array.isArray(item.children)) {
        item.children.forEach(child => processItem(child, path));
      }
    };

    items.forEach(item => processItem(item, parentPath));
    return result;
  }, []);

  // Memoize row data with proper dependency tracking
  const rowData = useMemo(() => flattenData(data), [data, flattenData]);

  // Prevent duplicate renders
  useEffect(() => {
    if (gridApi && rowData) {
      // Use transactions for better performance
      const transaction = {
        add: [],
        update: [],
        remove: []
      };

      // Clear and reset data properly
      gridApi.setRowData(rowData);
    }
  }, [rowData, gridApi]);

  // Column definitions
  const columnDefs = useMemo(() => [
    {
      headerName: 'Level',
      field: 'level',
      width: 80,
      pinned: 'left',
      cellClass: 'text-center',
      editable: false,
      rowDrag: true, // Enable row dragging
      rowDragText: (params, dragItemCount) => {
        return dragItemCount > 1
          ? `${dragItemCount} items`
          : params.value;
      }
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
      headerName: '수량',
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
  ], []);

  // Default column properties
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    editable: true
  }), []);

  // Grid options with safe drag and drop
  const gridOptions = useMemo(() => ({
    treeData: true,
    getDataPath: data => data.path,
    getRowId: params => params.data.rowId, // Use our unique row ID
    groupDefaultExpanded: 1,
    animateRows: true,
    rowSelection: 'multiple',
    rowMultiSelectWithClick: true,
    enableCellChangeFlash: true,
    rowDragManaged: true, // Enable managed row dragging
    suppressMoveWhenRowDragging: false,
    suppressDuplicateRowDrags: true,
    immutableData: true,
    deltaRowDataMode: true, // Use delta mode for better performance
    onRowDragEnter: onRowDragEnter,
    onRowDragEnd: onRowDragEnd,
    onRowDragMove: onRowDragMove,
    onRowDragLeave: onRowDragLeave
  }), []);

  // Drag event handlers
  const onRowDragEnter = useCallback((e) => {
    setDraggedNode(e.node);
  }, []);

  const onRowDragMove = useCallback((e) => {
    // Visual feedback during drag
  }, []);

  const onRowDragLeave = useCallback((e) => {
    // Clean up visual feedback
  }, []);

  const onRowDragEnd = useCallback((e) => {
    const { node, overNode, overIndex } = e;

    if (!node || !overNode) {
      showWarning('올바른 위치에 드롭해주세요.');
      setDraggedNode(null);
      return;
    }

    // Prevent self-drop
    if (node.data.id === overNode.data.id) {
      setDraggedNode(null);
      return;
    }

    // Check for circular reference
    const wouldCreateCircular = (draggedId, targetId) => {
      const findInChildren = (item) => {
        if (item.id === targetId) return true;
        if (item.children) {
          return item.children.some(child => findInChildren(child));
        }
        return false;
      };

      return findInChildren(node.data);
    };

    if (wouldCreateCircular(node.data.id, overNode.data.id)) {
      showError('순환 참조를 만들 수 없습니다.');
      setDraggedNode(null);
      return;
    }

    // Perform the move
    moveItem(node.data.id, overNode.data.id, overIndex);
    showSuccess(`${node.data.partNumber}을(를) 이동했습니다.`);
    setDraggedNode(null);
  }, [moveItem, showSuccess, showWarning, showError]);

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
        getContextMenuItems={getContextMenuItems}
        getRowStyle={getRowStyle}
        {...gridOptions}
      />
    </div>
  );
};

export default SafeBOMGrid;