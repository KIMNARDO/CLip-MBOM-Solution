import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useBOMData } from '../../contexts/BOMDataContext';
import MoveableBOMGrid from '../grid/MoveableBOMGrid';
import Header from '../layout/Header';
import Sidebar from '../layout/Sidebar';
import Toolbar from '../layout/Toolbar';
import FilterPanel from '../filters/FilterPanel';
import {
  Plus,
  Upload,
  Download,
  Save,
  RefreshCw
} from 'lucide-react';

const MBOMDashboard = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  const {
    bomData,
    loading,
    saveBOMData,
    loadBOMData,
    addBOMItem
  } = useBOMData();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveBOMData();

    if (result.success) {
      showSuccess('BOM 데이터가 성공적으로 저장되었습니다.');
    } else {
      showError('저장 중 오류가 발생했습니다.');
    }
    setIsSaving(false);
  };

  const handleNewBOM = () => {
    addBOMItem(null, {
      partNumber: 'NEW-BOM-' + Date.now(),
      description: '새 BOM 항목',
      quantity: 1,
      unit: 'EA'
    });
    showInfo('새 BOM 항목이 추가되었습니다.');
  };

  const handleImport = () => {
    showInfo('Import 기능은 개발 중입니다.');
  };

  const handleExport = () => {
    showInfo('Export 기능은 개발 중입니다.');
  };

  const handleRefresh = () => {
    loadBOMData();
    showSuccess('데이터를 새로고침했습니다.');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 p-6">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              Multi-BOM 관리
            </h1>
            <p className="text-muted-foreground mt-1">
              제조 BOM 구조 관리 및 편집
            </p>
          </div>

          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={handleNewBOM}
              className="btn btn-primary btn-default"
            >
              <Plus className="w-4 h-4 mr-2" />
              새 BOM
            </button>

            <button
              onClick={handleImport}
              className="btn btn-outline btn-default"
            >
              <Upload className="w-4 h-4 mr-2" />
              가져오기
            </button>

            <button
              onClick={handleExport}
              className="btn btn-outline btn-default"
            >
              <Download className="w-4 h-4 mr-2" />
              내보내기
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-outline btn-default"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? '저장 중...' : '저장'}
            </button>

            <button
              onClick={handleRefresh}
              className="btn btn-outline btn-default"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </button>
          </div>

          {/* Filter Panel */}
          <FilterPanel />

          {/* BOM Grid */}
          <div className="mt-4">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="spinner"></div>
                <span className="ml-2">데이터 로딩 중...</span>
              </div>
            ) : (
              <MoveableBOMGrid data={bomData} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MBOMDashboard;