import React, { useState, useEffect, useRef } from 'react';
import { useBOM } from '../contexts/BOMContext';
import { useTheme } from '../contexts/ThemeContext';

/**
 * 컨텍스트 메뉴 컴포넌트
 * 우클릭 시 나타나는 메뉴
 */
export const ContextMenu = ({ show, position, itemId, onClose, onColumnManager, onAddColumn }) => {
  const menuRef = useRef(null);
  const { theme } = useTheme();
  const {
    addSibling,
    addChild,
    deleteItem,
    indent,
    outdent,
    itemsById,
    addRoot
  } = useBOM();

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

  if (!show) return null;

  const item = itemId ? itemsById[itemId] : null;

  const hasChildren = item.children.length > 0;

  const handleAction = (action) => {
    action();
    onClose();
  };

  const handleDelete = () => {
    if (hasChildren) {
      if (confirm(`"${item.data.partName}"의 하위 항목까지 모두 삭제됩니다. 계속하시겠습니까?`)) {
        deleteItem(itemId);
      }
    } else {
      deleteItem(itemId);
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
      {!itemId && (
        <button
          onClick={() => handleAction(() => addRoot())}
          className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}
        >
          <span className="text-yellow-400">📦</span>
          루트 BOM 추가
        </button>
      )}

      {itemId && (
        <button
          onClick={() => handleAction(() => addSibling(itemId))}
          className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}
        >
          <span className="text-blue-400">➕</span>
          형제 추가
        </button>
      )}

      {itemId && (
        <button
          onClick={() => handleAction(() => addChild(itemId))}
          className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}
        >
          <span className="text-green-400">➕</span>
          자식 추가
        </button>
      )}

      <div className="border-t border-gray-700 my-1" />

      {itemId && (
        <>
          <button
            onClick={() => handleAction(() => indent(itemId))}
            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}
          >
            <span className="text-purple-400">→</span>
            들여쓰기
          </button>

          <button
            onClick={() => handleAction(() => outdent(itemId))}
            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}
          >
            <span className="text-purple-400">←</span>
            내어쓰기
          </button>
        </>
      )}

      <div className="border-t border-gray-700 my-1" />

      <button
        onClick={() => {
          onColumnManager();
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center gap-2"
      >
        <span>⚙️</span>
        컬럼 관리
      </button>

      {onAddColumn && (
        <button
          onClick={() => {
            onAddColumn();
            onClose();
          }}
          className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}
        >
          <span>📊</span>
          컬럼 추가
        </button>
      )}

      <div className="border-t border-gray-700 my-1" />

      {itemId && (
        <button
          onClick={handleDelete}
          className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
        >
          <span>🗑️</span>
          삭제
        </button>
      )}
    </div>
  );
};