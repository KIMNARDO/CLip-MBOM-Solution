import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * 헤더 컨텍스트 메뉴 컴포넌트
 * 헤더 우클릭 시 나타나는 메뉴
 */
export const HeaderContextMenu = ({
  show,
  position,
  columnField,
  columnHeader,
  isRequired,
  onClose,
  onDelete,
  onColumnManager,
  onAutoFit,
  onResetWidth
}) => {
  const menuRef = useRef(null);
  const { theme } = useTheme();

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [show, onClose]);

  if (!show || !columnField) return null;

  const handleDelete = () => {
    if (isRequired) {
      alert(`'${columnHeader}' 컬럼은 필수 항목이므로 삭제할 수 없습니다.`);
    } else if (confirm(`'${columnHeader}' 컬럼을 삭제하시겠습니까?`)) {
      onDelete(columnField);
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className={`fixed z-50 rounded shadow-lg py-1 ${theme === 'dark' ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-300'}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <div className={`px-3 py-2 text-xs border-b ${theme === 'dark' ? 'text-gray-400 border-gray-700' : 'text-gray-600 border-gray-200'}`}>
        {columnHeader}
      </div>

      <button
        onClick={() => {
          onAutoFit(columnField);
          onClose();
        }}
        className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}
      >
        <span>↔️</span>
        자동 너비 맞춤
      </button>

      <button
        onClick={() => {
          onResetWidth(columnField);
          onClose();
        }}
        className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}
      >
        <span>🔄</span>
        너비 초기화
      </button>

      <div className="border-t border-gray-700 my-1" />

      <button
        onClick={() => {
          onColumnManager();
          onClose();
        }}
        className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}
      >
        <span>⚙️</span>
        컬럼 관리
      </button>

      <div className="border-t border-gray-700 my-1" />

      <button
        onClick={handleDelete}
        className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
          isRequired
            ? 'text-gray-500 cursor-not-allowed'
            : 'text-red-400 hover:bg-gray-700'
        }`}
        disabled={isRequired}
      >
        <span>🗑️</span>
        컬럼 삭제
        {isRequired && ' (필수)'}
      </button>
    </div>
  );
};