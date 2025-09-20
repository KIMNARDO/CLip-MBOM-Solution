import React, { useState, useCallback } from 'react';
import { useBOM } from '../contexts/BOMContext';
import { useTheme } from '../contexts/ThemeContext';

/**
 * 툴바 컴포넌트
 * 전역 액션 버튼들 제공
 */
export const Toolbar = () => {
  const { theme } = useTheme();
  const {
    addRoot,
    expandAll,
    collapseAll,
    addColumn,
    removeColumn,
    columns,
    visibleItems
  } = useBOM();

  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnField, setNewColumnField] = useState('');
  const [newColumnHeader, setNewColumnHeader] = useState('');
  const [columnToRemove, setColumnToRemove] = useState('');

  // 컬럼 추가 처리
  const handleAddColumn = useCallback(() => {
    if (newColumnField && newColumnHeader) {
      addColumn(newColumnField, newColumnHeader);
      setNewColumnField('');
      setNewColumnHeader('');
      setShowAddColumn(false);
    }
  }, [newColumnField, newColumnHeader, addColumn]);

  // 컬럼 제거 처리
  const handleRemoveColumn = useCallback(() => {
    if (columnToRemove) {
      removeColumn(columnToRemove);
      setColumnToRemove('');
    }
  }, [columnToRemove, removeColumn]);

  // CSV 내보내기
  const exportToCSV = useCallback(() => {
    const headers = ['Level', ...columns.map(col => col.header)];
    const rows = visibleItems.map(item => {
      const row = [item.level.toString()];
      columns.forEach(col => {
        row.push(String(item.data[col.field] || ''));
      });
      return row;
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `BOM_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  }, [columns, visibleItems]);

  return (
    <div className={`border-b p-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
      <div className="flex items-center gap-2">
        {/* 루트 추가 */}
        <button
          onClick={addRoot}
          className={`px-3 py-1 rounded text-sm text-white ${theme === 'dark' ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'}`}
        >
          + 루트 추가
        </button>

        {/* 모두 펼치기/접기 */}
        <button
          onClick={expandAll}
          className={`px-3 py-1 rounded text-sm text-white ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
        >
          모두 펼치기
        </button>

        <button
          onClick={collapseAll}
          className={`px-3 py-1 rounded text-sm text-white ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
        >
          모두 접기
        </button>

        {/* 구분선 */}
        <div className="w-px h-6 bg-gray-600" />

        {/* 컬럼 관리 */}
        <div className="flex items-center gap-2">
          {showAddColumn ? (
            <>
              <input
                type="text"
                placeholder="Field name"
                value={newColumnField}
                onChange={(e) => setNewColumnField(e.target.value)}
                className="px-2 py-1 bg-gray-700 rounded text-sm w-28"
                onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
              />
              <input
                type="text"
                placeholder="Header"
                value={newColumnHeader}
                onChange={(e) => setNewColumnHeader(e.target.value)}
                className="px-2 py-1 bg-gray-700 rounded text-sm w-28"
                onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
              />
              <button
                onClick={handleAddColumn}
                className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
              >
                추가
              </button>
              <button
                onClick={() => {
                  setShowAddColumn(false);
                  setNewColumnField('');
                  setNewColumnHeader('');
                }}
                className="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
              >
                취소
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAddColumn(true)}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm"
            >
              + 컬럼 추가
            </button>
          )}

          {/* 컬럼 제거 */}
          <select
            value={columnToRemove}
            onChange={(e) => setColumnToRemove(e.target.value)}
            className="px-2 py-1 bg-gray-700 rounded text-sm"
          >
            <option value="">컬럼 제거...</option>
            {columns.map(col => (
              <option key={col.field} value={col.field}>
                {col.header}
              </option>
            ))}
          </select>

          {columnToRemove && (
            <button
              onClick={handleRemoveColumn}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
            >
              제거
            </button>
          )}
        </div>

        {/* 구분선 */}
        <div className="w-px h-6 bg-gray-600" />

        {/* 내보내기 */}
        <button
          onClick={exportToCSV}
          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
        >
          📥 CSV 내보내기
        </button>

        {/* 우측 정보 */}
        <div className="ml-auto text-sm text-gray-400">
          총 {visibleItems.length}개 항목
        </div>
      </div>
    </div>
  );
};