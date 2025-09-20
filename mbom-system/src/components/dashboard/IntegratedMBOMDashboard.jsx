import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useBOMData } from '../../contexts/BOMDataContext';
import { BOMProvider } from '../../contexts/BOMContext';
import { useTheme } from '../../contexts/ThemeContext';
import { TreeGrid } from '../TreeGrid';
import { Sidebar } from '../Sidebar';
import { Toolbar } from '../Toolbar';
import UnifiedNotificationManager from '../notification/UnifiedNotificationManager';
import RightSidebar from '../layout/RightSidebar';
import { AlarmDashboard } from '../AlarmDashboard';

const IntegratedMBOMDashboard = () => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const { showSuccess, showError, showInfo, showWarning } = useNotification();
  const {
    bomData,
    selectedItem,
    changeHistory,
    loading,
    expandedNodeIds,
    customColumns,
    setSelectedItem,
    setChangeHistory,
    saveBOMData,
    loadBOMData,
    updateBOMItem,
    addBOMItem,
    deleteBOMItem,
    toggleNodeExpanded,
    addCustomColumn,
    removeCustomColumn
  } = useBOMData();

  // States
  const [activeTab, setActiveTab] = useState('structure');
  const [showChanges, setShowChanges] = useState(false);
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAlarmDashboard, setShowAlarmDashboard] = useState(false);
  const [alarms, setAlarms] = useState([]);
  const [sidebarSearchTerm, setSidebarSearchTerm] = useState('');
  const [gridSearchTerm, setGridSearchTerm] = useState('');
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // 초기화 시 알람 생성
  useEffect(() => {
    const initialAlarms = [
      { id: 1, type: 'warning', message: 'ENGINE-ASM-001 리드타임 초과 (45일)', time: '10분 전', active: true },
      { id: 2, type: 'info', message: 'CRK-SFT-001 원가 10% 상승', time: '30분 전', active: true },
      { id: 3, type: 'error', message: 'VALVE-ASM-001 재고 부족', time: '1시간 전', active: false },
      { id: 4, type: 'success', message: 'PISTON-001 검증 완료', time: '2시간 전', active: false }
    ];
    setAlarms(initialAlarms);

    // 활성 알람 카운트
    const activeAlarms = initialAlarms.filter(a => a.active).length;
    setNotificationCount(activeAlarms);
    setHasNewNotifications(activeAlarms > 0);
  }, []);

  // 알림 시뮬레이션 (데모용)
  useEffect(() => {
    const interval = setInterval(() => {
      const random = Math.random();
      if (random > 0.7) {
        setHasNewNotifications(true);
        setNotificationCount(prev => prev + 1);
        showInfo('새로운 알림이 도착했습니다.');

        // 3초 후 깜빡임 중지
        setTimeout(() => {
          setHasNewNotifications(false);
        }, 3000);
      }
    }, 15000); // 15초마다 체크

    return () => clearInterval(interval);
  }, [showInfo]);

  // 변경사항 추적
  const addChangeRecord = useCallback((type, item, field = null, oldValue = null, newValue = null) => {
    const change = {
      id: Date.now(),
      type,
      partNumber: item?.partNumber || 'Unknown',
      field,
      oldValue,
      newValue,
      timestamp: new Date().toLocaleTimeString('ko-KR'),
      user: user?.name || 'Unknown User'
    };
    setChangeHistory(prev => [change, ...prev].slice(0, 50));
    return change;
  }, [user, setChangeHistory]);

  // 탭 메뉴
  const tabs = [
    { id: 'structure', label: 'BOM Structure', icon: '📊' },
    { id: 'changes', label: 'Changes', icon: '📝', badge: changeHistory?.length },
    { id: 'analysis', label: 'Analysis', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <BOMProvider>
      <div className={`flex flex-col h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* 상단 헤더 */}
        <header className={`bg-gradient-to-r text-white ${theme === 'dark' ? 'from-red-600 to-red-700' : 'from-blue-500 to-blue-600'}`}>
          <div className="flex justify-between items-center px-4 py-2">
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold">🚨 eBOM 변경 감지: 3개 항목이 변경되었습니다.</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => loadBOMData()}
                className="px-4 py-1 bg-white/20 rounded hover:bg-white/30 text-sm"
              >
                변경사항 보기
              </button>

              {/* 알림 벨 버튼 - 상단에 배치 */}
              <button
                onClick={() => setShowAlarmDashboard(!showAlarmDashboard)}
                className={`relative px-3 py-1 rounded text-sm transition-all ${
                  hasNewNotifications
                    ? 'bg-yellow-500 text-gray-900 animate-pulse'
                    : notificationCount > 0
                    ? 'bg-orange-600 text-white'
                    : 'bg-white/20 text-white'
                } hover:bg-white/30`}
              >
                🔔 알림
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>

              <span className="text-white">{user?.name || 'Test User'}</span>
              <button
                onClick={logout}
                className="px-4 py-1 bg-white/20 rounded hover:bg-white/30 text-sm"
              >
                나가기
              </button>
            </div>
          </div>
        </header>

        {/* 메인 타이틀 바 */}
        <div className={`border-b px-4 py-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-center">
            <h1 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              M-BOM Management System - Enterprise Edition
            </h1>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              최종 동기화: {new Date().toLocaleString('ko-KR')}
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className={`border-b px-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-2 text-sm font-medium transition-colors
                  ${activeTab === tab.id
                    ? (theme === 'dark' ? 'bg-gray-700 text-white border-b-2 border-blue-500' : 'bg-blue-50 text-blue-700 border-b-2 border-blue-500')
                    : (theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-700/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')}
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {tab.badge && (
                  <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 툴바 */}
        <Toolbar />

        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 왼쪽 사이드바 - BOM Explorer */}
          <div className={`w-80 border-r flex flex-col ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`px-4 py-2 border-b ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">📁</span>
                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>BOM EXPLORER</span>
                <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                  {bomData?.length || 0}
                </span>
              </div>
            </div>

            {/* 검색 */}
            <div className="px-4 py-2 border-b border-gray-700">
              <input
                type="text"
                placeholder="검색..."
                value={sidebarSearchTerm}
                onChange={(e) => setSidebarSearchTerm(e.target.value)}
                className={`w-full px-3 py-1 rounded border focus:border-blue-500 focus:outline-none ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
              />
            </div>

            {/* BOM 트리 - 검색어 전달 */}
            <Sidebar searchTerm={sidebarSearchTerm} />
          </div>

          {/* 중앙 그리드 영역 */}
          <div className={`flex-1 flex flex-col ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {activeTab === 'structure' && (
              <>
                {/* 그리드 헤더 정보 */}
                <div className={`px-4 py-2 border-b ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="flex justify-between items-center">
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      데이터 상태: 로드 완료 ({bomData?.length || 0}개 항목)
                    </div>
                    <div className="flex gap-2">
                      <button className={`px-3 py-1 text-white text-sm rounded ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}>
                        Excel 내보내기
                      </button>
                      <button className={`px-3 py-1 text-white text-sm rounded ${theme === 'dark' ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'}`}>
                        모두 펼치기
                      </button>
                      <button className={`px-3 py-1 text-white text-sm rounded ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600'}`}>
                        모두 접기
                      </button>
                    </div>
                  </div>
                </div>

                {/* 그리드 검색 */}
                {activeTab === 'structure' && (
                  <div className={`px-4 py-2 border-b ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <input
                      type="text"
                      placeholder="그리드에서 검색..."
                      value={gridSearchTerm}
                      onChange={(e) => setGridSearchTerm(e.target.value)}
                      className={`px-3 py-1 rounded text-sm border focus:border-blue-500 focus:outline-none ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                    />
                    {gridSearchTerm && (
                      <button
                        onClick={() => setGridSearchTerm('')}
                        className={`ml-2 px-2 py-1 text-white text-sm rounded ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600'}`}
                      >
                        취소
                      </button>
                    )}
                  </div>
                )}

                {/* React 그리드 */}
                <TreeGrid searchTerm={gridSearchTerm} />
              </>
            )}

            {activeTab === 'changes' && (
              <div className={`p-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                <h2 className="text-lg font-semibold mb-4">변경 이력</h2>
                <div className="space-y-2">
                  {changeHistory?.map((change, index) => (
                    <div key={change.id} className={`p-3 rounded border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                      <div className="flex justify-between">
                        <span className="text-blue-400">{change.partNumber}</span>
                        <span className="text-xs text-gray-500">{change.timestamp}</span>
                      </div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {change.type === 'edit' && `${change.field}: ${change.oldValue} → ${change.newValue}`}
                        {change.type === 'add' && '새 항목 추가'}
                        {change.type === 'delete' && '항목 삭제'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'analysis' && (
              <div className={`p-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                <h2 className="text-lg font-semibold mb-4">BOM 분석</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                    <h3 className="text-sm font-semibold mb-2">총 부품 수</h3>
                    <p className="text-2xl font-bold text-blue-400">{bomData?.length || 0}</p>
                  </div>
                  <div className={`p-4 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                    <h3 className="text-sm font-semibold mb-2">변경 항목</h3>
                    <p className="text-2xl font-bold text-yellow-400">{changeHistory?.length || 0}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className={`p-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                <h2 className="text-lg font-semibold mb-4">설정</h2>
                <div className="space-y-4">
                  <div className={`p-4 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                    <h3 className="text-sm font-semibold mb-2">그리드 설정</h3>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked />
                      <span>자동 저장 활성화</span>
                    </label>
                  </div>
                  <div className={`p-4 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                    <h3 className="text-sm font-semibold mb-2">알림 설정</h3>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked />
                      <span>변경 알림 표시</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* 하단 상태바 - 알림 시스템 연동 */}
        <div className={`border-t px-4 py-1 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-center text-xs text-gray-400">
            <div className="flex gap-4 items-center">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {user?.name || 'Test User'}
              </span>
              <span>📋 {bomData?.length || 0} items</span>
              <span>🔄 {changeHistory?.length || 0} changes</span>

              {/* 알림 표시 - 깜빡임 애니메이션 */}
              <span
                className={`flex items-center gap-1 transition-all ${
                  hasNewNotifications
                    ? 'text-yellow-400 animate-pulse'
                    : notificationCount > 0
                    ? 'text-orange-400'
                    : ''
                }`}
                onClick={() => setShowAlarmDashboard(!showAlarmDashboard)}
                style={{ cursor: 'pointer' }}
              >
                🔔 {notificationCount} {notificationCount === 1 ? 'alarm' : 'alarms'}
              </span>
            </div>
            <div className="flex gap-4 items-center">
              <span>eBOM: {changeHistory?.filter(c => c.type === 'edit').length || 0} changes</span>
              <span>🌐 UTF-8</span>
              <span>{new Date().toLocaleTimeString('ko-KR')}</span>
            </div>
          </div>
        </div>

        {/* 알림 매니저 제거 - 자체 알림 시스템 사용 */}

        {/* 알람 대시보드 팝업 */}
        <AlarmDashboard
          show={showAlarmDashboard}
          alarms={alarms}
          onClose={() => setShowAlarmDashboard(false)}
          onClearAll={() => {
            setAlarms(prev => prev.map(a => ({ ...a, active: false })));
            setNotificationCount(0);
            setHasNewNotifications(false);
          }}
        />
      </div>
    </BOMProvider>
  );
};

export default IntegratedMBOMDashboard;