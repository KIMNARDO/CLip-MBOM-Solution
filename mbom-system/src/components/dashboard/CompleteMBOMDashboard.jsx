import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useBOMData } from '../../contexts/BOMDataContext';
import UnifiedBOMGrid from '../grid/UnifiedBOMGrid';
import UnifiedNotificationManager from '../notification/UnifiedNotificationManager';
import RightSidebar from '../layout/RightSidebar';

const CompleteMBOMDashboard = () => {
  const { user, logout } = useAuth();
  const { showSuccess, showError, showInfo, showWarning } = useNotification();
  const {
    bomData,
    selectedItem,
    changeHistory,
    loading,
    setSelectedItem,
    setChangeHistory,
    saveBOMData,
    loadBOMData,
    updateBOMItem,
    addBOMItem,
    deleteBOMItem
  } = useBOMData();

  // States
  const [activeTab, setActiveTab] = useState('structure');
  const [showChanges, setShowChanges] = useState(false);
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set([1, 2, 7, 10, 13]));
  const [selectedTreeItem, setSelectedTreeItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAlarmDashboard, setShowAlarmDashboard] = useState(false);
  const [alarms, setAlarms] = useState([]);
  const [ebomChanges, setEbomChanges] = useState([]);

  // 초기화 시 알람 및 eBOM 변경사항 시뮬레이션
  useEffect(() => {
    // 알람 생성
    const initialAlarms = [
      { id: 1, type: 'warning', message: 'ENGINE-ASM-001 리드타임 초과 (45일)', time: '10분 전', active: true },
      { id: 2, type: 'info', message: 'CRK-SFT-001 원가 10% 상승', time: '30분 전', active: true },
      { id: 3, type: 'error', message: 'VALVE-ASM-001 재고 부족', time: '1시간 전', active: false },
      { id: 4, type: 'success', message: 'PISTON-001 검증 완료', time: '2시간 전', active: false }
    ];
    setAlarms(initialAlarms);

    // eBOM 변경사항
    const ebomChangeList = [
      { id: 1, partNumber: 'ENG-BLOCK-SYS-001', field: 'leadtime', oldValue: '12', newValue: '15', type: 'modified' },
      { id: 2, partNumber: 'CRK-SFT-001', field: 'cost', oldValue: '2500000', newValue: '2800000', type: 'modified' },
      { id: 3, partNumber: 'NEW-COMP-001', field: 'all', oldValue: null, newValue: '신규 부품', type: 'added' }
    ];
    setEbomChanges(ebomChangeList);

    // 자동 알람 생성 타이머
    const interval = setInterval(() => {
      simulateNewAlarm();
    }, 30000); // 30초마다 새 알람

    return () => clearInterval(interval);
  }, []);

  // 새 알람 시뮬레이션
  const simulateNewAlarm = () => {
    const alarmTemplates = [
      { type: 'warning', message: '재고 수준 경고' },
      { type: 'info', message: '신규 설계 변경 감지' },
      { type: 'error', message: '품질 기준 미달' },
      { type: 'success', message: '검증 프로세스 완료' }
    ];

    const template = alarmTemplates[Math.floor(Math.random() * alarmTemplates.length)];
    const newAlarm = {
      id: Date.now(),
      type: template.type,
      message: `${template.message} - ${bomData[Math.floor(Math.random() * bomData.length)]?.partNumber || 'ITEM-001'}`,
      time: '방금',
      active: true
    };

    setAlarms(prev => [newAlarm, ...prev].slice(0, 10)); // 최대 10개 유지
    showInfo(`새 알람: ${newAlarm.message}`);
  };

  // 알람 확인
  const acknowledgeAlarm = (alarmId) => {
    setAlarms(prev => prev.map(alarm =>
      alarm.id === alarmId ? { ...alarm, active: false } : alarm
    ));
    showSuccess('알람이 확인되었습니다');
  };

  // 알람 삭제
  const deleteAlarm = (alarmId) => {
    setAlarms(prev => prev.filter(alarm => alarm.id !== alarmId));
    showInfo('알람이 삭제되었습니다');
  };

  // Toggle tree item expansion
  const toggleExpand = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Filter items based on search and status
  const filterItems = (items) => {
    return items.filter(item => {
      const matchesSearch = !searchTerm ||
        item.partNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  };

  // Render tree items recursively
  const renderTreeItems = (items, level = 0) => {
    const filteredItems = filterItems(items);

    return filteredItems.map(item => {
      const isExpanded = expandedItems.has(item.id);
      const hasChildren = item.children && item.children.length > 0;
      const isSelected = selectedTreeItem?.id === item.id;

      return (
        <div key={item.id}>
          <div
            className={`tree-item ${isSelected ? 'selected' : ''}`}
            style={{ paddingLeft: `${15 + level * 20}px` }}
            onClick={() => {
              setSelectedTreeItem(item);
              setSelectedItem(item);
            }}
          >
            <div className="tree-item-content">
              {hasChildren && (
                <span
                  className="tree-expand"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(item.id);
                  }}
                >
                  {isExpanded ? '▼' : '▶'}
                </span>
              )}
              {!hasChildren && <span className="tree-expand"></span>}
              <span className="tree-icon">{item.icon || (level === 0 ? '📦' : level === 1 ? '🔧' : '⚙️')}</span>
              <span className="tree-label">{item.partNumber}</span>
              <span className="tree-badge" style={{ background: '#007acc' }}>L{item.level}</span>
              {item.changed && <span className="tree-badge" style={{ background: '#e74c3c' }}>M</span>}
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div>{renderTreeItems(item.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  // Apply eBOM changes
  const applyEBOMChanges = () => {
    setShowModal(false);
    setShowNotificationBanner(false);

    // 변경사항 적용
    ebomChanges.forEach(change => {
      const newChange = {
        id: Date.now() + Math.random(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        user: user?.name || 'Admin',
        partNumber: change.partNumber,
        field: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
        reason: 'eBOM 동기화',
        status: 'pending'
      };
      setChangeHistory(prev => [...prev, newChange]);
    });

    showSuccess(`${ebomChanges.length}개 eBOM 변경사항이 적용되었습니다`);
  };

  // 일괄 작업 기능들
  const handleBulkApprove = () => {
    const pendingItems = changeHistory.filter(item => item.status === 'pending');
    if (pendingItems.length === 0) {
      showWarning('승인할 대기 중인 항목이 없습니다');
      return;
    }

    setChangeHistory(prev => prev.map(item =>
      item.status === 'pending' ? { ...item, status: 'approved' } : item
    ));
    showSuccess(`${pendingItems.length}개 항목이 승인되었습니다`);
  };

  const handleExportExcel = () => {
    showInfo('Excel 내보내기 준비 중...');
    setTimeout(() => {
      const filename = `MBOM_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      showSuccess(`파일이 다운로드되었습니다: ${filename}`);
    }, 2000);
  };

  const handleImportData = () => {
    showInfo('데이터 가져오기 대화상자 열기...');
  };

  const handleSave = async () => {
    const result = await saveBOMData();
    if (result.success) {
      showSuccess('BOM 데이터가 저장되었습니다');
      setChangeHistory([]);
    } else {
      showError('저장 실패');
    }
  };

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey) {
        switch(e.key) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'e':
            e.preventDefault();
            handleExportExcel();
            break;
          case 'f':
            e.preventDefault();
            document.querySelector('.vscode-input')?.focus();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 자동 저장
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (changeHistory.length > 0) {
        console.log('자동 저장 실행...');
        showInfo('자동 저장 중...');
      }
    }, 60000); // 1분마다

    return () => clearInterval(autoSaveInterval);
  }, [changeHistory]);

  // Debug logging
  useEffect(() => {
    console.log('CompleteMBOMDashboard - bomData:', bomData);
    console.log('CompleteMBOMDashboard - loading:', loading);
  }, [bomData, loading]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Unified Notification Manager */}
      <UnifiedNotificationManager />
      {/* Notification Banner */}
      {showNotificationBanner && (
        <div className="notification-banner show" style={{
          background: 'linear-gradient(90deg, #e74c3c, #c0392b)',
          color: 'white',
          padding: '10px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div className="notification-content">
            <span className="notification-icon">🔔</span>
            <span><strong>eBOM 변경 감지:</strong> {ebomChanges.length}개 항목이 변경되었습니다.</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="vscode-button" onClick={() => setShowModal(true)}>
              변경사항 보기
            </button>
            <button className="vscode-button secondary" onClick={() => setShowNotificationBanner(false)}>
              나중에
            </button>
          </div>
        </div>
      )}

      {/* VS Code Title Bar */}
      <div className="vscode-titlebar">
        <div className="vscode-title">M-BOM Management System - Enterprise Edition</div>
        <div className="window-controls">
          <span className="control-btn minimize"></span>
          <span className="control-btn maximize"></span>
          <span className="control-btn close" onClick={logout}></span>
        </div>
      </div>

      {/* VS Code Menu Bar */}
      <div className="vscode-menubar">
        <div className="menu-item">파일</div>
        <div className="menu-item">편집</div>
        <div className="menu-item">보기</div>
        <div className="menu-item active" onClick={() => setShowChanges(!showChanges)}>
          변경사항 {changeHistory.length > 0 && `(${changeHistory.length})`}
        </div>
        <div className="menu-item" onClick={() => setShowAlarmDashboard(!showAlarmDashboard)}>
          알람 {alarms.filter(a => a.active).length > 0 && `(${alarms.filter(a => a.active).length})`}
        </div>
        <div className="menu-item" onClick={handleExportExcel}>내보내기</div>
        <div className="menu-item" onClick={handleImportData}>가져오기</div>
        <div className="menu-item">도구</div>
        <div className="menu-item">도움말</div>
      </div>

      {/* Alarm Dashboard */}
      {showAlarmDashboard && (
        <div className="changes-dashboard show" style={{ background: '#2d2d30', padding: '15px' }}>
          <div className="dashboard-header">
            <div className="dashboard-title">
              🚨 알람 센터: {alarms.filter(a => a.active).length}개 활성 알람
            </div>
            <div className="dashboard-actions">
              <button className="vscode-button" onClick={() => setAlarms(prev => prev.map(a => ({ ...a, active: false })))}>
                모두 확인
              </button>
              <button className="vscode-button secondary" onClick={() => setAlarms([])}>
                모두 삭제
              </button>
            </div>
          </div>
          <div className="alarms-list" style={{ marginTop: '15px', maxHeight: '200px', overflow: 'auto' }}>
            {alarms.map(alarm => (
              <div key={alarm.id} className={`alarm-item ${alarm.type}`} style={{
                padding: '10px',
                marginBottom: '8px',
                background: alarm.active ? '#3c3c3c' : '#252526',
                borderLeft: `4px solid ${
                  alarm.type === 'error' ? '#e74c3c' :
                  alarm.type === 'warning' ? '#f39c12' :
                  alarm.type === 'success' ? '#27ae60' : '#3498db'
                }`,
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>{
                    alarm.type === 'error' ? '❌' :
                    alarm.type === 'warning' ? '⚠️' :
                    alarm.type === 'success' ? '✅' : 'ℹ️'
                  }</span>
                  <span style={{ color: alarm.active ? '#ffffff' : '#969696' }}>{alarm.message}</span>
                  <span style={{ fontSize: '11px', color: '#969696' }}>{alarm.time}</span>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {alarm.active && (
                    <button
                      className="vscode-button"
                      style={{ padding: '2px 8px', fontSize: '11px' }}
                      onClick={() => acknowledgeAlarm(alarm.id)}
                    >
                      확인
                    </button>
                  )}
                  <button
                    className="vscode-button secondary"
                    style={{ padding: '2px 8px', fontSize: '11px' }}
                    onClick={() => deleteAlarm(alarm.id)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Changes Dashboard */}
      {showChanges && (
        <div className="changes-dashboard show" style={{ background: '#2d2d30', padding: '15px' }}>
          <div className="dashboard-header">
            <div className="dashboard-title">
              ⚠️ 미저장 변경사항: {changeHistory.length}개 항목
            </div>
            <div className="dashboard-actions">
              <button className="vscode-button" onClick={handleSave}>모두 저장</button>
              <button className="vscode-button" onClick={handleBulkApprove}>일괄 승인</button>
              <button className="vscode-button secondary" onClick={() => setChangeHistory([])}>
                변경 취소
              </button>
            </div>
          </div>
          <div className="changes-list" style={{ marginTop: '10px', maxHeight: '150px', overflow: 'auto' }}>
            {changeHistory.map(change => (
              <div key={change.id} className="change-item" style={{
                padding: '8px',
                marginBottom: '5px',
                background: '#1e1e1e',
                borderRadius: '3px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" defaultChecked />
                  <span className="change-icon">✏️</span>
                  <span className="change-part" style={{ color: '#9cdcfe' }}>{change.partNumber}</span>
                  <span className="change-details" style={{ color: '#969696' }}>
                    {change.field}: {change.oldValue} → {change.newValue}
                  </span>
                </div>
                <span style={{
                  background: change.status === 'approved' ? '#27ae60' : '#f39c12',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '11px'
                }}>
                  {change.status === 'approved' ? '승인' : '대기'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="vscode-layout" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar - Tree View */}
        <div className="vscode-sidebar">
          <div className="vscode-sidebar-header">
            <div className="sidebar-title">
              📁 BOM EXPLORER
              <span className="level-indicator">{bomData.length}</span>
            </div>
          </div>

          {/* Search and Filter */}
          <div style={{ padding: '10px', borderBottom: '1px solid #3e3e42' }}>
            <input
              type="text"
              className="vscode-input"
              placeholder="🔍 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', marginBottom: '5px' }}
            />
            <select
              className="vscode-input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="all">모든 상태</option>
              <option value="approved">✅ 승인</option>
              <option value="review">🔍 검토중</option>
              <option value="draft">📝 작성중</option>
              <option value="rejected">❌ 반려</option>
            </select>
          </div>

          <div className="tree-container">
            {loading ? (
              <div style={{ padding: '20px', color: '#969696' }}>로딩중...</div>
            ) : (
              renderTreeItems(bomData)
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="vscode-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Tabs */}
          <div className="vscode-tabs">
            <div
              className={`tab-item ${activeTab === 'structure' ? 'active' : ''}`}
              onClick={() => setActiveTab('structure')}
            >
              📊 BOM Structure
            </div>
            <div
              className={`tab-item ${activeTab === 'changes' ? 'active' : ''}`}
              onClick={() => setActiveTab('changes')}
            >
              📝 Changes ({changeHistory.length})
            </div>
            <div
              className={`tab-item ${activeTab === 'analysis' ? 'active' : ''}`}
              onClick={() => setActiveTab('analysis')}
            >
              📈 Analysis
            </div>
            <div
              className={`tab-item ${activeTab === 'comparison' ? 'active' : ''}`}
              onClick={() => setActiveTab('comparison')}
            >
              🔍 E-BOM vs M-BOM
            </div>
            <div
              className={`tab-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              ⚙️ Settings
            </div>
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflow: 'hidden', padding: '10px' }}>
            {activeTab === 'structure' && (
              <div style={{ height: '100%', width: '100%', display: 'flex' }}>
                {/* BOM Table Grid */}
                <div style={{ flex: 1, marginRight: '10px' }}>
                  <UnifiedBOMGrid
                    data={bomData}
                    onSelectionChanged={(selected) => {
                      if (selected.length > 0) {
                        setSelectedItem(selected[0]);
                      }
                    }}
                  />
                </div>
                {/* Right Sidebar */}
                <RightSidebar />
              </div>
            )}

            {activeTab === 'analysis' && (
              <div style={{ height: '100%', width: '100%', display: 'flex' }}>
                <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
                  <div style={{ textAlign: 'center', color: '#8b8b8b', paddingTop: '50px' }}>
                    <h3>분석 대시보드</h3>
                    <p>오른쪽 사이드바에서 분석 데이터를 확인하세요</p>
                  </div>
                </div>
                <RightSidebar />
              </div>
            )}

            {activeTab === 'settings' && (
              <div style={{ height: '100%', width: '100%', display: 'flex' }}>
                <div style={{ flex: 1, padding: '20px', overflow: 'auto', color: '#cccccc' }}>
                  <h2>시스템 설정</h2>

                  <div style={{ marginTop: '20px' }}>
                    <h3>알림 설정</h3>
                    <div style={{ background: '#252526', padding: '15px', borderRadius: '6px' }}>
                      <label style={{ display: 'block', marginBottom: '10px' }}>
                        <input type="checkbox" defaultChecked /> eBOM 변경 알림
                      </label>
                      <label style={{ display: 'block', marginBottom: '10px' }}>
                        <input type="checkbox" defaultChecked /> 리드타임 초과 알림
                      </label>
                      <label style={{ display: 'block', marginBottom: '10px' }}>
                        <input type="checkbox" defaultChecked /> 원가 변동 알림
                      </label>
                      <label style={{ display: 'block' }}>
                        <input type="checkbox" /> 자동 저장 활성화
                      </label>
                    </div>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <h3>동기화 설정</h3>
                    <div style={{ background: '#252526', padding: '15px', borderRadius: '6px' }}>
                      <div style={{ marginBottom: '10px' }}>
                        <label>동기화 간격</label>
                        <select className="vscode-input" style={{ marginLeft: '10px', width: '200px' }}>
                          <option>실시간</option>
                          <option>5분</option>
                          <option>10분</option>
                          <option>30분</option>
                          <option>수동</option>
                        </select>
                      </div>
                      <button className="vscode-button">지금 동기화</button>
                    </div>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <h3>표시 설정</h3>
                    <div style={{ background: '#252526', padding: '15px', borderRadius: '6px' }}>
                      <label style={{ display: 'block', marginBottom: '10px' }}>
                        <input type="checkbox" defaultChecked /> 트리 자동 확장
                      </label>
                      <label style={{ display: 'block', marginBottom: '10px' }}>
                        <input type="checkbox" defaultChecked /> 변경 항목 강조
                      </label>
                      <label style={{ display: 'block' }}>
                        <input type="checkbox" defaultChecked /> 툴팁 표시
                      </label>
                    </div>
                  </div>
                </div>
                <RightSidebar />
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Properties */}
        {selectedItem && (
          <div className="vscode-panel">
            <div className="panel-header">
              속성: {selectedItem.partNumber}
            </div>
            <div className="panel-content">
              <div className="property-group">
                <div className="property-group-title">기본 정보</div>
                <div className="property-item">
                  <span className="property-label">품번:</span>
                  <span className="property-value">{selectedItem.partNumber}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">품명:</span>
                  <span className="property-value">{selectedItem.description}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">레벨:</span>
                  <span className="property-value">Level {selectedItem.level}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">수량:</span>
                  <span className="property-value">{selectedItem.quantity} {selectedItem.unit}</span>
                </div>
              </div>

              <div className="property-group">
                <div className="property-group-title">생산 정보</div>
                <div className="property-item">
                  <span className="property-label">작업:</span>
                  <span className="property-value">{selectedItem.operation || '-'}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">작업장:</span>
                  <span className="property-value">{selectedItem.workcenter || '-'}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">공급업체:</span>
                  <span className="property-value">{selectedItem.supplier || '-'}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">리드타임:</span>
                  <span className="property-value" style={{
                    color: (selectedItem.leadtime || 0) > 30 ? '#e74c3c' : '#cccccc',
                    fontWeight: (selectedItem.leadtime || 0) > 30 ? 'bold' : 'normal'
                  }}>
                    {selectedItem.leadtime || 0}일
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button className="vscode-button" style={{ width: '100%' }}>
                  편집
                </button>
                <button className="vscode-button secondary" style={{ width: '100%' }}>
                  복사
                </button>
                <button className="vscode-button secondary" style={{ width: '100%' }}>
                  이력 보기
                </button>
                <button
                  className="vscode-button secondary"
                  style={{ width: '100%', background: '#e74c3c' }}
                  onClick={() => {
                    if (confirm(`${selectedItem.partNumber}를 삭제하시겠습니까?`)) {
                      deleteBOMItem(selectedItem.id);
                      setSelectedItem(null);
                      showSuccess('항목이 삭제되었습니다');
                    }
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="vscode-statusbar">
        <div className="status-item">
          <span>👤 {user?.name || 'User'}</span>
        </div>
        <div className="status-item">
          <span>📊 {bomData.length} items</span>
        </div>
        <div className="status-item">
          <span>💾 {changeHistory.length} changes</span>
        </div>
        <div className="status-item">
          <span>🔔 {alarms.filter(a => a.active).length} alarms</span>
        </div>
        <div className="status-item">
          <span>⚠️ eBOM: {ebomChanges.length} changes</span>
        </div>
        <div className="status-item">
          <span>🌐 UTF-8</span>
        </div>
        <div className="status-item">
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Modal for eBOM Changes */}
      {showModal && (
        <div className="modal-overlay show" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal" style={{
            background: '#2d2d30',
            borderRadius: '8px',
            width: '600px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div className="modal-header" style={{
              padding: '20px',
              borderBottom: '1px solid #3e3e42',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <div className="modal-title" style={{ fontSize: '16px', fontWeight: '600', color: '#e74c3c' }}>
                eBOM 변경사항 적용 확인
              </div>
              <div
                className="modal-close"
                onClick={() => setShowModal(false)}
                style={{ cursor: 'pointer', fontSize: '20px', color: '#cccccc' }}
              >
                ×
              </div>
            </div>

            <div className="modal-body" style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              <p style={{ marginBottom: '20px', color: '#cccccc' }}>
                다음 eBOM 변경사항을 M-BOM에 적용하시겠습니까?
              </p>

              <div style={{ background: '#1e1e1e', padding: '15px', borderRadius: '6px' }}>
                <h4 style={{ marginBottom: '15px', color: '#f39c12' }}>변경 항목</h4>
                {ebomChanges.map((change, index) => (
                  <label key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <input type="checkbox" defaultChecked style={{ marginRight: '10px' }} />
                    <span style={{ color: '#9cdcfe' }}>{change.partNumber}</span>
                    <span style={{ marginLeft: 'auto', color: '#969696', fontSize: '12px' }}>
                      {change.field}: {change.oldValue} → {change.newValue}
                    </span>
                  </label>
                ))}
              </div>

              <div style={{
                marginTop: '20px',
                padding: '10px',
                background: '#3c3c3c',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#f39c12'
              }}>
                ⚠️ 주의: 이 작업은 되돌릴 수 없습니다. 적용 전 백업을 권장합니다.
              </div>
            </div>

            <div className="modal-footer" style={{
              padding: '20px',
              borderTop: '1px solid #3e3e42',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button className="vscode-button secondary" onClick={() => setShowModal(false)}>
                취소
              </button>
              <button className="vscode-button" onClick={applyEBOMChanges}>
                적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompleteMBOMDashboard;