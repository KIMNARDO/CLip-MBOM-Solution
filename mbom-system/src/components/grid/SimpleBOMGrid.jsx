import React, { useState, useMemo } from 'react';
import { useBOMData } from '../../contexts/BOMDataContext';
import { useTheme } from '../../contexts/ThemeContext';
import EnhancedLevelIndicator from '../level/EnhancedLevelIndicator';

/**
 * SimpleBOMGrid - ag-Grid 대신 간단한 HTML 테이블을 사용하는 BOM 그리드
 */
const SimpleBOMGrid = ({ data, onSelectionChanged }) => {
  const { theme } = useTheme();
  const [selectedRows, setSelectedRows] = useState([]);
  const [quickFilter, setQuickFilter] = useState('');

  // 데이터 준비
  const rowData = useMemo(() => {
    console.log('SimpleBOMGrid - Received data:', data);
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn('SimpleBOMGrid - No data received!');
      return [];
    }

    // 트리 데이터를 플랫 리스트로 변환
    const flattenData = (items, level = 0) => {
      const result = [];
      items.forEach(item => {
        result.push({ ...item, level });
        if (item.children && item.children.length > 0) {
          result.push(...flattenData(item.children, level + 1));
        }
      });
      return result;
    };

    const flatData = flattenData(data);
    console.log('SimpleBOMGrid - Flattened data:', flatData);
    
    return flatData;
  }, [data]);

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    if (!quickFilter) return rowData;
    
    return rowData.filter(item => 
      item.partNumber?.toLowerCase().includes(quickFilter.toLowerCase()) ||
      item.description?.toLowerCase().includes(quickFilter.toLowerCase())
    );
  }, [rowData, quickFilter]);

  // 행 선택 처리
  const handleRowClick = (item) => {
    const isSelected = selectedRows.find(row => row.id === item.id);
    let newSelected;
    
    if (isSelected) {
      newSelected = selectedRows.filter(row => row.id !== item.id);
    } else {
      newSelected = [...selectedRows, item];
    }
    
    setSelectedRows(newSelected);
    if (onSelectionChanged) {
      onSelectionChanged(newSelected);
    }
  };

  console.log('SimpleBOMGrid - Rendering with filteredData:', filteredData);

  return (
    <div className="simple-bom-grid h-full w-full flex flex-col" style={{ height: '100%', width: '100%' }}>
      {/* 툴바 */}
      <div className={`grid-toolbar flex items-center gap-2 p-2 border-b ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
        <input
          type="text"
          placeholder="빠른 검색..."
          className={`px-3 py-1 rounded ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-300'}`}
          value={quickFilter}
          onChange={e => setQuickFilter(e.target.value)}
        />
        <button
          onClick={() => {
            const csvContent = filteredData.map(item => 
              `${item.partNumber},${item.description},${item.quantity},${item.unit}`
            ).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `BOM_Export_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
          }}
          className={`px-3 py-1 rounded ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
        >
          CSV 내보내기
        </button>
        <span className={`ml-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          선택: {selectedRows.length}개 / 전체: {filteredData.length}개
        </span>
      </div>

      {/* 데이터 상태 표시 */}
      {!data || data.length === 0 ? (
        <div className={`flex-1 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
          <div className="text-center">
            <h3 className="text-xl mb-2">데이터를 로딩 중입니다...</h3>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>BOM 데이터가 없거나 로딩 중입니다.</p>
            <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>데이터 타입: {typeof data}, 길이: {data ? data.length : 'null'}</p>
          </div>
        </div>
      ) : (
        /* HTML 테이블 */
        <div className={`flex-1 overflow-auto ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
          <table className={`w-full ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            <thead className={`sticky top-0 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <tr>
                <th className={`p-2 text-left border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>Level</th>
                <th className={`p-2 text-left border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>품번</th>
                <th className={`p-2 text-left border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>품명</th>
                <th className={`p-2 text-left border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>U/S</th>
                <th className={`p-2 text-left border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>단위</th>
                <th className={`p-2 text-left border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>작업장</th>
                <th className={`p-2 text-left border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>공급업체</th>
                <th className={`p-2 text-left border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>리드타임</th>
                <th className={`p-2 text-left border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>상태</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => {
                const isSelected = selectedRows.find(row => row.id === item.id);
                return (
                  <tr 
                    key={item.id || index} 
                    className={`border-b cursor-pointer ${theme === 'dark' ? 'hover:bg-gray-800 border-gray-700' : 'hover:bg-gray-100 border-gray-200'} ${
                      isSelected ? (theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100') : ''
                    }`}
                    style={{ paddingLeft: `${item.level * 20}px` }}
                    onClick={() => handleRowClick(item)}
                  >
                    <td className="p-2">
                      <EnhancedLevelIndicator
                        level={item.level || 0}
                        hasChildren={item.children && item.children.length > 0}
                        isExpanded={item.isExpanded}
                        partType={item.partType}
                        itemCount={item.children ? item.children.length : 0}
                        criticalPath={item.criticalPath}
                        changeStatus={item.diff_status}
                      />
                    </td>
                    <td className="p-2 font-mono">{item.partNumber}</td>
                    <td className="p-2">{item.description}</td>
                    <td className="p-2 text-right">{item.quantity}</td>
                    <td className="p-2">{item.unit}</td>
                    <td className="p-2">{item.workcenter || '-'}</td>
                    <td className="p-2">{item.supplier || '-'}</td>
                    <td className="p-2 text-right">{item.leadtime || 0}일</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.status === 'approved' ? (theme === 'dark' ? 'bg-green-600' : 'bg-green-500 text-white') :
                        item.status === 'review' ? (theme === 'dark' ? 'bg-yellow-600' : 'bg-yellow-500 text-white') :
                        item.status === 'draft' ? (theme === 'dark' ? 'bg-gray-600' : 'bg-gray-500 text-white') :
                        (theme === 'dark' ? 'bg-red-600' : 'bg-red-500 text-white')
                      }`}>
                        {item.status === 'approved' ? '승인' :
                         item.status === 'review' ? '검토중' :
                         item.status === 'draft' ? '작성중' :
                         item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SimpleBOMGrid;


