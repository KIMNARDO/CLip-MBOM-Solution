import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * 도면 미리보기 컴포넌트
 */
export const DrawingPreview = ({ show, type, partNumber, partName, onClose }) => {
  const { theme } = useTheme();
  if (!show) return null;

  // 샘플 도면 이미지 (실제로는 서버에서 가져와야 함)
  const drawingImages = {
    '2D': {
      'G4FG-2E000': '📐 ENGINE ASSY Technical Drawing',
      'G4FG-11100-A': '📏 CYLINDER BLOCK Drawing',
      'G4FG-11310-A': '📐 CYLINDER HEAD Drawing',
      'A6GF1-2C000': '📐 TRANSMISSION Drawing',
      'CN7-51100-2S000': '📏 CHASSIS FRAME Drawing',
      'default': '📋 Technical Drawing'
    },
    '3D': {
      'G4FG-2E000': '🎯 ENGINE ASSY 3D Model',
      'G4FG-11100-A': '🎲 CYLINDER BLOCK 3D Model',
      'G4FG-11310-A': '🎯 CYLINDER HEAD 3D Model',
      'A6GF1-2C000': '🎲 TRANSMISSION 3D Model',
      'CN7-51100-2S000': '🎯 CHASSIS FRAME 3D Model',
      'default': '📦 3D Model View'
    }
  };

  const getDrawingContent = () => {
    const drawings = drawingImages[type];
    return drawings[partNumber] || drawings.default;
  };

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 ${theme === 'dark' ? 'bg-black/70' : 'bg-black/50'}`} onClick={onClose}>
      <div
        className={`rounded-lg max-w-4xl max-h-[90vh] overflow-hidden ${theme === 'dark' ? 'bg-gray-900 border border-gray-600' : 'bg-white border border-gray-300'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className={`flex justify-between items-center px-4 py-3 border-b ${theme === 'dark' ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-gray-100'}`}>
          <div>
            <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {type} 도면 미리보기
            </h3>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {partNumber} - {partName}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`text-xl ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            ✕
          </button>
        </div>

        {/* 도면 영역 */}
        <div className={`p-8 ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'}`}>
          <div className="bg-white rounded-lg p-12 min-h-[500px] flex flex-col items-center justify-center">
            {/* 도면 표시 영역 */}
            <div className="text-6xl mb-4">
              {type === '2D' ? '📐' : '🎲'}
            </div>
            <div className="text-gray-800 text-lg font-medium mb-2">
              {getDrawingContent()}
            </div>
            <div className="text-gray-600 text-sm">
              Part Number: {partNumber}
            </div>
            <div className="text-gray-600 text-sm">
              Part Name: {partName}
            </div>

            {/* 도면 정보 테이블 */}
            <div className="mt-8 border border-gray-300 rounded">
              <table className="text-sm text-gray-700">
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="px-4 py-2 bg-gray-100 font-medium">Rev.</td>
                    <td className="px-4 py-2">A</td>
                    <td className="px-4 py-2 bg-gray-100 font-medium">Date</td>
                    <td className="px-4 py-2">2024.01.15</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="px-4 py-2 bg-gray-100 font-medium">Scale</td>
                    <td className="px-4 py-2">1:1</td>
                    <td className="px-4 py-2 bg-gray-100 font-medium">Unit</td>
                    <td className="px-4 py-2">mm</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 bg-gray-100 font-medium">Material</td>
                    <td className="px-4 py-2" colSpan="3">See BOM</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 실제 구현시에는 여기에 이미지나 PDF viewer를 넣어야 함 */}
            <div className="mt-6 p-4 bg-gray-100 rounded text-gray-600 text-xs">
              <p>* 실제 도면 파일이 여기에 표시됩니다</p>
              <p>* PDF, DWG, STEP 등의 형식을 지원합니다</p>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-600 bg-gray-800">
          <button
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            📥 다운로드
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            🖨️ 인쇄
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};