import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { useBOMData } from '../../contexts/BOMDataContext';
import { useNotification } from '../../contexts/NotificationContext';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const MoveableBOMGrid = ({ data }) => {
  const gridRef = useRef();
  const { updateBOMItem, addBOMItem, deleteBOMItem, moveItem } = useBOMData();
  const { showSuccess, showWarning, showError, showInfo } = useNotification();
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
        originalId: item.id // Keep original ID for operations
      };
      result.push(gridRow);

      if (item.children && Array.isArray(item.children)) {
        item.children.forEach(child => processItem(child, path));
      }
    };

    if (data && Array.isArray(data)) {
      data.forEach(item => processItem(item, []));
    }

    console.log('MoveableBOMGrid - Input data:', data);
    console.log(`MoveableBOMGrid - Grid rows: ${result.length}`, result);
    return result;
  }, [data]);

  // Column definitions with drag enabled - matching original M-BOM.html
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

  // Drag start - prepare for CUT operation
  const onRowDragEnter = useCallback(() => {
    console.log('Drag enter');
  }, []);

  const onRowDragEnd = useCallback((event) => {
    const { node, overNode, overIndex } = event;

    if (!node || !overNode) {
      showWarning('유효한 위치에 놓아주세요');
      return;
    }

    // Get the actual data
    const draggedData = node.data;
    const targetData = overNode.data;

    // Prevent self-drop
    if (draggedData.originalId === targetData.originalId) {
      return;
    }

    console.log(`Moving item ${draggedData.partNumber} (Level ${draggedData.level}) near ${targetData.partNumber} (Level ${targetData.level})`);

    // Check for circular reference
    const wouldCreateCircular = (sourceId, targetId) => {
      // Find target in source's children
      const checkChildren = (item) => {
        if (!item.children) return false;
        for (let child of item.children) {
          if (child.id === targetId) return true;
          if (checkChildren(child)) return true;
        }
        return false;
      };

      // Find source item in data
      const findItem = (items, id) => {
        for (let item of items) {
          if (item.id === id) return item;
          if (item.children) {
            const found = findItem(item.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const sourceItem = findItem(data, sourceId);
      return sourceItem ? checkChildren(sourceItem) : false;
    };

    if (wouldCreateCircular(draggedData.originalId, targetData.originalId)) {
      showError('순환 참조를 만들 수 없습니다');
      return;
    }

    // Determine placement based on levels
    let newParentId = null;

    // Decision logic for placement:
    // 1. If dragging to a LOWER level number (e.g., L1 to L0), make target the parent
    // 2. If dragging to the SAME level, make them siblings (same parent)
    // 3. If dragging to a HIGHER level number, place as sibling

    const draggedLevel = draggedData.level;
    const targetLevel = targetData.level;

    if (draggedLevel > targetLevel) {
      // Moving to a parent level (e.g., L1 to L0)
      // The target becomes the new parent
      newParentId = targetData.originalId;
      console.log(`Moving ${draggedData.partNumber} (L${draggedLevel}) as child of ${targetData.partNumber} (L${targetLevel})`);
    } else {
      // Same level or moving up - become siblings
      const targetPath = targetData.path;
      if (targetPath && targetPath.length > 1) {
        // Target has a parent - use same parent
        const parentPartNumber = targetPath[targetPath.length - 2];
        const parent = rowData.find(row => row.partNumber === parentPartNumber);
        newParentId = parent ? parent.originalId : null;
        console.log(`Moving ${draggedData.partNumber} as sibling of ${targetData.partNumber} under parent ${parentPartNumber || 'ROOT'}`);
      } else {
        // Target is at root - place at root
        newParentId = null;
        console.log(`Moving ${draggedData.partNumber} to root level`);
      }
    }

    // Position: place after the target
    let insertIndex = overIndex;

    // Perform the MOVE operation (cut from source, paste to target)
    const parentInfo = newParentId ? `부모 ${newParentId}` : '루트';
    showInfo(`이동: ${draggedData.partNumber} → ${parentInfo} 위치`);

    // Call moveItem to update the data structure
    moveItem(draggedData.originalId, newParentId, insertIndex);

    showSuccess(`${draggedData.partNumber}이(가) 이동되었습니다`);
  }, [data, rowData, moveItem, showSuccess, showWarning, showError, showInfo]);

  const onRowDragMove = useCallback((event) => {
    // Visual feedback during drag
    const { node, overNode, y } = event;

    if (overNode) {
      const overNodeRect = overNode.rowTop;
      const mouseY = y - overNodeRect;

      // Show drop position indicator
      if (mouseY < 10) {
        // Drop above
        event.api.clearRangeSelection();
      }
    }
  }, []);

  const onRowDragLeave = useCallback(() => {
    console.log('Drag leave');
  }, []);

  // Grid event handlers
  const onGridReady = useCallback((params) => {
    setGridApi(params.api);
    console.log('Grid ready with', params.api.getDisplayedRowCount(), 'rows');
  }, []);

  const onCellValueChanged = useCallback((params) => {
    const { data, colDef, newValue, oldValue } = params;
    if (newValue !== oldValue) {
      updateBOMItem(data.originalId, { [colDef.field]: newValue });
      showSuccess(`${colDef.headerName} 업데이트됨`);
    }
  }, [updateBOMItem, showSuccess]);

  // Context menu
  const getContextMenuItems = useCallback((params) => {
    return [
      {
        name: '잘라내기',
        action: () => {
          setDraggedNode(params.node);
          showInfo('항목이 잘라내기되었습니다. 붙여넣을 위치를 선택하세요.');
        },
        icon: '<i class="fas fa-cut"></i>'
      },
      {
        name: '붙여넣기',
        action: () => {
          if (draggedNode) {
            // Move the cut item to this location
            moveItem(draggedNode.data.originalId, params.node.data.originalId);
            showSuccess('항목이 이동되었습니다');
            setDraggedNode(null);
          } else {
            showWarning('먼저 잘라낼 항목을 선택하세요');
          }
        },
        icon: '<i class="fas fa-paste"></i>',
        disabled: !draggedNode
      },
      'separator',
      {
        name: '부품 추가',
        action: () => {
          const newPart = {
            partNumber: 'NEW-' + Date.now(),
            description: '새 부품',
            quantity: 1,
            unit: 'EA'
          };
          addBOMItem(params.node.data.originalId, newPart);
          showSuccess('새 부품 추가됨');
        },
        icon: '<i class="fas fa-plus"></i>'
      },
      {
        name: '부품 삭제',
        action: () => {
          deleteBOMItem(params.node.data.originalId);
          showSuccess('부품 삭제됨');
        },
        icon: '<i class="fas fa-trash"></i>'
      }
    ];
  }, [draggedNode, addBOMItem, deleteBOMItem, moveItem, showSuccess, showWarning, showInfo]);

  // Row styling
  const getRowStyle = useCallback((params) => {
    // Highlight dragged item if in cut mode
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

  // Grid options with MOVE behavior
  const gridOptions = useMemo(() => ({
    treeData: true,
    getDataPath: data => data.path,
    getRowId: params => params.data.gridId,
    groupDefaultExpanded: 1,
    animateRows: true,
    rowSelection: 'multiple',
    enableCellChangeFlash: true,
    // IMPORTANT: Disable ag-Grid's managed dragging to prevent duplication
    rowDragManaged: false, // We handle the move manually
    suppressMoveWhenRowDragging: true, // Prevent ag-Grid from moving rows
    suppressDuplicateRowDrags: true,
    immutableData: true,
    // Drag events
    onRowDragEnter: onRowDragEnter,
    onRowDragEnd: onRowDragEnd,
    onRowDragMove: onRowDragMove,
    onRowDragLeave: onRowDragLeave
  }), [onRowDragEnter, onRowDragEnd, onRowDragMove, onRowDragLeave]);

  // Monitor data changes
  useEffect(() => {
    if (gridApi) {
      console.log('Data updated, refreshing grid');
      gridApi.refreshCells({ force: true });
    }
  }, [data, gridApi]);

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
          onCellValueChanged={onCellValueChanged}
          getContextMenuItems={getContextMenuItems}
          getRowStyle={getRowStyle}
          {...gridOptions}
        />
      </div>
    </div>
  );
};

export default MoveableBOMGrid;