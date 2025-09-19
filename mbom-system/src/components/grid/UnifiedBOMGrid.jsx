import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { useBOMData } from '../../contexts/BOMDataContext';
import { useNotification } from '../../contexts/NotificationContext';
import 'ag-grid-enterprise';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

/**
 * UnifiedBOMGrid - 통합 BOM 그리드 컴포넌트
 * ag-Grid Enterprise의 모든 기능을 활용하는 단일 통합 컴포넌트
 */
const UnifiedBOMGrid = ({
  data,
  onSelectionChanged,
  onCellEditingStarted,
  onCellEditingStoppedCallback,
  theme = 'ag-theme-alpine-dark'
}) => {
  const gridRef = useRef();
  const { updateBOMItem, addBOMItem, deleteBOMItem, moveItem } = useBOMData();
  const { showSuccess, showWarning, showError, showInfo } = useNotification();

  const [gridApi, setGridApi] = useState(null);
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
    return convertToTreeData(data);
  }, [data, convertToTreeData]);

  // 컬럼 정의
  const columnDefs = useMemo(() => [
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
      width: 80,
      cellClass: params => `level-${params.value}`,
      pinned: 'left'
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
      headerName: '수량',
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
  ], []);

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
    // Tree Data 설정
    treeData: true,
    getDataPath: data => data.path,
    groupDefaultExpanded: 1,

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

    // 상태바 설정
    statusBar: {
      statusPanels: [
        { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left' },
        { statusPanel: 'agSelectedRowCountComponent' },
        { statusPanel: 'agAggregationComponent' }
      ]
    },

    // 사이드바 설정
    sideBar: {
      toolPanels: [
        {
          id: 'columns',
          labelDefault: '컬럼',
          labelKey: 'columns',
          iconKey: 'columns',
          toolPanel: 'agColumnsToolPanel',
          minWidth: 225,
          maxWidth: 225
        },
        {
          id: 'filters',
          labelDefault: '필터',
          labelKey: 'filters',
          iconKey: 'filter',
          toolPanel: 'agFiltersToolPanel',
          minWidth: 225,
          maxWidth: 225
        }
      ],
      defaultToolPanel: ''
    }
  }), []);

  // Grid Ready 이벤트
  const onGridReady = useCallback(params => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  }, []);

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
    if (gridApi) {
      gridApi.setQuickFilter(quickFilter);
    }
  }, [quickFilter, gridApi]);

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

  return (
    <div className="unified-bom-grid h-full w-full flex flex-col">
      {/* 툴바 */}
      <div className="grid-toolbar flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
        <input
          type="text"
          placeholder="빠른 검색..."
          className="px-3 py-1 bg-gray-700 text-white rounded"
          value={quickFilter}
          onChange={e => setQuickFilter(e.target.value)}
        />
        <button
          onClick={exportToExcel}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Excel 내보내기
        </button>
        <button
          onClick={() => gridApi?.expandAll()}
          className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          모두 펼치기
        </button>
        <button
          onClick={() => gridApi?.collapseAll()}
          className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          모두 접기
        </button>
        <span className="ml-auto text-gray-400">
          선택: {selectedRows.length}개 / 전체: {rowData.length}개
        </span>
      </div>

      {/* 그리드 */}
      <div className={`${theme} flex-1`}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          gridOptions={gridOptions}
          onGridReady={onGridReady}
          onCellEditingStopped={onCellEditingStoppedHandler}
          onSelectionChanged={onSelectionChangedHandler}
          onRowDragEnd={onRowDragEnd}
          getContextMenuItems={getContextMenuItems}
        />
      </div>
    </div>
  );
};

export default UnifiedBOMGrid;