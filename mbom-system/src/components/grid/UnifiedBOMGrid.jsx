import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useBOMData } from '../../contexts/BOMDataContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import EnhancedLevelIndicator from '../level/EnhancedLevelIndicator';

/**
 * UnifiedBOMGrid - 통합 BOM 그리드 컴포넌트
 * ag-Grid Enterprise의 모든 기능을 활용하는 단일 통합 컴포넌트
 */
const UnifiedBOMGrid = ({
  data,
  onSelectionChanged,
  onCellEditingStarted,
  onCellEditingStoppedCallback
}) => {
  const gridRef = useRef();
  const {
    updateBOMItem,
    addBOMItem,
    deleteBOMItem,
    moveItem,
    expandedNodeIds,
    customColumns,
    setGridApi,
    toggleNodeExpanded
  } = useBOMData();
  const { showSuccess, showWarning, showError, showInfo } = useNotification();
  const { theme: appTheme } = useTheme();
  const gridTheme = appTheme === 'dark' ? 'ag-theme-alpine-dark' : 'ag-theme-alpine';

  const [gridApiState, setGridApiState] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [quickFilter, setQuickFilter] = useState('');

  // Tree Data 변환 함수
  const convertToTreeData = useCallback((items, parentPath = []) => {
    if (!items || !Array.isArray(items)) return [];

    const result = [];
    items.forEach(item => {
      const currentPath = [...parentPath, item.partNumber];

      // ag-Grid Tree Data 구조로 변환
      const treeItem = {
        ...item,
        path: currentPath,
        orgHierarchy: currentPath,
        // Tree 레벨은 path 길이로 자동 계산
        treeLevel: currentPath.length - 1
      };

      result.push(treeItem);

      // 자식 요소 재귀 처리
      if (item.children && item.children.length > 0) {
        const childrenData = convertToTreeData(item.children, currentPath);
        result.push(...childrenData);
      }
    });

    return result;
  }, []);

  // 그리드 데이터 준비
  const rowData = useMemo(() => {
    console.log('UnifiedBOMGrid - Received data:', data);
    console.log('UnifiedBOMGrid - Data type:', typeof data);
    console.log('UnifiedBOMGrid - Data is array:', Array.isArray(data));
    console.log('UnifiedBOMGrid - Data length:', data ? data.length : 'null/undefined');

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn('UnifiedBOMGrid - No data received!');
      console.warn('UnifiedBOMGrid - Data details:', { data, type: typeof data, isArray: Array.isArray(data) });
      return [];
    }

    const treeData = convertToTreeData(data);
    console.log('UnifiedBOMGrid - Tree data prepared:', treeData);
    console.log('UnifiedBOMGrid - Tree data length:', treeData.length);
    console.log('UnifiedBOMGrid - First item:', treeData[0]);

    return treeData;
  }, [data, convertToTreeData]);

  // 컬럼 정의 (동적 컬럼 포함)
  const columnDefs = useMemo(() => {
    const columns = [
    {
      headerName: '',
      field: 'selection',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 50,
      pinned: 'left'
    },
    {
      headerName: 'Level',
      field: 'level',
      width: 120,
      pinned: 'left',
      cellRenderer: params => {
        if (!params.data) return null;

        return React.createElement(EnhancedLevelIndicator, {
          level: params.value || 0,
          hasChildren: params.data.children && params.data.children.length > 0,
          isExpanded: params.node.expanded,
          onToggle: () => {
            params.node.setExpanded(!params.node.expanded);
          },
          partType: params.data.partType,
          itemCount: params.data.children ? params.data.children.length : 0,
          criticalPath: params.data.criticalPath,
          changeStatus: params.data.diff_status
        });
      },
      autoHeight: true
    },
    {
      headerName: '품번',
      field: 'partNumber',
      width: 200,
      editable: true,
      cellEditor: 'agTextCellEditor',
      cellClassRules: {
        'modified-cell': params => params.data.changed,
        'error-cell': params => params.data.hasError
      }
    },
    {
      headerName: '품명',
      field: 'description',
      width: 250,
      editable: true,
      cellEditor: 'agLargeTextCellEditor',
      cellEditorParams: {
        maxLength: 200,
        rows: 3,
        cols: 50
      }
    },
    {
      headerName: 'U/S',
      field: 'quantity',
      width: 100,
      editable: params => params.data.level !== 0,
      cellEditor: 'agNumberCellEditor',
      cellEditorParams: {
        min: 0,
        max: 9999
      },
      valueParser: params => Number(params.newValue),
      cellClass: 'numeric-cell'
    },
    {
      headerName: '단위',
      field: 'unit',
      width: 80,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['EA', 'SET', 'PCS', 'KG', 'L', 'M']
      }
    },
    {
      headerName: '작업장',
      field: 'workcenter',
      width: 150,
      editable: true,
      cellEditor: 'agRichSelectCellEditor',
      cellEditorParams: {
        values: ['제조1팀', '제조2팀', '조립1팀', '조립2팀', '품질팀', '포장팀']
      }
    },
    {
      headerName: '공급업체',
      field: 'supplier',
      width: 150,
      editable: true,
      enableRowGroup: true
    },
    {
      headerName: '리드타임',
      field: 'leadtime',
      width: 100,
      editable: true,
      cellEditor: 'agNumberCellEditor',
      valueParser: params => Number(params.newValue),
      cellClass: 'numeric-cell'
    },
    {
      headerName: '단가',
      field: 'cost',
      width: 120,
      editable: true,
      cellEditor: 'agNumberCellEditor',
      valueFormatter: params => params.value ? `₩${params.value.toLocaleString()}` : '',
      cellClass: 'numeric-cell'
    },
    {
      headerName: '상태',
      field: 'status',
      width: 100,
      cellEditor: 'agRichSelectCellEditor',
      cellEditorParams: {
        values: ['approved', 'review', 'draft', 'rejected']
      },
      cellClassRules: {
        'status-approved': params => params.value === 'approved',
        'status-review': params => params.value === 'review',
        'status-draft': params => params.value === 'draft',
        'status-rejected': params => params.value === 'rejected'
      }
    },
    {
      headerName: 'ECO#',
      field: 'eco',
      width: 100,
      editable: true
    },
    {
      headerName: '비고',
      field: 'remarks',
      width: 200,
      editable: true,
      cellEditor: 'agLargeTextCellEditor'
    }
  ];

  // 동적 컬럼 추가
  const dynamicColumns = customColumns ? customColumns.map(col => ({
    headerName: col.headerName,
    field: col.field,
    editable: col.editable !== false,
    width: col.width || 150,
    cellEditor: col.type === 'number' ? 'agNumberCellEditor' :
                col.type === 'date' ? 'agDateCellEditor' :
                col.type === 'boolean' ? 'agCheckboxCellEditor' :
                'agTextCellEditor'
  })) : [];

  return [...columns, ...dynamicColumns];
  }, [customColumns]);

  // 기본 컬럼 설정
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    floatingFilter: true,
    menuTabs: ['filterMenuTab', 'generalMenuTab', 'columnsMenuTab'],
    minWidth: 80
  }), []);

  // Grid Options
  const gridOptions = useMemo(() => ({

    // 편집 설정
    editType: 'fullRow',
    stopEditingWhenCellsLoseFocus: true,
    undoRedoCellEditing: true,
    undoRedoCellEditingLimit: 20,

    // 선택 설정
    rowSelection: 'multiple',
    rowMultiSelectWithClick: true,

    // 드래그 설정
    rowDragManaged: true,
    animateRows: true,

    // 성능 설정
    rowBuffer: 10,
    rowModelType: 'clientSide',

    // 스타일 설정
    rowHeight: 35,
    headerHeight: 40,

    // 페이지네이션 설정 (Community Edition)
    pagination: true,
    paginationPageSize: 50,
    paginationPageSizeSelector: [20, 50, 100, 200]
  }), []);

  // Grid Ready 이벤트
  const onGridReady = useCallback(params => {
    console.log('UnifiedBOMGrid - Grid is ready!');
    const api = params.api;
    setGridApiState(api);

    // Context에 Grid API 등록
    if (setGridApi) {
      setGridApi(api);
    }

    // 초기 확장 상태 적용
    if (expandedNodeIds) {
      setTimeout(() => {
        api.forEachNode((node) => {
          if (node.data && expandedNodeIds.has(node.data.id)) {
            api.setRowNodeExpanded(node, true);
          }
        });
      }, 100);
    }

    // Check if data is loaded
    const rowCount = api.getDisplayedRowCount();
    console.log('UnifiedBOMGrid - Displayed row count:', rowCount);

    params.api.sizeColumnsToFit();
  }, [expandedNodeIds, setGridApi]);

  // Row expanded event handler (양방향 동기화)
  const onRowGroupOpened = useCallback((params) => {
    if (params.node && params.node.data && toggleNodeExpanded) {
      toggleNodeExpanded(params.node.data.id, params.node.expanded);
    }
  }, [toggleNodeExpanded]);

  // 셀 편집 완료 이벤트
  const onCellEditingStoppedHandler = useCallback(params => {
    if (params.oldValue !== params.newValue) {
      const updatedItem = {
        ...params.data,
        [params.column.colId]: params.newValue,
        changed: true
      };

      updateBOMItem(params.data.id, updatedItem);
      showSuccess(`${params.column.colId} 필드가 업데이트되었습니다`);
    }

    // 외부 콜백 호출
    if (onCellEditingStoppedCallback) {
      onCellEditingStoppedCallback(params);
    }
  }, [updateBOMItem, showSuccess, onCellEditingStoppedCallback]);

  // 행 선택 변경 이벤트
  const onSelectionChangedHandler = useCallback(() => {
    const selectedNodes = gridRef.current.api.getSelectedNodes();
    const selectedData = selectedNodes.map(node => node.data);
    setSelectedRows(selectedData);

    if (onSelectionChanged) {
      onSelectionChanged(selectedData);
    }
  }, [onSelectionChanged]);

  // 행 드래그 종료 이벤트
  const onRowDragEnd = useCallback(params => {
    const { node, overNode } = params;

    if (!overNode) {
      showWarning('올바른 위치로 드래그해주세요');
      return;
    }

    moveItem(node.data.id, overNode.data.id);
    showSuccess('항목이 이동되었습니다');
  }, [moveItem, showSuccess, showWarning]);

  // 빠른 필터 적용
  useEffect(() => {
    if (gridApiState && gridApiState.setGridOption) {
      gridApiState.setGridOption('quickFilterText', quickFilter);
    }
  }, [quickFilter, gridApiState]);

  // 컨텍스트 메뉴
  const getContextMenuItems = useCallback(params => {
    const result = [
      {
        name: '복사',
        action: () => {
          const selectedData = params.api.getSelectedRows();
          navigator.clipboard.writeText(JSON.stringify(selectedData, null, 2));
          showInfo('선택한 항목이 클립보드에 복사되었습니다');
        },
        icon: '<span class="ag-icon ag-icon-copy"></span>'
      },
      {
        name: '붙여넣기',
        disabled: params.node.data.level === 0,
        action: () => {
          showInfo('붙여넣기 기능은 준비 중입니다');
        },
        icon: '<span class="ag-icon ag-icon-paste"></span>'
      },
      'separator',
      {
        name: '하위 항목 추가',
        action: () => {
          const newItem = {
            id: Date.now(),
            level: params.node.data.level + 1,
            partNumber: 'NEW-PART-' + Date.now(),
            description: '새 부품',
            quantity: 1,
            unit: 'EA',
            status: 'draft'
          };
          addBOMItem(newItem, params.node.data.id);
          showSuccess('새 항목이 추가되었습니다');
        },
        icon: '<span class="ag-icon ag-icon-plus"></span>'
      },
      {
        name: '삭제',
        disabled: params.node.data.level === 0,
        action: () => {
          deleteBOMItem(params.node.data.id);
          showSuccess('항목이 삭제되었습니다');
        },
        icon: '<span class="ag-icon ag-icon-minus"></span>'
      },
      'separator',
      'export',
      'autoSizeAll'
    ];

    return result;
  }, [addBOMItem, deleteBOMItem, showSuccess, showInfo]);

  // Excel Export
  const exportToExcel = useCallback(() => {
    gridRef.current.api.exportDataAsExcel({
      fileName: `BOM_Export_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'BOM Data',
      author: 'M-BOM System',
      processCellCallback: params => {
        if (params.column.colId === 'cost' && params.value) {
          return params.value;
        }
        return params.value;
      }
    });
    showSuccess('Excel 파일로 내보내기가 완료되었습니다');
  }, [showSuccess]);

  console.log('=== UnifiedBOMGrid Render Debug ===');
  console.log('Received data prop:', data);
  console.log('Data type:', typeof data);
  console.log('Data length:', data ? data.length : 'null/undefined');
  console.log('RowData prepared:', rowData);
  console.log('RowData length:', rowData.length);
  console.log('ColumnDefs:', columnDefs.length, 'columns');
  console.log('Theme:', gridTheme);
  console.log('Grid ready state:', !!gridApiState);
  console.log('==================================');

  return (
    <div className="unified-bom-grid" style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 툴바 */}
      <div className="grid-toolbar">
        <input
          type="text"
          placeholder="빠른 검색..."
          className="vscode-input"
          value={quickFilter}
          onChange={e => setQuickFilter(e.target.value)}
          style={{ width: '250px' }}
        />
        <button
          onClick={exportToExcel}
          className="vscode-button"
        >
          Excel 내보내기
        </button>
        <button
          onClick={() => gridApiState?.expandAll()}
          className="vscode-button secondary"
        >
          모두 펼치기
        </button>
        <button
          onClick={() => gridApiState?.collapseAll()}
          className="vscode-button secondary"
        >
          모두 접기
        </button>
        <span className="grid-status-text" style={{ marginLeft: 'auto' }}>
          선택: {selectedRows.length}개 / 전체: {rowData.length}개
        </span>
      </div>

      {/* 그리드 */}
      <div className={`${gridTheme} flex-1`} style={{ height: 'calc(100% - 50px)', width: '100%' }}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          {...gridOptions}
          onGridReady={onGridReady}
          onCellEditingStopped={onCellEditingStoppedHandler}
          onSelectionChanged={onSelectionChangedHandler}
          onRowDragEnd={onRowDragEnd}
          onRowGroupOpened={onRowGroupOpened}
          getContextMenuItems={getContextMenuItems}
        />
      </div>
    </div>
  );
};

export default UnifiedBOMGrid;