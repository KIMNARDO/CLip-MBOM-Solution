import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * 컬럼 관리 다이얼로그
 */
export const ColumnManager = ({ show, columns, visibleColumns, onClose, onApply }) => {
  const { theme } = useTheme();
  const [selected, setSelected] = useState(visibleColumns);

  if (!show) return null;

  const handleToggle = (field) => {
    setSelected(prev => {
      if (prev.includes(field)) {
        // 필수 컬럼은 숨길 수 없음
        const column = columns.find(c => c.field === field);
        if (column?.required) {
          alert('필수 컬럼은 숨길 수 없습니다.');
          return prev;
        }
        return prev.filter(f => f !== field);
      } else {
        return [...prev, field];
      }
    });
  };

  const handleApply = () => {
    onApply(selected);
    onClose();
  };

  const handleSelectAll = () => {
    setSelected(columns.map(c => c.field));
  };

  const handleDeselectAll = () => {
    // 필수 컬럼만 남김
    setSelected(columns.filter(c => c.required).map(c => c.field));
  };

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 ${theme === 'dark' ? 'bg-black/50' : 'bg-black/30'}`}>
      <div className={`rounded-lg w-96 max-h-[80vh] flex flex-col ${theme === 'dark' ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-300'}`}>
        <div className={`flex justify-between items-center px-4 py-3 border-b ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
          <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>컬럼 관리</h3>
          <button
            onClick={onClose}
            className={theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
          >
            ✕
          </button>
        </div>

        <div className={`flex gap-2 px-4 py-2 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={handleSelectAll}
            className={`px-3 py-1 text-white text-xs rounded ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            모두 선택
          </button>
          <button
            onClick={handleDeselectAll}
            className={`px-3 py-1 text-white text-xs rounded ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600'}`}
          >
            모두 해제
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {columns.map(column => (
              <label
                key={column.field}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(column.field)}
                  onChange={() => handleToggle(column.field)}
                  className="w-4 h-4"
                  disabled={column.required}
                />
                <span className={`text-sm ${column.required ? (theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600') : (theme === 'dark' ? 'text-white' : 'text-gray-900')}`}>
                  {column.header}
                  {column.required && ' (필수)'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className={`flex justify-end gap-2 px-4 py-3 border-t ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-white text-sm rounded ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600'}`}
          >
            취소
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
};