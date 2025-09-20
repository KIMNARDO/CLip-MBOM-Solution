import React, { useState, useEffect, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useNotification } from '../../contexts/NotificationContext';
import { useBOMData } from '../../contexts/BOMDataContext';
import { useTheme } from '../../contexts/ThemeContext';

const EBOMMBOMComparison = ({ ebomData, mbomData, onSync }) => {
  const { showSuccess, showError, showInfo, showWarning } = useNotification();
  const { updateBOMItem } = useBOMData();
  const { theme } = useTheme();

  const [comparisonData, setComparisonData] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filterMode, setFilterMode] = useState('all'); // all, added, deleted, modified, matched
  const [gridApi, setGridApi] = useState(null);

  // EBOM과 MBOM 데이터 비교
  useEffect(() => {
    if (!ebomData || !mbomData) return;

    const comparison = compareEBOMMBOM(ebomData, mbomData);
    setComparisonData(comparison);
  }, [ebomData, mbomData]);

  // 비교 로직
  const compareEBOMMBOM = (eBOM, mBOM) => {
    const result = [];
    const mbomMap = new Map();

    // MBOM 데이터를 맵으로 변환
    const flattenMBOM = (items, parent = null) => {
      items.forEach(item => {
        const key = `${item.partNumber}_${parent || 'ROOT'}`;
        mbomMap.set(key, item);

        if (item.children && item.children.length > 0) {
          flattenMBOM(item.children, item.partNumber);
        }
      });
    };

    flattenMBOM(mBOM);

    // EBOM 데이터와 비교
    const compareItems = (eBOMItems, parentPart = null) => {
      eBOMItems.forEach(eBOMItem => {
        const key = `${eBOMItem.partNumber}_${parentPart || 'ROOT'}`;
        const mBOMItem = mbomMap.get(key);

        const comparisonItem = {
          id: eBOMItem.id || `compare_${Date.now()}_${Math.random()}`,
          partNumber: eBOMItem.partNumber,
          description: eBOMItem.description,
          level: eBOMItem.level,
          parent: parentPart,

          // EBOM 데이터
          ebomQuantity: eBOMItem.quantity,
          ebomUnit: eBOMItem.unit,
          ebomOperation: eBOMItem.operation,
          ebomWorkcenter: eBOMItem.workcenter,
          ebomSupplier: eBOMItem.supplier,
          ebomLeadtime: eBOMItem.leadtime,
          ebomCost: eBOMItem.cost,

          // MBOM 데이터
          mbomQuantity: mBOMItem?.quantity || null,
          mbomUnit: mBOMItem?.unit || null,
          mbomOperation: mBOMItem?.operation || null,
          mbomWorkcenter: mBOMItem?.workcenter || null,
          mbomSupplier: mBOMItem?.supplier || null,
          mbomLeadtime: mBOMItem?.leadtime || null,
          mbomCost: mBOMItem?.cost || null,

          // 비교 상태
          status: 'matched',
          differences: [],
          quantityDiff: 0,
          costDiff: 0,
          leadtimeDiff: 0
        };

        // 차이점 계산
        if (!mBOMItem) {
          comparisonItem.status = 'added';
          comparisonItem.differences.push('신규 항목 (EBOM에만 존재)');
        } else {
          // 수량 차이
          if (eBOMItem.quantity !== mBOMItem.quantity) {
            comparisonItem.status = 'modified';
            comparisonItem.quantityDiff = eBOMItem.quantity - mBOMItem.quantity;
            comparisonItem.differences.push(`수량: ${mBOMItem.quantity} → ${eBOMItem.quantity}`);
          }

          // 비용 차이
          if (eBOMItem.cost !== mBOMItem.cost) {
            comparisonItem.status = 'modified';
            comparisonItem.costDiff = (eBOMItem.cost || 0) - (mBOMItem.cost || 0);
            comparisonItem.differences.push(`비용: ${mBOMItem.cost || 0} → ${eBOMItem.cost || 0}`);
          }

          // 리드타임 차이
          if (eBOMItem.leadtime !== mBOMItem.leadtime) {
            comparisonItem.status = 'modified';
            comparisonItem.leadtimeDiff = (eBOMItem.leadtime || 0) - (mBOMItem.leadtime || 0);
            comparisonItem.differences.push(`리드타임: ${mBOMItem.leadtime || 0} → ${eBOMItem.leadtime || 0}`);
          }

          // 기타 필드 차이
          if (eBOMItem.operation !== mBOMItem.operation) {
            comparisonItem.status = 'modified';
            comparisonItem.differences.push(`작업: ${mBOMItem.operation || '-'} → ${eBOMItem.operation || '-'}`);
          }

          if (eBOMItem.workcenter !== mBOMItem.workcenter) {
            comparisonItem.status = 'modified';
            comparisonItem.differences.push(`작업장: ${mBOMItem.workcenter || '-'} → ${eBOMItem.workcenter || '-'}`);
          }

          if (eBOMItem.supplier !== mBOMItem.supplier) {
            comparisonItem.status = 'modified';
            comparisonItem.differences.push(`공급업체: ${mBOMItem.supplier || '-'} → ${eBOMItem.supplier || '-'}`);
          }
        }

        result.push(comparisonItem);
        mbomMap.delete(key); // 처리된 MBOM 항목 제거

        // 하위 항목 비교
        if (eBOMItem.children && eBOMItem.children.length > 0) {
          compareItems(eBOMItem.children, eBOMItem.partNumber);
        }
      });
    };

    compareItems(eBOM);

    // MBOM에만 있는 항목 (삭제된 항목)
    mbomMap.forEach((mBOMItem, key) => {
      result.push({
        id: `deleted_${mBOMItem.id}`,
        partNumber: mBOMItem.partNumber,
        description: mBOMItem.description,
        level: mBOMItem.level,
        parent: key.split('_')[1],

        ebomQuantity: null,
        ebomUnit: null,
        ebomOperation: null,
        ebomWorkcenter: null,
        ebomSupplier: null,
        ebomLeadtime: null,
        ebomCost: null,

        mbomQuantity: mBOMItem.quantity,
        mbomUnit: mBOMItem.unit,
        mbomOperation: mBOMItem.operation,
        mbomWorkcenter: mBOMItem.workcenter,
        mbomSupplier: mBOMItem.supplier,
        mbomLeadtime: mBOMItem.leadtime,
        mbomCost: mBOMItem.cost,

        status: 'deleted',
        differences: ['삭제된 항목 (MBOM에만 존재)'],
        quantityDiff: -(mBOMItem.quantity || 0),
        costDiff: -(mBOMItem.cost || 0),
        leadtimeDiff: -(mBOMItem.leadtime || 0)
      });
    });

    return result;
  };

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    if (filterMode === 'all') return comparisonData;
    return comparisonData.filter(item => item.status === filterMode);
  }, [comparisonData, filterMode]);

  // Grid 컬럼 정의
  const columnDefs = [
    {
      headerName: '상태',
      field: 'status',
      width: 100,
      pinned: 'left',
      cellRenderer: (params) => {
        const statusIcons = {
          matched: { icon: '✅', color: '#27ae60' },
          modified: { icon: '⚠️', color: '#f39c12' },
          added: { icon: '➕', color: '#3498db' },
          deleted: { icon: '➖', color: '#e74c3c' }
        };
        const status = statusIcons[params.value] || { icon: '❓', color: '#7f8c8d' };
        return `<span style="color: ${status.color}; font-size: 18px;">${status.icon}</span>`;
      },
      headerCheckboxSelection: true,
      checkboxSelection: true
    },
    {
      headerName: '품번',
      field: 'partNumber',
      width: 150,
      pinned: 'left'
    },
    {
      headerName: '품명',
      field: 'description',
      width: 200
    },
    {
      headerName: '레벨',
      field: 'level',
      width: 80,
      cellStyle: { textAlign: 'center' }
    },
    {
      headerName: 'EBOM',
      children: [
        {
          headerName: '수량',
          field: 'ebomQuantity',
          width: 100,
          cellStyle: (params) => ({
            backgroundColor: params.data.quantityDiff !== 0 ? '#fff3cd' : 'transparent'
          })
        },
        {
          headerName: '단위',
          field: 'ebomUnit',
          width: 80
        },
        {
          headerName: '작업',
          field: 'ebomOperation',
          width: 100
        },
        {
          headerName: '작업장',
          field: 'ebomWorkcenter',
          width: 100
        },
        {
          headerName: '공급업체',
          field: 'ebomSupplier',
          width: 120
        },
        {
          headerName: '리드타임',
          field: 'ebomLeadtime',
          width: 100,
          cellStyle: (params) => ({
            backgroundColor: params.data.leadtimeDiff !== 0 ? '#fff3cd' : 'transparent'
          })
        },
        {
          headerName: '비용',
          field: 'ebomCost',
          width: 120,
          valueFormatter: (params) => {
            if (params.value == null) return '-';
            return new Intl.NumberFormat('ko-KR', {
              style: 'currency',
              currency: 'KRW'
            }).format(params.value);
          },
          cellStyle: (params) => ({
            backgroundColor: params.data.costDiff !== 0 ? '#fff3cd' : 'transparent'
          })
        }
      ]
    },
    {
      headerName: 'MBOM',
      children: [
        {
          headerName: '수량',
          field: 'mbomQuantity',
          width: 100,
          cellStyle: (params) => ({
            backgroundColor: params.data.quantityDiff !== 0 ? '#ffebee' : 'transparent'
          })
        },
        {
          headerName: '단위',
          field: 'mbomUnit',
          width: 80
        },
        {
          headerName: '작업',
          field: 'mbomOperation',
          width: 100
        },
        {
          headerName: '작업장',
          field: 'mbomWorkcenter',
          width: 100
        },
        {
          headerName: '공급업체',
          field: 'mbomSupplier',
          width: 120
        },
        {
          headerName: '리드타임',
          field: 'mbomLeadtime',
          width: 100,
          cellStyle: (params) => ({
            backgroundColor: params.data.leadtimeDiff !== 0 ? '#ffebee' : 'transparent'
          })
        },
        {
          headerName: '비용',
          field: 'mbomCost',
          width: 120,
          valueFormatter: (params) => {
            if (params.value == null) return '-';
            return new Intl.NumberFormat('ko-KR', {
              style: 'currency',
              currency: 'KRW'
            }).format(params.value);
          },
          cellStyle: (params) => ({
            backgroundColor: params.data.costDiff !== 0 ? '#ffebee' : 'transparent'
          })
        }
      ]
    },
    {
      headerName: '차이',
      children: [
        {
          headerName: '수량 차이',
          field: 'quantityDiff',
          width: 100,
          cellStyle: (params) => ({
            color: params.value > 0 ? '#27ae60' : params.value < 0 ? '#e74c3c' : '#7f8c8d',
            fontWeight: params.value !== 0 ? 'bold' : 'normal'
          }),
          valueFormatter: (params) => {
            if (params.value === 0) return '-';
            return params.value > 0 ? `+${params.value}` : `${params.value}`;
          }
        },
        {
          headerName: '비용 차이',
          field: 'costDiff',
          width: 120,
          cellStyle: (params) => ({
            color: params.value > 0 ? '#e74c3c' : params.value < 0 ? '#27ae60' : '#7f8c8d',
            fontWeight: params.value !== 0 ? 'bold' : 'normal'
          }),
          valueFormatter: (params) => {
            if (params.value === 0) return '-';
            const formatted = new Intl.NumberFormat('ko-KR', {
              style: 'currency',
              currency: 'KRW'
            }).format(Math.abs(params.value));
            return params.value > 0 ? `+${formatted}` : `-${formatted}`;
          }
        },
        {
          headerName: '변경사항',
          field: 'differences',
          width: 300,
          autoHeight: true,
          wrapText: true,
          cellRenderer: (params) => {
            if (!params.value || params.value.length === 0) return '-';
            return params.value.join('<br>');
          }
        }
      ]
    }
  ];

  // Grid 옵션
  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    suppressMenu: false
  };

  const gridOptions = {
    rowSelection: 'multiple',
    rowMultiSelectWithClick: true,
    suppressRowClickSelection: false,
    animateRows: true,
    groupDefaultExpanded: -1,
    getRowStyle: (params) => {
      const styles = {
        matched: { backgroundColor: 'transparent' },
        modified: { backgroundColor: 'rgba(243, 156, 18, 0.1)' },
        added: { backgroundColor: 'rgba(52, 152, 219, 0.1)' },
        deleted: { backgroundColor: 'rgba(231, 76, 60, 0.1)' }
      };
      return styles[params.data.status] || {};
    }
  };

  // MBOM에 변경사항 적용
  const applyChangesToMBOM = () => {
    const selected = gridApi.getSelectedRows();
    if (selected.length === 0) {
      showWarning('적용할 항목을 선택해주세요');
      return;
    }

    const confirmed = window.confirm(
      `${selected.length}개 항목의 EBOM 변경사항을 MBOM에 적용하시겠습니까?`
    );

    if (confirmed) {
      selected.forEach(item => {
        if (item.status === 'modified' || item.status === 'added') {
          // MBOM 업데이트
          updateBOMItem(item.id, {
            quantity: item.ebomQuantity,
            unit: item.ebomUnit,
            operation: item.ebomOperation,
            workcenter: item.ebomWorkcenter,
            supplier: item.ebomSupplier,
            leadtime: item.ebomLeadtime,
            cost: item.ebomCost,
            syncedFromEBOM: true,
            lastSyncDate: new Date().toISOString()
          });
        }
      });

      showSuccess(`${selected.length}개 항목이 MBOM에 반영되었습니다`);
      if (onSync) onSync(selected);
    }
  };

  // 통계 정보
  const statistics = useMemo(() => {
    return {
      total: comparisonData.length,
      matched: comparisonData.filter(item => item.status === 'matched').length,
      modified: comparisonData.filter(item => item.status === 'modified').length,
      added: comparisonData.filter(item => item.status === 'added').length,
      deleted: comparisonData.filter(item => item.status === 'deleted').length,
      totalQuantityDiff: comparisonData.reduce((sum, item) => sum + item.quantityDiff, 0),
      totalCostDiff: comparisonData.reduce((sum, item) => sum + item.costDiff, 0)
    };
  }, [comparisonData]);

  // Excel 내보내기
  const exportToExcel = () => {
    gridApi.exportDataAsExcel({
      fileName: `EBOM_MBOM_Comparison_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'Comparison',
      author: 'MBOM System',
      processCellCallback: (params) => {
        if (params.column.getColId() === 'status') {
          const statusText = {
            matched: '일치',
            modified: '수정됨',
            added: '추가됨',
            deleted: '삭제됨'
          };
          return statusText[params.value] || params.value;
        }
        return params.value;
      }
    });
    showSuccess('Excel 파일이 다운로드되었습니다');
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: theme === 'dark' ? '#1e1e1e' : '#f9fafb' }}>
      {/* Header */}
      <div style={{
        padding: '15px 20px',
        background: theme === 'dark' ? '#2d2d30' : '#ffffff',
        borderBottom: theme === 'dark' ? '1px solid #3e3e42' : '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h2 style={{ margin: 0, color: theme === 'dark' ? '#cccccc' : '#111827' }}>🔍 EBOM vs MBOM 비교 분석</h2>

          {/* Filter buttons */}
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              className={`vscode-button ${filterMode === 'all' ? '' : 'secondary'}`}
              onClick={() => setFilterMode('all')}
              style={{ padding: '4px 10px', fontSize: '12px' }}
            >
              전체 ({statistics.total})
            </button>
            <button
              className={`vscode-button ${filterMode === 'matched' ? '' : 'secondary'}`}
              onClick={() => setFilterMode('matched')}
              style={{ padding: '4px 10px', fontSize: '12px' }}
            >
              ✅ 일치 ({statistics.matched})
            </button>
            <button
              className={`vscode-button ${filterMode === 'modified' ? '' : 'secondary'}`}
              onClick={() => setFilterMode('modified')}
              style={{ padding: '4px 10px', fontSize: '12px' }}
            >
              ⚠️ 수정 ({statistics.modified})
            </button>
            <button
              className={`vscode-button ${filterMode === 'added' ? '' : 'secondary'}`}
              onClick={() => setFilterMode('added')}
              style={{ padding: '4px 10px', fontSize: '12px' }}
            >
              ➕ 추가 ({statistics.added})
            </button>
            <button
              className={`vscode-button ${filterMode === 'deleted' ? '' : 'secondary'}`}
              onClick={() => setFilterMode('deleted')}
              style={{ padding: '4px 10px', fontSize: '12px' }}
            >
              ➖ 삭제 ({statistics.deleted})
            </button>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="vscode-button" onClick={applyChangesToMBOM}>
            📥 선택 항목 MBOM 적용
          </button>
          <button className="vscode-button secondary" onClick={exportToExcel}>
            📊 Excel 내보내기
          </button>
        </div>
      </div>

      {/* Statistics Bar */}
      <div style={{
        padding: '10px 20px',
        background: theme === 'dark' ? '#252526' : '#f3f4f6',
        borderBottom: theme === 'dark' ? '1px solid #3e3e42' : '1px solid #e5e7eb',
        display: 'flex',
        gap: '30px',
        fontSize: '13px',
        color: theme === 'dark' ? '#969696' : '#6b7280'
      }}>
        <div>
          <strong>총 수량 차이:</strong>{' '}
          <span style={{
            color: statistics.totalQuantityDiff > 0 ? '#27ae60' :
                   statistics.totalQuantityDiff < 0 ? '#e74c3c' : (theme === 'dark' ? '#cccccc' : '#111827'),
            fontWeight: 'bold'
          }}>
            {statistics.totalQuantityDiff > 0 ? '+' : ''}{statistics.totalQuantityDiff}
          </span>
        </div>
        <div>
          <strong>총 비용 차이:</strong>{' '}
          <span style={{
            color: statistics.totalCostDiff > 0 ? '#e74c3c' :
                   statistics.totalCostDiff < 0 ? '#27ae60' : (theme === 'dark' ? '#cccccc' : '#111827'),
            fontWeight: 'bold'
          }}>
            {new Intl.NumberFormat('ko-KR', {
              style: 'currency',
              currency: 'KRW'
            }).format(Math.abs(statistics.totalCostDiff))}
            {statistics.totalCostDiff > 0 ? ' ▲' : statistics.totalCostDiff < 0 ? ' ▼' : ''}
          </span>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          선택된 항목: <strong>{selectedItems.length}</strong>개
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1 }} className={theme === 'dark' ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'}>
        <AgGridReact
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowData={filteredData}
          gridOptions={gridOptions}
          onGridReady={(params) => {
            setGridApi(params.api);
            params.api.sizeColumnsToFit();
          }}
          onSelectionChanged={(params) => {
            const selected = params.api.getSelectedRows();
            setSelectedItems(selected);
          }}
        />
      </div>
    </div>
  );
};

export default EBOMMBOMComparison;