import React from 'react';
import { BOMProvider } from '../../contexts/BOMContext';
import { TreeGrid } from '../TreeGrid';
import { Sidebar } from '../Sidebar';
import { Toolbar } from '../Toolbar';

/**
 * React 기반 MBOM 대시보드 컴포넌트
 * AG-Grid 없이 순수 React로 구현
 */
function ReactMBOMDashboard() {
  return (
    <BOMProvider>
      <div className="h-screen flex flex-col bg-gray-900 text-white">
        {/* 헤더 */}
        <header className="bg-gray-800 border-b border-gray-700 px-4 py-2">
          <h1 className="text-xl font-bold">
            React MBOM Grid System - Pure React (No AG-Grid)
          </h1>
          <p className="text-sm text-gray-400">
            트리 구조 BOM 데이터 관리 시스템
          </p>
        </header>

        {/* 툴바 */}
        <Toolbar />

        {/* 메인 컨텐츠 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 사이드바 */}
          <Sidebar />

          {/* 그리드 */}
          <TreeGrid />
        </div>

        {/* 푸터 */}
        <footer className="bg-gray-800 border-t border-gray-700 px-4 py-1 text-xs text-gray-400">
          <div className="flex justify-between">
            <span>
              단축키: Tab(다음 셀), Shift+Tab(이전 셀), Double-click(편집)
            </span>
            <span>
              © 2024 React MBOM Grid - Built with React + TypeScript
            </span>
          </div>
        </footer>
      </div>
    </BOMProvider>
  );
}

export default ReactMBOMDashboard;