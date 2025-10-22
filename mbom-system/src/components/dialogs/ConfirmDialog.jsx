import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * 확인 대화상자 컴포넌트
 * 사용자 동작 확인을 위한 모달 대화상자
 */
export const ConfirmDialog = ({
  show,
  title = '확인',
  message = '계속하시겠습니까?',
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  type = 'info' // info, warning, danger
}) => {
  const { theme } = useTheme();

  console.log('ConfirmDialog rendered:', { show, title, confirmText, hasOnConfirm: !!onConfirm });

  if (!show) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return theme === 'dark'
          ? 'bg-yellow-900/20 border-yellow-500'
          : 'bg-yellow-50 border-yellow-400';
      case 'danger':
        return theme === 'dark'
          ? 'bg-red-900/20 border-red-500'
          : 'bg-red-50 border-red-400';
      default:
        return theme === 'dark'
          ? 'bg-blue-900/20 border-blue-500'
          : 'bg-blue-50 border-blue-400';
    }
  };

  const getButtonStyles = () => {
    switch (type) {
      case 'danger':
        return theme === 'dark'
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-red-500 hover:bg-red-600 text-white';
      default:
        return theme === 'dark'
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : 'bg-blue-500 hover:bg-blue-600 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />

      {/* 대화상자 */}
      <div className={`
        relative min-w-[400px] max-w-[600px] rounded-lg shadow-xl
        ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}
      `}>
        {/* 헤더 */}
        <div className={`
          px-6 py-4 border-b
          ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
        `}>
          <h3 className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {type === 'warning' && '⚠️ '}
            {type === 'danger' && '🚨 '}
            {title}
          </h3>
        </div>

        {/* 내용 */}
        <div className={`
          px-6 py-8 border-2 mx-4 my-4 rounded
          ${getTypeStyles()}
        `}>
          <p className={`text-sm whitespace-pre-line ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
          }`}>
            {message}
          </p>
        </div>

        {/* 버튼 */}
        <div className="px-6 py-4 flex justify-end gap-3">
          <button
            onClick={(e) => {
              console.log('Cancel button clicked');
              e.stopPropagation();
              if (onCancel) onCancel();
            }}
            className={`
              px-4 py-2 rounded text-sm font-medium transition-colors
              ${theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}
            `}
          >
            {cancelText}
          </button>
          <button
            onClick={(e) => {
              console.log('Confirm button clicked', { onConfirm: !!onConfirm });
              e.stopPropagation();
              if (onConfirm) onConfirm();
            }}
            className={`
              px-4 py-2 rounded text-sm font-medium transition-colors
              ${getButtonStyles()}
            `}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;