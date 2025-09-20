import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useBOMData } from '../../contexts/BOMDataContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import EnhancedLevelIndicator from '../level/EnhancedLevelIndicator';

/**
 * AdvancedBOMGrid - 원본 MBOM 대시보드의 완전한 그리드 기능을 React로 구현
 */
const AdvancedBOMGrid = ({ onSelectionChanged }) => {
  const gridRef = useRef();
  const { theme: appTheme } = useTheme();
  const gridTheme = appTheme === 'dark' ? 'ag-theme-alpine-dark' : 'ag-theme-alpine';
  const {
    bomData,
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

  const [gridApi, setGridApiState] = useState(null);
  const [columnApi, setColumnApi] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [levelCount, setLevelCount] = useState(5);

  // 고객사 목록
  const getCustomerList = () => [
    'Hyundai', 'KIA', 'GM', 'Renault', 'SsangYong', 'Mercedes-Benz', 'BMW', 'Volkswagen'
  ];

  // 차종 목록 (고객사별)
  const getVehicleList = (customer) => {
    const vehicles = {
      'Hyundai': ['Sonata', 'Grandeur', 'Genesis', 'Santa Fe', 'Tucson', 'Kona'],
      'KIA': ['K5', 'K7', 'K9', 'Sportage', 'Sorento', 'Carnival'],
      'GM': ['Malibu', 'Trax', 'Equinox', 'Tahoe'],
      'default': ['Model A', 'Model B', 'Model C']
    };
    return vehicles[customer] || vehicles.default;
  };

  // 프로젝트 목록
  const getProjectList = (vehicle) => {
    return [
      `${vehicle}-2024MY`,
      `${vehicle}-2025MY`,
      `${vehicle}-Facelift`,
      `${vehicle}-EV`
    ];
  };

  // 레벨 컬럼 동적 생성
  const getLevelColumns = useCallback(() => {
    return [{
      headerName: 'LEVEL',
      field: 'level',
      width: 120,
      pinned: 'left',
      cellRenderer: (params) => {
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
    }];
  }, [levelCount]);

  // 컬럼 정의
  const columnDefs = useMemo(() => [
    // 체크박스 선택
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      width: 50,
      pinned: 'left',
      headerClass: appTheme === 'dark' ? 'ag-header-cell-dark' : '',
      cellClass: appTheme === 'dark' ? 'ag-cell-dark' : ''
    },

    // 순번
    {
      headerName: '순번',
      field: 'seq',
      width: 70,
      pinned: 'left',
      editable: false,
      valueGetter: 'node.rowIndex + 1',
      cellStyle: { textAlign: 'center', color: '#969696' }
    },

    // 고객사
    {
      headerName: '고객사',
      field: 'customer',
      width: 120,
      pinned: 'left',
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: getCustomerList()
      }
    },

    // 차종
    {
      headerName: '차종',
      field: 'vehicle',
      width: 120,
      pinned: 'left',
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: (params) => ({
        values: getVehicleList(params.data?.customer)
      })
    },

    // 프로젝트
    {
      headerName: '프로젝트',
      field: 'project',
      width: 150,
      pinned: 'left',
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: (params) => ({
        values: getProjectList(params.data?.vehicle)
      })
    },

    // Part 구조 - 들여쓰기로 계층 표현
    {
      headerName: 'Part Structure',
      field: 'partNumber',
      width: 350,
      pinned: 'left',
      cellRenderer: (params) => {
        const depth = params.data?.depth || 0;
        const indent = '　'.repeat(depth * 2); // 들여쓰기
        const icon = depth === 0 ? '📦' : depth === 1 ? '🔧' : '⚙️';
        const hasChildren = params.data?.hasChildren;
        const expandIcon = hasChildren ? '▶ ' : '　';
        return `<span>${indent}${expandIcon}${icon} ${params.value || ''}</span>`;
      },
      cellStyle: (params) => {
        const depth = params.data?.depth || 0;
        return {
          fontWeight: depth === 0 ? 'bold' : 'normal',
          color: depth === 0 ? '#4fc3f7' : depth === 1 ? '#81c784' : '#cccccc'
        };
      }
    },

    // 레벨 컬럼들
    ...getLevelColumns(),

    // Part No. 그룹
    {
      headerName: 'Part No.',
      children: [
        {
          headerName: '품번',
          field: 'partNumber',
          width: 150
        },
        {
          headerName: 'S/ON 품번',
          field: 'sonPartNo',
          width: 150
        },
        {
          headerName: '설변 품번',
          field: 'changePartNo',
          width: 150
        }
      ]
    },

    // 품명 그룹
    {
      headerName: 'Part Name',
      children: [
        {
          headerName: '품명',
          field: 'description',
          width: 200
        },
        {
          headerName: 'S/ON 품명',
          field: 'sonDescription',
          width: 200
        }
      ]
    },

    // U/S 수량 (품명 다음으로 이동)
    {
      headerName: 'U/S',
      field: 'quantity',
      width: 100,
      type: 'numericColumn',
      cellEditor: 'agNumberCellEditor',
      cellStyle: { textAlign: 'right' },
      valueFormatter: (params) => {
        if (params.value == null) return '';
        return params.value.toLocaleString();
      }
    },

    // 사양
    {
      headerName: '사양',
      field: 'specification',
      width: 150,
      cellEditor: 'agTextCellEditor'
    },

    // 수량 정보
    {
      headerName: 'Quantity',
      children: [
        {
          headerName: 'LOSS(%)',
          field: 'lossRate',
          width: 100,
          type: 'numericColumn',
          cellEditor: 'agNumberCellEditor',
          cellStyle: { textAlign: 'right' },
          valueFormatter: (params) => {
            if (params.value == null) return '';
            return params.value + '%';
          }
        },
        {
          headerName: '총수량',
          field: 'totalQuantity',
          width: 100,
          type: 'numericColumn',
          editable: false,
          cellStyle: { textAlign: 'right', backgroundColor: '#252526', fontWeight: 'bold' },
          valueGetter: (params) => {
            const qty = params.data?.quantity || 0;
            const loss = params.data?.lossRate || 0;
            return qty * (1 + loss / 100);
          },
          valueFormatter: (params) => {
            if (params.value == null) return '';
            return params.value.toLocaleString();
          }
        }
      ]
    },

    // 단위
    {
      headerName: '단위',
      field: 'unit',
      width: 80,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['EA', 'SET', 'KG', 'M', 'L', 'M2', 'M3']
      }
    },

    // 재질
    {
      headerName: '재질',
      field: 'material',
      width: 150
    },

    // 중량
    {
      headerName: '중량',
      field: 'weight',
      width: 100,
      type: 'numericColumn',
      cellEditor: 'agNumberCellEditor',
      cellStyle: { textAlign: 'right' },
      valueFormatter: (params) => {
        if (params.value == null) return '';
        return params.value + ' kg';
      }
    },

    // 공급업체 정보
    {
      headerName: 'Supplier Info',
      children: [
        {
          headerName: '공급업체',
          field: 'supplier',
          width: 150,
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            values: ['Supplier A', 'Supplier B', 'Supplier C', 'In-house']
          }
        },
        {
          headerName: '업체코드',
          field: 'supplierCode',
          width: 100
        },
        {
          headerName: '거래통화',
          field: 'currency',
          width: 80,
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            values: ['KRW', 'USD', 'EUR', 'JPY', 'CNY']
          }
        }
      ]
    },

    // 비용 정보
    {
      headerName: 'Cost Info',
      children: [
        {
          headerName: '단가',
          field: 'unitCost',
          width: 120,
          type: 'numericColumn',
          cellEditor: 'agNumberCellEditor',
          cellStyle: { textAlign: 'right' },
          valueFormatter: (params) => {
            if (params.value == null) return '';
            return new Intl.NumberFormat('ko-KR', {
              style: 'currency',
              currency: params.data?.currency || 'KRW'
            }).format(params.value);
          }
        },
        {
          headerName: '총비용',
          field: 'totalCost',
          width: 120,
          type: 'numericColumn',
          editable: false,
          cellStyle: { textAlign: 'right', backgroundColor: '#252526', fontWeight: 'bold' },
          valueGetter: (params) => {
            const unitCost = params.data?.unitCost || 0;
            const totalQty = params.getValue('totalQuantity') || 0;
            return unitCost * totalQty;
          },
          valueFormatter: (params) => {
            if (params.value == null) return '';
            return new Intl.NumberFormat('ko-KR', {
              style: 'currency',
              currency: params.data?.currency || 'KRW'
            }).format(params.value);
          }
        }
      ]
    },

    // 리드타임
    {
      headerName: '리드타임',
      field: 'leadTime',
      width: 100,
      type: 'numericColumn',
      cellEditor: 'agNumberCellEditor',
      cellStyle: (params) => {
        const leadTime = params.value || 0;
        if (leadTime > 30) {
          return { textAlign: 'right', color: '#e74c3c', fontWeight: 'bold' };
        }
        return { textAlign: 'right' };
      },
      valueFormatter: (params) => {
        if (params.value == null) return '';
        return params.value + '일';
      }
    },

    // 공정 정보
    {
      headerName: 'Process Info',
      children: [
        {
          headerName: '작업',
          field: 'operation',
          width: 100
        },
        {
          headerName: '작업장',
          field: 'workcenter',
          width: 100
        },
        {
          headerName: '라인',
          field: 'line',
          width: 80
        }
      ]
    },

    // 상태
    {
      headerName: '상태',
      field: 'status',
      width: 100,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['draft', 'pending', 'approved', 'rejected', 'review']
      },
      cellStyle: (params) => {
        const statusColors = {
          draft: '#969696',
          pending: '#f39c12',
          approved: '#27ae60',
          rejected: '#e74c3c',
          review: '#3498db'
        };
        return {
          backgroundColor: statusColors[params.value] || 'transparent',
          color: 'white',
          textAlign: 'center',
          fontWeight: 'bold'
        };
      },
      valueFormatter: (params) => {
        const statusLabels = {
          draft: '작성중',
          pending: '대기',
          approved: '승인',
          rejected: '반려',
          review: '검토'
        };
        return statusLabels[params.value] || params.value;
      }
    },

    // 비고
    {
      headerName: '비고',
      field: 'remarks',
      width: 200,
      cellEditor: 'agLargeTextCellEditor',
      cellEditorPopup: true
    },

    // 생성/수정 정보
    {
      headerName: 'System Info',
      children: [
        {
          headerName: '생성일',
          field: 'createdDate',
          width: 120,
          editable: false,
          valueFormatter: (params) => {
            if (!params.value) return '';
            return new Date(params.value).toLocaleDateString('ko-KR');
          }
        },
        {
          headerName: '생성자',
          field: 'createdBy',
          width: 100,
          editable: false
        },
        {
          headerName: '수정일',
          field: 'modifiedDate',
          width: 120,
          editable: false,
          valueFormatter: (params) => {
            if (!params.value) return '';
            return new Date(params.value).toLocaleDateString('ko-KR');
          }
        },
        {
          headerName: '수정자',
          field: 'modifiedBy',
          width: 100,
          editable: false
        }
      ]
    }
  ], [levelCount, getLevelColumns]);

  // 기본 컬럼 설정
  const defaultColDef = useMemo(() => ({
    editable: true,
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 80,
    suppressMenu: false
  }), []);

  // 그리드 옵션 - Community Edition 호환
  const gridOptions = useMemo(() => ({
    rowSelection: 'multiple',
    rowMultiSelectWithClick: true,
    suppressRowClickSelection: false,
    animateRows: true,
    rowDragManaged: false, // Community edition doesn't support managed row drag
    groupDefaultExpanded: 1,
    // treeData 제거 - Community Edition에서 지원 안함
    getRowId: (params) => params.data.id,
    getRowStyle: (params) => {
      if (params.data?.status === 'approved') {
        return { backgroundColor: 'rgba(39, 174, 96, 0.1)' };
      }
      if (params.data?.status === 'rejected') {
        return { backgroundColor: 'rgba(231, 76, 60, 0.1)' };
      }
      if (params.data?.isModified) {
        return { backgroundColor: 'rgba(243, 156, 18, 0.1)' };
      }
      return null;
    }
  }), []);

  // Flat 데이터로 변환 - Tree를 플랫하게 만들어서 Community Edition에서 사용
  const convertToFlatData = useCallback((items, parentId = null, depth = 0) => {
    if (!items || !Array.isArray(items)) return [];

    let flatData = [];

    items.forEach((item, index) => {
      // 현재 아이템을 플랫 데이터에 추가
      const flatItem = {
        ...item,
        id: item.id || `${parentId}_${index}`,
        parentId: parentId,
        depth: depth,
        customer: item.customer || 'Hyundai',
        vehicle: item.vehicle || 'Genesis',
        project: item.project || 'Genesis-2024MY',
        createdDate: item.createdDate || new Date().toISOString(),
        createdBy: item.createdBy || 'System',
        modifiedDate: item.modifiedDate || new Date().toISOString(),
        modifiedBy: item.modifiedBy || 'User',
        hasChildren: item.children && item.children.length > 0
      };

      flatData.push(flatItem);

      // 자식 아이템들을 재귀적으로 처리
      if (item.children && item.children.length > 0) {
        const childData = convertToFlatData(item.children, flatItem.id, depth + 1);
        flatData = flatData.concat(childData);
      }
    });

    return flatData;
  }, []);

  // 그리드 준비 완료
  const onGridReady = useCallback((params) => {
    console.log('AdvancedBOMGrid - Grid Ready');
    setGridApiState(params.api);
    setColumnApi(params.columnApi);
    setGridApi(params.api);

    // 플랫 데이터로 변환하여 설정
    console.log('AdvancedBOMGrid - BOM Data:', bomData);
    const flatData = convertToFlatData(bomData);
    console.log('AdvancedBOMGrid - Flat Data:', flatData);
    params.api.setRowData(flatData);

    // 컬럼 자동 조정
    params.api.sizeColumnsToFit();
  }, [bomData, convertToFlatData, setGridApi]);

  // 셀 값 변경
  const onCellValueChanged = useCallback((params) => {
    const updatedData = { ...params.data };
    updatedData.modifiedDate = new Date().toISOString();
    updatedData.modifiedBy = 'User';
    updatedData.isModified = true;

    updateBOMItem(updatedData.id, updatedData);
    showSuccess(`"${params.colDef.headerName}" 값이 변경되었습니다`);
  }, [updateBOMItem, showSuccess]);

  // 선택 변경
  const onRowSelected = useCallback((params) => {
    if (params.api) {
      const selectedNodes = params.api.getSelectedNodes();
      const selectedData = selectedNodes.map(node => node.data);
      setSelectedRows(selectedData);
      if (onSelectionChanged) {
        onSelectionChanged(selectedData);
      }
    }
  }, [onSelectionChanged]);

  // 컨텍스트 메뉴
  const onCellContextMenu = useCallback((params) => {
    params.event.preventDefault();
    // 컨텍스트 메뉴 구현
    console.log('Context menu at:', params);
  }, []);

  // 행 추가
  const addNewRow = useCallback(() => {
    const newRow = {
      id: `new_${Date.now()}`,
      partNumber: 'NEW-PART-001',
      description: '새 부품',
      level: 0,
      quantity: 1,
      unit: 'EA',
      status: 'draft',
      customer: 'Hyundai',
      vehicle: 'Genesis',
      project: 'Genesis-2024MY',
      treePath: ['NEW-PART-001'],
      createdDate: new Date().toISOString(),
      createdBy: 'User',
      isNew: true
    };

    if (gridApi) {
      const currentData = [];
      gridApi.forEachNode(node => currentData.push(node.data));
      currentData.push(newRow);

      const treeData = convertToFlatData(currentData);
      gridApi.setRowData(treeData);

      showSuccess('새 행이 추가되었습니다');
    }
  }, [gridApi, convertToFlatData, showSuccess]);

  // 선택된 행 삭제
  const deleteSelectedRows = useCallback(() => {
    if (gridApi) {
      const selectedNodes = gridApi.getSelectedNodes();
      if (selectedNodes.length === 0) {
        showWarning('삭제할 항목을 선택하세요');
        return;
      }

      const selectedIds = selectedNodes.map(node => node.data.id);
      const currentData = [];
      gridApi.forEachNode(node => {
        if (!selectedIds.includes(node.data.id)) {
          currentData.push(node.data);
        }
      });

      const treeData = convertToFlatData(currentData);
      gridApi.setRowData(treeData);

      showSuccess(`${selectedNodes.length}개 항목이 삭제되었습니다`);
    }
  }, [gridApi, convertToFlatData, showSuccess, showWarning]);

  // Excel 내보내기
  const exportToExcel = useCallback(() => {
    if (gridApi) {
      gridApi.exportDataAsExcel({
        fileName: `MBOM_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: 'MBOM Data',
        author: 'MBOM System'
      });
      showSuccess('Excel 파일이 다운로드되었습니다');
    }
  }, [gridApi, showSuccess]);

  // 데이터 새로고침
  useEffect(() => {
    if (gridApi && bomData) {
      const treeData = convertToFlatData(bomData);
      gridApi.setRowData(treeData);
    }
  }, [bomData, gridApi, convertToFlatData]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 툴바 */}
      <div style={{
        padding: '10px',
        background: '#2d2d30',
        borderBottom: '1px solid #3e3e42',
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
        <button className="vscode-button" onClick={addNewRow}>
          ➕ 행 추가
        </button>
        <button className="vscode-button secondary" onClick={deleteSelectedRows}>
          🗑️ 삭제
        </button>
        <button className="vscode-button secondary" onClick={exportToExcel}>
          📊 Excel 내보내기
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ fontSize: '12px', color: '#969696' }}>레벨 수:</label>
          <select
            value={levelCount}
            onChange={(e) => setLevelCount(Number(e.target.value))}
            style={{
              background: '#3c3c3c',
              color: '#cccccc',
              border: '1px solid #3e3e42',
              borderRadius: '4px',
              padding: '4px 8px'
            }}
          >
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
          </select>

          {selectedRows.length > 0 && (
            <span style={{ color: '#007acc', fontSize: '12px' }}>
              {selectedRows.length}개 선택됨
            </span>
          )}
        </div>
      </div>

      {/* AG-Grid */}
      <div style={{ flex: 1 }} className={gridTheme}>
        <AgGridReact
          ref={gridRef}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowData={[]}
          gridOptions={gridOptions}
          onGridReady={onGridReady}
          onCellValueChanged={onCellValueChanged}
          onRowSelected={onRowSelected}
          onCellContextMenu={onCellContextMenu}
          onSelectionChanged={onRowSelected}
        />
      </div>
    </div>
  );
};

export default AdvancedBOMGrid;