import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

/**
 * BOM 이동 경고 메시지 표시 컴포넌트
 * 드래그앤드롭 시 발생하는 규칙 위반 경고를 시각적으로 표시
 */
export const BOMWarningNotification = ({ message, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      setIsLeaving(false);

      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  if (!isVisible || !message) return null;

  return (
    <div
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] transition-all duration-300 ${
        isLeaving ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-start gap-3 min-w-[400px] max-w-[600px]">
        {/* 경고 아이콘 */}
        <div className="flex-shrink-0">
          <AlertCircle className="w-6 h-6 animate-pulse" />
        </div>

        {/* 메시지 내용 */}
        <div className="flex-1">
          <h4 className="font-bold text-base mb-1">BOM 이동 규칙 위반</h4>
          <p className="text-sm whitespace-pre-line opacity-95">{message}</p>
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 hover:bg-white/20 rounded p-1 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 프로그레스 바 */}
      <div className="h-1 bg-white/20 rounded-full overflow-hidden mt-2 mx-6">
        <div
          className="h-full bg-white animate-shrink"
          style={{
            animation: `shrink ${duration}ms linear forwards`
          }}
        />
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default BOMWarningNotification;